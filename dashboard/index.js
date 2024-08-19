// Add Task from the dashboard to the list
document.getElementById(".tasksButton").addEventListener("click", function () {
    const task = document.getElementById("taskInput").value;
    if (!task) {
        console.error("Please Enter a Task.");
        return;
    }
    chrome.storage.sync.get("tasks", function (data) {
        var tasks = data.tasks || [];
        tasks.push({
            task: task,
            completed: false,
        });
        chrome.storage.local.set({ tasks: tasks }, function () {
            console.log("Task added to list");
            chrome.storage.local.get(["tasks"], function (updatedResult) {
                console.log("Updated tasks:", updatedResult.tasks); // Debug log
            });
        });
    });
});

// Display the list of tasks
chrome.storage.sync.get("tasks", function (data) {
    const tasks = data.tasks || [];
    const list = document.getElementById("taskList");
    tasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.textContent = task.task;
        list.appendChild(listItem);
    });
});