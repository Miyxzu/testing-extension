document.addEventListener("DOMContentLoaded", function () {
    // Inject CSS into the active tab
    document.getElementById("on").addEventListener("click", function () {
        console.log("Inject button clicked"); // Debug log
        chrome.runtime.sendMessage({ action: "injectAcrylicEffect" });
    });

    // Remove injected CSS from the active tab
    document.getElementById("off").addEventListener("click", function () {
        chrome.runtime.sendMessage({ action: "removeAcrylicEffect" });
    });

    // Function to display the whitelist
    document.getElementById("showFilterList").addEventListener("click", function () {
        chrome.storage.sync.get("filterList", function (data) {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving Filter List:", chrome.runtime.lastError);
                return;
            }
            const filterList = data.filterList || [];
            console.log("Fetched Filter List:", filterList); // Debug log
            const filterListContainer = document.getElementById("filterListContainer");
            filterListContainer.innerHTML = ""; // Clear any existing content
    
            filterList.forEach((item, index) => {
                const listItem = document.createElement("div");
                listItem.innerHTML = `Index: ${index} <br> Website: ${item.websiteName} <br> URL: ${item.url}`;
                filterListContainer.appendChild(listItem);
            });
        });
    });

    

    // Listen for changes in storage
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'sync' && changes.filterList) {
            console.log("Filter List updated:", changes.filterList.newValue);
            // Update the whitelist display if needed
        }
    });

    // Add Task from popup to the list
    document.getElementById("addTask").addEventListener("click", function () {
        const task = document.getElementById("taskInput").value;
        if (!task) {
            console.error("Please Enter a Task.");
            return;
        }
        chrome.storage.local.get("tasks", function (data) {
            const tasks = data.tasks || [];
            tasks.push({
                task: task,
                completed: false,
            });
            chrome.storage.local.set({ tasks: tasks }, function () {
                console.log("Task added to list");
                chrome.storage.local.get(["tasks"], function (updatedResult) {
                    displayTasks(); // Call displayTasks after adding the task
                });
            });
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

    // Remove 
    
    // Initial display of tasks and whitelist
    displayTasks();
});
