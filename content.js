// Listen for URL requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getCurrentUrl') {
        sendResponse({ url: window.location.href });
        return true;
    }
});

// Watch for changes in storage and update accordingly
chrome.storage.onChanged.addListener((changes) => {
    if (changes.globalFontPatchingEnabled || changes.siteFontPatchingSettings) {
        applyFontPatching();
    }
});

// Function to apply font patching
async function applyFontPatching() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'getSiteOverride' });
        if (!response) {
            console.error('No response received from background script.');
            return;
        }

        const { globalOverride: globalPatchingEnabled, siteOverride: sitePatchingEnabled } = response;

        // Only apply patching if global is enabled AND (site override is undefined OR explicitly enabled)
        if (globalPatchingEnabled && (sitePatchingEnabled === undefined || sitePatchingEnabled === true)) {
            // Fetch font settings from Chrome storage and apply them dynamically
            chrome.storage.sync.get(['serif-font', 'sans-serif-font', 'fixed-font', 'serif-font-custom', 'sans-serif-font-custom', 'fixed-font-custom'], (settings) => {
                const style = document.createElement('style');
                // Apply font patching by replacing web fonts
                style.textContent = `
                    @font-face {
                        font-family: 'serif';
                        src: local('Times New Roman'), local('Arial'), local('Courier New'),
                             local('Georgia'), local('Helvetica'), local('Courier'),
                             local('serif'), local('sans-serif'), local('monospace');
                    }
                    * {
                        font-family: inherit !important;
                    }
                `;

                const serifFont = settings['serif-font'] === 'Custom' ? settings['serif-font-custom'] : settings['serif-font'] || 'Times New Roman';
                const sansSerifFont = settings['sans-serif-font'] === 'Custom' ? settings['sans-serif-font-custom'] : settings['sans-serif-font'] || 'Arial';
                const fixedFont = settings['fixed-font'] === 'Custom' ? settings['fixed-font-custom'] : settings['fixed-font'] || 'Courier New';

                style.textContent += `
                    * {
                        font-family: ${sansSerifFont}, sans-serif !important;
                    }
                    h1, h2, h3, h4, h5, h6, p, blockquote {
                        font-family: ${serifFont}, serif !important;
                    }
                    pre, code, kbd, samp, tt {
                        font-family: ${fixedFont}, monospace !important;
                    }
                `;

                // Remove any existing font patching styles
                const existingStyle = document.querySelector('style[data-renderwise]');
                if (existingStyle) {
                    existingStyle.remove();
                }

                style.setAttribute('data-renderwise', 'true');
                document.head.appendChild(style);
                console.log('Font patching styles updated successfully');
            });
        } else {
            // Remove font patching if disabled
            const existingStyle = document.querySelector('style[data-renderwise]');
            if (existingStyle) {
                existingStyle.remove();
                console.log('Font patching styles removed');
            }
        }
    } catch (error) {
        console.error('Error applying font patching:', error);
    }
}

// Initial application of font patching
applyFontPatching();