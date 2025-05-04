// Default settings if storage is empty
const DEFAULT_SETTINGS = {
    globalFontPatchingEnabled: true,
    siteFontPatchingSettings: {}
};

async function getFontPatchingState(hostname) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['globalFontPatchingEnabled', 'siteFontPatchingSettings'], (result) => {
            const globalFontPatchingEnabled = result.globalFontPatchingEnabled !== undefined ? result.globalFontPatchingEnabled : DEFAULT_SETTINGS.globalFontPatchingEnabled;
            const siteFontPatchingSettings = result.siteFontPatchingSettings || DEFAULT_SETTINGS.siteFontPatchingSettings;
            const siteFontPatchingEnabled = hostname ? siteFontPatchingSettings[hostname] : undefined;
            
            resolve({
                globalFontPatchingEnabled,
                siteFontPatchingEnabled,
                siteFontPatchingSettings
            });
        });
    });
}

async function updateExtensionIcon(tabId, isActive) {
    // Define colors with alpha channel for better readability
    const ACTIVE_COLOR = "#4CAF50"; // Green
    const INACTIVE_COLOR = "#F44336"; // Red
    
    try {
        const text = isActive ? "✓" : "✗";
        const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
        
        await chrome.action.setBadgeText({ 
            text: text,
            tabId: tabId 
        });
        await chrome.action.setBadgeBackgroundColor({ 
            color: color,
            tabId: tabId 
        });
    } catch (error) {
        console.error('Error updating extension icon:', error);
    }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getSiteOverride') {
        const currentSite = new URL(sender.tab.url).hostname;
        getFontPatchingState(currentSite).then(states => {
            const isActive = states.globalFontPatchingEnabled && 
                           (states.siteFontPatchingEnabled === undefined || states.siteFontPatchingEnabled === true);
            updateExtensionIcon(sender.tab.id, isActive);
            sendResponse({
                globalOverride: states.globalFontPatchingEnabled,
                siteOverride: states.siteFontPatchingEnabled
            });
        }).catch(error => {
            console.error('Error in getSiteOverride:', error);
            sendResponse({ error: 'Failed to get site override status' });
        });
        return true;
    }
    
    if (message.type === 'getOverrideStates') {
        getFontPatchingState(message.hostname).then(states => {
            sendResponse({
                globalOverride: states.globalFontPatchingEnabled,
                siteOverride: states.siteFontPatchingEnabled
            });
        }).catch(error => {
            console.error('Error in getOverrideStates:', error);
            sendResponse({ error: 'Failed to get override states' });
        });
        return true;
    }

    if (message.type === 'setGlobalOverride') {
        chrome.storage.sync.set({ globalFontPatchingEnabled: message.value }, () => {
            sendResponse({ success: true });
            // Note: We don't try to message content scripts directly anymore
            // They will check settings on their own
        });
        return true;
    }

    if (message.type === 'setSiteOverride') {
        chrome.storage.sync.get(['siteFontPatchingSettings'], (result) => {
            const siteFontPatchingSettings = result.siteFontPatchingSettings || {};
            siteFontPatchingSettings[message.hostname] = message.value;
            chrome.storage.sync.set({ siteFontPatchingSettings }, () => {
                sendResponse({ success: true });
                // Note: We don't try to message content scripts directly anymore
                // They will check settings on their own
            });
        });
        return true;
    }
});