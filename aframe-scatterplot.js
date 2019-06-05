/**
 * Javascript for data visualisation using aframe
 * @author Christian Garske
 */
var rotate;
/**
 * @desc AFRAME component to listen for a touch on the screen as that emits the
 * click function
 */
AFRAME.registerComponent('touch-screen', {
    init: function () {
        const sceneEl = this.el.sceneEl;
        const canvasEl = sceneEl.canvas;
        canvasEl.addEventListener('touchend', function () {
            var cursor = document.getElementById('cursor');
            // objects in focus of the cursor
            intersObjects = cursor.components.raycaster.intersectedEls;
            var i;
            for (i = 0; i < intersObjects.length; i++) {
                intersObjects[i].emit('click');
            }
        })
    }
});
/**
 * @desc AFRAME component that creates the octagonal room in the scene
 */
AFRAME.registerComponent('room', {
    init: function () {
        var space = document.querySelector('a-scene');
        var i,
            w = 10,
            h = 15;
        for (i = 0; i < 8; i++) {
            var sheet = document.createElement('a-entity');
            var alpha = i / 4 * Math.PI;
            sheet.setAttribute('id', 'mycanvas' + i);
            sheet.setAttribute('geometry', {
                primitive: 'plane',
                height: h,
                width: w
            });
            sheet.setAttribute('material', 'color', '#f0f0f0');
            sheet.object3D.position.set(10 * Math.sin(alpha), 1, 10 * Math.cos(alpha));
            sheet.setAttribute('rotation', { x: 0, y: (i - 4) / 8 * 360, z: 0 });
            if (!(i % 2)) {
                sheet.setAttribute('axis_buttons', '');
            }
            sheet.setAttribute('value', i);
            space.appendChild(sheet);
        }
    }
});
/**
 * @desc AFRAME component that creates main buttons on a wall for the plot 
 */
AFRAME.registerComponent('axis_buttons', {
    init: function () {
        var val = this.el.getAttribute('value');
        // labels
        var b = ['show', 'hide', 'help','inspect'];
        // positions
        var bx = [0.2, 0.8, .5,.2].map(function (x) { return 10 * (x - .5) });
        var by = [0.2, 0.2, .15,.3].map(function (x) { return 15 * (x - .5) });
        for (j = 0; j < b.length; j++) {
            var ax_button = button(name = '', pos = bx[j] + ' ' + by[j] + ' 0', size = [.5, .75, .1], txt = b[j], idx = val);
            ax_button.setAttribute('value', b[j]);
            ax_button.setAttribute(b[j] + '_cursorlistener', '');
            if(b[j]=='inspect'){
                ax_button.object3D.visible=false;
            }
            this.el.appendChild(ax_button);
        }
        d3.csv('simulated_data_2_random_2000.csv', type, function (error, data) {
            window.value = data;
            var wheel = document.createElement('a-entity');
            wheel.setAttribute('value', [d3.keys(d3.values(window.value)[0])]);
            wheel.setAttribute('id', 'wheel' + (val));
            wheel.setAttribute('select-wheel', '');
            wheel.object3D.position.set(-2.7, 0, 0);
            var sheet = document.getElementById('mycanvas' + (val));
            sheet.appendChild(wheel);
        });
    }
});
/**
 * @desc AFRAME component that listens for a click which loads the respective variable data to the plotpoints
 */
AFRAME.registerComponent('data_cursorlistener', { // not used
    schema: {
        axis: { default: 'x' }
    },
    init: function () {
        var compdata = this.data;
        this.el.addEventListener('click',
            function () {
                var plotdata = window.value,
                    idx = this.parentNode.parentNode.getAttribute('value'),
                    plotID = document.getElementById('plotbox' + idx),
                    geo = plotID.getAttribute('geometry'),
                    range = [];
                switch (compdata.axis) {
                    case 'x':
                        range = [0, geo.width];
                        break;
                    case 'y':
                        range = [0, geo.height];
                        break;
                    case 'z':
                        range = [0, geo.depth];
                }
                var origin = d3.select('#origin' + idx);
                var key = this.getAttribute('value'),
                    extent = d3.extent(plotdata, function (d) { return +d[key]; });
                axis_ticks(compdata.axis, extent, idx, geo, key);
                var scale = d3.scaleLinear()
                    .domain(extent)
                    .range(range);
                // plotting the data points
                var selection = origin.selectAll('a-plane')
                    .data(plotdata);
                selection.enter().append('a-plane')
                    .attr('geometry', 'height:.1;width:.1') // size
                    .attr('material', 'src:#circle')        // texture
                    .attr('material', 'alphaTest:0.5')      // enable alpha
                    .attr('material', 'color:black')        // color
                    .attr('position', '0 0 0')              // position
                    .attr('look-at', '[camera]')            // always faces camera
                    .attr('animation', function (d) {
                        return 'property: position; to: ' + scale(d[key]) + ' 0 0;dur:1500;easing:linear';
                    })
                if (compdata.axis == 'z') {
                    var colorScale = d3.scaleSequential()
                        .domain(extent)
                        .interpolator(d3.interpolateInferno);
                    selection.attr('color', function (d) { return colorScale(d[key]); });
                }
                selection.attr('animation', function (d) {
                    var pos = '0 0 0';
                    switch (compdata.axis) {
                        case 'x':
                            pos = scale(d[key]) + ' ' + d3.select(this).attr('position').y + ' ' + d3.select(this).attr('position').z;
                            break;
                        case 'y':
                            pos = d3.select(this).attr('position').x + ' ' + scale(d[key]) + ' ' + d3.select(this).attr('position').z;
                            break;
                        case 'z':
                            pos = d3.select(this).attr('position').x + ' ' + d3.select(this).attr('position').y + ' ' + scale(d[key]);
                    }
                    return 'property: position; to: ' + pos + ';dur:1500;easing:linear';
                });
            }
        );
    }
});
/**
 * @desc AFRAME component that makes the axis buttons visible and creates the plot area
 */
