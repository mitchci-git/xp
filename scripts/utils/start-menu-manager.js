// ...existing code...
        if (isInMostUsedToolsMenu) {
            // Remove any existing popup
            const existing = document.getElementById('xp-demo-popup');
            if (existing) existing.remove();
            // Create popup
            const popup = document.createElement('div');
            popup.id = 'xp-demo-popup';
            popup.innerHTML = `
              <div class="window" style="margin: 0; width: 270px; position: fixed; left: 50vw; top: 50vh; transform: translate(-50%, -50%); z-index: 10000; user-select: none;">
                <div class="title-bar">
                  <div class="title-bar-text">Program Not Found</div>
                  <div class="title-bar-controls">
                    <button aria-label="Close" id="popup-close"></button>
                  </div>
                </div>
                <div class="window-body">
                  <p style="user-select: none; text-align: center; margin-bottom: 5px;">The selected program could not be found.</p>
                  <section class="field-row" style="justify-content: center; user-select: none;">
                    <button id="popup-ok">OK</button>
                  </section>
                </div>
              </div>
            `;
            popup.setAttribute('tabindex', '-1');
            popup.focus();
            document.body.appendChild(popup);
            // Close on any button click
            popup.querySelectorAll('button').forEach(btn => {
              btn.addEventListener('click', () => popup.remove());
            });
            // Close the start menu after showing the popup
            this.closeStartMenu();
            return;
        }
// ...existing code...