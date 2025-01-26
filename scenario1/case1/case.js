const KEYS = {
    ENTER: 'Enter',
    SPACE: 'Space',
    ESC: 'Escape'
};

document.addEventListener('DOMContentLoaded', () => {
    let selectedElement = null;

    document.querySelectorAll('.draggable').forEach(draggable => {
        draggable.addEventListener('keydown', (event) => {
            if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
                event.preventDefault();
                if (selectedElement) {
                    selectedElement.setAttribute('aria-describedby', 'drag');
                }
                selectedElement = draggable;
                draggable.setAttribute('aria-describedby', 'drag grab');
            } else if (event.key === KEYS.ESC) {
                event.preventDefault();
                if (selectedElement) {
                    selectedElement.setAttribute('aria-describedby', 'drag');
                    selectedElement = null;
                }
            }
        });

        draggable.addEventListener('dragstart', (event) => {
            selectedElement = draggable;
            draggable.setAttribute('aria-describedby', 'drag grab');
        });

        draggable.addEventListener('dragend', (event) => {
            draggable.setAttribute('aria-describedby', 'drag');
            selectedElement = null;
        });
    });

    document.querySelectorAll('.dropzone').forEach(dropzone => {
        dropzone.addEventListener('keydown', (event) => {
            if ((event.key === KEYS.ENTER || event.key === KEYS.SPACE) && selectedElement) {
                event.preventDefault();
                dropzone.appendChild(selectedElement);
                selectedElement.setAttribute('aria-describedby', 'drag');
                selectedElement = null;
            }
        });

        dropzone.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        dropzone.addEventListener('drop', (event) => {
            event.preventDefault();
            if (selectedElement) {
                dropzone.appendChild(selectedElement);
                selectedElement.setAttribute('aria-describedby', 'drag');
                selectedElement = null;
            }
        });
    });
});
