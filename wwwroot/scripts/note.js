function createNewNote() {
    if (!connection) {
        console.error("SignalR connection not initialized");
        return;
    }
    const note = {
        title: "New Note",
        content: "",
        color: "#ffd700",
        positionX: Math.random() * (window.innerWidth - 300),
        positionY: Math.random() * (window.innerHeight - 300)
    };
    connection.invoke("AddNote", note);
}

function addNoteToUI(note) {
    const stickyNote = document.createElement('div');
    stickyNote.className = "note";
    stickyNote.id = note.id;
    stickyNote.style.left = note.positionX + "px";
    stickyNote.style.top = note.positionY + "px";
    stickyNote.style.backgroundColor = note.color;
    stickyNote.innerHTML = `
        <div class="note-actions">
            <button class="close-btn" onclick="deleteNote(${note.id})">x</button>
        </div>
        <div class="note-header">
            <div class="drag-handle">⋮⋮</div>
            <div class="note-title" contenteditable="true" onblur="updateNoteTitle(${note.id}, this.textContent)">${note.title}</div>
        </div>
        <div class="note-content" contenteditable="true" onblur="updateNoteContent(${note.id}, this.textContent)">${note.content}</div>
    `;
    
    const rect = canvas.getBoundingClientRect();
    stickyNote.style.left = (rect.width / 2 - 125) + 'px';
    stickyNote.style.top = (rect.height / 2 - 125) + 'px';
    
    canvas.parentElement.appendChild(stickyNote);
    makeElementDraggable(stickyNote);
    notes.set(note.id, note);
}

function updateNoteInUI(note) {
    const noteElement = document.getElementById(note.id);
    if (noteElement) {
        noteElement.querySelector(".note-title").textContent = note.title;
        noteElement.querySelector(".note-content").textContent = note.content;
        noteElement.style.backgroundColor = note.color;
        notes.set(note.id, note);
    }
}

function deleteNoteFromUI(noteId) {
    const noteElement = document.getElementById(noteId);
    if (noteElement) {
        noteElement.remove();
        notes.delete(noteId);
    }
}

function moveNoteInUI(noteId, x, y) {
    const noteElement = document.getElementById(noteId);
    if (noteElement) {
        noteElement.style.left = x + "px";
        noteElement.style.top = y + "px";
        noteElement.style.transform = "none";
        
        const note = notes.get(noteId);
        if (note) {
            note.positionX = x;
            note.positionY = y;
        }
    }
}

function updateNoteTitle(noteId, title) {
    const note = notes.get(noteId);
    if (note) {
        note.title = title;
        note.updatedAt = new Date();
        connection.invoke("UpdateNote", note);
    }
}

function updateNoteContent(noteId, content) {
    const note = notes.get(noteId);
    if (note) {
        note.content = content;
        note.updatedAt = new Date();
        connection.invoke("UpdateNote", note);
    }
}

function deleteNote(noteId) {
    connection.invoke("DeleteNote", parseInt(noteId));
}

// Make elements draggable
function makeElementDraggable(element) {
    let startX, startY, initialX, initialY;
    let originalLeft, originalTop;

    const dragHandle = element.querySelector('.drag-handle');
    dragHandle.onmousedown = dragStart;

    function dragStart(e) {
        initialX = e.clientX - element.offsetLeft;
        initialY = e.clientY - element.offsetTop;
        originalLeft = element.offsetLeft;
        originalTop = element.offsetTop;

        if (e.target === dragHandle) {
            element.classList.add('dragging');
            document.onmousemove = drag;
            document.onmouseup = dragEnd;
        }
    }

    function drag(e) {
        if (element.classList.contains('dragging')) {
            e.preventDefault();
            startX = e.clientX - initialX;
            startY = e.clientY - initialY;

            element.style.left = startX + "px";
            element.style.top = startY + "px";
        }
    }

    function dragEnd(e) {
        if (element.classList.contains('dragging')) {
            element.classList.remove('dragging');
            document.onmousemove = null;
            document.onmouseup = null;

            const noteId = parseInt(element.id);
            connection.invoke("MoveNote", noteId, startX, startY);
        }
    }
}