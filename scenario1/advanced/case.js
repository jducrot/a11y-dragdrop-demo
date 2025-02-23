const KEYS = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESC: 'Escape'
};

// Requirements
//  - Update instructions
//  - Same interaction for mouse users as basic
// - each sentence on its own line

// - MENU WITH EMPTY DZ
// - All states in WB

// - MENU WITH FILLED DZ
// - All States in WB
// - Remove <state in DZ>

document.addEventListener('DOMContentLoaded', () => {
    let selectedElement = null;
    let lastAnnouncement = '';
    let debounceTimeout;

    setUpLiveRegion();

    const draggables = document.querySelectorAll('.draggable');
    const dropzones = document.querySelectorAll('.dropzone');

    draggables.forEach(draggable => {
        draggable.addEventListener('keydown', handleDraggableKeydown);
        draggable.addEventListener('dragstart', handleDragStartEvent);
        draggable.addEventListener('dragend', handleDragEndEvent);
        draggable.addEventListener('click', handleDragStartEvent);
    });

    dropzones.forEach(dropzone => {
        dropzone.addEventListener('keydown', handleDropzoneKeydown);
        dropzone.addEventListener('click', handleDropzoneKeydown);
        dropzone.addEventListener('dragover', event => event.preventDefault());
        dropzone.addEventListener('drop', handleDropEvent);
    });

    function handleDraggableKeydown(event) {
        event.stopPropagation();
        const { key, currentTarget } = event;
        if (key === KEYS.ENTER || key === KEYS.SPACE) {
            handleEnterOrSpaceKey(event, currentTarget);
        } else if (key === KEYS.ESC) {
            handleEscapeKey(event);
        }
    }

    function handleEnterOrSpaceKey(event, currentTarget) {
        event.preventDefault();
        if (selectedElement && currentTarget !== selectedElement) {
            swapDraggables(selectedElement, currentTarget, announce);
            selectedElement = null;
        } else {
            selectedElement = handleDragStart(selectedElement, currentTarget, announce);
        }
        checkDropzones(announce);
    }

    function handleEscapeKey(event) {
        event.preventDefault();
        if (selectedElement) {
            const itemName = getItemName(selectedElement);
            selectedElement.setAttribute('aria-describedby', 'drag');
            selectedElement.classList.remove('grabbed');
            selectedElement = null;
            announce(`${itemName} selection canceled`);
        }
    }

    function handleDragStartEvent(event) {
        selectedElement = handleDragStart(selectedElement, event.currentTarget, announce);
        removeEmptyListItems();
    }

    function handleDragEndEvent(event) {
        const itemName = getItemName(event.currentTarget);
        event.currentTarget.setAttribute('aria-describedby', 'drag');
        event.currentTarget.classList.remove('grabbed');
        selectedElement = null;
        removeEmptyListItems();
        announce(`${itemName} dropped`);
        checkDropzones(announce);
    }

    function handleDropzoneKeydown(event) {
        if (selectedElement && (event.key === KEYS.ENTER || event.key === KEYS.SPACE || event.type === 'click')) {
            event.preventDefault();
            handleDrop(event.currentTarget);
        }
    }

    function handleDrop(target) {
        const itemName = getItemName(selectedElement);
        moveChildToWordBank(target);
        target.appendChild(selectedElement);
        finalizeDrop(itemName);
    }

    function finalizeDrop(itemName) {
        selectedElement.setAttribute('aria-describedby', 'drag');
        selectedElement.classList.remove('grabbed');
        selectedElement = null;
        removeEmptyListItems();
        announce(`${itemName} dropped`);
        checkDropzones(announce);
    }

    function handleDropEvent(event) {
        event.preventDefault();
        let target = event.currentTarget;
        if (target.classList.contains('dropzone')) {
            const childDraggable = target.querySelector('.draggable');
            target = childDraggable;
        } else if (!target.classList.contains('draggable')) {
            target = null;
        }
        if (selectedElement) {
            if (target && target !== selectedElement) {
                swapDraggables(selectedElement, target, announce);
            } else {
                event.currentTarget.appendChild(selectedElement);
                selectedElement.setAttribute('aria-describedby', 'drag');
                selectedElement.classList.remove('grabbed');
                announce(`${getItemName(selectedElement)} dropped`);
            }
            selectedElement = null;
            removeEmptyListItems();
            checkDropzones(announce);
        }
    }

    function moveChildToWordBank(dropzone) {
        if (dropzone.hasChildNodes()) {
            const child = dropzone.firstChild;
            const wordBank = document.querySelector('#word-bank ul');
            if (wordBank) {
                const listItem = document.createElement('li');
                listItem.appendChild(child);
                wordBank.appendChild(listItem);
            }
            removeEmptyListItems();
        }
    }

    function removeEmptyListItems() {
        const wordBank = document.querySelector('#word-bank ul');
        wordBank.querySelectorAll('li').forEach(li => {
            if (!li.hasChildNodes() || li.textContent.trim() === '') {
                li.remove();
            }
        });
    }

    function announce(message, showMessage = false) {
        if (message === lastAnnouncement) {
            clearTimeout(debounceTimeout);
        }
        lastAnnouncement = message;
        debounceTimeout = setTimeout(() => {
            const liveRegion = document.getElementById('a11y-live-region');
            const messageDiv = document.getElementById('message');
            if (liveRegion) {
                liveRegion.textContent = message;
            }
            if (messageDiv && showMessage) {
                messageDiv.textContent = message;
            }
        }, 200);
    }
});

function handleDragStart(selectedElement, draggable, announce) {
    selectedElement = draggable;
    draggable.setAttribute('aria-describedby', 'drag grab');
    draggable.classList.add('grabbed');
    announce(`${getItemName(draggable)} grabbed`);
    return selectedElement;
}

function getItemName(element) {
    return element.textContent.trim();
}

function setUpLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveRegion);
}

function swapDraggables(draggable1, draggable2, announce) {
    const parent1 = draggable1.parentNode;
    const parent2 = draggable2.parentNode;
    if (parent1 && parent2) {
        const placeholder = document.createElement('div');
        parent1.replaceChild(placeholder, draggable1);
        parent2.replaceChild(draggable1, draggable2);
        parent1.replaceChild(draggable2, placeholder);
    }
    setTimeout(() => {
        draggable1.classList.remove('grabbed');
        draggable2.classList.remove('grabbed');
        draggable1.focus();
        announce(`swapped ${getItemName(draggable1)} and ${getItemName(draggable2)}`);
    }, 100);
}

function checkDropzones(announce) {
    const dropzoneIds = ['dz-1', 'dz-2', 'dz-3', 'dz-4'];
    const correctOrder = ['Alaska', 'Rhode Island', 'California', 'Wyoming'];
    const targets = document.getElementById('targets');
    let allFilled = true;
    let correct = true;

    dropzoneIds.forEach((id, index) => {
        const content = document.getElementById(id).querySelector('.draggable')?.textContent.trim();
        if (!content) {
            allFilled = false;
        } else if (content !== correctOrder[index]) {
            correct = false;
        }
    });

    if (allFilled) {
        if (correct) {
            targets.classList.add('success');
            targets.classList.remove('error');
            announce(`All states are in the correct order. Well done!`, true);
        } else {
            targets.classList.add('error');
            targets.classList.remove('success');
            announce(`Not all states are in the correct order. Try again!`, true);
        }
    } else {
        targets.classList.remove('success');
        targets.classList.remove('error');
    }
}



