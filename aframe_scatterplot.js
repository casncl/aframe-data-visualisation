/**
 * aframe_scatterplot script for AFRAME VR Data Visualisation Tool
 *  Copyright (C) 2019 Christian Garske
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

 /**
 * @desc AFRAME component to listen for a touch on the screen as that emits the
 * click function
 */
AFRAME.registerComponent('touch_screen', {
    init: function () {
        const scene_el = this.el.sceneEl;
        const canvas_el = scene_el.canvas;
        canvas_el.addEventListener('touchend', function () {
            var cursor = document.getElementById('cursor');
            // objects in focus of the cursor
            inters_objects = cursor.components.raycaster.intersectedEls;
            var i;
            for (i = 0; i < inters_objects.length; i++) {
                inters_objects[i].emit('click');
            }
        })
    }
});
/**
 * @desc AFRAME component that creates the octagonal room in the scene
 */
AFRAME.registerComponent('room', {
    init: function () {
        var scene = document.querySelector('a-scene');
        var i,
            w = 10,
            h = 15;
        for (i = 0; i < 8; i++) {
            var wall = document.createElement('a-entity');
            var alpha = i / 4 * Math.PI;
            wall.setAttribute('id', 'wall' + i);
            wall.setAttribute('geometry', {
                primitive: 'plane',
                height: h,
                width: w
            });
            wall.setAttribute('material', 'color', '#f0f0f0');
            wall.object3D.position.set(10 * Math.sin(alpha), 1, 10 * Math.cos(alpha));
            wall.setAttribute('rotation', { x: 0, y: (i - 4) / 8 * 360, z: 0 });
            if (!(i % 2)) {
                wall.setAttribute('axis_buttons', '');
            }else if (i==5){
                var ctrl_b = button('',pos='0 0 0',size=[.5,1,.1],txt='switch',idx=i);
                ctrl_b.appendChild(button_text('controls:','black',0.05,[0,.75]));
                var text = button_text('gaze','black',0.05,[0,0.5]);
                text.setAttribute('id','cur_control');
                ctrl_b.appendChild(text);
                ctrl_b.setAttribute('control_button','');
                wall.appendChild(ctrl_b);
            }
            wall.setAttribute('value', i);
            scene.appendChild(wall);
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
        var b_list = ['load', 'clear', 'help','inspect'];
        // positions
        var b_x = [0.2, 0.7, .45,.45].map(function (x) { return 10 * (x - .5) });
        var b_y = [0.2, 0.2, .15,.25].map(function (x) { return 15 * (x - .5) });
        for (j = 0; j < b_list.length; j++) {
            var ax_button = button(name = '', pos = b_x[j] + ' ' + b_y[j] + ' 0', size = [.5, .75, .1], txt = b_list[j], idx = val);
            ax_button.setAttribute('value', b_list[j]);
            ax_button.setAttribute(b_list[j] + '_cursorlistener', '');
            if(b_list[j]=='inspect'){
                ax_button.object3D.visible=false;
            }
            this.el.appendChild(ax_button);
        }
        var scene = document.getElementById('scene')
        var csv_data = scene.getAttribute('csv')
        d3.csv(csv_data, type, function (error, data) {
            window.value = data;
            var wheel = document.createElement('a-entity');
            var variables = d3.keys(d3.values(window.value)[0])
            var exclude = scene.getAttribute('exclude').split(',');
            var variables_filtered = variables.filter(function(value,index,arr){
                return !exclude.includes(value);
            })
            wheel.setAttribute('value', variables_filtered);
            wheel.setAttribute('id', 'wheel' + (val));
            wheel.setAttribute('select_wheel', '');
            wheel.object3D.position.set(-2.7, 0, 0);
            var wall = document.getElementById('wall' + (val));
            wall.appendChild(wheel);
        });
    }
});
/**
 * @desc AFRAME component that switches between gaze control and touch screen click
 */
AFRAME.registerComponent('control_button',{
    schema:{
        control: {type:'string',default:'gaze'}
    },
    init:function(){
        var control_type = this.data.control;
        this.el.addEventListener('click',function(){
            // var idx=this.parentNode.getAttribute('value');
            scene = document.getElementById('scene');
            cursor = document.getElementById('cursor');
            current = document.getElementById('cur_control');
            if (control_type=='gaze'){
                control_type='touch';
                scene.setAttribute('touch_screen','');
                cursor.setAttribute('cursor','fuse:false');
                current.setAttribute('value','trigger');
            }else{
                control_type='gaze';
                scene.removeAttribute('touch_screen');
                cursor.setAttribute('cursor','fuse:true');
                current.setAttribute('value','gaze');
            }
        })
    }
})
/**
 * @desc AFRAME component that makes the axis buttons visible and creates the plot area
 */
AFRAME.registerComponent('load_cursorlistener', {
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
            if (!loading) {
                if (!document.getElementById('origin' + val)) { 
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
                    create_spinner(val);
                    draw_data(origin, selection, plotdata, 10, val);
                    loaded = true;
                    axis_ticks('x', [0, 0], val, '', false);
                    axis_ticks('y', [0, 0], val, '', false);
                    axis_ticks('z', [0, 0], val, '', false);
                }
                var inspect_b = document.getElementById('inspect'+val);
                if (!inspect_b.object3D.visible){
                    inspect_b.object3D.visible=true;
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
                    if (!origin.hasAttribute('line__x')) {
                        origin.setAttribute('line__x', 'start: 0 0 0; end: 5 0 0;color:gray');
                    }
                    if (!origin.hasAttribute('line__y')) {
                        origin.setAttribute('line__y', 'start: 0 0 0; end: 0 5 0;color:gray');
                    }
                } else {
                    var plotbox = document.getElementById('plotbox' + val);
                    plotbox.object3D.visible = true;
                }
                
            }
        });
    }
});
/**
 * @desc AFRAME component that moves the plot area to the center of the room (or back)
 */
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
            var wall = document.getElementById('wall'+idx);
            var origin = document.getElementById('origin'+idx);
            if (!clck){
                clck=true;
                if(!cntrd){
                    var world_pos = wall.object3D.getWorldPosition();
                    origin.setAttribute('animation__pos','property:position;to:'+(-world_pos.x-2.5)+' '+(-world_pos.y-1.5)+' '+(-world_pos.z-2.5)+';easing:linear;dur:500');
                    cntrd = true;
                }else{ 
                    origin.setAttribute('animation__pos','property:position;to:'+(-1.5)+' '+(-2.5)+' '+(.05)+';easing:linear;dur:500');
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
/**
 * @desc AFRAME component that shows help messages for different buttons
 */
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
                var load_help = document.getElementById('load' + idx + 'help');
                load_help.object3D.visible = false;
                var wheel_help = document.getElementById('wheel' + idx + 'help');
                wheel_help.object3D.visible = false;
                var inspect_help = document.getElementById('inspect' + idx+ 'help');
                inspect_help.object3D.visible = false;
                var clear_help = document.getElementById('clear' + idx + 'help');
                clear_help.object3D.visible = false;
                var gt_help = document.getElementById('switch' + (+idx+1) + 'help');
                gt_help.object3D.visible = false;
                var h_help = document.getElementById('help' + idx + 'help');
                h_help.object3D.visible = false;
            } else {
                on = true;
                if (!document.getElementById('load' + idx + 'help')) {
                    var load_b = document.getElementById('load' + idx);
                    var b = help_text(load_b, loc = [-1, .5]);
                    b.setAttribute('value', 'Click to load the data and\n show the plot area!');
                } else {
                    var load_help = document.getElementById('load' + idx + 'help');
                    load_help.object3D.visible = true;
                }
                if (!document.getElementById('wheel' + idx + 'help')) {
                    var wheel_b = document.getElementById('wheel' + idx);
                    var b = help_text(wheel_b, loc = [-1.25, -2]);
                    b.setAttribute('value', 'Choose variable on the wheel, \n choose axis and click the plot triangle!');
                } else {
                    var wheel_help = document.getElementById('wheel' + idx + 'help');
                    wheel_help.object3D.visible = true;
                }
                if (!document.getElementById('inspect' + idx + 'help')) {
                    var inspect_b = document.getElementById('inspect' + idx);
                    var b = help_text(inspect_b, loc = [-1, .5]);
                    b.setAttribute('value', 'Click to move the plot area\n to the center of the room!');
                } else {
                    var inspect_help = document.getElementById('inspect' + idx + 'help');
                    inspect_help.object3D.visible = true;
                }
                if (!document.getElementById('clear' + idx + 'help')) {
                    var clear_b = document.getElementById('clear' + idx);
                    var b = help_text(clear_b, loc = [-1, .5]);
                    b.setAttribute('value', 'Click to clear the plot data!');
                } else {
                    var clear_help = document.getElementById('clear' + idx + 'help');
                    clear_help.object3D.visible = true;
                }
                if (!document.getElementById('switch' + (+idx+1) + 'help')) {
                    var gt_b = document.getElementById('switch' + (+idx+1));
                    var b = help_text(gt_b, loc = [-1, -.5]);
                    b.setAttribute('value', 'Click to switch between gaze\ncontrol and touch click control!');
                } else {
                    var gt_help = document.getElementById('switch' + (+idx+1) + 'help');
                    gt_help.object3D.visible = true;
                }
                if (!document.getElementById('help' + idx + 'help')) {
                    var h_b = document.getElementById('help' + idx);
                    var b = help_text(h_b, loc = [0, -.5]);
                    b.setAttribute('align','center');
                    b.setAttribute('value', 'Click on the floor to teleport to the highlighted tile!');
                } else {
                    var h_help = document.getElementById('help' + idx + 'help');
                    h_help.object3D.visible = true;
                }
            }
        })
    }
});
/**
 * @desc AFRAME component that hides the buttons and the plot area on a click
 */
