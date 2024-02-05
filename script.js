document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");
    const colorPicker = document.getElementById("color");
    const prePickedColors = document.querySelectorAll(".pre-picked-color");
    const clearCanvasButton = document.getElementById("clearCanvas");
    const saveDrawingButton = document.getElementById("saveDrawing");
    const undoButton = document.getElementById("undo");
    const backgroundColorInput = document.getElementById("backgroundColor");
    const sizeInput = document.getElementById("size");
    const sizePreview = document.getElementById("sizePreview");
    const brushPickerIcons = document.querySelectorAll(".brush-icon");

    const drawingCanvas = document.createElement("canvas");
    const drawingCtx = drawingCanvas.getContext("2d");
    const backgroundCanvas = document.createElement("canvas");
    const backgroundCtx = backgroundCanvas.getContext("2d");

    drawingCanvas.width = canvas.width;
    drawingCanvas.height = canvas.height;
    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;

    let painting = false;
    let lastDrawingTime = Date.now();
    let drawingHistory = [];

    // Set default background color
    setBackgroundColor(backgroundColorInput.value);

    // Draw the initial state on the canvas
    drawInitialCanvasState();

    function drawInitialCanvasState() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundCanvas, 0, 0);
        ctx.drawImage(drawingCanvas, 0, 0);
    }

    function startPosition(e) {
        painting = true;
        draw(e);
    }

    function endPosition() {
        if (painting) {
            // Save the current state if significant time has passed since the last save
            const currentTime = Date.now();
            if (currentTime - lastDrawingTime > 100) {
                saveDrawingState();
                lastDrawingTime = currentTime;
            }
        }
        painting = false;
        drawingCtx.beginPath();
    }

    function draw(e) {
        if (!painting) return;

        const penSize = sizeInput.value;
        const selectedColor = colorPicker.value;

        drawingCtx.lineWidth = penSize;
        drawingCtx.lineCap = "round";
        drawingCtx.strokeStyle = selectedColor;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (brushPickerIcons[0].classList.contains("selected")) {
            drawingCtx.lineTo(x, y);
            drawingCtx.stroke();
            drawingCtx.beginPath();
            drawingCtx.arc(x, y, penSize / 2, 0, Math.PI * 2); // Draw a circle for the size preview
            drawingCtx.fillStyle = selectedColor;
            drawingCtx.fill();
            drawingCtx.beginPath();
            drawingCtx.moveTo(x, y);
        } else if (brushPickerIcons[1].classList.contains("selected")) {
            sprayPaint(x, y, penSize, selectedColor);
        } else if (brushPickerIcons[2].classList.contains("selected")) {
            watercolor(x, y, penSize, selectedColor);
        }

        // Update size preview
        sizePreview.style.width = `${penSize}px`;
        sizePreview.style.height = `${penSize}px`;
        sizePreview.style.backgroundColor = selectedColor;

        // Update the main canvas
        drawInitialCanvasState();
    }

    function sprayPaint(x, y, penSize, selectedColor) {
        drawingCtx.fillStyle = selectedColor;

        for (let i = 0; i < 20; i++) {
            const sprayX = x + Math.random() * penSize * 2 - penSize;
            const sprayY = y + Math.random() * penSize * 2 - penSize;

            drawingCtx.fillRect(sprayX, sprayY, 1, 1);
        }
    }

    function watercolor(x, y, penSize, selectedColor) {
        drawingCtx.globalAlpha = 0.1; // Set a lower opacity, e.g., 10%
        drawingCtx.fillStyle = selectedColor;
    
        for (let i = 0; i < 5; i++) {
            drawingCtx.fillRect(x, y, penSize, penSize);
        }
    
        drawingCtx.globalAlpha = 1; // Reset opacity to default
    }
    
    
    function undo() {
        if (drawingHistory.length > 0) {
            drawingCtx.putImageData(drawingHistory.pop(), 0, 0);
            drawInitialCanvasState();
        }
    }

    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", endPosition);

    canvas.addEventListener("mousemove", function (e) {
        if (painting) {
            draw(e);
        }
    });

    prePickedColors.forEach((prePickedColor) => {
        prePickedColor.addEventListener("click", function () {
            const color = this.style.backgroundColor;
            colorPicker.value = rgbToHex(color);
            sizePreview.style.backgroundColor = colorPicker.value;
        });
    });

    clearCanvasButton.addEventListener("click", function () {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingHistory = []; // Clear drawing history
        setBackgroundColor(backgroundColorInput.value, function () {
            drawInitialCanvasState();
        });
    });

    saveDrawingButton.addEventListener("click", function () {
        // Prompt the user to name the image
        const imageName = prompt("Please enter the image name:");
    
        if (imageName) {
            // Create a new canvas for saving
            const saveCanvas = document.createElement("canvas");
            saveCanvas.width = canvas.width;
            saveCanvas.height = canvas.height;
            const saveCtx = saveCanvas.getContext("2d");
    
            // Fill the new canvas with the background color
            saveCtx.fillStyle = backgroundColorInput.value;
            saveCtx.fillRect(0, 0, saveCanvas.width, saveCanvas.height);
    
            // Draw the content (drawingCanvas) on the new canvas
            saveCtx.drawImage(drawingCanvas, 0, 0);
    
            // Convert the new canvas content to a data URL
            const dataURL = saveCanvas.toDataURL("image/jpeg");
    
            // Create a link element and trigger a click event to download the image
            const link = document.createElement("a");
            link.href = dataURL;
            link.download = `${imageName}.jpg`;
            link.click();
        }
    });
    
    
    
    
    

    function saveDrawing(imageName) {
        // Create a new canvas for saving
        const saveCanvas = document.createElement("canvas");
        saveCanvas.width = canvas.width;
        saveCanvas.height = canvas.height;
        const saveCtx = saveCanvas.getContext("2d");

        // Fill the new canvas with the background color
        saveCtx.fillStyle = backgroundColorInput.value;
        saveCtx.fillRect(0, 0, saveCanvas.width, saveCanvas.height);

        // Draw the content (backgroundCanvas and drawingCanvas) on the new canvas
        saveCtx.drawImage(backgroundCanvas, 0, 0);
        saveCtx.drawImage(drawingCanvas, 0, 0);

        drawingHistory.forEach(imageData => {
            saveCtx.putImageData(imageData, 0, 0);
        });

        // Convert the new canvas content to a data URL
        const dataURL = saveCanvas.toDataURL("image/jpeg");

        // Create a link element and trigger a click event to download the image
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${imageName}.jpg`;
        link.click();
    }

    function setBackgroundColor(color, callback) {
        // Fill the background with the specified color
        backgroundCtx.fillStyle = color;
        backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

        // Draw the content (backgroundCanvas and drawingCanvas) on the drawing canvas
        ctx.drawImage(backgroundCanvas, 0, 0);
        ctx.drawImage(drawingCanvas, 0, 0);

        // Execute the callback if provided
        if (typeof callback === "function") {
            callback();
        }
    }

    undoButton.addEventListener("click", undo);

    backgroundColorInput.addEventListener("input", function () {
        setBackgroundColor(backgroundColorInput.value, function () {
            drawInitialCanvasState();
        });
    });

    sizeInput.addEventListener("input", function () {
        const penSize = sizeInput.value;
        sizePreview.style.width = `${penSize}px`;
        sizePreview.style.height = `${penSize}px`;
    });

    colorPicker.addEventListener("input", function () {
        sizePreview.style.backgroundColor = colorPicker.value;
    });

    brushPickerIcons.forEach(icon => {
        icon.addEventListener("click", function () {
            brushPickerIcons.forEach(icon => icon.classList.remove("selected"));
            this.classList.add("selected");
        });
    });

    function setBackgroundColor(color, callback) {
        // Fill the background with the specified color
        backgroundCtx.fillStyle = color;
        backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

        // Draw the content (backgroundCanvas and drawingCanvas) on the drawing canvas
        ctx.drawImage(backgroundCanvas, 0, 0);
        ctx.drawImage(drawingCanvas, 0, 0);

        // Execute the callback if provided
        if (typeof callback === "function") {
            callback();
        }
    }

    function rgbToHex(rgb) {
        const values = rgb.match(/\d+/g);
        const hex = values.map(value => Number(value).toString(16).padStart(2, '0')).join('');
        return `#${hex}`;
    }

    function saveDrawingState() {
        drawingHistory.push(drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));
    }

    const eraserIcon = document.querySelector(".brush-icon.eraser");