AFRAME.registerComponent('show_cursorlistener', {
    schema: {
        loaded: { type: 'boolean', default: false },
        loading: { type: 'boolean', default: false }
    },
    update: function () {
        var loaded = this.data.loaded;
        var loading = this.data.loading;
        this.el.addEventListener('click', function () {
            var val = this.parentNode.getAttribute('value')
            var plotdata = window.value
           // create plotting area if none exists yet
            if (!loading) {
                if (!document.getElementById('origin' + val)) { // creates the plot origin if there is none
                    var origin = document.createElement('a-entity');
                    origin.setAttribute('id', 'origin' + val)
                    origin.setAttribute('position', (-1.5) + ' ' + (-2.5) + ' 0.05');
                    this.parentNode.appendChild(origin);
                } else {
                    var origin = document.getElementById('origin' + val);
                    origin.object3D.visible = true
                }
                if (!loaded) {
                    loading=true;
                    var origin = d3.select('#origin' + val);
                    var selection = origin.selectAll('a-plane')
                        .data(plotdata);
                    createSpinner(val);
                    drawData(origin, selection, plotdata, 10, val);
                    loaded = true;
                    axis_ticks('x', [0, 0], val, '', false);
                    axis_ticks('y', [0, 0], val, '', false);
                    axis_ticks('z', [0, 0], val, '', false);
                }
                var insB = document.getElementById('inspect'+val);
                if (!insB.object3D.visible){
                    insB.object3D.visible=true;
                }
                if (!document.getElementById('plotbox' + val)) {
                    var plotbox = document.createElement('a-box');
                    plotbox.setAttribute('id', 'plotbox' + val);
                    plotbox.object3D.position.set(2.5, 2.5, 0);
                    plotbox.setAttribute('geometry', {
                        height: 5,
                        width: 5,
                        depth: .1
                    });
                    plotbox.setAttribute('material', {
                        color: 'green',
                        opacity: .05,
                        transparent: true,
                        alphaTest: 0.001,
                        side: 'double'
                    });
                    plotbox.setAttribute('class', 'not-clickable');
                    plotbox.object3D.visible = false;
                    var origin = document.getElementById('origin' + val)
                    origin.appendChild(plotbox);
                    
                } else { // if existent just make it visible again
                    var plotbox = document.getElementById('plotbox' + val);
                    plotbox.object3D.visible = true;
                }
                
            }
        });
    }
});
AFRAME.registerComponent('inspect_cursorlistener',{
    schema:{
        clicked: {type:'bool',default:false},
        centered: {type:'bool',default:false}
    },
    init:function(){
        var cntrd = this.data.centered;
        var clck = this.data.clicked;
        this.el.addEventListener('click', function(){
            var idx = this.parentNode.getAttribute('value');
            var canvas = document.getElementById('mycanvas'+idx);
            var origin = document.getElementById('origin'+idx);
            if (!clck){
                clck=true;
                if(!cntrd){
                    console.log('center')
                    var worldPos = canvas.object3D.getWorldPosition();
                    origin.setAttribute('animation__pos','property:position;to:'+(-worldPos.x-2.5)+' '+(-worldPos.y-1.5)+' '+(-worldPos.z-2.5)+';easing:linear;dur:500');
                    // origin.object3D.position.set(-worldPos.x-2.5,-worldPos.y-1.5,-worldPos.z-2.5);
                    cntrd = true;
                }else{ 
                    console.log('wall')
                    origin.setAttribute('animation__pos','property:position;to:'+(-1.5)+' '+(-2.5)+' '+(.05)+';easing:linear;dur:500');
                    // origin.object3D.position.set(-1.5,-2.5,.05);
                    cntrd=false;
                }
                setTimeout(function(){
                    origin.removeAttribute('animation__pos');
                    clck=false;
                },600)
            }
        })
    }
});
AFRAME.registerComponent('help_cursorlistener', {
    schema: {
        clicked: { type: 'boolean', default: false }
    },
    init: function () {
        var on = this.data.clicked;
        this.el.addEventListener('click', function () {
            var idx = this.parentNode.getAttribute('value');
            if (on) {
                on = false;
                var showHelp = document.getElementById('show' + idx + 'help');
                showHelp.object3D.visible = false;
                var wheelHelp = document.getElementById('wheel' + idx + 'help');
                wheelHelp.object3D.visible = false;
            } else {
                on = true;
                if (!document.getElementById('show' + idx + 'help')) {
                    var showB = document.getElementById('show' + idx);
                    var b = helpText(showB, loc = [-1, -.5]);
                    b.setAttribute('value', '1.Click to load the data and\n show the plot area!');
                } else {
                    var showHelp = document.getElementById('show' + idx + 'help');
                    showHelp.object3D.visible = true;
                }
                if (!document.getElementById('wheel' + idx + 'help')) {
                    var wheelB = document.getElementById('wheel' + idx);
                    var b = helpText(wheelB, loc = [-1.25, -2]);
                    b.setAttribute('value', '2.Choose variable on the wheel \n 3.Choose axis and click the plot triangle');
                } else {
                    var wheelHelp = document.getElementById('wheel' + idx + 'help');
                    wheelHelp.object3D.visible = true;
                }
            }
        })
    }
});
/**
 * @desc AFRAME component that hides the buttons and the plot area on a click
 */
AFRAME.registerComponent('hide_cursorlistener', {
    init: function () {
        this.el.addEventListener('click', function () {
            var val = this.parentNode.getAttribute('value')
            if (document.getElementById('plotbox' + val)) {
                document.getElementById('plotbox' + val).object3D.visible = false;
            }
            if (document.getElementById('origin' + val)) {
                document.getElementById('origin' + val).object3D.visible = false;
            }
        });
    }
});
/**
 * @desc AFRAME component that creates or hides the buttons for the differen data variables
 */
