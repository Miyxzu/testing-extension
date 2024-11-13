document.addEventListener("DOMContentLoaded", function () {
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
            console.log("Tasks retrieved for popup:", tasks); // Debug log to confirm data
    
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
    
    // Initial display of tasks and whitelist
    displayTasks();
});
