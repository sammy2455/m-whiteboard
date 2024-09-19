'use strict';

(function () {
    var socket = io();
    var canvas = document.getElementsByClassName('whiteboard')[0];
    var context = canvas.getContext('2d');
    var current = {
        color: 'black',
        width: 2
    };
    var drawing = false;

    var colorPicker = document.getElementById('colorPicker');
    var lineWidthSlider = document.getElementById('lineWidth');
    var lineWidthValue = document.getElementById('lineWidthValue');
    var clearButton = document.getElementById('clearCanvas');
    var downloadButton = document.getElementById('downloadCanvas');
    var pencilTool = document.getElementById('pencilTool');
    var eraserTool = document.getElementById('eraserTool');
    var cursor = document.getElementById('cursor');

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

    canvas.addEventListener('touchstart', onTouchStart, false);
    canvas.addEventListener('touchend', onTouchEnd, false);
    canvas.addEventListener('touchcancel', onTouchEnd, false);
    canvas.addEventListener('touchmove', throttle(onTouchMove, 10), false);

    canvas.addEventListener('mousemove', updateCursor, false);
    canvas.addEventListener('mouseenter', showCursor, false);
    canvas.addEventListener('mouseleave', hideCursor, false);

    colorPicker.addEventListener('change', onColorUpdate, false);
    lineWidthSlider.addEventListener('input', onLineWidthUpdate, false);
    clearButton.addEventListener('click', clearCanvas, false);
    downloadButton.addEventListener('click', downloadCanvas, false);
    pencilTool.addEventListener('click', () => setTool('pencil'), false);
    eraserTool.addEventListener('click', () => setTool('eraser'), false);

    socket.on('drawing', onDrawingEvent);

    window.addEventListener('resize', onResize, false);
    onResize();

    function drawLine(x0, y0, x1, y1, color, width, emit) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = width;
        context.lineCap = 'round';
        context.stroke();
        context.closePath();

        if (!emit) {
            return;
        }
        var w = canvas.width;
        var h = canvas.height;

        socket.emit('drawing', {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            color: color,
            width: width
        });
    }

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function onMouseDown(e) {
        drawing = true;
        var pos = getMousePos(canvas, e);
        current.x = pos.x;
        current.y = pos.y;
    }

    function onMouseUp(e) {
        if (!drawing) {
            return;
        }
        drawing = false;
        var pos = getMousePos(canvas, e);
        drawLine(current.x, current.y, pos.x, pos.y, current.color, current.width, true);
    }

    function onMouseMove(e) {
        if (!drawing) {
            return;
        }
        var pos = getMousePos(canvas, e);
        drawLine(current.x, current.y, pos.x, pos.y, current.color, current.width, true);
        current.x = pos.x;
        current.y = pos.y;
    }

    function onTouchStart(e) {
        e.preventDefault();
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }

    function onTouchEnd(e) {
        e.preventDefault();
        var mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    }

    function onTouchMove(e) {
        e.preventDefault();
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }

    function onColorUpdate(e) {
        current.color = e.target.value;
        cursor.style.backgroundColor = current.color;
    }

    function onLineWidthUpdate(e) {
        current.width = e.target.value;
        lineWidthValue.textContent = e.target.value + 'px';
        updateCursorSize();
    }

    function updateCursor(e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }

    function showCursor() {
        cursor.style.display = 'block';
    }

    function hideCursor() {
        cursor.style.display = 'none';
    }

    function updateCursorSize() {
        cursor.style.width = current.width + 'px';
        cursor.style.height = current.width + 'px';
    }

    function setTool(tool) {
        if (tool === 'eraser') {
            current.color = '#FFFFFF';
            eraserTool.classList.add('active');
            pencilTool.classList.remove('active');
            cursor.style.border = '2px solid #000';
            cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        } else {
            current.color = colorPicker.value;
            pencilTool.classList.add('active');
            eraserTool.classList.remove('active');
            cursor.style.border = '2px solid #fff';
            cursor.style.backgroundColor = current.color;
        }
        updateCursorSize();
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function downloadCanvas() {
        var link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = canvas.toDataURL();
        link.click();
        showNotification();
    }

    function showNotification() {
        var notification = document.getElementById('notification');
        notification.classList.remove('hidden');
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    function throttle(callback, delay) {
        var previousCall = new Date().getTime();
        return function () {
            var time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    function onDrawingEvent(data) {
        var w = canvas.width;
        var h = canvas.height;
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.width);
    }

    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - document.querySelector('.toolbar').offsetHeight;
    }

    // Inicializar el tamaño del cursor
    updateCursorSize();
})();