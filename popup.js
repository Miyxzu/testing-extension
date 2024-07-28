//Get title of the active tab
document.querySelector(".titleButton").addEventListener("click", function () {
    getTitle();
});

//Inject CSS into the active tab
document.querySelector(".on").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "injectAcrylicEffect" });
});

//Remove injected CSS from the active tab
document.querySelector(".off").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "removeAcrylicEffect" });
});

//Append Title to whitelist.json
document.querySelector(".titleJson").addEventListener("click", function () {
    
});

// Get Title Function
function getTitle() {
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

            if (activeTab.url === mainDomain || activeTab.url === mainDomain + '/') {
                chrome.scripting.executeScript(
                    {
                        target: { tabId: activeTab.id },
                        func: () => document.title,
                    },
                    (results) => {
                        if (results && results[0] && results[0].result) {
                            document.getElementById("title").textContent =
                                results[0].result;
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
                        document.getElementById("title").textContent = title;
                    })
                    .catch((error) => {
                        console.error(
                            "Error fetching main domain HTML:",
                            error
                        );
                    });
            }
        } catch (e) {
            console.error("Error parsing URL:", e);
        }
    });
}