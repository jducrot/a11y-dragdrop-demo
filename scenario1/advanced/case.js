/**
 * Accessible Drag and Drop with Menu Alternative
 * WCAG 2.2 Level AA Compliant Implementation
 */

// Constants and State Management
const KEYS = { ENTER: 'Enter', SPACE: ' ', ESC: 'Escape' };
const STATE = {
  selectedElement: null,
  lastAnnouncement: '',
  placedWords: {}
};

// ===== Utility Functions =====
const utils = {
  /**
   * Get text content of an element
   * @param {HTMLElement} element 
   * @returns {string}
   */
  getItemName(element) {
    return element?.textContent.trim() || '';
  },
  
  /**
   * Find empty list items and remove them
   */
  removeEmptyListItems() {
    const wordBank = document.querySelector('#word-bank ul');
    if (wordBank) {
      wordBank.querySelectorAll('li').forEach(li => {
        if (!li.hasChildNodes() || li.textContent.trim() === '') {
          li.remove();
        }
      });
    }
  }
};

// ===== Accessibility Functions =====
const accessibility = {
  debounceTimeout: null,
  
  /**
   * Set up live region for screen reader announcements
   */
  setUpLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveRegion);
  },
  
  /**
   * Announce a message to screen readers
   * @param {string} message - Message to announce
   * @param {boolean} showMessage - Whether to show the message visually
   */
  announce(message, showMessage = false) {
    if (message === STATE.lastAnnouncement) {
      clearTimeout(this.debounceTimeout);
    }
    
    STATE.lastAnnouncement = message;
    this.debounceTimeout = setTimeout(() => {
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
};

// ===== Drag and Drop Operations =====
const dragDrop = {
  /**
   * Initialize drag and drop functionality
   */
  init() {
    const draggables = document.querySelectorAll('.draggable');
    const dropzones = document.querySelectorAll('.dropzone');
    
    draggables.forEach(draggable => {
      draggable.addEventListener('keydown', this.handleDraggableKeydown);
      draggable.addEventListener('dragstart', this.handleDragStart);
      draggable.addEventListener('dragend', this.handleDragEnd);
      draggable.addEventListener('click', this.handleDragStart);
    });
    
    dropzones.forEach(dropzone => {
      dropzone.addEventListener('keydown', this.handleDropzoneKeydown);
      dropzone.addEventListener('click', this.handleDropzoneKeydown);
      dropzone.addEventListener('dragover', event => event.preventDefault());
      dropzone.addEventListener('drop', this.handleDrop);
    });
  },
  
  /**
   * Handle keydown events on draggable elements
   * @param {KeyboardEvent} event 
   */
  handleDraggableKeydown(event) {
    event.stopPropagation();
    const { key, currentTarget } = event;
    
    if (key === KEYS.ENTER || key === KEYS.SPACE) {
      event.preventDefault();
      
      if (STATE.selectedElement && currentTarget !== STATE.selectedElement) {
        // Swap elements if one is already selected
        dragDrop.swapElements(STATE.selectedElement, currentTarget);
        STATE.selectedElement = null;
      } else {
        // Start drag operation
        STATE.selectedElement = currentTarget;
        currentTarget.setAttribute('aria-describedby', 'drag grab');
        currentTarget.classList.add('grabbed');
        accessibility.announce(`${utils.getItemName(currentTarget)} grabbed`);
      }
      
      validation.checkDropzones();
    } else if (key === KEYS.ESC) {
      event.preventDefault();
      
      if (STATE.selectedElement) {
        const itemName = utils.getItemName(STATE.selectedElement);
        STATE.selectedElement.setAttribute('aria-describedby', 'drag');
        STATE.selectedElement.classList.remove('grabbed');
        STATE.selectedElement = null;
        accessibility.announce(`${itemName} selection canceled`);
      }
    }
  },
  
  /**
   * Handle dragstart events
   * @param {DragEvent} event 
   */
  handleDragStart(event) {
    STATE.selectedElement = event.currentTarget;
    event.currentTarget.setAttribute('aria-describedby', 'drag grab');
    event.currentTarget.classList.add('grabbed');
    accessibility.announce(`${utils.getItemName(event.currentTarget)} grabbed`);
    utils.removeEmptyListItems();
  },
  
  /**
   * Handle dragend events
   * @param {DragEvent} event 
   */
  handleDragEnd(event) {
    const itemName = utils.getItemName(event.currentTarget);
    event.currentTarget.setAttribute('aria-describedby', 'drag');
    event.currentTarget.classList.remove('grabbed');
    STATE.selectedElement = null;
    utils.removeEmptyListItems();
    accessibility.announce(`${itemName} dropped`);
    validation.checkDropzones();
  },
  
  /**
   * Handle keydown or click events on dropzones
   * @param {Event} event 
   */
  handleDropzoneKeydown(event) {
    if (!STATE.selectedElement) return;
    
    if (event.key === KEYS.ENTER || event.key === KEYS.SPACE || event.type === 'click') {
      event.preventDefault();
      dragDrop.moveToDropzone(event.currentTarget);
    }
  },
  
  /**
   * Handle drop events
   * @param {DragEvent} event 
   */
  handleDrop(event) {
    event.preventDefault();
    
    if (!STATE.selectedElement) return;
    
    const dropzone = event.currentTarget;
    const existingDraggable = dropzone.querySelector('.draggable');
    
    if (existingDraggable && existingDraggable !== STATE.selectedElement) {
      dragDrop.swapElements(STATE.selectedElement, existingDraggable);
    } else {
      dropzone.appendChild(STATE.selectedElement);
      STATE.selectedElement.setAttribute('aria-describedby', 'drag');
      STATE.selectedElement.classList.remove('grabbed');
      accessibility.announce(`${utils.getItemName(STATE.selectedElement)} dropped`);
    }
    
    // Update tracking
    const word = utils.getItemName(STATE.selectedElement);
    const dropzoneId = dropzone.id;
    stateManager.updateAfterDragDrop(word, null, dropzoneId);
    
    STATE.selectedElement = null;
    utils.removeEmptyListItems();
    validation.checkDropzones();
  },
  
  /**
   * Move a draggable to a dropzone
   * @param {HTMLElement} dropzone 
   */
  moveToDropzone(dropzone) {
    const itemName = utils.getItemName(STATE.selectedElement);
    
    // Move any existing element in the dropzone back to the word bank
    if (dropzone.firstChild) {
      dragDrop.moveToWordBank(dropzone);
    }
    
    dropzone.appendChild(STATE.selectedElement);
    
    STATE.selectedElement.setAttribute('aria-describedby', 'drag');
    STATE.selectedElement.classList.remove('grabbed');
    STATE.selectedElement = null;
    utils.removeEmptyListItems();
    accessibility.announce(`${itemName} dropped`);
    
    // Update state tracking
    stateManager.updateAfterDragDrop(itemName, null, dropzone.id);
    
    validation.checkDropzones();
  },
  
  /**
   * Move an element from a dropzone to the word bank
   * @param {HTMLElement} dropzone 
   */
  moveToWordBank(dropzone) {
    const draggable = dropzone.querySelector('.draggable');
    if (!draggable) return;
    
    const word = utils.getItemName(draggable);
    const dropzoneId = dropzone.id;
    
    const wordBank = document.querySelector('#word-bank ul');
    if (wordBank) {
      const listItem = document.createElement('li');
      listItem.appendChild(draggable);
      wordBank.appendChild(listItem);
      draggable.setAttribute('aria-describedby', 'drag');
    }
    
    // Update state tracking
    stateManager.updateAfterDragDrop(word, dropzoneId, null);
    
    utils.removeEmptyListItems();
  },
  
  /**
   * Swap two draggable elements
   * @param {HTMLElement} draggable1 
   * @param {HTMLElement} draggable2 
   */
  swapElements(draggable1, draggable2) {
    const parent1 = draggable1.parentNode;
    const parent2 = draggable2.parentNode;
    
    if (!parent1 || !parent2) return;
    
    const placeholder = document.createElement('div');
    parent1.replaceChild(placeholder, draggable1);
    parent2.replaceChild(draggable1, draggable2);
    parent1.replaceChild(draggable2, placeholder);
    
    // Update state tracking
    if (parent1.classList.contains('dropzone') && parent2.classList.contains('dropzone')) {
      stateManager.swapDropzoneItems(parent1.id, parent2.id);
    } else if (parent1.classList.contains('dropzone')) {
      delete STATE.placedWords[parent1.id];
      STATE.placedWords[parent2.id] = utils.getItemName(draggable1);
    } else if (parent2.classList.contains('dropzone')) {
      delete STATE.placedWords[parent2.id];
      STATE.placedWords[parent1.id] = utils.getItemName(draggable2);
    }
    
    setTimeout(() => {
      draggable1.classList.remove('grabbed');
      draggable2.classList.remove('grabbed');
      draggable1.focus();
      accessibility.announce(`Swapped ${utils.getItemName(draggable1)} and ${utils.getItemName(draggable2)}`);
    }, 100);
  }
};

// ===== Dropdown Menu Operations =====
const dropdownMenu = {
  /**
   * Initialize dropdown menus
   */
  init() {
    const pickButtons = document.querySelectorAll('[aria-expanded]');
    
    pickButtons.forEach(button => {
      const dropzoneId = button.id.replace('-btn', '');
      const menu = this.createMenu(dropzoneId);
      document.body.appendChild(menu);
      
      // Add event listeners
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu(button, menu);
      });
      
      button.addEventListener('keydown', (e) => {
        if (e.key === KEYS.ENTER || e.key === KEYS.SPACE || e.key === 'ArrowDown') {
          e.preventDefault();
          this.showMenu(button, menu);
          const firstItem = menu.querySelector('[role="menuitem"]');
          if (firstItem) firstItem.focus();
        }
      });
    });
    
    // Close when clicking outside
    document.addEventListener('click', this.hideAllMenus.bind(this));
  },
  
  /**
   * Create a dropdown menu
   * @param {string} dropzoneId 
   * @returns {HTMLElement}
   */
  createMenu(dropzoneId) {
    const menu = document.createElement('div');
    menu.id = `menu-${dropzoneId}`;
    menu.className = 'dropdown-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', `${dropzoneId}-btn`);
    menu.setAttribute('hidden', 'true');
    
    const menuList = document.createElement('ul');
    menuList.setAttribute('role', 'none');
    menu.appendChild(menuList);
    
    this.populateMenu(menu);
    this.setupKeyboardNavigation(menu);
    
    return menu;
  },
  
  /**
   * Populate a menu with items
   * @param {HTMLElement} menu 
   */
  populateMenu(menu) {
    const menuList = menu.querySelector('ul');
    menuList.innerHTML = '';
    const dropzoneId = menu.id.replace('menu-', '');
    
    // Get available words from word bank
    const wordBankItems = document.querySelectorAll('#word-bank .draggable');
    const availableWords = Array.from(wordBankItems).map(item => utils.getItemName(item));
    
    // Create menu items for available words
    availableWords.forEach(word => {
      this.addMenuItem(menuList, word, () => {
        this.placeWordInDropzone(word, dropzoneId);
        this.hideAllMenus();
      });
    });
    
    // Add remove option if dropzone has a word
    if (STATE.placedWords[dropzoneId]) {
      const word = STATE.placedWords[dropzoneId];
      this.addMenuItem(
        menuList, 
        `Remove ${word}`, 
        () => {
          dragDrop.moveToWordBank(document.getElementById(dropzoneId));
          this.hideAllMenus();
        },
        `Remove ${word} and return it to word bank`
      );
    }
  },
  
  /**
   * Add a menu item to a menu list
   * @param {HTMLElement} menuList 
   * @param {string} text 
   * @param {Function} onClick 
   * @param {string} ariaLabel 
   */
  addMenuItem(menuList, text, onClick, ariaLabel = null) {
    const listItem = document.createElement('li');
    listItem.setAttribute('role', 'none');
    
    const button = document.createElement('button');
    button.textContent = text;
    button.setAttribute('role', 'menuitem');
    button.setAttribute('tabindex', '-1');
    
    if (ariaLabel) {
      button.setAttribute('aria-label', ariaLabel);
    }
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Find the button that triggered this menu
      const menuId = menuList.closest('.dropdown-menu').id;
      const buttonId = menuId.replace('menu-', '') + '-btn';
      const triggerButton = document.getElementById(buttonId);
      
      // Execute the action
      onClick();
      
      // Close the menu and return focus to the button
      this.hideAllMenus();
      
      // Use requestAnimationFrame to ensure focus happens after DOM updates
      requestAnimationFrame(() => {
        if (triggerButton && document.body.contains(triggerButton)) {
          triggerButton.focus();
        }
      });
    });
    
    listItem.appendChild(button);
    menuList.appendChild(listItem);
  },
  
  /**
   * Place a word in a dropzone via menu selection
   * @param {string} word 
   * @param {string} dropzoneId 
   */
  placeWordInDropzone(word, dropzoneId) {
    const dropzone = document.getElementById(dropzoneId);
    const wordBankItem = this.findWordInWordBank(word);
    
    if (!wordBankItem) {
      accessibility.announce(`Could not find ${word} in the word bank`);
      return;
    }
    
    // If there's already a word in the dropzone, move it back to word bank
    if (dropzone.firstChild) {
      dragDrop.moveToWordBank(dropzone);
    }
    
    // Move the element from word bank to dropzone
    dropzone.appendChild(wordBankItem);
    
    // Update tracking
    STATE.placedWords[dropzoneId] = word;
    
    // Announce the change
    accessibility.announce(`Placed ${word} in the dropzone`);
    
    // Check if all dropzones are filled correctly
    validation.checkDropzones();
  },
  
  /**
   * Find a word in the word bank
   * @param {string} word 
   * @returns {HTMLElement|null}
   */
  findWordInWordBank(word) {
    const wordBankButtons = document.querySelectorAll('#word-bank .draggable');
    
    for (const button of wordBankButtons) {
      if (utils.getItemName(button) === word) {
        return button;
      }
    }
    
    return null;
  },
  
  /**
   * Toggle a menu's visibility
   * @param {HTMLElement} button 
   * @param {HTMLElement} menu 
   */
  toggleMenu(button, menu) {
    if (menu.hasAttribute('hidden')) {
      this.showMenu(button, menu);
    } else {
      this.hideMenu(button, menu);
    }
  },
  
  /**
   * Show a menu
   * @param {HTMLElement} button 
   * @param {HTMLElement} menu 
   */
  showMenu(button, menu) {
    // Position the menu below the button
    const buttonRect = button.getBoundingClientRect();
    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    menu.style.left = `${buttonRect.left + window.scrollX}px`;
    
    // Update menu content
    this.populateMenu(menu);
    
    // Show the menu
    menu.removeAttribute('hidden');
    button.setAttribute('aria-expanded', 'true');
    
    // Ensure the button remains visible while menu is open
    button.classList.add('menu-open');
  },
  
  /**
   * Hide a menu
   * @param {HTMLElement} button 
   * @param {HTMLElement} menu 
   */
  hideMenu(button, menu) {
    menu.setAttribute('hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    
    // Remove the visible state when menu closes
    button.classList.remove('menu-open');
    
    // Return focus to button
    if (button && document.body.contains(button) && !button.disabled) {
      requestAnimationFrame(() => {
        button.focus();
      });
    }
  },
  
  /**
   * Hide all menus
   */
  hideAllMenus() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (!menu.hasAttribute('hidden')) {
        const buttonId = menu.getAttribute('aria-labelledby') || menu.id.replace('menu-', '') + '-btn';
        const button = document.getElementById(buttonId);
        
        if (button) {
          this.hideMenu(button, menu);
        }
      }
    });
  },
  
  /**
   * Set up keyboard navigation for a menu
   * @param {HTMLElement} menu 
   */
  setupKeyboardNavigation(menu) {
    menu.addEventListener('keydown', (e) => {
      const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
      const currentIndex = items.indexOf(document.activeElement);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < items.length - 1) {
            items[currentIndex + 1].focus();
          } else {
            items[0].focus(); // Wrap to first item
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            items[currentIndex - 1].focus();
          } else {
            // Return to the button
            const buttonId = menu.getAttribute('aria-labelledby');
            const button = document.getElementById(buttonId);
            this.hideMenu(button, menu);
          }
          break;
          
        case 'Home':
          e.preventDefault();
          if (items.length > 0) items[0].focus();
          break;
          
        case 'End':
          e.preventDefault();
          if (items.length > 0) items[items.length - 1].focus();
          break;
          
        case 'Escape':
          e.preventDefault();
          const buttonId = menu.getAttribute('aria-labelledby');
          const button = document.getElementById(buttonId);
          this.hideMenu(button, menu);
          break;
          
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (document.activeElement.getAttribute('role') === 'menuitem') {
            document.activeElement.click();
          }
          break;
          
        case 'Tab':
          e.preventDefault();
          this.hideAllMenus();
          break;
          
        // First-letter navigation
        default:
          if (e.key.length === 1 && e.key.match(/\S/)) {
            const char = e.key.toLowerCase();
            const matchingItems = items.filter(item => 
              item.textContent.trim().toLowerCase().startsWith(char)
            );
            
            if (matchingItems.length > 0) {
              // Find next match after current position or wrap to first
              const nextMatches = matchingItems.filter((item) => 
                items.indexOf(item) > currentIndex
              );
              
              if (nextMatches.length > 0) {
                nextMatches[0].focus();
              } else {
                matchingItems[0].focus();
              }
            }
          }
      }
    });
  }
};