AFRAME.registerComponent('axis_cursorlistener', { //not used
    schema: {
        axis: { type: 'string', default: 'x' },
        active: { type: 'boolean', default: false },
        listen: { type: 'boolean', default: true } // bool for the listener to turn off temporarily to avoid multiple triggers
    },
    init: function () {
        var option = this.data;
        var idx = this.el.parentNode.getAttribute('value'); this.el.addEventListener('click', function () {
            if (option.listen) { // button hasn't been triggered 
                if (option.active) { //hide the variable buttons
                    option.listen = false;
                    option.active = false;
                    var buttonchildren = d3.select(this).selectAll('.data_click')
                    buttonchildren.attr('animation', 'property:position;to: 0 0 0;dur:1500;easing:linear');
                    setTimeout(function () { // deletes the buttons after the animation
                        buttonchildren.remove();
                        document.getElementById(option.axis + idx).setAttribute('material', 'color:grey');
                        option.listen = true;
                    }, 1500);
                } else { // show the axis and the variable buttons
                    option.listen = false;
                    option.active = true;
                    var plotID = document.getElementById('plotbox' + idx);
                    var geo = plotID.getAttribute('geometry');
                    if (!document.getElementById('origin' + idx)) { // creates the plot origion if there is none
                        var origin = d3.select(plotID).append('a-entity')
                            .attr('id', 'origin' + idx)
                            .attr('position', (-geo.width / 2) + ' ' + (-geo.height / 2) + ' 0');
                    } else {
                        var origin = d3.select('#origin' + idx);
                    }
                    switch (option.axis) {
                        case 'x':
                            line_to = geo.width + ' 0 0';
                            break;
                        case 'y':
                            line_to = '0 ' + geo.height + ' 0';
                            console.log('y');
                            grid('x', 'y', idx, geo);
                            grid('y', 'x', idx, geo);
                            break;
                        case 'z':
                            grid('x', 'z', idx, geo, '');
                            grid('z', 'x', idx, geo, '');
                            grid('z', 'y', idx, geo, '');
                            grid('y', 'z', idx, geo, '');
                            grid('x', 'z', idx, geo, 'y');
                            grid('z', 'x', idx, geo, 'y');
                            grid('z', 'y', idx, geo, 'x');
                            grid('y', 'z', idx, geo, 'x');
                            origin.attr('animation', 'property: position;to:-2.5 -2.5 -2.5;dur:1500;easing:linear');
                            plotID.setAttribute('animation__depth', 'property: geometry.depth;to: 5;dur:1500;easing:linear');
                            plotID.setAttribute('animation__pos', 'property: position;to:-.5 0 3;dur:1500;easing:linear');
                            line_to = '0 0 5';
                            var ax = ['x', 'y', 'z'],
                                p = ['-.3 .65 0', '.3 .65 0'],
                                s = ['<', '>'], i, j;
                            for (i = 0; i < 3; i++) {
                                for (j = 0; j < 2; j++) {
                                    document.getElementById(ax[i] + idx).appendChild(rot_button(ax[i], p[j], s[j], idx));
                                }
                            }
                            // create button that centers the plot to the original position
                            var ctr_button = button('', '0 -4.75 0', [.3, .65, .08], 'center', idx)
                            ctr_button.addEventListener('click', function () {
                                plotID.removeAttribute('animation__rot');
                                plotID.setAttribute('animation__rot', 'property:rotation;to: 0 0 0;dur:1500;easing:linear;autoplay:true');
                            });
                            var wall = document.getElementById('mycanvas' + idx);
                            wall.appendChild(ctr_button);
                    }
                    //actual plotting
                    var shift = [0, 0];
                    var data = window.value;
                    d3.entries(data[0]).forEach(function (d) { //create data variable buttons
                        if (d.key != '' && d.key != 'sample_id' && d.key != 'value') {
                            shift[0]++;
                            if (shift[0] > 5) {
                                shift[0] = 1;
                                shift[1] = - 0.75;
                            }
                            // create data buttons 
                            var button = data_buttons(d, shft = shift, ax = option.axis);
                            // appending the buttons to the axis button
                            document.getElementById(option.axis + idx).appendChild(button);
                            document.getElementById(option.axis + idx).setAttribute('material', 'color:green');
                        }
                    });
                    //  draws axis if there is none
                    if (origin.select('line__' + option.axis).empty()) {
                        origin.attr('line__' + option.axis, 'start: 0 0 0; end: ' + line_to + ';color:gray');
                        setTimeout(function () {
                            option.listen = true
                        }, 1500);
                    }
                }
            }
        });
    }

});
/**
 * @desc AFRAME component for a wheel based selection tool
 */
