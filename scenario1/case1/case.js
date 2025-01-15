// State management
let selectedDraggable = null;
let dragSource = null;

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    setupLiveRegion();
    setupDraggables();
    setupDropzones();
});

function setupLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-announce';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.classList.add('visually-hidden');
    document.body.appendChild(liveRegion);
}

function setupDraggables() {
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', handleDragStart);
        draggable.addEventListener('dragend', handleDragEnd);
        draggable.addEventListener('keydown', handleDraggableKeydown);
        draggable.setAttribute('aria-selected', 'false');
    });
}

function setupDropzones() {
    const dropzones = document.querySelectorAll('.dropzone');
    dropzones.forEach(dropzone => {
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('drop', handleDrop);
        dropzone.addEventListener('keydown', handleDropzoneKeydown);
        // Add click/keyboard handling for items inside dropzones
        dropzone.addEventListener('click', handleDropzoneItemClick);
    });
}

// Add this new function
function handleDropzoneItemClick(e) {
    const item = e.target.closest('.draggable');
    if (item) {
        const wordBank = document.querySelector('#word-bank ul');
        const listItem = document.createElement('li');
        listItem.appendChild(item);
        wordBank.appendChild(listItem);
        announceAction('Item moved back to word bank');
    }
}

function handleDragStart(e) {
    selectedDraggable = this;
    dragSource = this.parentElement;
    e.dataTransfer.setData('text/plain', '');
    this.setAttribute('aria-selected', 'true');
    announceAction('Item selected for dragging');
}

function handleDragEnd() {
    this.setAttribute('aria-selected', 'false');
    announceAction('Item drag ended');
    if (selectedDraggable === this) {
        selectedDraggable = null;
        dragSource = null;
    }
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    if (selectedDraggable) {
        performDrop(this);
    }
}

function handleDraggableKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const inDropzone = this.closest('.dropzone');
        
        if (inDropzone) {
            // If item is in a dropzone, move it back to word bank
            const wordBank = document.querySelector('#word-bank ul');
            const listItem = document.createElement('li');
            listItem.appendChild(this);
            wordBank.appendChild(listItem);
            announceAction('Item moved back to word bank');
        } else if (!selectedDraggable) {
            selectDraggable(this);
        } else if (selectedDraggable === this) {
            deselectDraggable();
        }
    }
}

function handleDropzoneKeydown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && selectedDraggable) {
        e.preventDefault();
        performDrop(this);
    }
}

function selectDraggable(draggable) {
    selectedDraggable = draggable;
    dragSource = draggable.parentElement;
    draggable.setAttribute('aria-selected', 'true');
    const stateName = draggable.textContent.trim();
    announceAction(`${stateName} selected`);
}

function deselectDraggable() {
    const stateName = selectedDraggable.textContent.trim();
    handleDragEnd.call(selectedDraggable);
    announceAction(`${stateName} dropped`);
}

function performDrop(dropzone) {
    if (dropzone.hasChildNodes()) {
        dragSource.appendChild(dropzone.firstChild);
        announceAction('Existing item moved back to work bank');
    }
    dropzone.appendChild(selectedDraggable);
    selectedDraggable.setAttribute('aria-selected', 'false');
    announceAction('Item dropped successfully');
    selectedDraggable = null;
    dragSource = null;
}

function announceAction(message) {
    const liveRegion = document.getElementById('a11y-announce');
    liveRegion.textContent = message;
    setTimeout(() => {
        liveRegion.textContent = '';
    }, 1000);
}