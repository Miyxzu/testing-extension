document.addEventListener("DOMContentLoaded", function () {
    // Add URL to filterList
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
        chrome.storage.sync.get("filterList", function (data) {
            var filterList = data.filterList || [];
            var urlCheck = filterList.find((item) => item.url === url);
            if (urlCheck) {
                console.error("URL already exists in Filter List.");
                document.getElementById("websiteLabel").innerText = "URL already exists in Filter List.";
                return;
            }
            try {
                var urlObject = new URL(url);
                var mainDomain = urlObject.protocol + "//" + urlObject.hostname;

                console.log("Main Domain:", mainDomain); // Debug log

                if (url === mainDomain || url === mainDomain + "/") {
                    chrome.runtime.sendMessage({ action: "fetchTitle", url: mainDomain }, function (response) {
                        if (response && response.status === 500) {
                            console.error("Website not added to Filter List.");
                            return;
                        }

                        var title = response && response.title ? response.title : "No Title Found";

                        filterList.push({ // Add the website to the whitelist
                            websiteName: title,
                            url: url,
                            permissions: [],
                            whitelisted: false,
                        });

                        chrome.storage.sync.set({ filterList: filterList }, function () {
                            chrome.storage.sync.get(["filterList"], function (updatedResult) {
                                console.log("Updated Filter List:", updatedResult.filterList); // Debug log
                                document.getElementById("websiteLabel").innerText = "URL added to Filter List.";
                                displayFilterList(); // Call displayFilterList after adding the website
                            });
                        });
                    });
                } else {
                    console.error("URL does not match the main domain.");
                }
            } catch (error) {
                console.error("Error parsing URL:", error);
            }
        });
    });

    // Clear all websites from the whitelist
    document.getElementById("resetFilterList").addEventListener("click", function () {
        chrome.storage.sync.remove("filterList", function () {
            displayFilterList();
        });
    });

    // Example function to update the whitelist
    function updateFilterList(newItem) {
        chrome.storage.sync.get("filterList", function (data) {
            const filterList = data.filterList || [];
            filterList.push(newItem);
            chrome.storage.sync.set({ filterList: filterList }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error updating Filter List:", chrome.runtime.lastError);
                } else {
                    console.log("Filter List updated successfully");
                }
            });
        });
    }

    // Listen for changes in storage
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'sync' && changes.filterList) {
            console.log("Filter List updated:", changes.filterList.newValue);
            // Handle the updated whitelist if needed
        }
    });

    // Function to display the whitelist
    function displayFilterList() {
        chrome.storage.sync.get("filterList", function (data) {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving filterList:", chrome.runtime.lastError);
                return;
            }
            const filterList = data.filterList || [];
            const filterListContainer = document.getElementById("filteredWebsitesContainer");
            filterListContainer.innerHTML = ""; // Clear any existing content

            filterList.forEach((item, index) => {
                const listItem = document.createElement("div");
                listItem.innerHTML = `<br> Website: ${item.websiteName} <br> URL: ${item.url}`;
                filterListContainer.appendChild(listItem);
            });
        });
    }

    // Add Task from the dashboard to the list
    document.getElementById("tasksButton").addEventListener("click", function () {
        const task = document.getElementById("taskInput").value;
        if (!task) {
            console.error("Please Enter a Task.");
            document.getElementById("taskLabel").innerText = "Task Added to List.";
            return;
        }
        chrome.storage.local.get("tasks", function (data) {
            const tasks = data.tasks || [];

            if (tasks.find((item) => item.task === task)) {
                console.error("Task already exists in Task List.");
                document.getElementById("taskLabel").innerText = "Task already exists in Task List.";
                return;
            }

            // var urlCheck = filterList.find((item) => item.url === url);

            tasks.push({
                task: task,
                completed: false,
            });
            chrome.storage.local.set({ tasks: tasks }, function () {
                console.log("Task added to list");
                document.getElementsById("taskLabel").innerText = "Task Added to List.";
                displayTasks(); // Call displayTasks after adding the task
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
            const tasks = data.tasks || [];
            const taskList = document.getElementById("taskContainer");
            taskList.innerHTML = "";

            tasks.forEach((task, index) => {
                const taskItem = document.createElement("li");

                // Create checkbox
                const checkbox = document.createElement("input");
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
    displayFilterList();
});