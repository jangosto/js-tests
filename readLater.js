//READ LATER FEATURE IMPLEMENTATION
var sendReadLaterMessage = function (e) {
    var id = e.target.getAttribute("id");
    var url = e.target.parentNode.getElementsByClassName("new-url")[0].getAttribute('href');
    var message = {"type": "cacheAddUrlRequest", "url": getAmpUrl(url)};
    return new Promise(function(resolve, reject) {
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function(ev) {
            if (ev.data) {
                e.target.setAttribute('style', 'background:#00FF00');
            }
        };
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
}

var sendIsCachedMessage = function (url, element) {
    var message = {"type": "isUrlCachedRequest", "url": url};
    return new Promise(function(resolve, reject) {
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function(ev) {
            if (ev.data.cached == true) {
                element.setAttribute('style', 'background:#00FF00');
            }
        };
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
}

var observer = new MutationObserver(function (mutations) {
    var readLaterButtons = document.getElementsByClassName("read-later");
    if (readLaterButtons.length > 0) {
        for (var i = 0; i < readLaterButtons.length; i++) {
            sendIsCachedMessage(getAmpUrl(readLaterButtons[i].parentNode.getElementsByClassName("new-url")[0].getAttribute('href')), readLaterButtons[i]);
            readLaterButtons[i].addEventListener("click", function(e) {
                sendReadLaterMessage(e);
            }, false);
        }
    }
});

var container = document.getElementById("content");
var config = { attributes: false, childList: true, characterData: false };
observer.observe(container, config);