AFRAME.registerComponent('select-wheel', {
    init: function () {
        var val = this.el.parentNode.getAttribute('value');
        // labels
        var b = this.el.getAttribute('value').split(',');
        var a = ['x', 'y', 'z'];
        var g = ['grey', 'darkgrey', 'lightgrey'];
        // button up
        var tr_up = document.createElement('a-triangle');
        tr_up.object3D.position.set(-.75, 1.5, 0.05);
        tr_up.setAttribute('color', 'grey');
        tr_up.setAttribute('scale', '.5 .5');
        tr_up.setAttribute('class', 'clickable');
        tr_up.setAttribute('value', 'up');
        tr_up.setAttribute('wheel-arrow-listener', 'direction:up');
        this.el.appendChild(tr_up);
        // button spin down
        var tr_down = document.createElement('a-triangle');
        tr_down.object3D.position.set(-.75, -1.5, 0.05);
        tr_down.object3D.rotation.set(0, 0, Math.PI);
        tr_down.setAttribute('scale', '.5 .5');
        tr_down.setAttribute('color', 'grey');
        tr_down.setAttribute('class', 'clickable');
        tr_down.setAttribute('value', 'down');
        tr_down.setAttribute('wheel-arrow-listener', 'direction:down');
        this.el.appendChild(tr_down);
        // button to select and plot
        var tr_select = document.createElement('a-triangle');
        tr_select.setAttribute('id', 'sel_tri' + val);
        tr_select.object3D.position.set(-0.05, -.5, 0.05);
        tr_select.object3D.rotation.set(0, 0, -Math.PI / 2);
        tr_select.setAttribute('scale', '.5 .5');
        tr_select.setAttribute('color', 'grey');
        tr_select.setAttribute('class', 'clickable');
        tr_select.setAttribute('axis', 'x');
        tr_select.setAttribute('variable', b[2]);
        tr_select.setAttribute('wheel-select-listener', '');
        var sel_text = buttontext('plot', c = 'black', d = '0.05', offset = [0, -.1]);
        sel_text.object3D.rotation.set(0, 0, Math.PI / 2);
        sel_text.setAttribute('scale', '1.5 1.5');
        sel_text.setAttribute('align', 'center');
        tr_select.appendChild(sel_text);
        this.el.appendChild(tr_select);
        // creates the wheel entries
        var buttons = document.createElement('a-entity');
        buttons.object3D.position.set(-.75, 0, 0);
        buttons.setAttribute('id', this.el.getAttribute('id') + 'buttons');
        for (j = 0; j < b.length; j++) {
            var wheel_button = button(name = '', pos = '0 ' + ((j - 2) * 0.5) + ' 0', size = [.5, .75, .1], txt = b[j], idx = val);
            if (j > 4) {
                wheel_button.object3D.visible = false;
            } else {
                wheel_button.setAttribute('material', 'color:' + g[Math.abs(j - 2)]);
                wheel_button.setAttribute('scale', (1 - Math.abs(j - 2) / 10) + ' 1 1');
            }
            wheel_button.removeAttribute('class');
            wheel_button.setAttribute('id', j);
            wheel_button.setAttribute('value', j);
            buttons.appendChild(wheel_button);
        }
        this.el.appendChild(buttons);
        // creates axis buttons
        var axes = document.createElement('a-entity');
        axes.object3D.position.set(.5, 0, 0);
        axes.setAttribute('id', this.el.getAttribute('id') + 'axes');
        for (j = 0; j < a.length; j++) {
            var axis_button = button(name = '', pos = '0 ' + ((j - 1) * 0.55) + ' 0', size = [.5, .5, .1], txt = a[j], idx = val);
            axis_button.setAttribute('id', a[j] + val);
            axis_button.setAttribute('value', a[j] + val);
            axis_button.setAttribute('wheel-axis-listener', '');
            axes.appendChild(axis_button);
        }
        this.el.appendChild(axes);
    }
})
/**
 * @desc AFRAME component: Listener for direction arrows to spin the wheel 
 */
AFRAME.registerComponent('wheel-arrow-listener', {
    schema: {
        direction: { type: 'string', default: 'up' },
        clicked: { type: 'bool', default: false }
    },
    init: function () {
        var dir = this.data.direction;
        var clicked = this.data.clicked;
        this.el.addEventListener('click', function () {
            if (!clicked) {
                clicked = true;
                var buttons = document.getElementById(this.parentNode.getAttribute('id') + 'buttons').childNodes;
                var val = this.parentNode.parentNode.getAttribute('value');
                var b = this.parentNode.getAttribute('value').split(',');
                var i;
                var g = ['#808080', '#A9A9A9', '#D3D3D3'];
                for (i = 0; i < buttons.length; i++) {
                    var pos = buttons[i].object3D.position;
                    if (dir == 'down' && +buttons[i].getAttribute('id') < 5) {
                        clicked == true;
                        if (buttons[i].getAttribute('id') == 4) {
                            buttons[i].setAttribute('animation__scl', 'property:scale;to: 0.1 0.1 0.1;easing:linear;dur:500');
                            var j = buttons[i].getAttribute('value') - 5;
                            if (j < 0) { j = b.length + j };
                            buttons[j].object3D.visible = true;
                            buttons[j].object3D.position.set(0, -1.5, 0)
                            buttons[j].setAttribute('material', 'color:' + g[2]);
                            buttons[j].setAttribute('animation__pos', 'property:position;to: 0 -1 0;easing:linear;dur:500');
                            buttons[j].setAttribute('animation__scl', 'property:scale;from: 0 0 0;to: .8 1 1;easing:linear;dur:500');
                            buttons[j].setAttribute('id', -1);
                            setTimeout(function (b_ex, b_en) {
                                b_ex.removeAttribute('animation__scl');
                                b_en.removeAttribute('animation__pos');
                                b_en.removeAttribute('animation__scl');
                            }, 550, buttons[i], buttons[j])
                        }
                        else {
                            buttons[i].setAttribute('animation__pos', 'property:position;to: 0 ' + (pos.y + 0.5) + ' 0;easing:linear;dur:500');
                            buttons[i].setAttribute('animation__scl', 'property:scale;to: ' + (1 - Math.abs(buttons[i].getAttribute('id') - 1) / 10) + ' 1 1;easing:linear;dur:500');
                            buttons[i].setAttribute('animation__col', 'property: components.material.material.color;type:color;to:' + g[Math.abs(buttons[i].getAttribute('id') - 1)] + ';easing:linear;dur:500');
                            setTimeout(function (b_cur) {
                                b_cur.removeAttribute('animation__pos');
                                b_cur.removeAttribute('animation__scl');
                                b_cur.removeAttribute('animation__col');
                            }, 550, buttons[i])
                        }
                    } else if (dir == 'up' && +buttons[i].getAttribute('id') < 5) {
                        clicked == true;
                        if (buttons[i].getAttribute('id') == 0) {
                            buttons[i].setAttribute('animation__scl', 'property:scale;to: 0 0 0;easing:linear;dur:500');
                            var j = +buttons[i].getAttribute('value') + 5;
                            if (j >= buttons.length) { j = j - (buttons.length); };
                            buttons[j].object3D.visible = true;
                            buttons[j].object3D.position.set(0, 1.5, 0)
                            buttons[j].setAttribute('material', 'color:' + g[2]);
                            buttons[j].setAttribute('animation__pos', 'property:position;to: 0 1 0;easing:linear;dur:500');
                            buttons[j].setAttribute('animation__scl', 'property:scale;from: 0 0 0;to: .8 1 1;easing:linear;dur:500');
                            buttons[j].setAttribute('id', 5);
                            setTimeout(function (b_ex, b_en) {
                                b_ex.removeAttribute('animation__scl');
                                b_en.removeAttribute('animation__pos');
                                b_en.removeAttribute('animation__scl');
                            }, 550, buttons[i], buttons[j])
                        } else {
                            buttons[i].setAttribute('animation__pos', 'property:position;to: 0 ' + (pos.y - 0.5) + ' 0;easing:linear;dur:500');
                            buttons[i].setAttribute('animation__scl', 'property:scale;to: ' + (1 - Math.abs(buttons[i].getAttribute('id') - 3) / 10) + ' 1 1;easing:linear;dur:500');
                            buttons[i].setAttribute('animation__col', 'property: components.material.material.color;type:color;to:' + g[Math.abs(buttons[i].getAttribute('id') - 3)] + ';easing:linear;dur:500');
                            setTimeout(function (b_cur) {
                                b_cur.removeAttribute('animation__pos');
                                b_cur.removeAttribute('animation__scl');
                                b_cur.removeAttribute('animation__col');
                            }, 550, buttons[i])
                        }
                    }

                }
                for (i = 0; i < buttons.length; i++) {
                    if (dir == 'down') {
                        buttons[i].setAttribute('id', ((+buttons[i].getAttribute('id') + 1)));
                    } else {
                        if (buttons[i].getAttribute('id') == 0) {
                            buttons[i].setAttribute('id', buttons.length - 1);
                        } else {
                            buttons[i].setAttribute('id', ((+buttons[i].getAttribute('id') - 1)));
                        }
                    }
                    if (buttons[i].getAttribute('id') == 2) {
                        var sel = document.getElementById('sel_tri' + val);
                        sel.setAttribute('variable', b[i]);
                    }
                }
                setTimeout(function () {
                    clicked = false;
                }, 600)
            }
        })
    }
});
/**
 * @desc AFRAME component: Listener for the axis buttons that turn the respective axis active
 */