AFRAME.registerComponent('clear_cursorlistener', {
    init: function () {
        this.el.addEventListener('click', function () {
            var val = this.parentNode.getAttribute('value')
            if (document.getElementById('origin' + val)) {
                var origin = document.getElementById('origin' + val);
                origin.childNodes.forEach(
                    function(n){
                        var node_class = n.getAttribute('class');
                        switch(node_class){
                            case 'datapoint':
                            case 'axis':
                                n.object3D.position.set(0,0,0);
                                n.setAttribute('visible','false');
                            }
                    }
                )
                if (document.getElementById('plotbox' + val)) {
                    var plot = document.getElementById('plotbox' + val);
                    plot.setAttribute('animation__depth', 'property: geometry.depth;to: .1;dur:1500;easing:linear');
                    plot.setAttribute('animation__pos', 'property: position;to: 2.5 2.5 0;dur:1500;easing:linear');
                    var ax = ['x','y','z'];
                    var i,j,k,l;
                    for (l=0;l<4;l++){
                    for (i=0;i<3;i++){
                        for (j=0;j<3;j++){
                            if(ax[i]!=ax[j]&&(ax[i]=='z' || ax[j]=='z')){
                                origin.setAttribute('line__'+ax[i]+ax[j]+l,'visible:false');
                                for (k=0;k<2;k++){
                                    if(ax[k]!=ax[i]&&ax[k]!=ax[j]){
                                        origin.setAttribute('line__'+ax[i]+ax[j]+ax[k]+l,'visible:false');        
                                    }
                                }
                            }
                            
                        }
                    }}
                    origin.setAttribute('line__z','visible:false');
                }
            }
        });
    }
});
/**
 * @desc AFRAME component for a wheel based selection tool
 */
