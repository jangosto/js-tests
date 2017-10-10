var getJsonUrl = function (url) {
    removeQueryString(url);
}

var removeQueryString = function (url) {
    var response = url.replace(/(\?)([^=]+=[^&]+)+/g, "");
    return response; 
}

var updatePage = function (data) {
    var div = document.createElement('div');
    div.innerHTML = JSON.parse(data).data.content.replace(/^\s+|\s+$/g, '');
    var elements = div.childNodes;
    var container = document.getElementById("content");

    var head = document.getElementsByTagName("head")[0];
    (JSON.parse(data).data.requiredScripts).forEach(function(script) {
        var requiredScript = unescape(script);
        var divElement = document.createElement('div');
        divElement.innerHTML = requiredScript;
        var elementAttr = divElement.firstChild.attributes;
        var scriptElement = document.createElement(divElement.firstChild.tagName);
        for (i = 0; i < elementAttr.length; i++) {
            scriptElement.setAttribute(elementAttr[i].nodeName, elementAttr[i].value);
        }
        document.head.appendChild(scriptElement);
    });
    elements.forEach(function(element) {
        container.parentNode.insertBefore(element, container);
        scripts = element.getElementsByTagName("script");
        for (i = 0; i < scripts.length; i++) {
            if (scripts[i].textContent.length > 3 & scripts[i].getAttribute("id") != "entry-template") {
                var trimedScript = scripts[i].textContent.replace(/^\s+|\s+$/g, '');
                if (trimedScript.charAt(trimedScript.length - 1) == ";") {
                    eval(scripts[i].textContent);
                } else {
                    eval("("+scripts[i].textContent+")");
                }
            }
        }
    });
    container.remove();

    var newMainScript = document.createElement("script");
    newMainScript.src = "/js/mobile.min.js";
    newMainScript.type = "text/javascript";
    document.head.appendChild(newMainScript);

/*    MetadataParser.updateContentTags(JSON.parse(data).metadata["other-tags"],"data-ue-");
    MetadataParser.updateContentTags(JSON.parse(data).metadata["meta-tags"],"data-ue-");
    AnalyticsParser.updateAnalytics({content:{analytics:JSON.parse(data).analytics}});*/
    
}

var getAmpUrl = function (url) {
    // ... regex for portada
    var coverPattern =  new RegExp("^"+siteDomain+"(\/)?$", "i");
    // ... regex for portadillas
    var autocoverPattern =  new RegExp("^"+siteDomain+"\/([a-z0-9\-]+\/)?([a-z0-9\-]+\/)?([a-z0-9\-]+\/)?([a-z0-9\-]+.html)?$", "i");
    // ... regex for news
    var newPattern = new RegExp("^"+siteDomain+"\/([a-z0-9\-]+\/)?([a-z0-9\-]+\/)?([a-z0-9\-]+\/)?[0-9]{4}\/[0-1][0-9]\/[0-3][0-9]\/[0-9a-f]{24}.html$", "i");
    var currentUrl = removeQueryString(url);

    var ampUrl = "";

    ampUrl = serviceDomain+contentServiceUrl+"?url="+currentUrl;

    return ampUrl;
}

var transformContent = function () {
    var currentUrl = window.location.href;

    var ampUrl = getAmpUrl(currentUrl);

    if (ampUrl.length > 0) {
        fetch(ampUrl).then(function (response) {
            return response.text().then(function (data) {
                updatePage(data);
            });
        });
    }
}

transformContent();

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