AFRAME.registerComponent('wheel-axis-listener', {
    schema: {
        clicked: { type: 'bool', default: false }
    },
    init: function () {
        var clicked = this.data.clicked;
        this.el.addEventListener('click', function () {
            if (!clicked) {
                clicked = true;
                var val = this.parentNode.parentNode.parentNode.getAttribute('value');
                var pos = this.object3D.position;
                selector = document.getElementById('sel_tri' + val);
                selector.setAttribute('animation__pos', 'property:position;to: -0.05 ' + pos.y + ' 0.05;easing:linear;dur:500');
                selector.setAttribute('axis', this.getAttribute('id')[0]);
                setTimeout(function () {
                    clicked = false;
                }, 600)
            }
        })
    }
});
/**
 * @desc AFRAME component Listener for the plot button which plots the selected variable on the selected axis.
 */
AFRAME.registerComponent('wheel-select-listener', {
    schema: {
        clicked: { type: 'bool', default: false }
    },
    init: function () {
        this.el.addEventListener('click', function () {
            var plotdata = window.value,
                idx = this.parentNode.parentNode.getAttribute('value'),
                plotID = document.getElementById('plotbox' + idx),
                geo = plotID.getAttribute('geometry'),
                key = this.getAttribute('variable'),
                axis = this.getAttribute('axis');
            range = [];
            if (!document.getElementById('origin' + idx)) { // creates the plot origion if there is none
                var origin = d3.select(plotID).append('a-entity')
                    .attr('id', 'origin' + idx)
                    .attr('position', (-geo.width / 2) + ' ' + (-geo.height / 2) + ' 0');
            } else {
                var origin = d3.select('#origin' + idx);
            }
            switch (axis) {
                case 'x':
                    range = [0, geo.width];
                    line_to = geo.width + ' 0 0';
                    break;
                case 'y':
                    range = [0, geo.height];
                    line_to = '0 ' + geo.height + ' 0';
                    grid('x', 'y', idx, geo);
                    grid('y', 'x', idx, geo);
                    break;
                case 'z':
                    range = [0, 5];
                    grid('x', 'z', idx, geo, '');
                    grid('z', 'x', idx, geo, '');
                    grid('z', 'y', idx, geo, '');
                    grid('y', 'z', idx, geo, '');
                    grid('x', 'z', idx, geo, 'y');
                    grid('z', 'x', idx, geo, 'y');
                    grid('z', 'y', idx, geo, 'x');
                    grid('y', 'z', idx, geo, 'x');
                    // origin.attr('animation', 'property: position;to:-2.5 -2.5 -2.5;dur:1500;easing:linear');
                    plotID.setAttribute('animation__depth', 'property: geometry.depth;to: 5;dur:1500;easing:linear');
                    plotID.setAttribute('animation__pos', 'property: position;to:2.5 2.5 2.5;dur:1500;easing:linear');
                    line_to = '0 0 5';
                    plotID.childNodes.forEach(function (n) {
                        if (n.getAttribute('id').includes('x') || n.getAttribute('id').includes('y')) {
                            n.object3D.position.set(n.object3D.position.x, n.object3D.position.y, 2.5);
                        }
                    })
            }
            //  draws axis if there is none
            if (origin.select('line__' + axis).empty()) {
                origin.attr('line__' + axis, 'start: 0 0 0; end: ' + line_to + ';color:gray');
            }
            var extent = d3.extent(plotdata, function (d) { return +d[key]; });
            axis_ticks(axis, extent, idx, key);
            var scale = d3.scaleLinear()
                .domain(extent)
                .range(range);
            var selection = origin.selectAll('a-plane')
                .data(plotdata);
            // drawData(origin,selection,plotdata,10,key,scale);
            // plotting the data points
            // var selection = origin.selectAll('a-plane')
            //         .data(plotdata);
            // setTimeout( function(o){ 
            //     var selection = o.selectAll('a-plane')
            //         .data(plotdata);
            //     selection.enter().append('a-plane')
            //         .attr('geometry', 'height:.1;width:.1') // size
            //         .attr('material', 'src:#circle')        // texture
            //         .attr('material', 'alphaTest:0.5')      // enable alpha
            //     .attr('material', 'color:black')        // color
            //     .attr('position', '0 0 0')              // position
            //     .attr('look-at', '[camera]')            // always faces camera
            //     .attr('animation', function (d) {
            //         return 'property: position; to: ' + scale(d[key]) + ' 0 0;dur:1500;easing:linear';
            //     })
            // },0,origin);
            if (axis == 'z') {
                var colorScale = d3.scaleSequential()
                    .domain(extent)
                    .interpolator(d3.interpolateInferno);
                selection.attr('color', function (d) { return colorScale(d[key]); });
            }
            selection.attr('visible', 'true');
            selection.attr('animation', function (d) {
                var pos = '0 0 0';
                switch (axis) {
                    case 'x':
                        pos = scale(d[key]) + ' ' + d3.select(this).attr('position').y + ' ' + d3.select(this).attr('position').z;
                        break;
                    case 'y':
                        pos = d3.select(this).attr('position').x + ' ' + scale(d[key]) + ' ' + d3.select(this).attr('position').z;
                        break;
                    case 'z':
                        pos = d3.select(this).attr('position').x + ' ' + d3.select(this).attr('position').y + ' ' + scale(d[key]);
                }
                return 'property: position; to: ' + pos + ';dur:1500;easing:linear';
            });
            setTimeout(function () {
                clicked = true
            }, 1500);
        }
        );
    }
});
/**
 * @desc AFRAME component that creates interactible tiles that the user can teleport to on a click
 */
