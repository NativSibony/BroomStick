(function() {
    const defaultOptions = {
        generalPeriod: 1, // 1, 24, 168, 672, all  // 1, 24, 24 * 7, 24 * 7 * 4, all
        generalHistory: true,
        generalCache: true,
        generalCookies: true,
        generalDownloads: true,
        generalStorage: true,
        generalForms: true,
        quickActionSettings: 'general', // general, custom
        quickActionMode: 'popup', // popup, site, all
        customPeriod: 24, // 1, 24, 168, 672, all
        customHistory: true,
        customCache: false,
        customCookies: true,
        customDownloads: false,
        customStorage: true,
        customForms: false,
    }

    chrome.runtime.onInstalled.addListener(function() {
        chrome.contextMenus.create({
            id: 'ohoCleanerMenuItem',
            title: chrome.i18n.getMessage('contextMenu'),
            contexts: ['page'],
            onclick: (info, tab) => {
                clearSite(tab);
            }
        });

        chrome.storage.sync.get(defaultOptions,
            (options) => {
                chrome.storage.sync.set(options);
            });
    });

    chrome.browserAction.onClicked.addListener((tab) => {
        chrome.storage.sync.get('quickActionMode',
            (options) => {
                switch (options.quickActionMode) {
                    case 'site':
                        clearSite(tab);
                        break;

                    case 'all':
                        clearSite();
                        break;

                    default:
                        chrome.browserAction.setPopup({
                            popup: 'html/popup.html'
                        });
                }
            });
    });

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            switch (request.action) {
                case 'getDefaultOptions':
                    sendResponse(defaultOptions);
                    break;

                case 'clearSite':
                    chrome.tabs.query({ active: true }, (tabs) => {
                        clearSite(tabs[0], request.period ? request.period : null);
                    });
                    break;

                case 'clearAll':
                    clearAll(request.period ? request.period : null, request.from ? request.from : null);
                    break;

                default:
                    return;
            }

            return true;
        });

    function clearSite(tab, period) {
        const url = new URL(tab.url);
        const now = new Date().getTime();

        console.log('clearSite', url, tab);

        chrome.storage.sync.get(defaultOptions,
            (options) => {
                const endTime = now;
                const startTime = (period == 'all') ?
                    new Date(0).getTime() :
                    now - parseInt(period ? period : options[options.quickActionSettings + 'Period']) * 60 * 60 * 1000;

                let promises = [];

                if (options[options.quickActionSettings + 'History']) promises.push(clearHistory(startTime, endTime, url.origin));
                if (options[options.quickActionSettings + 'Cookies']) promises.push(clearCookies(startTime, endTime, url.hostname));
                if (options[options.quickActionSettings + 'Downloads']) promises.push(clearDownloads(startTime, endTime, url.origin));

                Promise.all(promises).then(
                    (values) => {
                        console.log('Custom erasing finished. Starting native chrome.browsingData.remove method');

                        chrome.browsingData.remove({
                                "since": startTime
                            }, {
                                "cache": options[options.quickActionSettings + 'Cache'],
                                "localStorage": options[options.quickActionSettings + 'Storage'],
                                "formData": options[options.quickActionSettings + 'Forms'],
                            },
                            () => {
                                let settingsList = [];

                                if (options[options.quickActionSettings + 'History']) settingsList.push('History');
                                if (options[options.quickActionSettings + 'Cache']) settingsList.push('Cache');
                                if (options[options.quickActionSettings + 'Cookies']) settingsList.push('Cookies');
                                if (options[options.quickActionSettings + 'Downloads']) settingsList.push('Downloads');
                                if (options[options.quickActionSettings + 'Storage']) settingsList.push('Storage');
                                if (options[options.quickActionSettings + 'Forms']) settingsList.push('Forms');

                                chrome.notifications.create('startSiteNotification', {
                                    type: 'basic',
                                    iconUrl: 'images/icon_128.png',
                                    title: chrome.i18n.getMessage('finishedSiteNotificationTitle'),
                                    message: chrome.i18n.getMessage('finishedSiteNotificationMessage', [settingsList.join(', '), url.hostname, new Date(startTime).toString(), new Date(endTime).toString()])
                                });
                            })
                    },
                    () => {
                        alert('Cannot be used on this site.');
                    }
                );

            });
    }

    function clearAll(period, sender) {
        const now = new Date().getTime();

        console.log('clearAll');

        chrome.storage.sync.get(defaultOptions,
            (options) => {
                const config = (sender == 'settings') ? 'general' : options.quickActionSettings;
                const since = (period == 'all') ?
                    new Date(0).getTime() :
                    now - parseInt(period ? period : options[config + 'Period']) * 60 * 60 * 1000;

                chrome.browsingData.remove({
                        "since": since
                    }, {
                        "history": options[config + 'History'],
                        "cache": options[config + 'Cache'],
                        "cookies": options[config + 'Cookies'],
                        "downloads": options[config + 'Downloads'],
                        "localStorage": options[config + 'Storage'],
                        "formData": options[config + 'Forms'],
                    },
                    () => {
                        let settingsList = [];

                        if (options[config + 'History']) settingsList.push('History');
                        if (options[config + 'Cache']) settingsList.push('Cache');
                        if (options[config + 'Cookies']) settingsList.push('Cookies');
                        if (options[config + 'Downloads']) settingsList.push('Downloads');
                        if (options[config + 'Storage']) settingsList.push('Storage');
                        if (options[config + 'Forms']) settingsList.push('Forms');

                        chrome.notifications.create('startAllNotification', {
                            type: 'basic',
                            iconUrl: 'images/icon_128.png',
                            title: chrome.i18n.getMessage('finishedAllNotificationTitle'),
                            message: chrome.i18n.getMessage('finishedAllNotificationMessage', [settingsList.join(', '), new Date(since).toString(), new Date(now).toString()])
                        });
                    });
            });
    }

    function clearHistory(startTime, endTime, url, callback) {
        return new Promise((resolve, reject) => {
            if (url) {
                clearHistoryByUrl(startTime, endTime, url, () => {
                    resolve([startTime, endTime]);
                });
            } else {
                chrome.storage.sync.get([
                        'quickActionSettings',
                        'generalPeriod',
                        'customPeriod'
                    ],
                    (options) => {
                        chrome.history.deleteRange({ startTime: startTime, endTime: endTime },
                            () => {
                                resolve([startTime, endTime]);
                            });
                    });
            }
        });
    }

    function clearHistoryByUrl(startTime, endTime, url, callback) {
        chrome.history.search({ text: '"' + url + '"' },
            (results) => {
                if (results.length) {
                    results.forEach((visit) => {
                        if (visit.lastVisitTime >= startTime) {
                            chrome.history.deleteRange({ startTime: visit.lastVisitTime, endTime: visit.lastVisitTime + 0.5 }, () => {});
                        }
                    });

                    clearHistoryByUrl(startTime, endTime, url);
                } else if (typeof callback === 'function') {
                    callback(startTime, endTime);
                } else {
                    return;
                }
            });
    }

    function clearDownloads(startTime, endTime, url, callback) {
        url = (typeof url == 'string') ? [url] : url;

        return new Promise((resolve, reject) => {
            if (url) {
                chrome.downloads.erase({ query: url, startedAfter: (isNaN(startTime) ? 0 : startTime).toString(), endedAfter: (isNaN(startTime) ? 0 : startTime).toString() },
                    (erasedIds) => {
                        resolve([startTime, endTime, erasedIds, url]);
                    });
            } else {
                chrome.downloads.erase({ startedAfter: startTime, endedBefore: endTime },
                    (erasedIds) => {
                        resolve([startTime, endTime, erasedIds]);
                    });
            }
        });
    }

    function clearCookies(startTime, endTime, url, callback) {
        url = (!url) ? '' : url;

        return new Promise((resolve, reject) => {
            chrome.cookies.getAll({ domain: url },
                (cookies) => {
                    if (cookies.length) {
                        cookies.forEach((cookie) => {
                            const protocol = cookie.secure ? "https://" : "http://";
                            chrome.cookies.remove({ url: protocol + cookie.domain, name: cookie.name },
                                (results) => {
                                    resolve([startTime, endTime]);
                                });
                        });
                    } else {
                        resolve([startTime, endTime]);
                    }
                });

        });
    }

})();