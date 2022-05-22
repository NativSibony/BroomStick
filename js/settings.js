const $loader = document.querySelector('.js-loader');
const $options = document.querySelectorAll('.js-option');
const $clearAllButton = document.querySelector('.js-clear-all');
const $quickActionSelect = document.querySelector('.js-quick-action');
const $customSettingsBlock = document.querySelector('.js-custom-settings');
const $quickActionModeSelect = document.querySelector('.js-quick-action-mode');

document.addEventListener('DOMContentLoaded', () => {
    i18n();

    bind_events();

    restore_options(() => {
        $quickActionSelect.onchange();
    });

    setTimeout(() => {
        $loader.hidden = true;
    }, 1000);
}, false);

function i18n() {
    [].forEach.call(document.querySelectorAll('[data-i18n]'), (element) => {
        element.innerHTML = chrome.i18n.getMessage(element.getAttribute('data-i18n')) || element.innerHTML;
    });
}

function bind_events() {
    [].forEach.call($options, (element) => {
        element.addEventListener('change', function() {
            save_options(this);
        });
    });

    window.liquidButton.setAction(() => {
        chrome.runtime.sendMessage({ action: 'clearAll', period: 'all', from: 'settings' });
        window.liquidButton.setProgress(100);
    });
    // $clearAllButton.addEventListener('click', () => {
    //   chrome.runtime.sendMessage({action: 'clearAll', period: 'all', from: 'settings'});
    // });

    $quickActionSelect.onchange = () => {
        $customSettingsBlock.hidden = $quickActionSelect.value != 'custom';
    };

    $quickActionModeSelect.onchange = () => {
        chrome.browserAction.setPopup({
            popup: ($quickActionSelect.value == 'popup') ? 'html/popup.html' : ''
        });
    };
}

function save_options(element) {
    $loader.hidden = false;

    let option = {};
    option[element.id] = typeof element.checked !== 'undefined' ? element.checked : element.value;

    chrome.storage.sync.set(option,
        () => {
            setTimeout(() => {
                $loader.hidden = true;
            }, 150);
        });
}

function restore_options(callback) {
    chrome.runtime.sendMessage({ action: 'getDefaultOptions' },
        (defaultOptions) => {

            chrome.storage.sync.get(defaultOptions,
                (options) => {

                    Object.keys(options).forEach((key, index) => {
                        const element = document.getElementById(key);

                        if (element) {
                            switch (element.type) {
                                case 'checkbox':
                                    element.checked = options[key];
                                    element.parentNode.classList.toggle('is-checked', options[key]);
                                    break;

                                case 'text':
                                case 'select-one':
                                    element.value = options[key];
                                    break;

                                default:
                                    console.error('Options element not found:', key, options);
                            }
                        }
                    });

                    if (typeof callback === 'function') {
                        callback();
                    }
                });
        });
}