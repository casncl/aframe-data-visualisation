window.addEventListener('gamepadconnected', function(evt){
    var s = document.getElementById('mycanvas4');
    var txt = document.createElement('a-text');
    txt.setAttribute('value','gamepad connected');
    s.appendChild(txt);
})