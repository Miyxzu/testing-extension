// Create a WebSocket connection to the server
const ws = new WebSocket("ws://localhost:8080");

// Override console methods
["log", "info", "warn", "error"].forEach((method) => {
    const originalMethod = console[method];
    console[method] = function (...args) {
        // Send log messages to the WebSocket server
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method, args }));
        }
        // Call the original console method
        originalMethod.apply(console, args);
    };
});

// Get title of the active tab
document.getElementById("titleButton").addEventListener("click", function () {
    getTitle((title) => {
        document.getElementById("title").textContent = title;
    });
});

// Inject CSS into the active tab
document.getElementById("on").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "injectAcrylicEffect" });
});

// Remove injected CSS from the active tab
document.getElementById("off").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "removeAcrylicEffect" });
});

// Append Title to whitelist.json
document.getElementById("jsonPush").addEventListener("click", function () {
    getTitle((title) => {
        if (!title) {
            console.error("No title found.");
            return;
        } else if (title === "New Tab") {
            console.error("Title is 'New Tab'.");
            return;
        }
        getURL((url) => {
            if (!url) {
                console.error("No URL found.");
                return;
            } else if (url === "chrome://newtab/") {
                console.error("URL is 'chrome://newtab/'.");
                return;
            }
            chrome.storage.sync.get("whitelist", function (data) {
                var whitelist = data.whitelist || [];
                var urlCheck = whitelist.find((item) => item.url === url);
                if (urlCheck) {
                    console.error("URL already exists in whitelist.");
                    return;
                }
                whitelist.push({
                    websiteName: title,
                    url: url,
                    permissions: [],
                    whitelisted: true,
                });
                chrome.storage.sync.set({ whitelist: whitelist }, function () {
                    console.log("Details added to whitelist");
                    chrome.storage.sync.get(
                        ["whitelist"],
                        function (updatedResult) {
                            console.log(
                                "Updated whitelist:",
                                updatedResult.whitelist
                            ); // Debug log
                        }
                    );
                });
            });
        });
    });
});

// Get Title Function
function getTitle(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            return;
        }
        var activeTab = tabs[0];
        if (!activeTab.url) {
            console.error("Active tab has no URL.");
            return;
        }
        try {
            var url = new URL(activeTab.url);
            var mainDomain = url.protocol + "//" + url.hostname;

            if (
                activeTab.url === mainDomain ||
                activeTab.url === mainDomain + "/"
            ) {
                chrome.scripting.executeScript(
                    {
                        target: { tabId: activeTab.id },
                        func: () => document.title,
                    },
                    (results) => {
                        if (results && results[0] && results[0].result) {
                            callback(results[0].result);
                        } else {
                            console.error(
                                "Error retrieving title from the active tab."
                            );
                        }
                    }
                );
            } else {
                fetch(mainDomain)
                    .then((response) => response.text())
                    .then((html) => {
                        var parser = new DOMParser();
                        var doc = parser.parseFromString(html, "text/html");
                        var title = doc.querySelector("title").innerText;
                        callback(title);
                    })
                    .catch((error) => {
                        console.error(
                            "Error fetching main domain HTML:",
                            error
                        );
                    });
            }
        } catch (error) {
            console.error("Error parsing URL:", error);
        }
    });
}

// Get URL Function
function getURL(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            callback(null);
            return;
        }
        var activeTab = tabs[0];
        if (!activeTab.url) {
            console.error("Active tab has no URL.");
            callback(null);
            return;
        }
        try {
            var url = new URL(activeTab.url);
            var mainDomain = url.protocol + "//" + url.hostname;

            if (
                activeTab.url === mainDomain ||
                activeTab.url === mainDomain + "/"
            ) {
                callback(activeTab.url);
            } else {
                callback(mainDomain);
            }
        } catch (error) {
            console.error("Error parsing URL:", error);
            callback(null);
        }
    });
}

// Function to display the whitelist
document.getElementById("showWhitelist").addEventListener("click", function () {
    chrome.storage.local.get("whitelist", function (data) {
        if (chrome.runtime.lastError) {
            console.error(
                "Error retrieving whitelist:",
                chrome.runtime.lastError
            );
            return;
        }
        const whitelist = data.whitelist || [];
        console.log("Fetched whitelist:", whitelist); // Debug log
        const whitelistContainer =
            document.getElementById("whitelistContainer");
        whitelistContainer.innerHTML = ""; // Clear any existing content

        whitelist.forEach((item, index) => {
            const listItem = document.createElement("div");
            listItem.innerHTML = `Index: ${index} <br> Website: ${item.websiteName} <br> URL: ${item.url}`;
            whitelistContainer.appendChild(listItem);
        });
    });
});

// document.getElementById("addTask").addEventListener("click", function () {
//     const task = document.getElementById("taskInput").value;
//     if (!task) {
//         console.error("Please Enter a Task.");
//         return;
//     }
//     chrome.storage.local.get("tasks", function (data) {
//         var tasks = data.tasks || [];
//         tasks.push({
//             task: task,
//             completed: false,
//         });
//         chrome.storage.local.set({ tasks: tasks }, function () {
//             console.log("Task added to list");
//             chrome.storage.local.get(["tasks"], function (updatedResult) {
//                 console.log("Updated tasks:", updatedResult.tasks); // Debug log
//                 displayTasks(); // Call displayTasks after adding the task
//             });
//         });
//     });
// });

// // Display the list of tasks
// function displayTasks() {
//     chrome.storage.sync.get("tasks", function (data) {
//         var tasks = data.tasks || [];
//         var taskList = document.getElementById("taskContainer");
//         taskList.innerHTML = "";
//         tasks.forEach((task, index) => {
//             var taskItem = document.createElement("li");

//             // Create checkbox
//             var checkbox = document.createElement("input");
//             checkbox.type = "checkbox";
//             checkbox.checked = task.completed;
//             checkbox.addEventListener("change", function () {
//                 toggleTask(index);
//             });

//             // Append checkbox and task text to the list item
//             taskItem.appendChild(checkbox);
//             taskItem.appendChild(document.createTextNode(task.task));
//             taskItem.setAttribute("data-index", index);

//             taskList.appendChild(taskItem);
//             if (task.completed) {
//                 taskItem.classList.add("completed");
//             }
//         });
//     });
// }

// // Toggle task completion status
// function toggleTask(index) {
//     chrome.storage.local.get("tasks", function (data) {
//         var tasks = data.tasks || [];
//         tasks[index].completed = !tasks[index].completed;
//         chrome.storage.local.set({ tasks: tasks }, function () {
//             displayTasks();
//         });
//     });
// }