AFRAME.registerComponent('teleport-tiles', {
    init: function () {
        var m, n;
        var nTiles = 10;
        for (m = 0; m < nTiles; m++) {
            for (n = 0; n < nTiles; n++) {
                var tile = document.createElement('a-entity');
                tile.setAttribute('geometry', {
                    primitive: 'plane',
                    height: 2, width: 2
                });
                tile.object3D.position.set((2 * m - 9), (2 * n - 9), 0.01);
                tile.setAttribute('material', 'opacity', 0.2);
                tile.setAttribute('class', 'clickable');
                if (Math.sqrt((2 * m - 9) ** 2 + (2 * n - 9) ** 2) < 8.5) {
                    tile.setAttribute('line__l', 'start:-1 -1 0; end:1 -1 0;color:black;visible:false');
                    tile.setAttribute('line__t', 'start:1 -1 0; end:1 1 0;color:black;visible:false');
                    tile.setAttribute('line__r', 'start:1 1 0; end:-1 1 0;color:black;visible:false');
                    tile.setAttribute('line__b', 'start:-1 1 0; end:-1 -1 0;color:black;visible:false');
                    tile.addEventListener('mouseenter', function () {
                        this.setAttribute('line__l', 'visible:true');
                        this.setAttribute('line__t', 'visible:true');
                        this.setAttribute('line__b', 'visible:true');
                        this.setAttribute('line__r', 'visible:true');
                    });
                    tile.addEventListener('mouseleave', function () {
                        this.setAttribute('line__l', 'visible:false');
                        this.setAttribute('line__t', 'visible:false');
                        this.setAttribute('line__b', 'visible:false');
                        this.setAttribute('line__r', 'visible:false');
                    });
                    tile.addEventListener('click', function () {
                        var cam = document.getElementById('rig');
                        cam.object3D.position.set(this.object3D.position.x, 0, -this.object3D.position.y);
                    });
                }
                var floor = document.getElementById('floor');
                floor.appendChild(tile);
            };
        };
    }
});
function helpText(node, loc = [0, 0]) {
    var text = document.createElement('a-text');
    text.setAttribute('id', node.getAttribute('id') + 'help');
    text.setAttribute('width', '5');
    text.setAttribute('wrapCount', '20')
    text.setAttribute('color', 'red');
    text.setAttribute('align', 'left');
    text.object3D.position.set(loc[0], loc[1], 0.05);
    node.appendChild(text);
    return text;
};
/**
 * @desc casts input to a number
 * @param d - the string to be cast into a number
 * @return the cast number
 */
function type(d) {
    d.value = +d.value;
    return d;
};
/**
 * @desc creates the button label
 * @param string text - the string to be cast into a number
 * @param string c - the color of the label
 * @param float d - distance of the label to the button
 * @return an a-text entity
 */
function buttontext(text, c = 'black', d = .05, offset = [0, 0]) {
    var buttontext = document.createElement('a-text');
    buttontext.setAttribute('value', text);
    buttontext.setAttribute('width', '5');
    buttontext.setAttribute('color', c);
    buttontext.setAttribute('align', 'center');
    buttontext.object3D.position.set(offset[0], offset[1], d);
    // buttontext.setAttribute('zOffset',d);
    buttontext.setAttribute('depthTest', false);
    return buttontext;
};
/**
 * @desc creates a clickable button
 * @param string name - name for the id 
 * @param string pos - position relative to parent node
 * @param array size - dimensions of the button
 * @param string txt - text for the button label
 * @param string idx - index of the wall
 * @param string array c - colors for the button [0] and the text [1]
 * @return a clickable a-box entity with an a-text label
 */
