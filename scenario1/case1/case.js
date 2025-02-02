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
        draggable.addEventListener('keydown', (event) => {
            if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
                event.preventDefault();
                if (selectedElement) {
                    selectedElement.setAttribute('aria-describedby', 'drag');
                    selectedElement.classList.remove('grabbed');
                    updateDraggableTabindex();
                }
                selectedElement = handleDragStart(selectedElement, draggable, updateDraggableTabindex, announce);
            } else if (event.key === KEYS.ESC) {
                event.preventDefault();
                if (selectedElement) {
                    const itemName = getItemName(selectedElement);
                    selectedElement.setAttribute('aria-describedby', 'drag');
                    selectedElement.classList.remove('grabbed');
                    selectedElement = null;
                    updateDraggableTabindex();
                    announce(`${itemName} selection canceled`);
                }
            }
        });

        draggable.addEventListener('dragstart', (event) => {
            selectedElement = handleDragStart(selectedElement, draggable, updateDraggableTabindex, announce);
            removeEmptyListItems();
        });

        draggable.addEventListener('dragend', (event) => {
            const itemName = getItemName(draggable);
            draggable.setAttribute('aria-describedby', 'drag');
            draggable.classList.remove('grabbed');
            selectedElement = null;
            updateDraggableTabindex();
            removeEmptyListItems();
            announce(`${itemName} dropped`);
        });
    });

    document.querySelectorAll('.dropzone').forEach(dropzone => {
        dropzone.addEventListener('keydown', (event) => {
            if ((event.key === KEYS.ENTER || event.key === KEYS.SPACE) && selectedElement) {
                event.preventDefault();
                const itemName = getItemName(selectedElement);
                moveChildToWordBank(dropzone);
                dropzone.appendChild(selectedElement);
                selectedElement.setAttribute('aria-describedby', 'drag');
                selectedElement.classList.remove('grabbed');
                selectedElement = null;
                updateDraggableTabindex();
                removeEmptyListItems();
                announce(`${itemName} dropped`);
            }
        });

        dropzone.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        dropzone.addEventListener('drop', (event) => {
            event.preventDefault();
            if (selectedElement) {
                const itemName = getItemName(selectedElement);
                moveChildToWordBank(dropzone);
                dropzone.appendChild(selectedElement);
                selectedElement.setAttribute('aria-describedby', 'drag');
                selectedElement.classList.remove('grabbed');
                selectedElement = null;
                updateDraggableTabindex();
                removeEmptyListItems();
                announce(`${itemName} dropped`);
            }
        });
    });

    function moveChildToWordBank(dropzone) {
        if (dropzone.hasChildNodes()) {
            const child = dropzone.firstChild;
            const wordBank = document.querySelector('#word-bank ul');
            if (wordBank) {
                const listItem = document.createElement('li');
                listItem.appendChild(child);
                wordBank.appendChild(listItem);
            }
        }
    }

    function removeEmptyListItems() {
        const wordBank = document.querySelector('#word-bank ul');
        wordBank.querySelectorAll('li').forEach(li => {
            if (!li.hasChildNodes()) {
                li.remove();
            }
        });
    }

    function updateDraggableTabindex() {
        document.querySelectorAll('.draggable').forEach(draggable => {
            if (selectedElement) {
                if (draggable.closest('.dropzone')) {
                    draggable.setAttribute('tabindex', '-1');
                } else {
                    draggable.setAttribute('tabindex', '0');
                }
            } else {
                draggable.setAttribute('tabindex', '0');
            }
        });
    }

    function announce(message) {
        if (message === lastAnnouncement) {
            clearTimeout(debounceTimeout);
        }
        lastAnnouncement = message;
        debounceTimeout = setTimeout(() => {
            const liveRegion = document.getElementById('a11y-live-region');
            if (liveRegion) {
                liveRegion.textContent = message;
            }
        }, 200);
    }
});

function handleDragStart(selectedElement, draggable, updateDraggableTabindex, announce) {
    selectedElement = draggable;
    draggable.setAttribute('aria-describedby', 'drag grab');
    draggable.classList.add('grabbed');
    updateDraggableTabindex();
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