eraserIcon.addEventListener("click", function () {
    brushPickerIcons.forEach(icon => icon.classList.remove("selected"));
    this.classList.add("selected");

    // Set the drawing context for eraser
    drawingCtx.globalCompositeOperation = "destination-out";
});

brushPickerIcons.forEach(icon => {
    if (!icon.classList.contains("eraser")) {
        icon.addEventListener("click", function () {
            brushPickerIcons.forEach(icon => icon.classList.remove("selected"));
            this.classList.add("selected");

            // Set the drawing context back to default
            drawingCtx.globalCompositeOperation = "source-over";
        });
    }
});

function erase(e) {
    if (!painting) return;

    const penSize = sizeInput.value;

    drawingCtx.lineWidth = penSize;
    drawingCtx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    drawingCtx.beginPath();
    drawingCtx.arc(x, y, penSize / 2, 0, Math.PI * 2);
    drawingCtx.fillStyle = 'rgba(0,0,0,0)';
    drawingCtx.fill();
    drawingCtx.beginPath();
    drawingCtx.moveTo(x, y);

    drawInitialCanvasState();
}

canvas.addEventListener("mousemove", function (e) {
    if (painting) {
        if (eraserIcon.classList.contains("selected")) {
            erase(e);
        } else {
            draw(e);
        }
    }
});
});
