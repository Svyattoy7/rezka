
chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
                conditions: [/*new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {hostEquals: 'developer.chrome.com'},
                    })*/
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {
                            urlMatches: '.*'
                        },
                        //css: ["a"]
                    })
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
});
console.log(chrome.runtime.id)

let forPopupPort = null;
chrome.runtime.onConnect.addListener(function (portFrom) {
    if (portFrom.name === 'BgSendPopup') {
        forPopupPort = portFrom;
        forPopupPort.onDisconnect.addListener((p) => {
            forPopupPort = null
        });
    }
    if (portFrom.name === 'rezkaSendBg') {
        
        portFrom.onMessage.addListener(function (message) {
            if (message.type == 'GOT_CURRENT_VIDEO')
                chrome.storage.local.set({
                    currentCDN: message
                });
            if (message.type == 'GOT_ALL_VIDEOS')
                chrome.storage.local.set({
                    serialCDN: message
                });
            forPopupPort.postMessage({action: 'DATA_RECEIVED'});
        });
    }
});