AFRAME.registerComponent('select_wheel', {
    init: function () {
        var val = this.el.parentNode.getAttribute('value');
        // labels
        var button_labels = this.el.getAttribute('value').split(',');
        var axis_labels = ['x', 'y', 'z'];
        var g = ['grey', 'darkgrey', 'lightgrey'];
        // button up
        var tr_up = document.createElement('a-triangle');
        tr_up.object3D.position.set(-.75, 1.5, 0.05);
        tr_up.setAttribute('color', 'grey');
        tr_up.setAttribute('scale', '.5 .5');
        tr_up.setAttribute('class', 'clickable');
        tr_up.setAttribute('value', 'up');
        tr_up.setAttribute('wheel_arrow_listener', 'direction:up');
        this.el.appendChild(tr_up);
        // button spin down
        var tr_down = document.createElement('a-triangle');
        tr_down.object3D.position.set(-.75, -1.5, 0.05);
        tr_down.object3D.rotation.set(0, 0, Math.PI);
        tr_down.setAttribute('scale', '.5 .5');
        tr_down.setAttribute('color', 'grey');
        tr_down.setAttribute('class', 'clickable');
        tr_down.setAttribute('value', 'down');
        tr_down.setAttribute('wheel_arrow_listener', 'direction:down');
        this.el.appendChild(tr_down);
        // button to select and plot
        var tr_select = document.createElement('a-triangle');
        tr_select.setAttribute('id', 'sel_tri' + val);
        tr_select.object3D.position.set(.6, 0, 0.05);
        tr_select.object3D.rotation.set(0, 0, -Math.PI / 2);
        tr_select.setAttribute('scale', '1 .5');
        tr_select.setAttribute('color', 'grey');
        tr_select.setAttribute('class', 'clickable');
        tr_select.setAttribute('axis', 'x');
        tr_select.setAttribute('variable', button_labels[2]);
        tr_select.setAttribute('wheel_select_listener', '');
        var sel_text = button_text('plot', c = 'black', d = '0.05', offset = [0, -.1]);
        sel_text.object3D.rotation.set(0, 0, Math.PI / 2);
        sel_text.setAttribute('scale', '1.5 .75');
        sel_text.setAttribute('align', 'center');
        tr_select.appendChild(sel_text);
        this.el.appendChild(tr_select);
        // creates the wheel entries
        var buttons = document.createElement('a-entity');
        buttons.object3D.position.set(-.75, 0, 0);
        buttons.setAttribute('id', this.el.getAttribute('id') + 'buttons');
        for (j = 0; j < button_labels.length; j++) {
            var wheel_button = button(name = '', pos = '0 ' + ((j - 2) * 0.5) + ' 0', size = [.5, .75, .1], txt = button_labels[j], idx = val);
            if (j > 4) {
                wheel_button.object3D.visible = false;
            } else {
                wheel_button.setAttribute('material', 'color:' + g[Math.abs(j - 2)]);
                wheel_button.setAttribute('scale', (1 - Math.abs(j - 2) / 10) + ' 1 '+(1 - Math.abs(j - 2) / 10));
            }
            wheel_button.removeAttribute('class');
            wheel_button.setAttribute('id', j);
            wheel_button.setAttribute('value', j);
            buttons.appendChild(wheel_button);
        }
        var wheel_select_box = document.createElement('a-box');
        wheel_select_box.setAttribute('material','color:red');
        wheel_select_box.setAttribute('geometry',{
            height:.55,
            width:.8,
            depth:.095});
        wheel_select_box.setAttribute('id','wheel_frame'+val);
        wheel_select_box.object3D.position.set(-.75,0,0);
        this.el.appendChild(wheel_select_box);
        this.el.appendChild(buttons);
        // creates axis buttons
        var axes = document.createElement('a-entity');
        axes.object3D.position.set(0, 0, 0);
        axes.setAttribute('id', this.el.getAttribute('id') + 'axes');
        for (j = 0; j < axis_labels.length; j++) {
            var axis_button = button(name = '', pos = '0 ' + ((j - 1) * 0.55) + ' 0', size = [.5, .5, .1], txt = axis_labels[j], idx = val);
            axis_button.setAttribute('id', axis_labels[j] + val);
            axis_button.setAttribute('value', axis_labels[j] + val);
            axis_button.setAttribute('wheel_axis_listener', '');
            axes.appendChild(axis_button);
        }
        var axis_select_box = document.createElement('a-box');
        axis_select_box.setAttribute('material','color:red');
        axis_select_box.setAttribute('geometry',{height:.55,width:.55,depth:.08});
        axis_select_box.setAttribute('id','axis_frame'+val);
        axis_select_box.object3D.position.set(0,-.55,0);
        this.el.appendChild(axis_select_box);
        this.el.appendChild(axes);
    }
})
/**
 * @desc AFRAME component: Listener for direction arrows to spin the wheel 
 */
