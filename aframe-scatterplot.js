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
            sheet.object3D.position.set(10 * Math.sin(alpha), 1, 10 * Math.cos      (alpha));
            sheet.setAttribute('rotation', { x: 0, y: (i - 4) / 8 * 360, z: 0 });
            if (!(i % 2)) {
                sheet.setAttribute('axis_buttons', '');
            } else {
                var wheel = document.createElement('a-entity');
                wheel.setAttribute('id','wheel'+i);
                wheel.setAttribute('select-wheel','');
                sheet.appendChild(wheel);
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
        var b = ['x', 'y', 'z', 'show', 'hide'];
        // positions
        var bx = [0.15, 0.775, 0.15, 0.2, 0.8].map(function (x) { return 10 * (x - .5) });
        var by = [0.3, 0.65, 0.7, 0.2, 0.2].map(function (x) { return 15 * (x - .5) });
        for (j = 0; j < 5; j++) {
            var ax_button = button(name = '', pos = bx[j] + ' ' + by[j] + ' 0',     size = [.5, .75, .1], txt = b[j], idx = val);
            ax_button.setAttribute('value', b[j]);
            if (b[j] == "x" || b[j] == "y" || b[j] == "z") {
                ax_button.setAttribute('axis_cursorlistener', { axis: b[j],         active: false });
            } else {
                ax_button.setAttribute(b[j] + '_cursorlistener', '');
            }
            if (j < 3) {
                ax_button.object3D.visible=false;
                ax_button.removeAttribute('class', 'clickable');
            }
            this.el.appendChild(ax_button);
        }
    }
});
/**
 * @desc AFRAME component that listens for a click which loads the respective variable data to the plotpoints
 */
AFRAME.registerComponent('data_cursorlistener', {
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
                    extent = d3.extent(plotdata, function (d) {return +d[key]; });
                axis_ticks(compdata.axis,extent,idx,geo,key);
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
    init: function () {
        this.el.addEventListener('click', function () {
            console.log('show');
            var val = this.parentNode.getAttribute('value')
            show(buttons = ['x' + val, 'y' + val, 'z' + val]);
            // create plotting area if none exists yet
            if (!document.getElementById('plotbox' + val)) {
                var plotbox = document.createElement('a-box');
                plotbox.setAttribute('id', 'plotbox' + val);
                plotbox.object3D.position.set(-.5, 0, .055);
                plotbox.setAttribute('geometry', {
                    height: 5,
                    width: 5,
                    depth: .1
                });
                plotbox.setAttribute('material', {
                    color: 'green',
                    opacity: .1
                });
                plotbox.setAttribute('class', 'not-clickable');
                // load the data into the window to not have to load it for every chang of data
                d3.csv('simulated_data_2_random_2000.csv', type, function (error, data) {
                    window.value = data;
                });
                this.parentNode.appendChild(plotbox);
            } else { // if existent just make it visible again
                var plotbox = document.getElementById('plotbox' + val);
                plotbox.object3D.visible = true;
            }
        });
    }
});
/**
 * @desc AFRAME component that hides the buttons and the plot area on a click
 */
AFRAME.registerComponent('hide_cursorlistener', { // hides the plot and the buttons
    init: function () {
        this.el.addEventListener('click', function () {
            var val = this.parentNode.getAttribute('value')
            hide(buttons = ['x' + val, 'y' + val, 'z' + val]);
            if (document.getElementById('plotbox' + val)) {
                document.getElementById('plotbox' + val).object3D.visible = false;
            }
        });
    }
});
/**
 * @desc AFRAME component that creates or hides the buttons for the differen data variables
 */
