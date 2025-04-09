document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageInput = document.getElementById('imageInput');
    const resetBtn = document.getElementById('resetBtn');
    const showGridCheckbox = document.getElementById('showGrid');
    const canvasContainer = document.querySelector('.canvas-container');
    
    let originalImage = null;
    let handles = [];
    let activeHandle = null;
    let showGrid = false;
    let isDragging = false;
    
    // Initialize the application
    function init() {
        // Ensure canvas and container elements exist
        if (!canvas || !ctx || !canvasContainer) {
            console.error('Required DOM elements not found');
            return;
        }

        // Set up event listeners
        if (imageInput) {
            imageInput.addEventListener('change', handleImageLoad);
        } else {
            console.error('Image input element not found');
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', resetTransform);
        }
        
        if (showGridCheckbox) {
            showGridCheckbox.addEventListener('change', toggleGrid);
        }
        
        // Mouse events
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        // Touch events for mobile
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        
        // Disable right-click menu on handles
        canvasContainer.addEventListener('contextmenu', (e) => {
            if (e.target.classList && e.target.classList.contains('handle')) {
                e.preventDefault();
            }
        });
        
        // Set initial canvas size
        resizeCanvas(800, 600);
    }
    
    // Resize the canvas and update handle positions
    function resizeCanvas(width, height) {
        canvas.width = width;
        canvas.height = height;
        canvasContainer.style.width = width + 'px';
        canvasContainer.style.height = height + 'px';
        
        if (originalImage) {
            draw();
        } else {
            // Display placeholder text if no image is loaded
            ctx.fillStyle = '#ddd';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Select an image to begin', width / 2, height / 2);
        }
    }
    
    // Handle image loading
    function handleImageLoad(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    
                    // Resize canvas to fit the image (with max dimensions)
                    const maxWidth = Math.min(window.innerWidth - 40, 1200);
                    const maxHeight = window.innerHeight - 150;
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        const ratio = maxWidth / width;
                        width = maxWidth;
                        height = height * ratio;
                    }
                    
                    if (height > maxHeight) {
                        const ratio = maxHeight / height;
                        height = maxHeight;
                        width = width * ratio;
                    }
                    
                    resizeCanvas(width, height);
                    
                    // Ensure handles are created before trying to draw
                    try {
                        createHandles();
                        
                        // Check if handles were created successfully
                        if (handles && handles.length === 4 && 
                            handles.every(handle => handle && typeof handle.x !== 'undefined' && typeof handle.y !== 'undefined')) {
                            draw();
                        } else {
                            console.error('Failed to create handles correctly');
                            // Draw the original image without transformation
                            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
                        }
                    } catch (error) {
                        console.error('Error during handle creation:', error);
                        // Draw the original image without transformation as fallback
                        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Create the corner handles
    function createHandles() {
        try {
            // Remove any existing handles
            if (handles && handles.length > 0) {
                handles.forEach(handle => {
                    if (handle && handle.element && handle.element.parentNode) {
                        handle.element.parentNode.removeChild(handle.element);
                    }
                });
            }
            
            // Reset handles array
            handles = [];
            
            // Check if container exists
            if (!canvasContainer) {
                console.error('Canvas container not found');
                return false;
            }
            
            // Create the four corner handles
            const positions = [
                { x: 0, y: 0 },                          // Top-left
                { x: canvas.width, y: 0 },               // Top-right
                { x: canvas.width, y: canvas.height },   // Bottom-right
                { x: 0, y: canvas.height }               // Bottom-left
            ];
            
            // Validate positions
            if (!positions.every(pos => typeof pos.x === 'number' && typeof pos.y === 'number')) {
                console.error('Invalid handle positions');
                return false;
            }
            
            positions.forEach((pos, index) => {
                const handle = document.createElement('div');
                handle.className = 'handle';
                handle.dataset.index = index;
                
                handle.style.left = pos.x + 'px';
                handle.style.top = pos.y + 'px';
                
                canvasContainer.appendChild(handle);
                
                handles.push({
                    x: pos.x,
                    y: pos.y,
                    element: handle
                });
            });
            
            // Validate that all handles were created correctly
            if (handles.length !== 4) {
                console.error('Failed to create all handles');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error creating handles:', error);
            return false;
        }
    }
    
    // Reset the transformation to original rectangle
    function resetTransform() {
        if (!originalImage) return;
        
        handles = [
            { x: 0, y: 0, element: handles[0].element },
            { x: canvas.width, y: 0, element: handles[1].element },
            { x: canvas.width, y: canvas.height, element: handles[2].element },
            { x: 0, y: canvas.height, element: handles[3].element }
        ];
        
        handles.forEach((handle, index) => {
            handle.element.style.left = handle.x + 'px';
            handle.element.style.top = handle.y + 'px';
        });
        
        draw();
    }
    
    // Toggle grid overlay
    function toggleGrid() {
        showGrid = showGridCheckbox.checked;
        draw();
    }
    
    // Mouse event handlers
    function handleMouseDown(e) {
        if (e.target.classList && e.target.classList.contains('handle')) {
            activeHandle = handles[parseInt(e.target.dataset.index)];
            isDragging = true;
            e.preventDefault();
        }
    }
    
    function handleMouseMove(e) {
        if (isDragging && activeHandle) {
            const rect = canvasContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(canvas.width, e.clientX - rect.left));
            const y = Math.max(0, Math.min(canvas.height, e.clientY - rect.top));
            
            activeHandle.x = x;
            activeHandle.y = y;
            activeHandle.element.style.left = x + 'px';
            activeHandle.element.style.top = y + 'px';
            
            draw();
        }
    }
    
    function handleMouseUp() {
        isDragging = false;
        activeHandle = null;
    }
    
    // Touch event handlers
    function handleTouchStart(e) {
        if (e.target.classList && e.target.classList.contains('handle')) {
            activeHandle = handles[parseInt(e.target.dataset.index)];
            isDragging = true;
            e.preventDefault();
        }
    }
    
    function handleTouchMove(e) {
        if (isDragging && activeHandle && e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = canvasContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(canvas.width, touch.clientX - rect.left));
            const y = Math.max(0, Math.min(canvas.height, touch.clientY - rect.top));
            
            activeHandle.x = x;
            activeHandle.y = y;
            activeHandle.element.style.left = x + 'px';
            activeHandle.element.style.top = y + 'px';
            
            draw();
            e.preventDefault();
        }
    }
    
    function handleTouchEnd() {
        isDragging = false;
        activeHandle = null;
    }
    
    // Main drawing function
    function draw() {
        if (!originalImage) return;
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply perspective transform
        perspectiveTransform();
        
        // Draw grid overlay if enabled
        if (showGrid) {
            drawGrid();
        }
    }
    
    // Implement perspective transformation
    function perspectiveTransform() {
        // Source points (original image corners)
        const srcPoints = [
            { x: 0, y: 0 },
            { x: originalImage.width, y: 0 },
            { x: originalImage.width, y: originalImage.height },
            { x: 0, y: originalImage.height }
        ];
        
        // Check if handles array is valid
        if (!handles || handles.length !== 4) {
            // If handles are not properly set up, just draw the image without transformation
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            return;
        }
        
        // Destination points (where the corners are dragged to)
        const dstPoints = handles.map(handle => {
            if (!handle || typeof handle.x === 'undefined' || typeof handle.y === 'undefined') {
                // If any handle is invalid, recreate the handles
                console.warn('Invalid handle detected, recreating handles');
                createHandles();
                return null;
            }
            return { x: handle.x, y: handle.y };
        });
        
        // Check if all destination points are valid
        if (dstPoints.includes(null)) {
            // Draw the original image without transformation
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            return;
        }
        
        // Render the transformed image
        renderTransformedImage(srcPoints, dstPoints);
    }
    
    // Compute projective transform matrix (3x3)
    function computeProjectiveTransform(src, dst) {
        // Create the coefficient matrix for the system of equations
        const A = [];
        const b = [];
        
        for (let i = 0; i < 4; i++) {
            // For x coordinate
            A.push([
                src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x
            ]);
            b.push(dst[i].x);
            
            // For y coordinate
            A.push([
                0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y
            ]);
            b.push(dst[i].y);
        }
        
        // Solve the system of equations using Gaussian elimination
        const h = solveLinearSystem(A, b);
        
        // Return the 3x3 transformation matrix
        return [
            [h[0], h[1], h[2]],
            [h[3], h[4], h[5]],
            [h[6], h[7], 1]
        ];
    }
    
    // Solve a system of linear equations using Gaussian elimination
    function solveLinearSystem(A, b) {
        const n = b.length;
        
        // Augmented matrix
        const augMatrix = A.map((row, i) => [...row, b[i]]);
        
        // Gaussian elimination with partial pivoting
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            let maxVal = Math.abs(augMatrix[i][i]);
            
            for (let j = i + 1; j < n; j++) {
                const absVal = Math.abs(augMatrix[j][i]);
                if (absVal > maxVal) {
                    maxVal = absVal;
                    maxRow = j;
                }
            }
            
            // Swap rows
            if (maxRow !== i) {
                [augMatrix[i], augMatrix[maxRow]] = [augMatrix[maxRow], augMatrix[i]];
            }
            
            // Eliminate below
            for (let j = i + 1; j < n; j++) {
                const factor = augMatrix[j][i] / augMatrix[i][i];
                for (let k = i; k <= n; k++) {
                    augMatrix[j][k] -= factor * augMatrix[i][k];
                }
            }
        }
        
        // Back substitution
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += augMatrix[i][j] * x[j];
            }
            x[i] = (augMatrix[i][n] - sum) / augMatrix[i][i];
        }
        
        return x;
    }
    
    // Apply the transformation and render the image
    function renderTransformedImage(srcPoints, dstPoints) {
        // Compute inverse matrix by swapping src and dst
        const inverseMatrix = computeProjectiveTransform(dstPoints, srcPoints);

        // Create an offscreen canvas for the original image
        const offCanvas = document.createElement('canvas');
        offCanvas.width = originalImage.width;
        offCanvas.height = originalImage.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(originalImage, 0, 0);
        
        // Get image data
        const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const data = imageData.data;
        
        // Create a new ImageData for the transformed image
        const transformedData = ctx.createImageData(canvas.width, canvas.height);
        const tData = transformedData.data;
        
        // Loop through each pixel in the destination space
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                // Skip pixels outside the quadrilateral
                let isInside = isPointInQuadrilateral(x, y, dstPoints);
                if (!isInside) {
                    continue;
                }
                
                // Apply inverse mapping to find the corresponding source pixel
                const invPoint = applyTransform(inverseMatrix, x, y);
                
                if (invPoint.x >= 0 && invPoint.x < originalImage.width &&
                    invPoint.y >= 0 && invPoint.y < originalImage.height) {
                    
                    // Bilinear interpolation
                    const x1 = Math.floor(invPoint.x);
                    const y1 = Math.floor(invPoint.y);
                    const x2 = Math.min(x1 + 1, originalImage.width - 1);
                    const y2 = Math.min(y1 + 1, originalImage.height - 1);
                    
                    const dx = invPoint.x - x1;
                    const dy = invPoint.y - y1;
                    
                    // Get the four surrounding pixels
                    const idx1 = (y1 * originalImage.width + x1) * 4;
                    const idx2 = (y1 * originalImage.width + x2) * 4;
                    const idx3 = (y2 * originalImage.width + x1) * 4;
                    const idx4 = (y2 * originalImage.width + x2) * 4;
                    
                    // Calculate the destination pixel index
                    const destIdx = (y * canvas.width + x) * 4;
                    
                    // Interpolate each color channel
                    for (let c = 0; c < 4; c++) {
                        const top = data[idx1 + c] * (1 - dx) + data[idx2 + c] * dx;
                        const bottom = data[idx3 + c] * (1 - dx) + data[idx4 + c] * dx;
                        tData[destIdx + c] = Math.round(top * (1 - dy) + bottom * dy);
                    }
                }
            }
        }
        
        // Put the transformed image data back onto the canvas
        ctx.putImageData(transformedData, 0, 0);
    }
    
    // Apply perspective transformation with a matrix
    function applyTransform(matrix, x, y) {
        // Compute denominator
        const den = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2];
        
        // Ensure denominator is not zero
        if (Math.abs(den) < 0.0001) {
            return { x: -1, y: -1 }; // Return out-of-bounds coordinates
        }
        
        // Compute transformed coordinates
        const transX = (matrix[0][0] * x + matrix[0][1] * y + matrix[0][2]) / den;
        const transY = (matrix[1][0] * x + matrix[1][1] * y + matrix[1][2]) / den;
        
        return { x: transX, y: transY };
    }
    
    // Check if a point is inside a quadrilateral
    function isPointInQuadrilateral(x, y, quad) {
        // Check if point is inside a quadrilateral using the winding number algorithm
        // We can simplify for this application and just check if the point is inside the bounding box
        // of the quadrilateral, since we want to transform the entire rectangle
        
        // This is a simplified approach
        let minX = Math.min(quad[0].x, quad[1].x, quad[2].x, quad[3].x);
        let maxX = Math.max(quad[0].x, quad[1].x, quad[2].x, quad[3].x);
        let minY = Math.min(quad[0].y, quad[1].y, quad[2].y, quad[3].y);
        let maxY = Math.max(quad[0].y, quad[1].y, quad[2].y, quad[3].y);
        
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    
    // Draw grid overlay to visualize the transformation
    function drawGrid() {
        const gridSize = 20;
        const numLinesX = Math.ceil(originalImage.width / gridSize);
        const numLinesY = Math.ceil(originalImage.height / gridSize);
        
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
        ctx.lineWidth = 1;
        
        // Source points (original image corners)
        const srcPoints = [
            { x: 0, y: 0 },
            { x: originalImage.width, y: 0 },
            { x: originalImage.width, y: originalImage.height },
            { x: 0, y: originalImage.height }
        ];
        
        // Check if handles array is valid
        if (!handles || handles.length !== 4) {
            return; // Don't draw grid if handles are not set up
        }
        
        // Destination points (where the corners are dragged to)
        const dstPoints = handles.map(handle => {
            if (!handle || typeof handle.x === 'undefined' || typeof handle.y === 'undefined') {
                return null;
            }
            return { x: handle.x, y: handle.y };
        });
        
        // Check if all destination points are valid
        if (dstPoints.includes(null)) {
            return; // Don't draw grid if any handle is invalid
        }
        
        // Compute the forward transformation matrix (source to destination)
        const matrix = computeProjectiveTransform(srcPoints, dstPoints);
        
        // Draw horizontal grid lines
        for (let i = 0; i <= numLinesY; i++) {
            const y = i * gridSize;
            const points = [];
            
            for (let j = 0; j <= numLinesX; j++) {
                const x = j * gridSize;
                if (x <= originalImage.width && y <= originalImage.height) {
                    // Apply forward transform to grid point
                    const transformedPoint = applyTransform(matrix, x, y);
                    points.push(transformedPoint);
                }
            }
            
            // Draw line connecting the transformed points
            if (points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let j = 1; j < points.length; j++) {
                    ctx.lineTo(points[j].x, points[j].y);
                }
                ctx.stroke();
            }
        }
        
        // Draw vertical grid lines
        for (let j = 0; j <= numLinesX; j++) {
            const x = j * gridSize;
            const points = [];
            
            for (let i = 0; i <= numLinesY; i++) {
                const y = i * gridSize;
                if (x <= originalImage.width && y <= originalImage.height) {
                    // Apply forward transform to grid point
                    const transformedPoint = applyTransform(matrix, x, y);
                    points.push(transformedPoint);
                }
            }
            
            // Draw line connecting the transformed points
            if (points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }
        }
    }
    
    // Initialize the application
    init();
}); 