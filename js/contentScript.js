
//start connection in content script
let bgPort = chrome.runtime.connect({
        name: 'rezkaSendBg'
    });


var s = document.createElement('script');
s.src = chrome.extension.getURL('js/rezkapagescript.js');
(document.head || document.documentElement).appendChild(s);

s.parentNode.removeChild(s);

chrome.runtime.onConnect.addListener(function (portFrom) {
    if (portFrom.name === 'popupSendRezka') {

        portFrom.onMessage.addListener(function (msg) {
            if (msg.action === 'GET_CURRENT_VIDEO') {
                
                let event = new CustomEvent('GET_CURRENT_VIDEO');
                window.dispatchEvent(event);
            }
            if (msg.action === 'GET_ALL_VIDEOS') {
                
                let event = new CustomEvent('GET_ALL_VIDEOS');
                window.dispatchEvent(event);
            }
        });
    }
});


window.addEventListener('message', function receiveInfo(event) {
    if (event.data.action === 'GOT_CURRENT_VIDEO' || event.data.action === 'GOT_ALL_VIDEOS') {
        
        bgPort.postMessage({
            type: event.data.action,
            payload: event.data.payload
        });
    }
}, false);

