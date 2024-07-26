//This script is responsible for handling the communication between the extension and the active tab.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectAcrylicEffect") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting
                .insertCSS({
                    target: { tabId: tabId },
                    files: ["acrylic.css"],
                })
                .then(() => {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        function: addAcrylicEffect,
                    });
                })
                .catch((error) =>
                    console.error("Failed to insert CSS:", error)
                );
        });
    } else if (request.action === "removeAcrylicEffect") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting
                .executeScript({
                    target: { tabId: tabId },
                    function: removeAcrylicEffect,
                })
                .catch((error) =>
                    console.error("Failed to remove CSS:", error)
                );
        });
    }
});

//Apply the acrylic effect to the active tab
function addAcrylicEffect() {
    if (document.querySelector(".acrylic-overlay")) {
        return
    }

    const overlay = document.createElement("div");
    overlay.classList.add("acrylic-overlay");

    const card = document.createElement("div");
    card.classList.add("acrylic-card");
    card.innerHTML =
        'This is an example text in the acrylic card';

    overlay.appendChild(card);
    document.body.appendChild(overlay);
}

//Remove the acrylic effect from the active tab
function removeAcrylicEffect() {
    const overlay = document.querySelector(".acrylic-overlay");
    if (overlay) {
        overlay.remove();
    }
}

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // Define your JSON data
        const jsonData = {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
        };

        // Store JSON data using chrome.storage.local
        chrome.storage.local.set({ myJsonData: jsonData }, function() {
            console.log('JSON data has been stored.');
        });
    }
});