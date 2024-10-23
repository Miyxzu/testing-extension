chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: "dashboard/page.html" });
});

// Handle tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
            checkIfFiltered(tab.url).then((isFiltered) => {
                if (isFiltered) {
                    checkIfTask().then((hasTasks) => {
                        const action = hasTasks ? "applyAcrylicEffect" : "removeAcrylicEffect";
                        // Directly send the message since the content script is auto-injected
                        chrome.tabs.sendMessage(activeInfo.tabId, { action });
                    });
                }
            });
        }
    });
});

// chrome.tabs.onActivated.addListener((activeInfo) => {
//     chrome.tabs.get(activeInfo.tabId, (tab) => {
//         if (tab.url) {
//             checkIfFiltered(tab.url).then((isFiltered) => {
//                 if (isFiltered) {
//                     checkIfTask().then((hasTasks) => {
//                         const action = hasTasks ? "applyAcrylicEffect" : "removeAcrylicEffect";
//                         chrome.tabs.sendMessage(activeInfo.tabId, { action });
//                     });
//                 }
//             });
//         }
//     });
// });

// Check if a task exists
function checkIfTask() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("tasks", (data) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const tasks = data.tasks || [];
            console.log(`Task data: ${JSON.stringify(tasks)}`);
            resolve(tasks.length > 0);
        });
    });
}

// Check if a task exists in storage and removes it if the browser is closed
chrome.runtime.onSuspend.addListener(() => {
    checkIfTask()
        .then((hasTasks) => {
            if (hasTasks) {
                chrome.storage.local.remove("tasks", () => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            `Error removing tasks: ${chrome.runtime.lastError}`
                        );
                    } else {
                        console.log("Tasks removed from storage.");
                    }
                });
            }
        })
        .catch((error) => {
            console.error(`Error checking tasks: ${error}`);
        });
});

// Check if the URL is whitelisted
function checkIfFiltered(url) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("filterList", (data) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const filterList = data.filterList || [];
            console.log(`filterList: ${JSON.stringify(filterList)}`);
            const normalizedUrl = normalizeUrl(url);
            console.log(`Normalized URL: ${normalizedUrl}`);
            const urlCheck = filterList.find((item) => {
                const normalizedFilterListUrl = normalizeUrl(item.url);
                console.log(`Checking against filter list URL: ${normalizedFilterListUrl}`);
                return normalizedUrl.endsWith(normalizedFilterListUrl);
            });
            resolve(!!urlCheck);
        });
    });
}

// Normalize URL for comparison
function normalizeUrl(url) {
    let normalizedUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/^\//, ""); // Remove protocol and 'www.'
    const parts = normalizedUrl.split(".");
    if (parts.length > 2) {
        normalizedUrl = parts.slice(-2).join(".");
    }
    const domainEndIndex = normalizedUrl.indexOf("/");
    if (domainEndIndex !== -1) {
        normalizedUrl = normalizedUrl.substring(0, domainEndIndex);
    }
    if (!normalizedUrl.endsWith("/")) {
        normalizedUrl += "/";
    }
    return normalizedUrl;
}

// Get Title Function (Section Provided by Copilot)
// (Server-side Method)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTitle") {
        const url = request.url;
        const serverUrl = `http://localhost:3000/fetch-title?url=${encodeURIComponent(
            url
        )}`;
        console.log(`Fetching title for URL: ${url} from server: ${serverUrl}`);
        fetch(serverUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `Network response was not ok: ${response.statusText}`
                    );
                }
                return response.json();
            })
            .then((data) => {
                // console.log(`Received title: ${data.title}`);
                sendResponse({ title: data.title });
            })
            .catch((error) => {
                console.error("Error fetching title:", error);
                sendResponse({ title: "No Title Found" });
            });
        return true; // Indicates that the response will be sent asynchronously
    }
});

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

chrome.permissions.request({
    origins: ["https://example.com/", "https://wikipedia.org"]
}, (granted) => {
    if (granted) {
        console.log("Permission granted");
        // Proceed with accessing the URL
    } else {
        console.log("Permission denied");
    }
});