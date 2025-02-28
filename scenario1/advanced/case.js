const KEYS = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESC: 'Escape'
};

// Global state to track available words and placed words
let availableWords = [];
let placedWords = {};

// Requirements
// - MENU WITH EMPTY DZ
// - All states in WB
// - MENU WITH FILLED DZ
// - All States in WB
// - Remove <state in DZ>

// Move the announce function outside the DOMContentLoaded event handler
// to make it globally available (replace the existing announce function)
let lastAnnouncement = '';
let debounceTimeout;

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

document.addEventListener('DOMContentLoaded', () => {
    let selectedElement = null;
    
    setUpLiveRegion();

    // Initialize available words from word bank
    document.querySelectorAll('#word-bank .draggable').forEach(word => {
        availableWords.push(word.textContent);
    });

    // Set up dropdown functionality for each pick button
    setupDropdownMenus();

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

function setupDropdownMenus() {
    const pickButtons = document.querySelectorAll('[aria-expanded]');
    
    pickButtons.forEach(button => {
        // Create dropdown menu for each button
        const dropzoneId = button.id.replace('-btn', '');
        const menu = createDropdownMenu(dropzoneId);
        document.body.appendChild(menu);
        
        // Add event listeners
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdownMenu(button, menu);
        });
        
        button.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                showDropdownMenu(button, menu);
                // Focus the first item
                const firstItem = menu.querySelector('li button');
                if (firstItem) firstItem.focus();
            }
        });
        
        // Close when clicking outside
        document.addEventListener('click', () => {
            hideAllDropdownMenus();
        });
    });
}

function createDropdownMenu(dropzoneId) {
    const menu = document.createElement('div');
    menu.id = `menu-${dropzoneId}`;
    menu.className = 'dropdown-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', `${dropzoneId}-btn`);
    menu.setAttribute('hidden', 'true');
    
    // Create menu container
    const menuList = document.createElement('ul');
    menuList.setAttribute('role', 'none');
    menu.appendChild(menuList);
    
    populateDropdownMenu(menu);
    setupMenuKeyboardNavigation(menu);
    
    return menu;
}

function populateDropdownMenu(menu) {
    const menuList = menu.querySelector('ul');
    menuList.innerHTML = '';
    
    // Create menu items for available words
    availableWords.forEach(word => {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'none');
        
        const button = document.createElement('button');
        button.textContent = word;
        button.setAttribute('role', 'menuitem');
        button.setAttribute('tabindex', '-1');
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropzoneId = menu.id.replace('menu-', '');
            placeWordInDropzone(word, dropzoneId);
            hideAllDropdownMenus();
        });
        
        listItem.appendChild(button);
        menuList.appendChild(listItem);
    });
    
    // Add a "Clear" option if dropzone has a word
    const dropzoneId = menu.id.replace('menu-', '');
    if (placedWords[dropzoneId]) {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'none');
        
        const button = document.createElement('button');
        // Improve the text to be more descriptive
        const stateInDropzone = placedWords[dropzoneId];
        button.textContent = `Remove ${stateInDropzone}`;
        button.setAttribute('role', 'menuitem');
        button.setAttribute('tabindex', '-1');
        // Add aria-label for improved screen reader context
        button.setAttribute('aria-label', `Remove ${stateInDropzone} and return it to word bank`);
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            removeWordFromDropzone(dropzoneId);
            hideAllDropdownMenus();
        });
        
        listItem.appendChild(button);
        menuList.appendChild(listItem);
    }
}

