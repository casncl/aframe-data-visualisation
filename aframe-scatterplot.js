// window.onload = function() {
// //create a new instance of shake.js.
// var myShakeEvent = new Shake({
//     threshold: 5
// });
// // start listening to device motion
// myShakeEvent.start();
// // register a shake event
// window.addEventListener('shake', shakeEventDidOccur, false);
// //shake event callback
// function shakeEventDidOccur () {
//     var canv = document.getElementById('mycanvas4');
//     console.log('shake has happened');
//     console.log(canv);
//     if (canv.getAttribute('material').color=='white'){
//         canv.setAttribute('material','color','green');
//     } else {
//         canv.setAttribute('material','color','white');
//     };
// }
// }
AFRAME.registerComponent('touch-screen',{
    init:function() {
        const sceneEl = this.el.sceneEl
        const canvasEl = sceneEl.canvas
        canvasEl.addEventListener('touchend',function() {
            console.log('touch');
            var cursor = document.getElementById('cursor');
            console.log(cursor);
            intersObjects = cursor.components.raycaster.intersectedEls;
            console.log(intersObjects);
            var i;
            for (i = 0; i<intersObjects.length;i++){
                // intersObjects[i].setAttribute('material','color','green');
                intersObjects[i].emit('click');
            }      
        })
    }
});