AFRAME.registerComponent('wheel_arrow_listener', {
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
                var select_box = document.getElementById('wheel_frame'+val);
                var button_labels = this.parentNode.getAttribute('value').split(',');
                var i;
                var g = ['grey', 'darkgrey', 'lightgrey'];
                select_box.object3D.visible=false;
                for (i = 0; i < buttons.length; i++) {
                    var pos = buttons[i].object3D.position;
                    if (dir == 'down' && +buttons[i].getAttribute('id') < 5) {
                        clicked == true;
                        if (buttons[i].getAttribute('id') == 4) {
                            buttons[i].setAttribute('animation__scl', 'property:scale;to: 0.1 0.1 0.1;easing:linear;dur:500');
                            var j = buttons[i].getAttribute('value') - 5;
                            if (j < 0) { j = button_labels.length + j };
                            buttons[j].object3D.visible = true;
                            buttons[j].object3D.position.set(0, -1.5, 0)
                            buttons[j].setAttribute('material', 'color:' + g[2]);
                            buttons[j].setAttribute('animation__pos', 'property:position;to: 0 -1 0;easing:linear;dur:500');
                            buttons[j].setAttribute('animation__scl', 'property:scale;from: 0 0 0;to: .8 1 .8;easing:linear;dur:500');
                            buttons[j].setAttribute('id', -1);
                            setTimeout(function (b_ex, b_en) {
                                b_ex.removeAttribute('animation__scl');
                                b_en.removeAttribute('animation__pos');
                                b_en.removeAttribute('animation__scl');
                            }, 550, buttons[i], buttons[j])
                        }
                        else {
                            buttons[i].setAttribute('animation__pos', 'property:position;to: 0 ' + (pos.y + 0.5) + ' 0;easing:linear;dur:500');
                            buttons[i].setAttribute('animation__scl', 'property:scale;to: ' + (1 - Math.abs(buttons[i].getAttribute('id') - 1) / 10) + ' 1 '+(1 - Math.abs(buttons[i].getAttribute('id') - 1) / 10)+';easing:linear;dur:500');
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
                            buttons[j].setAttribute('animation__scl', 'property:scale;from: 0 0 0;to: .8 1 .8;easing:linear;dur:500');
                            buttons[j].setAttribute('id', 5);
                            setTimeout(function (b_ex, b_en) {
                                b_ex.removeAttribute('animation__scl');
                                b_en.removeAttribute('animation__pos');
                                b_en.removeAttribute('animation__scl');
                            }, 550, buttons[i], buttons[j])
                        } else {
                            buttons[i].setAttribute('animation__pos', 'property:position;to: 0 ' + (pos.y - 0.5) + ' 0;easing:linear;dur:500');
                            buttons[i].setAttribute('animation__scl', 'property:scale;to: ' + (1 - Math.abs(buttons[i].getAttribute('id') - 3) / 10) + ' 1 '+(1 - Math.abs(buttons[i].getAttribute('id') - 3) / 10)+';easing:linear;dur:500');
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
                        sel.setAttribute('variable', button_labels[i]);
                    }
                }
                setTimeout(function () {
                    clicked = false;
                    select_box.object3D.visible=true;
                }, 600)
            }
        })
    }
});
/**
 * @desc AFRAME component: Listener for the axis buttons that turn the respective axis active
 */