// ===== State Management =====
const stateManager = {
  /**
   * Update state after drag and drop operations
   * @param {string} word 
   * @param {string|null} fromDropzone 
   * @param {string|null} toDropzone 
   */
  updateAfterDragDrop(word, fromDropzone, toDropzone) {
    if (fromDropzone) {
      delete STATE.placedWords[fromDropzone];
    }
    
    if (toDropzone) {
      STATE.placedWords[toDropzone] = word;
    }
    
    // Update all menus
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      dropdownMenu.populateMenu(menu);
    });
  },
  
  /**
   * Swap items between dropzones in state tracking
   * @param {string} dropzoneId1 
   * @param {string} dropzoneId2 
   */
  swapDropzoneItems(dropzoneId1, dropzoneId2) {
    const temp = STATE.placedWords[dropzoneId1];
    STATE.placedWords[dropzoneId1] = STATE.placedWords[dropzoneId2];
    STATE.placedWords[dropzoneId2] = temp;
  }
};

// ===== Validation =====
const validation = {
  /**
   * Check if dropzones contain correct states
   */
  checkDropzones() {
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
        accessibility.announce(`All states are in the correct order. Well done!`, true);
      } else {
        targets.classList.add('error');
        targets.classList.remove('success');
        accessibility.announce(`Not all states are in the correct order. Try again!`, true);
      }
    } else {
      targets.classList.remove('success');
      targets.classList.remove('error');
    }
  }
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  accessibility.setUpLiveRegion();
  dragDrop.init();
  dropdownMenu.init();
});



