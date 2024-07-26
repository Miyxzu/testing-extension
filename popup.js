//Get title of the active tab
document.querySelector('.titleButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
            console.error('No active tab found.');
            return;
        }
        var activeTab = tabs[0];
        if (!activeTab.url) {
            console.error('Active tab has no URL.');
            return;
        }
        try {
            var url = new URL(activeTab.url);
            var mainDomain = url.protocol + "//" + url.hostname;

            fetch(mainDomain)
                .then(response => response.text())
                .then(html => {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    var title = doc.querySelector('title').innerText;
                    document.getElementById('title').textContent = title;
                })
                .catch(error => {
                    console.error('Error fetching main domain HTML:', error);
                });
        } catch (e) {
            console.error('Error parsing URL:', e);
        }
    });
});

//Inject CSS into the active tab
document.querySelector('.on').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: "injectAcrylicEffect"});
});

//Remove injected CSS from the active tab
document.querySelector('.off').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: "removeAcrylicEffect"});
});