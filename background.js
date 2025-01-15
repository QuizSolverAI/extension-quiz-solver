chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab.url?.startsWith("chrome://")) return undefined;
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get('enabled', ({ enabled }) => {});
  }
});