AFRAME.registerComponent('axis_cursorlistener', {
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
                            grid('x','y',idx,geo);
                            grid('y','x',idx,geo);
                            break;
                        case 'z':
                            grid('x','z',idx,geo,'');
                            grid('z','x',idx,geo,'');
                            grid('z','y',idx,geo,'');
                            grid('y','z',idx,geo,'');
                            grid('x','z',idx,geo,'y');
                            grid('z','x',idx,geo,'y');
                            grid('z','y',idx,geo,'x');
                            grid('y','z',idx,geo,'x');
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
 * @desc prototyping an AFRAME component for wheel selection. 
 */
AFRAME.registerComponent('select-wheel',{
    init: function () {
        var val = this.el.parentNode.getAttribute('value');
        // labels
        var b = ['a', 'b', 'c', 'd', 'e'];
        // positions
        var tr_up = document.createElement('a-triangle');
        tr_up.object3D.position.set(0,1.5,0.05);
        tr_up.setAttribute('color','grey');
        tr_up.setAttribute('scale', '.5 .5');
        tr_up.setAttribute('class','clickable');
        tr_up.setAttribute('value','up');
        tr_up.setAttribute('wheel-arrow-listener','up');
        this.el.appendChild(tr_up);
        var tr_down = document.createElement('a-triangle');
        tr_down.object3D.position.set(0,-1.5,0.05);
        tr_down.object3D.rotation.set(0,0,Math.PI);
        tr_down.setAttribute('scale', '.5 .5');
        tr_down.setAttribute('color','grey');
        tr_down.setAttribute('class','clickable');
        tr_down.setAttribute('value','down');
        tr_down.setAttribute('wheel-arrow-listener','down');
        this.el.appendChild(tr_down);
        for (j = 0; j < 5; j++) {
            var wheel_button = button(name = '', pos =  '0 ' + ((j-2)*0.5) + ' 0',     size = [.3, .5, .1], txt = b[j], idx = val);
            wheel_button.setAttribute('material','opacity:'+1/(1+Math.abs(j-2)));
            wheel_button.setAttribute('value', b[j]);
            this.el.appendChild(wheel_button);
        }
    }
})
/**
 * @desc prototyping an AFRAME component for wheel selection. 
 */
AFRAME.registerComponent('wheel-arrow-listener',{
    schema:{
        direction: {type:'string', default:'up'}
    },
    init: function () {
        this.el.addEventListener('click', function () {
            var buttons = this.parentNode.childNodes;
            var i ;
            var 
            for (i=0; i<buttons.length;i++){
                if (buttons[i].nodeName!='A-TRIANGLE'){
                    //rotate over the key :/ we'll see
                }
            }
        })
    }
})
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
                tile.object3D.position.set((2 * m - 9), (2 * n - 9), 0.01 );
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
                        cam.object3D.position.set(this.object3D.position.x, 0, -this.object3D.position.y );
                    });
                }
                var floor = document.getElementById('floor');
                floor.appendChild(tile);
            };
        };
    }
})
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
function buttontext(text, c = 'black', d = .05) {
    var buttontext = document.createElement('a-text');
    buttontext.setAttribute('value', text);
    buttontext.setAttribute('width', '5');
    buttontext.setAttribute('color', c);
    buttontext.setAttribute('align', 'center');
    buttontext.object3D.position.set(0, 0, d);
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
function hide(buttons = '') {
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
function show(buttons = '') {// shows the listed buttons
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
function grid(ax1='x',ax2='y',idx='',geo,oppAx=''){
    var origin = d3.select('#origin' + idx);
    var pos_start = {x:0,y:0,z:0};
    var pos_end = {x:0,y:0,z:0};
    var q = [.25,.5,.75,1];
    var i;
    for (i=0;i<4;i++){
        pos_start[ax1]=q[i]*geo.width;
        pos_end[ax1]=q[i]*geo.width;
        pos_end[ax2]=geo.width;
        if (oppAx!=''){
            pos_start[oppAx]=geo.width;
            pos_end[oppAx]=geo.width;
        }
        origin.attr('line__' + ax1+ax2+oppAx+i, 'start: '+pos_start.x +' '+pos_start.y+' '+pos_start.z+'; end: ' + pos_end.x +' '+pos_end.y+' '+pos_end.z + ';color:lightgray');
    }
};
/**
 * @desc creates labels on the axis 
 * @param string ax - axis which should be labeled
 * @param array range - range of the data
 * @param int idx - index of the plot area
 * @param struct geo - geometry of the plot area
 */
function axis_ticks(ax='x',range,idx,geo,key){
    var plot = document.getElementById('plotbox'+idx);
    var pos = {x:-2.5,y:-2.5,z:2.5};
    var q = [0,.25,.5,.75,1];
    var i;
    for (i=0;i<5;i++){
        var pos = {x:-2.5,y:-2.5,z:-2.5};
        if(!document.getElementById('tick'+ax+i)){
            var text = document.createElement('a-text');
            text.setAttribute('id','tick'+ax+i);
            text.setAttribute('color','black');
            text.setAttribute('align','center');
            text.setAttribute('look-at','[camera]');
            pos[ax]=pos[ax]+geo.width*q[i];
            switch (ax){
                case 'x':
                    pos.y=pos.y-.1;
                    pos.z=2.5;
                    break;
                case 'y':
                    pos.z=2.5;
                    pos.x=pos.x-.1;
                    break;
                case 'z':
                    pos.y=pos.y-.1;
                    pos.x=pos.x-.1;
                    text.object3D.rotation.set(0,0,Math.PI/4);
            }
            text.object3D.position.set(pos.x,pos.y,pos.z);
        }else{
            text=document.getElementById('tick'+ax+i)
        }
        text.setAttribute('value',numeral(range[0]+(range[1]-range[0])*q[i]).format(0,0.0));
        text.setAttribute('scale','.5 .5');
        if(!document.getElementById('tick'+ax+i)){
            plot.appendChild(text);
        }   
    }
    if(!document.getElementById('label'+ax+i)){
        var text = document.createElement('a-text');
        text.setAttribute('id','label'+ax+i);
        text.setAttribute('color','black');
        switch (ax){
            case 'x':
                text.setAttribute('align','left');
                pos = {x:-2.3,y:-2.4,z:2.55};
                break;
            case 'y':
                text.setAttribute('align','left');
                pos = {x:-2.4,y:-2.3,z:2.55};
                text.object3D.rotation.set(0,0,Math.PI/2);
                break;
            case 'z':
                text.setAttribute('align','right');
                text.object3D.rotation.set(0,0,Math.PI/4);
                pos = {x:-2.65,y:-2.65,z:2.55};
        }
        text.object3D.position.set(pos.x,pos.y,pos.z);
    }else{
        text=document.getElementById('label'+ax+i)
    }
    text.setAttribute('value',key);
    text.setAttribute('scale','.5 .5');
    if(!document.getElementById('label'+ax+i)){
        plot.appendChild(text);
    }   
};