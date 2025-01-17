const KEYS = {
    ENTER: 'Enter',
    SPACE: 'Space'
};

const state = {
    selectedDraggable: null,
    dragSource: null,
    messageQueue: [],
    announceTimeout: null,
    ANNOUNCEMENT_DELAY: 2000
};

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    setupLiveRegion();
    setupDraggables();
    setupDropzones();
}

function setupLiveRegion() {
    const liveRegion = document.createElement('div');
    Object.assign(liveRegion, {
        id: 'a11y-announce',
        className: 'visually-hidden'
    });
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveRegion);
}

function setupDraggables() {
    document.querySelectorAll('.draggable').forEach(draggable => {
        draggable.addEventListener('dragstart', handleDragStart);
        draggable.addEventListener('dragend', handleDragEnd);
        draggable.addEventListener('keydown', handleDraggableKeydown);
        draggable.setAttribute('aria-selected', 'false');
    });
}

function setupDropzones() {
    function addEventListeners(element, events) {
        Object.keys(events).forEach(event => {
            element.addEventListener(event, events[event]);
        });
    }
    document.querySelectorAll('.dropzone').forEach(dropzone => {
        addEventListeners(dropzone, {
            dragover: handleDragOver,
            drop: handleDrop,
            keydown: handleDropzoneKeydown,
            click: handleDropzoneItemClick
        });
    });
}

function cleanupEmptyListItems() {
    const wordBank = document.querySelector('#word-bank ul');
    if (!wordBank) return;
    
    wordBank.querySelectorAll('li').forEach(li => {
        if (!li.hasChildNodes()) {
            li.remove();
        }
    });
}

function moveItemToWordBank(item, dropzone) {
    if (!item) return;
    const wordBank = document.querySelector('#word-bank ul');
    if (!wordBank) return;
    const listItem = document.createElement('li');
    listItem.appendChild(item);
    wordBank.appendChild(listItem);
    if (dropzone) cleanupEmptyListItems(); 
    announceAction(`${item.textContent.trim()} moved back to word bank`);
}

function handleKeyAction(e, actionType) {
    if (e.key !== KEYS.ENTER && e.key !== KEYS.SPACE) return;
    e.preventDefault();
    const inDropzone = e.target.closest('.dropzone')?.hasChildNodes() || false;
    if (actionType === 'draggable') {
        if (inDropzone) {
            moveItemToWordBank(e.target, inDropzone);
        } else if (!state.selectedDraggable) {
            selectDraggable(e.target);
        } else if (state.selectedDraggable === e.target) {
            deselectDraggable();
        }
    } else if (actionType === 'dropzone' && state.selectedDraggable) {
        performDrop(e.target);
    }
}

const handleDraggableKeydown = e => handleKeyAction(e, 'draggable');
const handleDropzoneKeydown = e => handleKeyAction(e, 'dropzone');

function handleDropzoneItemClick(e) {
    const item = e.target.closest('.draggable');
    const dropzone = item?.closest('.dropzone');
    if (item && dropzone) {
        moveItemToWordBank(item, dropzone);
    } else if (dropzone && dropzone.hasChildNodes()) {S
        moveItemToWordBank(dropzone.firstChild, dropzone);
    }
}

function handleDragStart(e) {
    state.selectedDraggable = e.target;
    state.dragSource = e.target.parentElement;
    e.target.setAttribute('aria-selected', 'true');
    announceAction(`${state.selectedDraggable.textContent.trim()} selected`);
}

function handleDragEnd() {
    this.setAttribute('aria-selected', 'false');
    if (state.selectedDraggable === this) {
        state.selectedDraggable = null;
        state.dragSource = null;
    }
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    if (state.selectedDraggable) {
        performDrop(this);
    }
}

/**
 * Selects a draggable element, sets it as the currently selected draggable,
 * updates its ARIA attribute to indicate selection, and announces the action.
 *
 * @param {HTMLElement} draggable - The draggable element to be selected.
 */
function selectDraggable(draggable) {
    state.selectedDraggable = draggable;
    state.dragSource = draggable.parentElement;
    draggable.setAttribute('aria-selected', 'true');
    const stateName = draggable.textContent.trim();
    announceAction(`${stateName} selected`);
}


/**
 * Deselects the currently selected draggable element.
 * 
 * This function retrieves the name of the currently selected draggable element,
 * triggers the drag end event for that element, and announces the action of dropping
 * the element.
 */
function deselectDraggable() {
    const stateName = state.selectedDraggable.textContent.trim();
    handleDragEnd.call(state.selectedDraggable);
    announceAction(`${stateName} dropped`);
}


/**
 * Handles the drop action by appending the selected draggable element to the specified dropzone.
 * It also updates the ARIA attributes and resets the drag source and selected draggable elements.
 *
 * @param {HTMLElement} dropzone - The target dropzone element where the draggable will be dropped.
 */
function performDrop(dropzone) {
    if (dropzone.hasChildNodes()) {
        moveItemToWordBank(dropzone.firstChild, dropzone);
    }
    const dragSourceLi = state.dragSource;
    dropzone.appendChild(state.selectedDraggable);
    state.selectedDraggable.setAttribute('aria-selected', 'false');
    state.selectedDraggable.removeAttribute('tabindex'); 
    if (dragSourceLi.tagName.toLowerCase() === 'li') {
        dragSourceLi.remove(); // Remove empty li
    }
    state.selectedDraggable = null;
    state.dragSource = null;
}

function announceAction(message) {
    if (!message) return;
    state.messageQueue.push(message);
    if (state.messageQueue.length === 1) {
        processMessageQueue();
    }
}

function processMessageQueue() {
    if (state.messageQueue.length === 0) return;
    const liveRegion = document.getElementById('a11y-announce');
    if (!liveRegion) return;
    clearTimeout(state.announceTimeout);
    liveRegion.textContent = state.messageQueue[0];
    state.announceTimeout = setTimeout(() => {
        state.messageQueue.shift();
        liveRegion.textContent = '';
        if (state.messageQueue.length > 0) {
            processMessageQueue();
        }
    }, state.ANNOUNCEMENT_DELAY);
}