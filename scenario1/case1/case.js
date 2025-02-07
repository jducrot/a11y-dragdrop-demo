const KEYS = {
    ENTER: 'Enter',
    SPACE: 'Space',
    ESC: 'Escape'
};

document.addEventListener('DOMContentLoaded', () => {
    let selectedElement = null;
    let lastAnnouncement = '';
    let debounceTimeout;

    setUpLiveRegion();

    document.querySelectorAll('.draggable').forEach(draggable => {
        draggable.addEventListener('keydown', handleDraggableKeydown);
        draggable.addEventListener('dragstart', handleDragStartEvent);
        draggable.addEventListener('dragend', handleDragEndEvent);
    });

    document.querySelectorAll('.dropzone').forEach(dropzone => {
        dropzone.addEventListener('keydown', handleDropzoneKeydown);
        dropzone.addEventListener('dragover', event => event.preventDefault());
        dropzone.addEventListener('drop', handleDropEvent);
    });

    function handleDraggableKeydown(event) {
        event.stopPropagation();
        if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
            event.preventDefault();
            if (selectedElement && (event.currentTarget !== selectedElement)) {
                swapDraggables(selectedElement, event.currentTarget, announce);
                selectedElement = null;
            } else {
                selectedElement = handleDragStart(selectedElement, event.currentTarget, announce);
            }
            checkDropzones(announce);
        } else if (event.key === KEYS.ESC) {
            event.preventDefault();
            if (selectedElement) {
                const itemName = getItemName(selectedElement);
                selectedElement.setAttribute('aria-describedby', 'drag');
                selectedElement.classList.remove('grabbed');
                selectedElement = null;
                announce(`${itemName} selection canceled`);
            }
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
        if ((event.key === KEYS.ENTER || event.key === KEYS.SPACE) && selectedElement) {
            event.preventDefault();
            const itemName = getItemName(selectedElement);
            moveChildToWordBank(event.currentTarget);
            event.currentTarget.appendChild(selectedElement);
            selectedElement.setAttribute('aria-describedby', 'drag');
            selectedElement.classList.remove('grabbed');
            selectedElement = null;
            removeEmptyListItems();
            announce(`${itemName} dropped`);
            checkDropzones(announce);
        }
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
        parent1.appendChild(draggable2);
        parent2.appendChild(draggable1);
    }
    setTimeout(() => {
        draggable1.classList.remove('grabbed');
        draggable2.classList.remove('grabbed');
        draggable1.focus();
        announce(`swapped ${getItemName(draggable1)} and ${getItemName(draggable2)}`);
    }, 100);
}

function checkDropzones(announce) {
    const dz1 = document.getElementById('dz-1').querySelector('.draggable')?.textContent.trim();
    const dz2 = document.getElementById('dz-2').querySelector('.draggable')?.textContent.trim();
    const dz3 = document.getElementById('dz-3').querySelector('.draggable')?.textContent.trim();
    const dz4 = document.getElementById('dz-4').querySelector('.draggable')?.textContent.trim();
    const targets = document.getElementById('targets');

    if (dz1 && dz2 && dz3 && dz4) {
        let msg = '';
        if (dz1 === 'Alaska' && dz2 === 'Rhode Island' && dz3 === 'California' && dz4 === 'Wyoming') {
            targets.classList.add('success');
            targets.classList.remove('error');
            msg = `All states are in the correct order. Well done!`;    
        } else {
            targets.classList.add('error');
            targets.classList.remove('success');
            msg = `Not all states are in the correct order. Try again!`;
        }
        announce(msg, true);
    } else {
        targets.classList.remove('success');
        targets.classList.remove('error');
    }
}