// Apply the acrylic effect to the active tab
function addAcrylicEffect() {
    // Ensure the acrylic effect is only applied after CSS is loaded
    if (!document.querySelector(".acrylic-overlay")) {
        // Now apply the overlay only after confirming no other overlays exist
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

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "applyAcrylicEffect") {
        console.log("Applying Acrylic Effect");
        addAcrylicEffect();  // Directly call the acrylic effect function
    } else if (request.action === "removeAcrylicEffect") {
        console.log("Removing Acrylic Effect");
        removeAcrylicEffect();  // Directly call the removal function
    }
});