function button(name = '', pos = '0 0 0', size = [.5, .5, .3], txt = '', idx = '', c = ['grey', 'black']) {
    var new_button = document.createElement('a-entity');
    new_button.setAttribute('id', name + txt + idx);
    new_button.setAttribute('geometry', {
        primitive: 'box',
        height: size[0],
        width: size[1],
        depth: size[2]
    });
    new_button.setAttribute('material', 'color', c[0]);
    new_button.setAttribute('position', pos);
    new_button.setAttribute('class', 'clickable');
    new_button.setAttribute('onclick', 'event.stopPropagation()');
    new_button.appendChild(buttontext(txt, c[1]), (size[2] / 2 + 0.05));
    return new_button;
};
/**
 * @desc creates the movement of the data variable buttons
 * @param d - the data entry 
 * @param array shft - shifted position relative to the axis parent button
 * @param string ax - axis label of the parent button
 * @param string c - color of the button
 * @return a clickable button with the data_cursorlistener
 */
function data_buttons(d, shft = [0, 0], ax = 'x', c = 'grey') {
    switch (ax) {
        case 'x':
            break;
        case 'y':
            shft = [-shft[1], -shft[0]];
            break;
        case 'z':
            shft = [shft[0], -shft[1]];
    };
    var new_data_b = button(ax, pos = '0 0 0', size = [.5, .75, .08], txt = d.key);
    new_data_b.setAttribute('animation', 'property:position;to: ' + shft[0] + ' ' + shft[1] + ' 0;dur:1500;easing:linear');
    new_data_b.setAttribute('data_cursorlistener', 'axis: ' + ax);
    new_data_b.setAttribute('value', d.key);
    new_data_b.removeAttribute('class');
    new_data_b.setAttribute('class', 'data_click');
    return new_data_b;
};
/**
 * @desc adds the rotation function on hover to the rotation buttons
 * @param string ax - respective axis
 * @param string pos - position of the button
 * @param string txt - label for the button
 * @param int idx - index of the wall 
 * @return a button that rotates the plot area on hover
 */
function rot_button(ax = 'x', pos = '0 0 0', txt = '', idx = 0) {
    var b = button(ax, pos, size = [.3, .3, .08], txt = txt, idx = idx)
    b.addEventListener('mouseenter', function () {
        window.clearInterval(rotate);
        rotate = setInterval(function () { rotatePlot(ax, idx, txt) }, 100);
    });
    b.addEventListener('mouseleave', function () {
        window.clearInterval(rotate);
    });
    return b;
};
/**
 * @desc rotates the plot area along the corresponding axis
 * @param string a - axis the plot rotattes along
 * @param int n - index of the plot
 * @param string d - direction of rotation ('<' or '>')
 */
function rotatePlot(a, n, d) {
    var plot = document.getElementById('plotbox' + n);
    var rot = plot.getAttribute('rotation');
    if (d == '<') {
        rot[a] = rot[a] - 1;
    } else if (d == '>') {
        rot[a] = rot[a] + 1;
    }
    plot.setAttribute('rotation', rot);
};
/**
 * @desc hides the listed buttons
 * @param string array buttons - list of object names to made invisible
 */
function hide(buttons = '') {//not used
    var i;
    for (i = 0; i < buttons.length; i++) {
        var b = document.getElementById(buttons[i]);
        if (b.object3D.visible == true) {
            b.object3D.visible = false;
            b.removeAttribute('class');
        }
    }
};
/**
 * @desc shows the listed buttons
 * @param string array buttons - list of object names to made visible
 */
function show(buttons = '') {//not used
    var i;
    for (i = 0; i < buttons.length; i++) {
        var b = document.getElementById(buttons[i]);
        if (b.object3D.visible == false) {
            b.object3D.visible = true;
            b.setAttribute('class', 'clickable');
        }
    }
};
/**
 * @desc creates a rough grid for orientation
 * @param string ax1 - axis along which the grid is supposed to run
 * @param string ax2 - second axis along which the grid is supposed to run
 * @param string idx - index of the plot area
 * @param struct geo - geometry of the plot area
 * @param string oppAx - third axis 
 */
function grid(ax1 = 'x', ax2 = 'y', idx = '', geo, oppAx = '') {
    var origin = d3.select('#origin' + idx);
    var pos_start = { x: 0, y: 0, z: 0 };
    var pos_end = { x: 0, y: 0, z: 0 };
    var q = [.25, .5, .75, 1];
    var i;
    for (i = 0; i < 4; i++) {
        pos_start[ax1] = q[i] * geo.width;
        pos_end[ax1] = q[i] * geo.width;
        pos_end[ax2] = geo.width;
        if (oppAx != '') {
            pos_start[oppAx] = geo.width;
            pos_end[oppAx] = geo.width;
        }
        origin.attr('line__' + ax1 + ax2 + oppAx + i, 'start: ' + pos_start.x + ' ' + pos_start.y + ' ' + pos_start.z + '; end: ' + pos_end.x + ' ' + pos_end.y + ' ' + pos_end.z + ';color:lightgray');
    }
};
/**
 * @desc creates labels on the axis 
 * @param {string} ax - axis which should be labeled
 * @param {array} range - range of the data
 * @param {int} idx - index of the plot area
 * @param {struct} geo - geometry of the plot area
 * @param {string} key - name of the variable on axis
 */
