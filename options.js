var targetWebsite = document.getElementById('target-website');
var featureSwitch = document.getElementById('feature-switch');
var openaiaKey = document.getElementById('openaia-api-key');
var logger = document.getElementById('logger');
var webTarget = null;
// create var array with key and value for the target website
var targetWebList = [
    { key: "onlevelup", value: "onlevelup.com" },
    { key: "stackoverflow", value: "stackoverflow.com" },
    { key: "linkedin", value: "linkedin.com" },
    { key: "quora", value: "quora.com" },
    // TODO: add more websites
    // { key: "skillvalue", value: "skillvalue.com" },
    // { key: "codingame", value: "codingame.com" },
    // { key: "classmarker", value: "classmarker.com" },
];

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    // get tab  url
    var url = tab.url;
    var EnableSwitch = false;
    // get element from tab html content 
    
    //gzt domain name from url
    var domain = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (domain != null) {
        targetWebList.forEach(element => {
            if (domain[2].includes(element.value)) {

                EnableSwitch = true;
                targetWeb = element.key;
                targetWebsite.value = targetWeb;
                chrome.storage.sync.set({ targetWeb }, () => {
                    console.log('opena AI Key saved');
                });

            }
        });
    }
    if (EnableSwitch == false) {
        featureSwitch.disabled = true;
        targetWebsite.disabled = true;
        logger.innerHTML = "The extension is not available for this website";
    } else {
        featureSwitch.disabled = false;
        targetWebsite.disabled = false;
        logger.innerHTML = "";
    }
});

targetWebsite.addEventListener('change', (event) => {
    const targetWeb = event.target.value;
    // save the state of the feature switch
    chrome.storage.sync.set({ targetWeb }, () => {
        console.log('target Website saved');
    });

});

chrome.storage.sync.get('targetWeb', ({ targetWeb }) => {
    if (targetWeb) {
        targetWebsite.value = targetWeb;
        webTarget = targetWeb;
    }
});

if (featureSwitch != null) {
    featureSwitch.checked = false;
}

openaiaKey.addEventListener('change', (event) => {
    const APIkey = event.target.value;
    // save the state of the feature switch
    chrome.storage.sync.set({ APIkey }, () => {
        console.log('opena AI Key saved');
    });
});

chrome.storage.sync.get('APIkey', ({ APIkey }) => {
    if (APIkey)
        openaiaKey.value = APIkey;
});

featureSwitch.addEventListener('change', (event) => {
    const enabled = event.target.checked;
    // save the state of the feature switch

    chrome.storage.sync.set({ enabled }, () => {
        var error = false;
        targetWebsite = document.getElementById('target-website');
        openaiaKey = document.getElementById('openaia-api-key');
        logger = document.getElementById('logger');
        featureSwitch = document.getElementById('feature-switch');

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tab = tabs[0];
            // get tab  url
            var url = tab.url;
            var tabId = tab.id;
            if (targetWebsite == null || openaiaKey == null || targetWebsite.value == null || openaiaKey.value == null || targetWebsite.value == "" || openaiaKey.value == "") {
                logger.innerHTML = "*Please fill the target website and the API key";
                error = true;
            } else {
                logger.innerHTML = "";
                error = false;
            }

            if (enabled && url.includes(targetWebsite.value) && error == false) {
                // get current tab ID 
                chrome.scripting
                    .executeScript({
                        target: { tabId: tabId },
                        files: ["contentScript.js"]
                    })
                    .then(() => console.log("script injected"));
            } else {
                // get current tab ID 
                featureSwitch.checked = false;
                // executeScript with parameter
                chrome.scripting
                    .executeScript({
                        target: { tabId: tabId },
                        files: ["end.js"],
                    })
                    .then(() => console.log("script injected"));
            }
        });
        // console.log('Feature switch state saved');
    });

});
// chrome.storage.sync.get('enabled', ({ enabled }) => {
//     if (enabled)
//         featureSwitch.checked = enabled;
// });


