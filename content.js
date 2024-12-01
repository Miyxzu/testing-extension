// Apply the acrylic effect to the active tab
function addAcrylicEffect() {
    if (!document.querySelector(".acrylic-overlay")) {
        chrome.storage.local.get("tasks", (data) => {
            if (chrome.runtime.lastError) {
                console.error(`Error fetching tasks: ${chrome.runtime.lastError}`);
                return;
            }
            const tasks = data.tasks || [];
            const overlay = document.createElement("div");
            overlay.classList.add("acrylic-overlay");

            const card = document.createElement("div");
            card.classList.add("acrylic-card");

            const filteredTasks = tasks.filter((task) => task.task && task.task.trim() !== "");
            if (filteredTasks.length > 0) {
                const taskList = document.createElement("ul");
                filteredTasks.forEach((task) => {
                    const listItem = document.createElement("li");
                    listItem.textContent = task.task;
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
}

// Remove the acrylic effect
function removeAcrylicEffect() {
    const overlay = document.querySelector(".acrylic-overlay");
    if (overlay) {
        overlay.remove();
    }
}

let originalNotification = null; // Store the original Notification API

// Block site notifications
function blockNotifications() {
    if (!originalNotification) {
        originalNotification = window.Notification;

        // Override the Notification constructor
        window.Notification = function () {
            console.log("Blocked a notification");
        };

        // Preserve existing properties
        window.Notification.permission = originalNotification.permission;
        window.Notification.requestPermission = originalNotification.requestPermission.bind(originalNotification);
    }
}

// Allow site notifications
function restoreNotifications() {
    if (originalNotification) {
        window.Notification = originalNotification; // Restore the original Notification constructor
        originalNotification = null;
        console.log("Notifications restored");
    }
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "applyAcrylicEffect") {
        console.log("Applying Acrylic Effect");
        if (document.querySelector(".acrylic-overlay")) {
            return;  // Ensure only one overlay is created
        }
        addAcrylicEffect();  // Apply acrylic effect after CSS injection
    } else if (request.action === "removeAcrylicEffect") {
        console.log("Removing Acrylic Effect");
        removeAcrylicEffect();
    }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "blockNotifications") {
        blockNotifications();
    } else if (request.action === "restoreNotifications") {
        restoreNotifications();
    }
});