function axis_ticks(ax = 'x', range, idx, key, vis = true) {
    var orig = document.getElementById('origin' + idx);
    var pos = { x: 0, y: 0, z: 0 };
    var q = [0, .25, .5, .75, 1];
    var i;
    if (!document.getElementById(ax + 'axis' + idx)) {
        var axis = document.createElement('a-entity');
        axis.setAttribute('id', ax + 'axis' + idx);
    } else {
        var axis = document.getElementById(ax + 'axis' + idx);
    }
    for (i = 0; i < 5; i++) {
        var pos = { x: 0, y: 0, z: 0 };
        if (!document.getElementById('tick' + idx + ax + i)) {
            var text = document.createElement('a-text');
            text.setAttribute('id', 'tick' + idx + ax + i);
            text.setAttribute('color', 'black');
            text.setAttribute('align', 'left');
            text.setAttribute('material', 'alphaTest:0.05')
            // text.setAttribute('look-at', '[camera]');
            pos[ax] = pos[ax] + 5 * q[i];
            switch (ax) {
                case 'x':
                    pos.y = pos.y - .1;
                    text.object3D.position.set(pos.x, pos.y, pos.z);
                    break;
                case 'y':
                    pos.x = pos.x - .1;
                    text.setAttribute('align', 'right');
                    text.setAttribute('baseline', 'bottom');
                    text.object3D.position.set(pos.x, pos.y, pos.z);
                    break;
                case 'z':
                    pos.y = pos.y - .1;
                    pos.x = pos.x - .1;
                    text.setAttribute('align', 'right')
                    text.object3D.rotation.set(0, 0, Math.PI / 4);
            }
        } else {
            text = document.getElementById('tick' + idx + ax + i)
        }
        if (ax == 'z' && vis) {
            pos[ax] = pos[ax] + 5 * q[i];
            text.setAttribute('animation__pos', 'property:position;to: 0 0 ' + pos.z + ';easing:linear;dur:1500');
        }
        text.setAttribute('value', numeral(range[0] + (range[1] - range[0]) * q[i]).format('0, 0.0'));
        text.setAttribute('scale', '.75 .75');
        text.object3D.visible = vis;
        if (!document.getElementById('tick' + idx + ax + i)) {
            axis.appendChild(text);
        }
    }
    if (!document.getElementById('label' + ax + idx)) {
        var text = document.createElement('a-text');
        text.setAttribute('id', 'label' + ax + idx);
        text.setAttribute('color', 'black');
        switch (ax) {
            case 'x':
                text.setAttribute('align', 'left');
                pos = { x: .3, y: -.3, z: 0 };
                break;
            case 'y':
                text.setAttribute('align', 'left');
                pos = { x: -.1, y: .3, z: 0 };
                text.object3D.rotation.set(0, 0, Math.PI / 2);
                break;
            case 'z':
                text.setAttribute('align', 'right');
                text.object3D.rotation.set(0, 0, Math.PI / 4);
                pos = { x: -.4, y: -.3, z: 0 };

        }
        text.object3D.position.set(pos.x, pos.y, pos.z);
    } else {
        text = document.getElementById('label' + ax + idx)
    }
    if (ax == 'z' && vis) {
        // pos = { x: -.4, y: -.3, z: 5 };
        text.setAttribute('animation__pos', 'property:position;to: -.4 -.3 5;easing:linear;dur:1500')
        var xaxis = document.getElementById('xaxis' + idx);
        xaxis.setAttribute('animation__pos', 'property:position;to: 0 0 5;easing:linear;dur:1500')
        var yaxis = document.getElementById('yaxis' + idx);
        yaxis.setAttribute('animation__pos', 'property:position;to: 0 0 5;easing:linear;dur:1500')
    }
    text.setAttribute('value', key);
    text.setAttribute('scale', '.75 .75');
    text.object3D.visible = vis;
    if (!document.getElementById('label' + ax + idx)) {
        axis.appendChild(text);
    }
    if (!document.getElementById(ax + 'axis' + idx)) {
        orig.appendChild(axis);
    }
};
/**
 * @desc draws the data in batches
 * @param {struct} origin - origion point of the plot
 * @param {struct} selection - d3 selection of the data points
 * @param {struct} plotdata - the data loaded in 
 * @param {int} batchSize - size of the batches
 * @param {string} key - name of the variable to be plotted
 * @param {struct} scale - scale of the data
 */
function createSpinner(idx) {
    var orig = document.getElementById('origin' + idx);
    var spinner = document.createElement('a-circle');
    spinner.object3D.position.set(2.5, 2.5, 0.1);
    spinner.object3D.rotation.set(0, Math.PI, 0);
    spinner.setAttribute('geometry', 'thetaStart:90');
    spinner.setAttribute('geometry', 'thetaLength:1');
    spinner.setAttribute('material', 'color:darkgrey');
    spinner.setAttribute('material', 'side:back');
    spinner.setAttribute('id', 'progbar' + idx);
    orig.append(spinner);
}
function drawData(origin, selection, plotdata, batchSize, idx) {//key,scale){

    function drawBatch(batchNumber, idx) {
        return function () {
            var startIdx = batchNumber * batchSize,
                stopIdx = Math.min(plotdata.length, startIdx + batchSize),
                enterSel = d3.selectAll(selection.enter()._groups[0].slice(startIdx, stopIdx));
            var progress = document.getElementById('progbar' + idx);
            progress.setAttribute('geometry', 'thetaLength:' + (startIdx / plotdata.length * 360));

            enterSel.each(function (d, i) {
                var newElement = origin.append('a-plane');
                enterSel[i] = newElement;
                newElement.__data__ = this.__data__;
                newElement._groups[0][0].setAttribute('geometry', 'height:.1;width:.1');
                newElement._groups[0][0].setAttribute('material', 'src:#circle');
                newElement._groups[0][0].setAttribute('material', 'alphaTest:0.5');
                newElement._groups[0][0].setAttribute('material', 'color:black');
                newElement._groups[0][0].setAttribute('visible', 'false');
                newElement._groups[0][0].setAttribute('position', '0 0 0');
                newElement._groups[0][0].setAttribute('look-at', '[camera]');
            })
            if (stopIdx < plotdata.length) {
                setTimeout(drawBatch(batchNumber + 1, idx), 0);
            } else {
                progress.object3D.visible = false;
                var plotbox = document.getElementById('plotbox' + idx);
                plotbox.object3D.visible = true;
                var showB = document.getElementById('show'+idx);
                showB.setAttribute('show_cursorlistener',{loaded:true,loading:false});
            }

        };
    }
    setTimeout(drawBatch(0, idx), 0);
};
