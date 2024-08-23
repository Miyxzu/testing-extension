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
    return true; // Indicates that the response will be sent asynchronously
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

// Get Title Function (Section Provided by Copilot)
// (Heroku Method)
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "fetchTitle") {
//         const url = request.url;
//         const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
//         fetch(proxyUrl)
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error(`Network response was not ok: ${response.statusText}`);
//                 }
//                 return response.text();
//             })
//             .then(html => {
//                 const parser = new DOMParser();
//                 const doc = parser.parseFromString(html, "text/html");
//                 const titleElement = doc.querySelector("title");
//                 const title = titleElement ? titleElement.innerText : "No Title Found";
//                 sendResponse({ title });
//             })
//             .catch(error => {
//                 console.error("Error fetching title:", error);
//                 sendResponse({ title: "No Title Found" });
//             });
//         return true; // Indicates that the response will be sent asynchronously
//     }
// });

// Get Title Function (Section Provided by Copilot)
// (Server-side Method)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTitle") {
        const url = request.url;
        const serverUrl = `http://localhost:3000/fetch-title?url=${encodeURIComponent(url)}`;
        console.log(`Fetching title for URL: ${url} from server: ${serverUrl}`);
        fetch(serverUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Received title: ${data.title}`);
                sendResponse({ title: data.title });
            })
            .catch(error => {
                console.error("Error fetching title:", error);
                sendResponse({ title: "No Title Found" });
            });
        return true; // Indicates that the response will be sent asynchronously
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log(`Tab updated: ${tab.url}`);
        checkIfTask()
            .then(taskExists => {
                console.log(`Task exists: ${taskExists}`);
                if (taskExists) {
                    return checkIfWhitelisted(tab.url);
                } else {
                    throw new Error("No task exists");
                }
            })
            .then(isWhitelisted => {
                console.log(`URL is whitelisted: ${isWhitelisted}`);
                if (isWhitelisted) {
                    return chrome.scripting.insertCSS({
                        target: { tabId: tabId },
                        files: ["acrylic.css"],
                    });
                } else {
                    throw new Error("URL is not whitelisted");
                }
            })
            .then(() => {
                return chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: addAcrylicEffect,
                });
            })
            .catch(error => {
                if (error.message.includes("ExtensionsSettings policy")) {
                    console.warn("Cannot script this page due to ExtensionsSettings policy.");
                } else {
                    console.error("Error in tab update listener:", error);
                }
            });
    }
});

function checkIfWhitelisted(url) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("whitelist", data => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const whitelist = data.whitelist || [];
            console.log(`Whitelist: ${JSON.stringify(whitelist)}`);
            const normalizedUrl = normalizeUrl(url);
            console.log(`Normalized URL: ${normalizedUrl}`);
            const urlCheck = whitelist.find(item => {
                const normalizedWhitelistUrl = normalizeUrl(item.url);
                console.log(`Checking against whitelist URL: ${normalizedWhitelistUrl}`);
                return normalizedWhitelistUrl === normalizedUrl;
            });
            resolve(!!urlCheck);
        });
    });
}

chrome.permissions.request({
    origins: ["https://example.com/"]
}, (granted) => {
    if (granted) {
        console.log("Permission granted");
        // Proceed with accessing the URL
    } else {
        console.log("Permission denied");
    }
});

function normalizeUrl(url) {
    let normalizedUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^\//, ''); // Remove protocol and 'www.'
    if (!normalizedUrl.endsWith('/')) {
        normalizedUrl += '/';
    }
    return normalizedUrl;
}

function checkIfTask() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("task", data => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const task = data.task || [];
            console.log(`Task data: ${JSON.stringify(task)}`);
            resolve(!!task);
        });
    });
}