AFRAME.registerComponent('wheel_axis_listener', {
    init: function () {
        this.el.addEventListener('click', function () {
            var val = this.parentNode.parentNode.parentNode.getAttribute('value');
            var selector = document.getElementById('sel_tri' + val);
            // var cur_ax = selector.getAttribute('axis');
            // var cur_ax_button = document.getElementById(cur_ax+val);
            // cur_ax_button.setAttribute('material','color:grey');
            // this.setAttribute('material','color:green');
            selector.setAttribute('axis', this.getAttribute('id')[0]);
            var select_box = document.getElementById('axis_frame'+val);
            select_box.object3D.position.set(0,this.object3D.position.y,0);
        })
    }
});
/**
 * @desc AFRAME component Listener for the plot button which plots the selected variable on the selected axis.
 */
AFRAME.registerComponent('wheel_select_listener', {
    schema: {
        clicked: { type: 'bool', default: false }
    },
    init: function () {
        this.el.addEventListener('click', function () {
            var plotdata = window.value,
                idx = this.parentNode.parentNode.getAttribute('value'),
                plot_ID = document.getElementById('plotbox' + idx),
                geo = plot_ID.getAttribute('geometry'),
                key = this.getAttribute('variable'),
                axis = this.getAttribute('axis');
            range = [];
            if (!document.getElementById('origin' + idx)) { 
                var origin = d3.select(plot_ID).append('a-entity')
                    .attr('id', 'origin' + idx)
                    .attr('position', (-geo.width / 2) + ' ' + (-geo.height / 2) + ' 0');
            } else {
                var origin = d3.select('#origin' + idx);
            }
            switch (axis) {
                case 'x':
                    range = [0, geo.width];
                    break;
                case 'y':
                    range = [0, geo.height];
                    break;
                case 'z':
                    range = [0, 5];
                    grid('x', 'z', idx, geo.width, '');
                    grid('z', 'x', idx, geo.width, '');
                    grid('z', 'y', idx, geo.width, '');
                    grid('y', 'z', idx, geo.width, '');
                    grid('x', 'z', idx, geo.width, 'y');
                    grid('z', 'x', idx, geo.width, 'y');
                    grid('z', 'y', idx, geo.width, 'x');
                    grid('y', 'z', idx, geo.width, 'x');
                    plot_ID.setAttribute('animation__depth', 'property: geometry.depth;to: 5;dur:1500;easing:linear');
                    plot_ID.setAttribute('animation__pos', 'property: position;to:2.5 2.5 2.5;dur:1500;easing:linear');
                    var line_to = '0 0 5';
                    origin.attr('line__' + axis, 'start: 0 0 0; end: ' + line_to + ';color:gray');
            }
            var extent = d3.extent(plotdata, function (d) { return +d[key]; });
            axis_ticks(axis, extent, idx, key);
            var scale = d3.scaleLinear()
                .domain(extent)
                .range(range);
            var selection = origin.selectAll('a-plane')
                .data(plotdata);
            if (axis == 'z') {
                var color_scale = d3.scaleSequential()
                    .domain(extent)
                    .interpolator(d3.interpolateInferno);
                selection.attr('color', function (d) { return color_scale(d[key]); });
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
                selection.attr('animation',null);
            }, 1500);
        }
        );
    }
});
/**
 * @desc AFRAME component that creates interactible tiles that the user can teleport to on a click
 */
