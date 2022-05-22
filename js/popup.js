$(document).ready(function() {
  [].forEach.call(document.querySelectorAll('[data-i18n]'), function(element) {
    element.innerHTML = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
  });

  chrome.storage.sync.get([
      'quickActionSettings',
      'generalPeriod',
      'customPeriod'
    ],
    (options) => {
      $('#period').val(options[options.quickActionSettings + 'Period']);
    });

  $('#settings').click(onSettings);

  $('#period').change(() => {
    chrome.storage.sync.get('quickActionSettings',
      (options) => {
        if (options.quickActionSettings != 'general') {
          options[options.quickActionSettings + 'Period'] = $('#period').val();

          chrome.storage.sync.set(options);
        }
      });
  });
});

var buttonTop = document.querySelector('.button-round_half-top'),
    buttonBottom = document.querySelector('.button-round_half-bottom');

buttonTop.addEventListener('click', onClearSite);
buttonBottom.addEventListener('click', onClearAll);

function onClearSite() {
  chrome.runtime.sendMessage({action: 'clearSite', from: 'popup', period: $('#period').val()});
  window.close();
}

function onClearAll() {
  chrome.runtime.sendMessage({action: 'clearAll', from: 'popup', period: $('#period').val()});
  window.close();
}

function onSettings() {
	console.log('On settings');

	chrome.runtime.openOptionsPage();
}
