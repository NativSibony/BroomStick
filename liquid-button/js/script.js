document.addEventListener('DOMContentLoaded', function() {
	var defaultPalette = {
			front: '#5eb8ff',
			header: '#005b9f',
			back: '#0288d1',
			button_bg: '#014f8a'
		},
		progressPalette = {
			front: '#00796b',
			header: '#004c40',
			back: '#48a999',
			button_bg: '#06564a'
		},
		completePalette = {
			front: '#8bc34a',
			header: '#5a9216',
			back: '#bef67a',
			button_bg: '#4d7d12'
		};

	var button = document.getElementById('water-button'),
		cnt = document.getElementById('count'),
		text = document.getElementById('text'),
		water = document.getElementById('water'),
		header = document.getElementById('header'),
		actionExecuted = null,
		progressAction = null,
		counter = null,
		animation = null;

	function clickHandler() {
		var state = button.classList;

		if (state.contains('default') || state.contains('complete')) {
			setMode('progress');
			setProgress(0, true);
			cnt.innerHTML = 0;
		}
	}

	function setProgress(progress, noIndicator) {
		var state = button.classList,
			previousProgress = +cnt.innerHTML,
			percent = previousProgress,
			iterator = (previousProgress < progress) ? 1 : -1;

		if (progress === previousProgress) {
			if (progress === 100) {
				setMode('complete');
			}

			return;
		}

		if (!state.contains('progress')) {
			return;
		}

		if (!noIndicator) {
			if (counter) {
				clearInterval(counter);
			}

			counter = setInterval(function() {
				percent += iterator;
				cnt.innerHTML = percent;
				if (percent === progress) {
					clearInterval(counter);
				}
			}, 1000 / Math.abs(previousProgress - progress));
		} else {
			document.getElementById('indicator').style.display = 'none';
			setTimeout(function() {
				document.getElementById('indicator').style.display = '';
			}, 1000);
		}

		state.add('animated');

		if (animation) {
			animation.finish();
		}

		animation = water.animate(
			[{
				transform: 'translate(0, ' + (100 - previousProgress) + '%)'
			},
			{
				transform: 'translate(0, ' + (100 - progress) + '%)'
			}], {
				duration: 1000
			});

		water.style.transform = 'translate(0, ' + (100 - progress) + '%)';

		setTimeout(function() {
			if (progress === 100 && +cnt.innerHTML === 100) {
				setMode('complete');
			} else {
				if (typeof progressAction === 'function' && !actionExecuted) {
					actionExecuted = true;
					progressAction();
				}
			}

			state.remove('animated');
		}, 1000);
	}

	function setMode(mode) {
		if (mode !== 'default' && mode !== 'progress' && mode !== 'complete') {
			return;
		}

		if (mode === 'default') {
			setText(chrome.i18n.getMessage('popClearAll') || 'Clean All', 15);
			cnt.innerHTML = 70;
		}

		if (mode === 'complete') {
			setText(chrome.i18n.getMessage('completeMessage') || 'Complete', 20);
			actionExecuted = false;
		}

		button.classList.remove('default');
		button.classList.remove('progress');
		button.classList.remove('complete');
		button.classList.add(mode);

		header.classList.remove('default');
		header.classList.remove('progress');
		header.classList.remove('complete');
		header.classList.add(mode);
	}

	function setText(newText, fontSize) {
		text.innerHTML = newText;

		if (fontSize) {
			text.style.fontSize = fontSize + 'px';
		}
	}

	function setAction(action) {
		progressAction = action;
	}

	function setPalette() {
		addStylesheetRules([
			['.box .water',
				['background', defaultPalette.front]
			],
			['header.default',
				['background', defaultPalette.header]
			],
			['.default .box',
				['background', defaultPalette.button_bg]
			],
			['.box .water_wave_front',
				['fill', defaultPalette.front]
			],
			['.box .water_wave_back',
				['fill', defaultPalette.back]
			],

			['.progress .box .water',
				['background', progressPalette.front]
			],
			['header.progress',
				['background', progressPalette.header]
			],
			['.progress .box',
				['background', progressPalette.button_bg]
			],
			['.progress .box .water_wave_front',
				['fill', progressPalette.front]
			],
			['.progress .box .water_wave_back',
				['fill', progressPalette.back]
			],

			['.complete .box .water',
				['background', completePalette.front]
			],
			['header.complete',
				['background', completePalette.header]
			],
			['.complete .box',
				['background', completePalette.button_bg]
			],
			['.complete .water_wave_front',
				['fill', completePalette.front]
			],
			['.complete .water_wave_back',
				['fill', completePalette.back]
			]
		]);
	}

	function addStylesheetRules(rules) {
		var styleEl = document.createElement('style'),
			styleSheet = null;

		document.head.appendChild(styleEl);

		styleSheet = styleEl.sheet;

		for (var i = 0, rl = rules.length; i < rl; i++) {
			var j = 1,
				rule = rules[i],
				selector = rules[i][0],
				propStr = '';

			if (Object.prototype.toString.call(rule[1][0]) === '[object Array]') {
				rule = rule[1];
				j = 0;
			}

			for (var pl = rule.length; j < pl; j++) {
				var prop = rule[j];

				propStr += prop[0] + ':' + prop[1] + (prop[2] ? ' !important' : '') + ';\n';
			}

			// Insert CSS Rule
			styleSheet.insertRule(selector + '{' + propStr + '}', styleSheet.cssRules.length);
		}
	}

	// Action starts here
	setPalette();
	setMode('default');

	setAction(function() {
		//chrome.runtime.sendMessage({action: 'clearAll', period: 'all', from: 'settings'});
	});

	window.liquidButton = {
		setProgress: setProgress,
		setAction: setAction
	};

	button.addEventListener('click', clickHandler);
});
