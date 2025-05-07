document.addEventListener('DOMContentLoaded', function() {
    // Stickers
    const stickerButton = document.getElementById('addSticker');
    const stickerPalette = document.getElementById('stickerPalette');

    // Ensure palette is hidden by default
    stickerPalette.classList.add('hidden');

    stickerButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        stickerPalette.classList.toggle('hidden');
    });

    // Close sticker palette when clicking outside
    document.addEventListener('click', (e) => {
        if (!stickerPalette.contains(e.target) && !stickerButton.contains(e.target)) {
            stickerPalette.classList.add('hidden');
        }
    });

    // Add custom sticker
    document.getElementById('addCustomSticker').addEventListener('click', () => {
        const input = document.getElementById('stickerInput');
        const content = input.value.trim();
        if (content) {
            createNewSticker(content);
            input.value = '';
            stickerPalette.classList.add('hidden');
        }
    });

    // Add sticker from suggestions
    document.querySelectorAll('.sticker').forEach(sticker => {
        sticker.addEventListener('click', () => {
            createNewSticker(sticker.textContent);
            stickerPalette.classList.add('hidden');
        });
    });
});

function createNewSticker(text) {
    if (!connection) {
        console.error("SignalR connection not initialized");
        return;
    }
    const sticker = {
        id: randomIntFromInterval(1, 999),
        content: text,
        positionX: Math.random() * (window.innerWidth - 300),
        positionY: Math.random() * (window.innerHeight - 300),
        size: 15
    };

    connection.invoke("AddSticker", sticker);
}

function addStickerToUI(sticker) {
    const stickerContainer = document.createElement('div');
    stickerContainer.className = 'sticker-container';
    
    const stickerContent = document.createElement('div');
    stickerContent.id = sticker.id;
    stickerContent.className = 'sticker-content';
    stickerContent.textContent = sticker.content;
    stickerContent.style.fontSize = sticker.size + "px";
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    
    stickerContainer.appendChild(stickerContent);
    stickerContainer.appendChild(resizeHandle);
    
    const rect = canvas.getBoundingClientRect();
    stickerContainer.style.left = (rect.width / 2) + 'px';
    stickerContainer.style.top = (rect.height / 2) + 'px';
    
    canvas.parentElement.appendChild(stickerContainer);
    makeStickerDraggable(stickerContainer, stickerContent);
    makeStickerResizable(stickerContainer, stickerContent);
    sticker.set(sticker.id, sticker);
}

function resizeStickerInUI(id, newSize){
    const stickerElement = document.getElementById(id);
    console.log(stickerElement);
    if (stickerElement) {
        stickerElement.style.fontSize = newSize + "px";
        
        const sticker = stickers.get(id);
        if (sticker) {
            sticker.size = newSize;
        }
    }
}

function moveStickerInUI(stickerId, x, y) {
    const stickerElement = document.getElementById(stickerId).parentElement;
    if (stickerElement) {
        stickerElement.style.left = x + "px";
        stickerElement.style.top = y + "px";

        const sticker = stickers.get(noteId);
        if (sticker) {
            sticker.positionX = x;
            sticker.positionY = y;
        }
    }
}

function makeStickerDraggable(element, content) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.classList.contains('resize-handle')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.classList.add('dragging');
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        element.classList.remove('dragging');
        document.onmouseup = null;
        document.onmousemove = null;

        console.log(element, content, element.offsetTop - pos2, element.offsetLeft - pos1);
        const stickerId = parseInt(content.id);
        connection.invoke("MoveSticker", stickerId, element.offsetLeft - pos1, element.offsetTop - pos2);
    }
}

// Make stickers resizable
function makeStickerResizable(container, content) {
    const handle = container.querySelector('.resize-handle');
    let startX, startY, startWidth;

    handle.addEventListener('mousedown', initResize);

    function initResize(e) {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(window.getComputedStyle(content).fontSize);
        container.classList.add('resizing');
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        e.preventDefault();
        e.stopPropagation();
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const newSize = Math.max(12, Math.min(100, startWidth + (deltaX + deltaY) / 2));
        content.style.fontSize = newSize + 'px';
    }

    function stopResize(e) {
        container.classList.remove('resizing');
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const noteId = parseInt(content.id);
        const newSize = Math.max(12, Math.min(100, startWidth + (deltaX + deltaY) / 2));
        connection.invoke("ResizeSticker", noteId, newSize);
    }
}