// Mainly for Popup CSS injection, no correlation to actual logic
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectAcrylicEffect") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ["acrylic.css"]
            }).then(() => {
                // After CSS is injected, apply the acrylic effect (ensure DOM manipulation happens after CSS)
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: addAcrylicEffect
                });
            }).catch(error => console.error("Failed to insert CSS:", error));
        });
    } else if (request.action === "removeAcrylicEffect") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: removeAcrylicEffect
            }).catch(error => console.error("Failed to remove effect:", error));
        });
    }
});

//Apply the acrylic effect to the active tab
function addAcrylicEffect() {
    chrome.storage.local.get("tasks", (data) => {
        if (chrome.runtime.lastError) {
            console.error(`Error fetching tasks: ${chrome.runtime.lastError}`);
            return;
        }
        const tasks = data.tasks || [];
        console.log(`Task data (via acrylicEffect): ${JSON.stringify(tasks)}`);

        if (document.querySelector(".acrylic-overlay")) {
            return;
        }

        const overlay = document.createElement("div");
        overlay.classList.add("acrylic-overlay");

        const card = document.createElement("div");
        card.classList.add("acrylic-card");

        // Filter out empty or whitespace-only tasks
        const filteredTasks = tasks.filter(task => task.title && task.title.trim() !== "");

        if (filteredTasks.length > 0) {
            const taskList = document.createElement("ul");
            filteredTasks.forEach((task) => {
                const listItem = document.createElement("li");
                listItem.textContent = task.title;
                taskList.appendChild(listItem);
            });
            card.appendChild(taskList);
        } else {
            card.textContent = "No tasks left.";
        }

        overlay.appendChild(card);
        document.body.appendChild(overlay);
    });
}

//Remove the acrylic effect from the active tab
function removeAcrylicEffect() {
    const overlay = document.querySelector(".acrylic-overlay");
    if (overlay) {
        overlay.remove();
    }
}

// Open Dashboard on First Install
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
                        
                        // Inject CSS before sending the action message
                        chrome.scripting.insertCSS({
                            target: { tabId: activeInfo.tabId },
                            files: ["acrylic.css"]
                        }).then(() => {
                            // Send the action message after CSS is confirmed injected
                            chrome.tabs.sendMessage(activeInfo.tabId, { action });
                        }).catch((error) => {
                            console.error("Failed to inject CSS:", error);
                        });
                    });
                }
            });
        }
    });
});


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
    let normalizedUrl = url.replace(/^https?:\/\//, "")  // Remove protocol (http or https)
                           .replace(/^www\./, "");      // Remove 'www.'

    const parts = normalizedUrl.split(".");

    const secondLevel = ['co.', 'gov.', 'edu.', 'org.', 'ac.']

    if (parts.length > 2) {
        const possibleSecondLevelDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
        if (secondLevel.includes(possibleSecondLevelDomain)) {
            normalizedDomain = `${parts[parts.length - 3]}.${possibleSecondLevelDomain}`;
        } else {
            normalizedDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
        }
    } else {
        normalizedDomain = normalizedUrl; // For short domains like example.com
    }

    const domainEndIndex = normalizedUrl.indexOf("/");
    if (domainEndIndex !== -1) {
        normalizedUrl = normalizedUrl.substring(0, domainEndIndex);  // Remove path
    }

    if (!normalizedUrl.endsWith("/")) {
        normalizedUrl += "/";                            // Ensure trailing slash
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
//         const proxyUrl = `https://corsproxy.io/?${url}`;
//         console.log(proxyUrl);
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