function placeWordInDropzone(word, dropzoneId) {
    const dropzone = document.getElementById(dropzoneId);
    
    // Find the matching draggable element in the word bank
    const wordBankItem = findWordInWordBank(word);
    
    if (!wordBankItem) {
        announce(`Could not find ${word} in the word bank`);
        return;
    }
    
    // If there's already a word in the dropzone, move it back to word bank
    if (dropzone.firstChild) {
        moveChildToWordBank(dropzone);
    }
    
    // Move the element from word bank to dropzone
    dropzone.appendChild(wordBankItem);
    
    // Update tracking variables
    const oldWord = placedWords[dropzoneId];
    if (oldWord && availableWords.indexOf(oldWord) === -1) {
        availableWords.push(oldWord);
    }
    
    availableWords = availableWords.filter(w => w !== word);
    placedWords[dropzoneId] = word;
    
    // Update all dropdown menus
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        populateDropdownMenu(menu);
    });
    
    // Announce the change to screen readers
    announce(`Placed ${word} in the dropzone`);
    
    // Check if all dropzones are filled correctly
    checkDropzones(announce);
}

function findWordInWordBank(word) {
    const wordBankButtons = document.querySelectorAll('#word-bank .draggable');
    
    for (const button of wordBankButtons) {
        if (button.textContent.trim() === word) {
            return button;
        }
    }
    
    return null;
}

function removeWordFromDropzone(dropzoneId) {
    const dropzone = document.getElementById(dropzoneId);
    
    if (dropzone.firstChild) {
        const word = dropzone.firstChild.textContent.trim();
        
        // Use the existing moveChildToWordBank function
        moveChildToWordBank(dropzone);
        
        // Update tracking
        delete placedWords[dropzoneId];
        availableWords.push(word);
        
        // Update all dropdown menus
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            populateDropdownMenu(menu);
        });
        
        // Announce the change to screen readers with improved context
        announce(`Removed ${word} from the dropzone and returned it to the word bank`);
    }
}

function toggleDropdownMenu(button, menu) {
    if (menu.hasAttribute('hidden')) {
        showDropdownMenu(button, menu);
    } else {
        hideDropdownMenu(button, menu);
    }
}

function showDropdownMenu(button, menu) {
    // Position the menu below the button
    const buttonRect = button.getBoundingClientRect();
    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    menu.style.left = `${buttonRect.left + window.scrollX}px`;
    
    // Update menu content with current available words
    populateDropdownMenu(menu);
    
    // Show the menu
    menu.removeAttribute('hidden');
    button.setAttribute('aria-expanded', 'true');
}

function hideDropdownMenu(button, menu) {
    menu.setAttribute('hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.focus(); // Return focus to the button
}

function hideAllDropdownMenus() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        const buttonId = menu.getAttribute('aria-labelledby');
        const button = document.getElementById(buttonId);
        if (button) {
            hideDropdownMenu(button, menu);
        }
    });
}

function setupMenuKeyboardNavigation(menu) {
    menu.addEventListener('keydown', (e) => {
        const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const currentIndex = items.indexOf(document.activeElement);
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < items.length - 1) {
                    items[currentIndex + 1].focus();
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex - 1].focus();
                } else {
                    // Return to the button when at the top
                    const buttonId = menu.getAttribute('aria-labelledby');
                    const button = document.getElementById(buttonId);
                    hideDropdownMenu(button, menu);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                const buttonId = menu.getAttribute('aria-labelledby');
                const button = document.getElementById(buttonId);
                hideDropdownMenu(button, menu);
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (document.activeElement.getAttribute('role') === 'menuitem') {
                    document.activeElement.click();
                }
                break;
                
            case 'Tab':
                hideAllDropdownMenus();
                break;
        }
    });
}

function announceChange(message) {
    // Use the existing announce function instead
    announce(message);
}

// This function should be called when words are dragged and dropped
function updateAvailableWordsAfterDragDrop(word, fromDropzone, toDropzone) {
    // Update tracking of words when drag/drop is used
    if (fromDropzone) {
        delete placedWords[fromDropzone];
    } else {
        // Word is coming from the word bank
        availableWords = availableWords.filter(w => w !== word);
    }
    
    if (toDropzone) {
        // If there was already a word in the target dropzone
        const oldWord = placedWords[toDropzone];
        if (oldWord) {
            availableWords.push(oldWord);
        }
        
        placedWords[toDropzone] = word;
    } else {
        // Word is going back to word bank
        availableWords.push(word);
    }
    
    // Update all menus
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        populateDropdownMenu(menu);
    });
}