AFRAME.registerComponent('teleport_tiles', {
    init: function () {
        var m, n;
        var n_tiles = 10;
        for (m = 0; m < n_tiles; m++) {
            for (n = 0; n < n_tiles; n++) {
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
/**
 * creates a help text for the specified button
 * @param {object} node -  button for which the help text is to be displayed
 * @param {array} loc - location of the text relative to the button
 */
function help_text(node, loc = [0, 0]) {
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
 * @param {string} d - the string to be cast into a number
 * @return the cast number
 */
function type(d) {
    d.value = +d.value;
    return d;
};
/**
 * @desc creates the button label
 * @param {string} text - the string to be cast into a number
 * @param {string} c - the color of the label
 * @param {float} d - distance of the label to the button
 * @return an a-text entity
 */
function button_text(text, c = 'black', d = .05, offset = [0, 0]) {
    var button_text = document.createElement('a-text');
    button_text.setAttribute('value', text);
    button_text.setAttribute('width', '5');
    button_text.setAttribute('color', c);
    button_text.setAttribute('align', 'center');
    button_text.object3D.position.set(offset[0], offset[1], d);
    // button_text.setAttribute('zOffset',d);
    button_text.setAttribute('depthTest', false);
    return button_text;
};
/**
 * @desc creates a clickable button
 * @param {string} name - name for the id 
 * @param {string} pos - position relative to parent node
 * @param {array} size - dimensions of the button
 * @param {string} txt - text for the button label
 * @param {string} idx - index of the wall
 * @param {string} array c - colors for the button [0] and the text [1]
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
    new_button.appendChild(button_text(txt, c[1]), (size[2] / 2 + 0.05));
    return new_button;
};
/**
 * @desc creates the movement of the data variable buttons
 * @param {object} d - the data entry 
 * @param {array} shft - shifted position relative to the axis parent button
 * @param {string} ax - axis label of the parent button
 * @param {string} c - color of the button
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
 * @desc creates a rough grid for orientation
 * @param {string} ax1 - axis along which the grid is supposed to run
 * @param {string} ax2 - second axis along which the grid is supposed to run
 * @param {string} idx - index of the plot area
 * @param {struct} geo - geometry of the plot area
 * @param {string} oppAx - third axis 
 */
function grid(ax1 = 'x', ax2 = 'y', idx = '', dim, oppAx = '') {
    var origin = document.getElementById('origin' + idx);
    var pos_start = { x: 0, y: 0, z: 0 };
    var pos_end = { x: 0, y: 0, z: 0 };
    var q = [.25, .5, .75, 1];
    var i;
    for (i = 0; i < 4; i++) {
        if (origin.hasAttribute('line__' + ax1 + ax2 + oppAx + i)){
            origin.setAttribute('line__' + ax1 + ax2 + oppAx + i,'visible:true');
        }else{
            pos_start[ax1] = q[i] * dim;
            pos_end[ax1] = q[i] * dim;
            pos_end[ax2] = dim;
            if (oppAx != '') {
                pos_start[oppAx] = dim;
                pos_end[oppAx] = dim;
            }
            origin.setAttribute('line__' + ax1 + ax2 + oppAx + i, 'start: ' + pos_start.x + ' ' + pos_start.y + ' ' + pos_start.z + '; end: ' + pos_end.x + ' ' + pos_end.y + ' ' + pos_end.z + ';color:lightgray');
        }
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
    var frac = [0, .25, .5, .75, 1];
    var i;
    if (!document.getElementById(ax + 'axis' + idx)) {
        var axis = document.createElement('a-entity');
        axis.setAttribute('id', ax + 'axis' + idx);
        axis.setAttribute('class','axis');
    } else {
        var axis = document.getElementById(ax + 'axis' + idx);
        axis.setAttribute('visible',vis);
    }
    for (i = 0; i < 5; i++) {
        var pos = { x: 0, y: 0, z: 0 };
        if (!document.getElementById('tick' + idx + ax + i)) {
            var text = document.createElement('a-text');
            text.setAttribute('id', 'tick' + idx + ax + i);
            text.setAttribute('color', 'black');
            text.setAttribute('align', 'left');
            text.setAttribute('material', 'alphaTest:0.05')
            text.setAttribute('class','axis');
            // text.setAttribute('look-at', '[camera]');
            pos[ax] = pos[ax] + 5 * frac[i];
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
            pos[ax] = pos[ax] + 5 * frac[i];
            text.setAttribute('animation__pos', 'property:position;to: 0 0 ' + pos.z + ';easing:linear;dur:1500');
        }
        text.setAttribute('value', numeral(range[0] + (range[1] - range[0]) * frac[i]).format('0, 0.0'));
        text.setAttribute('scale', '.75 .75');
        text.setAttribute('visible',vis);
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
        text.setAttribute('animation__pos', 'property:position;to: -.4 -.3 5;easing:linear;dur:1500')
        var xaxis = document.getElementById('xaxis' + idx);
        if (xaxis.hasAttribute('animation__pos')){
            xaxis.removeAttribute('animation__pos');
        }
        xaxis.setAttribute('animation__pos', 'property:position;to: 0 0 5;easing:linear;dur:1500')
        var yaxis = document.getElementById('yaxis' + idx);
        if (yaxis.hasAttribute('animation__pos')){
            yaxis.removeAttribute('animation__pos');
        }
        yaxis.setAttribute('animation__pos', 'property:position;to: 0 0 5;easing:linear;dur:1500')
    }
    text.setAttribute('value', key);
    text.setAttribute('scale', '.75 .75');
    text.setAttribute('visible',vis);
    if (!document.getElementById('label' + ax + idx)) {
        axis.appendChild(text);
    }
    if (!document.getElementById(ax + 'axis' + idx)) {
        orig.appendChild(axis);
    }
};
/**
 * @desc creates a circular progress indicator
 * @param {int} idx - wall which the progress indicator should be displayed on
 */
function create_spinner(idx) {
    var orig = document.getElementById('origin' + idx);
    var spinner = document.createElement('a-circle');
    spinner.object3D.position.set(2.5, 2.5, 0.1);
    spinner.object3D.rotation.set(0, Math.PI, 0);
    spinner.setAttribute('geometry', 'thetaStart:90');
    spinner.setAttribute('geometry', 'thetaLength:1');
    spinner.setAttribute('material', 'color:darkgrey');
    spinner.setAttribute('material', 'side:back');
    spinner.setAttribute('id', 'progbar' + idx);
    var text = document.createElement('a-text');
    text.setAttribute('value','Loading data');
    text.setAttribute('color','black');
    text.setAttribute('align','center')
    text.object3D.position.set(0,1.2,-.1);
    text.object3D.rotation.set(0,Math.PI,0);
    spinner.appendChild(text);
    orig.append(spinner);
}
/**
 * creates the datapoints batchwise
 * @param {object} origin 
 * @param {d3 object} selection 
 * @param {object} plotdata 
 * @param {int} batch_size 
 * @param {int} idx 
 */
function draw_data(origin, selection, plotdata, batch_size, idx) {
    function draw_batch(batch_number, idx) {
        return function () {
            var start_idx = batch_number * batch_size,
                stop_idx = Math.min(plotdata.length, start_idx + batch_size),
                enter_sel = d3.selectAll(selection.enter()._groups[0].slice(start_idx, stop_idx));
            var progress = document.getElementById('progbar' + idx);
            progress.setAttribute('geometry', 'thetaLength:' + ((start_idx+1) / plotdata.length * 360));

            enter_sel.each(function (d, i) {
                var new_element = origin.append('a-plane');
                enter_sel[i] = new_element;
                new_element.__data__ = this.__data__;
                new_element._groups[0][0].setAttribute('geometry', 'height:.1;width:.1');
                new_element._groups[0][0].setAttribute('material', 'src:#circle');
                new_element._groups[0][0].setAttribute('material', 'alphaTest:0.5');
                new_element._groups[0][0].setAttribute('material', 'color:black');
                new_element._groups[0][0].setAttribute('visible', 'false');
                new_element._groups[0][0].setAttribute('position', '0 0 0');
                new_element._groups[0][0].setAttribute('look-at', '[camera]');
                new_element._groups[0][0].setAttribute('class', 'datapoint');
            })
            if (stop_idx < plotdata.length) {
                setTimeout(draw_batch(batch_number + 1, idx), 0);
            } else {
                progress.object3D.visible = false;
                var plotbox = document.getElementById('plotbox' + idx);
                plotbox.object3D.visible = true;
                var load_b = document.getElementById('load'+idx);
                load_b.setAttribute('load_cursorlistener',{loaded:true,loading:false});
                grid('x', 'y', idx, 5);
                grid('y', 'x', idx, 5);
                    
            }

        };
    }
    setTimeout(draw_batch(0, idx), 0);
};
