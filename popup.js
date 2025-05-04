const toggleGlobalButton = document.getElementById('toggle-global');
const toggleSiteButton = document.getElementById('toggle-site');

// Replace alert with a user-friendly message display
function showMessage(message) {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        const newMessageContainer = document.createElement('div');
        newMessageContainer.id = 'message-container';
        newMessageContainer.style.backgroundColor = '#f8d7da';
        newMessageContainer.style.color = '#721c24';
        newMessageContainer.style.padding = '10px';
        newMessageContainer.style.marginTop = '10px';
        newMessageContainer.style.border = '1px solid #f5c6cb';
        newMessageContainer.style.borderRadius = '5px';
        newMessageContainer.style.whiteSpace = 'pre-wrap';
        newMessageContainer.textContent = message;
        document.body.appendChild(newMessageContainer);
        setTimeout(() => newMessageContainer.remove(), 3000);
    } else {
        messageContainer.textContent += '\n\n' + message;
    }
}

// Update button states based on stored preferences
function updateUIState() {
    // Get the current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const hostname = tabs[0]?.url ? new URL(tabs[0].url).hostname : null;

        chrome.runtime.sendMessage({ type: 'getOverrideStates', hostname }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error getting override states:', chrome.runtime.lastError);
                return;
            }

            if (!response) {
                console.error('No response received from background script');
                return;
            }

            toggleGlobalButton.textContent = response.globalOverride ? 'Disable Global Font Patching' : 'Enable Global Font Patching';

            if (hostname) {
                toggleSiteButton.textContent = response.siteOverride === false ? 'Enable Font Patching for This Site' : 'Disable Font Patching for This Site';
            } else {
                toggleSiteButton.textContent = 'No valid site detected';
            }
        });
    });
}

// Initial UI update
updateUIState();

// Toggle global override
toggleGlobalButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'getOverrideStates' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting override states:', chrome.runtime.lastError);
            return;
        }

        const newValue = !response.globalOverride;
        chrome.runtime.sendMessage({ type: 'setGlobalOverride', value: newValue }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error setting global override:', chrome.runtime.lastError);
                return;
            }
            updateUIState();
        });
    });
});

// Toggle site override
toggleSiteButton.addEventListener('click', () => {
    // Get the current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const hostname = tabs[0]?.url ? new URL(tabs[0].url).hostname : null;

        if (hostname) {
            chrome.runtime.sendMessage({ type: 'getOverrideStates', hostname }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error getting override states:', chrome.runtime.lastError);
                    return;
                }

                const newValue = !response.siteOverride;
                chrome.runtime.sendMessage({ type: 'setSiteOverride', hostname, value: newValue }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error setting site override:', chrome.runtime.lastError);
                        return;
                    }
                    updateUIState();
                    showMessage(`Font patching for ${hostname} has been ${newValue ? 'enabled' : 'disabled'}.`);
                });
            });
        } else {
            showMessage('No valid site detected. Cannot toggle font patching.');
        }
    });
});

// Font categories and dropdown population
const fontCategories = {
    'serif-font': ["Times New Roman", "Georgia", "Garamond", "Palatino", "Cambria", "SF Pro", "Custom"],
    'sans-serif-font': ["Arial", "Verdana", "Tahoma", "Trebuchet MS", "Segoe UI", "Calibri", "Helvetica", "Helvetica Neue", "Geneva", "Lucida Grande", "SF Pro", "Custom"],
    'fixed-font': ["Courier New", "Lucida Console", "Consolas", "Monaco", "Menlo", "JetBrainsMono Nerd Font", "Fira Code", "Fira Code Nerd Font", "Custom"]
};

Object.entries(fontCategories).forEach(([category, fonts]) => {
    const select = document.getElementById(category);
    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        select.appendChild(option);
    });
});

// Save settings to Chrome storage
document.getElementById('save-settings').addEventListener('click', () => {
    const settings = {};
    Object.keys(fontCategories).forEach(category => {
        const selectValue = document.getElementById(category).value;
        settings[category] = selectValue;
        if (selectValue === 'Custom') {
            const customFontInput = document.getElementById(`${category}-custom`).value;
            settings[`${category}-custom`] = customFontInput;
        }
    });
    chrome.storage.sync.set(settings, () => {
        showMessage('Settings saved!');
    });
});

// Load settings from Chrome storage
chrome.storage.sync.get(Object.keys(fontCategories), (result) => {
    Object.keys(fontCategories).forEach(category => {
        if (result[category]) {
            document.getElementById(category).value = result[category];
            if (result[category] === 'Custom') {
                chrome.storage.sync.get(`${category}-custom`, (customResult) => {
                    const customFont = customResult[`${category}-custom`];
                    if (customFont !== undefined) {
                        document.getElementById(`${category}-custom`).value = customFont;
                        document.getElementById(category).dispatchEvent(new Event('change'));
                    }
                });
            }
        }
    });
});

document.getElementById('serif-font').addEventListener('change', (e) => {
    document.getElementById('serif-font-custom').style.display = e.target.value === 'Custom' ? 'block' : 'none';
});

document.getElementById('sans-serif-font').addEventListener('change', (e) => {
    document.getElementById('sans-serif-font-custom').style.display = e.target.value === 'Custom' ? 'block' : 'none';
});

document.getElementById('fixed-font').addEventListener('change', (e) => {
    document.getElementById('fixed-font-custom').style.display = e.target.value === 'Custom' ? 'block' : 'none';
});