/**
 * util.js
 * Copyright (c) 2018- Aaron Angert
 * Copyright (c) 2014-2018 Andrew Toth
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Utility methods
 */

(function (window) {

    var util = function () {},
        // Promisified ajax request
        request = function (url, type, data) {
            return new Promise(function (resolve, reject) {
                var req = new XMLHttpRequest();
                //req.setRequestHeader('Cache-Control', 'no-cache');
                req.open((type ? type : 'GET'), url, true);
                req.onload = function () {
                    if (req.status == 200) {
                        resolve(req.response);
                    } else {
                        reject(Error(req.statusText));
                    }
                }
                req.onerror = function () {
                    reject(Error('Network error'));
                }
                if (type === 'POST') {
                    req.setRequestHeader('Content-type', 'application/json');
                }
                req.send(data);
            });
        };

    util.prototype = {
        getJSON: function (url) {
            if (typeof chrome !== 'undefined') {
                return request(url).then(JSON.parse);
            } else {
                return ret.message('getJSON', url);
            }
        },

        get: function (url) {
            return request(url);
        },

        post: function (url, data) {
            if (typeof chrome !== 'undefined') {
                return request(url, 'POST', data);
            } else {
                return ret.message('post', {url:url, content:data});
            }
        },

        // Used to send messages from content scripts to add-on scripts and return values to content scripts in Firefox add-on
        message: function (name, value) {
            return new Promise(function (resolve) {
                // 'self' can also be 'addon' depending on how script is injected
                var ref = (typeof addon === 'undefined' ? self : addon);
                ref.port.on(name, resolve);
                ref.port.emit(name, value);
            });
        }
    };

    var ret = new util();

    // Different workarounds to inject content into iFrames for Chrome and Firefox
    util.prototype.iframe = function (src) {
        return new Promise(function (resolve) {
            var iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            iframe.setAttribute('style', 'background-color: transparent; position: absolute; z-index: 2147483647; border: 0px;');
            iframe.setAttribute('allowtransparency', 'true');
            iframe.frameBorder = '0';


            if (navigator.userAgent.indexOf("Chrome") != -1) {
                // For Chrome get the HTML content with an ajax call and write it into the document
                iframe.src = 'about:blank';
                var request = new XMLHttpRequest();
                request.open('GET', chrome.extension.getURL('data/' + src), false);
                request.send(null);
                var text = request.response;
                // Replace css relative locations with absolute locations since Chrome won't find relative
                text = text.replace(/css\//g, chrome.extension.getURL('') + 'data/css/');
                iframe.contentWindow.document.open('text/html', 'replace');
                iframe.contentWindow.document.write(text);
                iframe.contentWindow.document.close();


                resolve(iframe);
            } else {

                var fullURL = browser.extension.getURL("data/"+src);
                iframe.src = fullURL;
                var request = new XMLHttpRequest();
                request.open('GET', chrome.extension.getURL('data/' + src), false);
                request.send(null);
                var text = request.response;
                text = text.replace(/css\//g, chrome.extension.getURL('') + 'data/css/');
                resolve(iframe);
                // // For Firefox get the encoded HTML and set it to the iFrame's src
                // iframe.src = 'moz-extension://ff3b317a-b2d5-4e7b-acee-c90f0ad9b174/data/paypopup.html';
                // ret.message('html', src).then(function (url) {
                //     iframe.src = url;
                //     // Only way to reliably know when the frame is ready in Firefox is by polling
                //     function pollReady() {
                //         if (!iframe.contentWindow.document.getElementById('progress')) {
                //             setTimeout(pollReady, 100);
                //         } else {
                //             resolve(iframe);
                //         }
                //     }
                //     pollReady();
                // });
            }
        });
    }

    window.util = ret;

})(window);