// creating of an octagonal 'room'
AFRAME.registerComponent('room', {
    init: function () {
        var space = document.querySelector('a-scene');
        var i;
        var w = 10,
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
            sheet.setAttribute('position', { x: 10 * Math.sin(alpha), y: 1, z: 10 * Math.cos(alpha) });
            sheet.setAttribute('rotation', { x: 0, y: (i - 4) / 8 * 360, z: 0 });
            if (i%2){
                sheet.setAttribute('axis_buttons', '');
            }
            sheet.setAttribute('value', i);
            space.appendChild(sheet);
        }
        // var myScreen = AFRAME.scenes[0].canvas;
        // myScreen.setAttribute('touch-screen','');
    }
});
AFRAME.registerComponent('axis_buttons', {// primary buttons on the canvas
    init: function () {
        var val = this.el.getAttribute('value');
        var b = ['x', 'y', 'z', 'show', 'hide'];
        var bx = [0.15, 0.775, 0.15, 0.2, 0.8].map(function (x) { return 10 * (x - .5) });
        var by = [0.3, 0.65, 0.7, 0.2, 0.2].map(function (x) { return 15 * (x - .5) });
        for (j = 0; j < 5; j++) {
            var ax_button = button(name = '', pos = bx[j] + ' ' + by[j] + ' 0', size = [.5, .75, .1], txt = b[j], idx = val);
            ax_button.setAttribute('value', b[j]);
            if (b[j] == "x" || b[j] == "y" || b[j] == "z") {
                ax_button.setAttribute('axis_cursorlistener', { axis: b[j], on: false });
            } else {
                ax_button.setAttribute(b[j] + '_cursorlistener', '');
            }
            if (j < 3) {
                ax_button.setAttribute('visible', 'false');
                ax_button.removeAttribute('class', 'clickable');
            }
            this.el.appendChild(ax_button);
        }
    }
});
// data listeners
AFRAME.registerComponent('data_cursorlistener', {
    schema: {
        axis: { default: 'x' }
    },
    init: function () {
        var compdata = this.data;
        //var sheet_nof = this.el.parentNode.parentNode.getAttribute('value'); 
        //var key = this.el.getAttribute('value');
        //console.log(key);
        this.el.addEventListener('click',// axis_click(event,compdata.axis,sheet_nof,key),false
        function () {
            var plotdata = window.value;
            var idx = this.parentNode.parentNode.getAttribute('value');
            var plotID = document.getElementById('plotbox' + idx);
            var geo = plotID.getAttribute('geometry');
            var range = [];
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
            var scale = d3.scaleLinear()
                .domain(extent)
                .range(range);
            var selection = origin.selectAll('a-plane')
                .data(plotdata);
            selection.enter().append('a-plane')
                // .attr('geometry','vertexA: 0 .03 0;vertexB:-0.03 -0.03 0;vertexC:0.03 -0.03 0')
                .attr('geometry', 'height:.1;width:.1')//;depth:0.03')
                // .attr('geometry','radiusInner:0.001')
                // .attr('geometry','radiusOuter:0.03')
                .attr('material','src:#circle')
                .attr('material','alphaTest:0.5')
                .attr('material','color:black')
                .attr('position', '0 0 0')
                .attr('look-at','[camera]')
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
// cursor listener for the show and hide button
AFRAME.registerComponent('show_cursorlistener', {
    init: function () {
        this.el.addEventListener('click', function () {
            var val = this.parentNode.getAttribute('value')
            show(buttons=['x'+val,'y'+val,'z'+val]);
            // create subplane to show the graph on
            if (!document.getElementById('plotbox' + val)) {
                var plotbox = document.createElement('a-box');
                plotbox.setAttribute('id', 'plotbox' + val);
                plotbox.setAttribute('position', { x: -.5, y: 0, z: .055 });
                plotbox.setAttribute('geometry', {
                    height:5,
                    width:5,
                    depth:.1});
                plotbox.setAttribute('material', 'color:green');
                plotbox.setAttribute('material', 'opacity:.1');
                plotbox.setAttribute('class', 'not-clickable');
                d3.csv('simulated_data_2_random_2000.csv', type, function (error, data) {
                    window.value = data;
                });
                //append everything
                this.parentNode.appendChild(plotbox);
            } else {
                var plotbox = document.getElementById('plotbox' + val);
                plotbox.setAttribute('visible', 'true');
            }
        });
    }
});
AFRAME.registerComponent('hide_cursorlistener', { // hides the plot and the buttons
    init: function () {
        this.el.addEventListener('click', function () {
            var val = this.parentNode.getAttribute('value')
            hide(buttons=['x'+val,'y'+val,'z'+val]);
            this.parentNode.querySelector('#plotbox' + val).setAttribute('visible', 'false');
        });
    }
});
// cursor listener for the axis
var rotate;
AFRAME.registerComponent('axis_cursorlistener', {
    schema: {
        axis: { type: 'string', default: 'x' },
        on: { type: 'boolean', default: false }
    },
    init: function () {
        var option = this.data;
        var idx = this.el.parentNode.getAttribute('value'); this.el.addEventListener('click', function () {
            if (option.on) { //hide the variable buttons
                option.on = false;
                var buttonchildren = d3.select(this).selectAll('.data_click')
                buttonchildren.attr('animation', 'property:position;to: 0 0 0;dur:1500;easing:linear');
                setTimeout(function () { // deletes the buttons after the animation
                    buttonchildren.remove();
                    document.getElementById(option.axis + idx).setAttribute('material', 'color:grey');
                }, 1500);
            } else { // show the axis and the variable buttons
                option.on = true;
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
                        break;
                    case 'z':
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
                }
            }
        });
    }
}); // axis buttons 
function type(d) { // casts entries to numbers
    d.value = +d.value;
    return d;
};
function buttontext(text, c = 'black', d = .05) { //creates text for buttons
    var buttontext = document.createElement('a-text');
    buttontext.setAttribute('value', text);
    buttontext.setAttribute('width','5');
    buttontext.setAttribute('color', c);
    buttontext.setAttribute('align', 'center');
    buttontext.setAttribute('position', { x: 0, y: 0, z: d });
    return buttontext;
};
function button(name = '', pos = '0 0 0', size = [.5, .5, .3], txt = '', idx = '', c = ['grey', 'black']) { // creates a basic clickable button
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
function data_buttons(d, shft = [0, 0], ax = 'x', c = 'grey') { // controls the position and the movement of the variable buttons
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
function rot_button(ax = 'x', pos = '0 0 0', txt = '', idx = 0) { // adds the rotation function on hover to the rotation buttons
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
function rotatePlot(a, n, d) { // rotates the plotbox corresponding to the button
    var plot = document.getElementById('plotbox' + n);
    var rot = plot.getAttribute('rotation');
    if (d == '<') {
        rot[a] = rot[a] - 1;
    } else if (d == '>') {
        rot[a] = rot[a] + 1;
    }
    plot.setAttribute('rotation', rot);
};
function hide(buttons = ''){// hides the listed buttons
    var i;
    for (i=0;i<buttons.length;i++){
        var b = document.getElementById(buttons[i]);
        if (b.getAttribute('visible')==true){
            b.setAttribute('visible','false');
            b.removeAttribute('class');
        }
    }
};
function show(buttons = ''){// shows the listed buttons
    var i;
    for (i=0;i<buttons.length;i++){
        var b = document.getElementById(buttons[i]);
        if (b.getAttribute('visible')==false){
            b.setAttribute('visible','true');
            b.setAttribute('class','clickable');
        }
    }
};
// creating teleport options
AFRAME.registerComponent('tiles', {
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
                tile.setAttribute('position', { x: (2*m - 9), y: (2*n - 9), z: 0.01 });
                tile.setAttribute('material', 'opacity', 0.2);
                tile.setAttribute('class', 'clickable');
                if (Math.sqrt((2*m - 9) ** 2 + (2*n - 9) ** 2) < 9) {
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
                        cam.setAttribute('position', { x: this.getAttribute('position').x, y: 0, z: -this.getAttribute('position').y });
                    });
                }
                var floor = document.getElementById('floor');
                floor.appendChild(tile);
            };
        };
    }
})
