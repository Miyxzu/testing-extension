document.addEventListener("DOMContentLoaded", function () {
    // Append Title to whitelist.json
    document.getElementById("websiteButton").addEventListener("click", function () {
        var url = document.getElementById("websiteText").value;
        if (!url) {
            console.error("Please Enter a URL.");
            return;
        }
        if (url) {
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
            }
        }
        chrome.storage.sync.get("whitelist", function (data) {
            var whitelist = data.whitelist || [];
            var urlCheck = whitelist.find((item) => item.url === url);
            if (urlCheck) {
                console.error("URL already exists in whitelist.");
                return;
            }
            try {
                var urlObject = new URL(url);
                var mainDomain = urlObject.protocol + "//" + urlObject.hostname;

                if (url === mainDomain || url === mainDomain + "/") {
                    chrome.runtime.sendMessage({ action: "fetchTitle", url: mainDomain }, function (response) {
                        var title = response && response.title ? response.title : "No Title Found";

                        whitelist.push({
                            websiteName: title,
                            url: url,
                            permissions: [],
                            whitelisted: true,
                        });
                        chrome.storage.sync.set({ whitelist: whitelist }, function () {
                            chrome.storage.sync.get(["whitelist"], function (updatedResult) {
                                console.log("Updated whitelist:", updatedResult.whitelist); // Debug log
                                displayWhitelist(); // Call displayWhitelist after adding the website
                            });
                        });
                    });
                }
            } catch (error) {
                console.error("Error parsing URL:", error);
            }
        });
    });

    // Clear all websites from the whitelist
    document.getElementById("resetWhitelist").addEventListener("click", function () {
        chrome.storage.sync.remove("whitelist", function () {
            displayWhitelist();
        });
    });

    // Function to display the whitelist
    function displayWhitelist() {
        chrome.storage.sync.get("whitelist", function (data) {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving whitelist:", chrome.runtime.lastError);
                return;
            }
            const whitelist = data.whitelist || [];
            // console.log("Fetched whitelist:", whitelist); // Debug log
            const whitelistContainer = document.getElementById("filteredWebsitesContainer");
            whitelistContainer.innerHTML = ""; // Clear any existing content

            whitelist.forEach((item, index) => {
                const listItem = document.createElement("div");
                listItem.innerHTML = `<br> Index: ${index} <br> Website: ${item.websiteName} <br> URL: ${item.url}`;
                whitelistContainer.appendChild(listItem);
            });
        });
    }

    // Add Task from the dashboard to the list
    document.getElementById("tasksButton").addEventListener("click", function () {
        const task = document.getElementById("taskInput").value;
        if (!task) {
            console.error("Please Enter a Task.");
            return;
        }
        chrome.storage.local.get("tasks", function (data) {
            var tasks = data.tasks || [];
            tasks.push({
                task: task,
                completed: false,
            });
            chrome.storage.local.set({ tasks: tasks }, function () {
                console.log("Task added to list");
                chrome.storage.local.get(["tasks"], function (updatedResult) {
                    console.log("Updated tasks:", updatedResult.tasks); // Debug log
                    displayTasks(); // Call displayTasks after adding the task
                });
            });
        });
    });

    // Clear all tasks from the list
    document.getElementById("clearTasks").addEventListener("click", function () {
        chrome.storage.local.remove("tasks", function () {
            displayTasks();
        });
    });

    // Display the list of tasks
    function displayTasks() {
        chrome.storage.local.get("tasks", function (data) {
            var tasks = data.tasks || [];
            var taskList = document.getElementById("taskContainer");
            taskList.innerHTML = "";

            tasks.forEach((task, index) => {
                var taskItem = document.createElement("li");

                // Create checkbox
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = task.completed;
                checkbox.addEventListener("change", function () {
                    toggleTask(index);
                });

                // Append checkbox and task text to the list item
                taskItem.appendChild(checkbox);
                taskItem.appendChild(document.createTextNode(task.task));
                taskItem.setAttribute("data-index", index);

                taskList.appendChild(taskItem);
                if (task.completed) {
                    taskItem.classList.add("completed");
                    taskItem.style.textDecoration = "line-through";
                }
            });
        });
    }

    // Toggle task completion status
    function toggleTask(index) {
        chrome.storage.local.get("tasks", function (data) {
            var tasks = data.tasks || [];
            tasks[index].completed = !tasks[index].completed;
            chrome.storage.local.set({ tasks: tasks }, function () {
                displayTasks();
            });
        });
    }

    // Remove completed tasks on page reload
    window.addEventListener("load", function () {
        chrome.storage.local.get("tasks", function (data) {
            var tasks = data.tasks || [];
            var incompleteTasks = tasks.filter((task) => !task.completed);
            chrome.storage.local.set({ tasks: incompleteTasks }, function () {
                displayTasks();
            });
        });
    });

    // Initial display of tasks
    displayTasks();
    displayWhitelist();
});

// // Append Title (via Heroku)
// document.getElementById("websiteButton").addEventListener("click", function () {
//     var url = document.getElementById("websiteText").value;
//     if (!url) {
//         console.error("Please Enter a URL.");
//         return;
//     }
//     if (url) {
//         if (!url.startsWith("http://") && !url.startsWith("https://")) {
//             url = "https://" + url;
//         }
//     }
//     chrome.storage.sync.get("whitelist", function (data) {
//         var whitelist = data.whitelist || [];
//         var urlCheck = whitelist.find((item) => item.url === url);
//         if (urlCheck) {
//             console.error("URL already exists in whitelist.");
//             return;
//         }
//         try {
//             var urlObject = new URL(url);
//             var mainDomain = urlObject.protocol + "//" + urlObject.hostname;

//             if (url === mainDomain || url === mainDomain + "/") {
//                 // Use a public CORS proxy
//                 var proxyUrl = "https://cors-anywhere.herokuapp.com/" + mainDomain;
//                 fetch(proxyUrl)
//                     .then((response) => response.text())
//                     .then((html) => {
//                         var parser = new DOMParser();
//                         var doc = parser.parseFromString(html, "text/html");
//                         var titleElement = doc.querySelector("title");
//                         var title = titleElement ? titleElement.innerText : "No Title Found";

//                         whitelist.push({
//                             websiteName: title,
//                             url: url,
//                             permissions: [],
//                             whitelisted: true,
//                         });
//                         chrome.storage.sync.set({ whitelist: whitelist }, function () {
//                             chrome.storage.sync.get(["whitelist"], function (updatedResult) {
//                                 console.log("Updated whitelist:", updatedResult.whitelist); // Debug log
//                                 displayWhitelist(); // Call displayWhitelist after adding the website
//                             });
//                         });
//                     })
//                     .catch((error) => {
//                         console.error("Error fetching Main Domain Title from HTML:", error);
//                     });
//             }
//         } catch (error) {
//             console.error("Error parsing URL:", error);
//         }
//     });
// });