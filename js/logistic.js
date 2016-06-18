"use strict";

const DEBUG = true;

let magnitude = toObservable({
	steps: [0.1, 0.01, 0.001, 0.0001, 0.00001],
	r: 0,
	x0: 0
});

let keys = {
	r: {
		title: "R",
		increment: 'T',
		decrement: 'E'
	},
	x0: {
		title: "x0",
		increment: 'C',
		decrement: 'Z'
	},
	iteractions: {
		title: "Iteractions",
		increment: 'O',
		decrement: 'U'
	},
}

var callSound = () => (console.log("callSound"));
var saveLogistic = () => (console.log("saveLogistic"));

function initWidgets() {
	$.widget("ui.logisticspinner", $.ui.spinner, {
		_format: function (value) {
			return (value === "") ? "" : $.number(value, this._precision());
		}
	});

	/**
		* Workaround to add functionality to SVGPlot.
	*/
	$.extend($.svg._extensions[0][1].prototype, {
		xToChart: function (x) {
			return s.numberFormat(
				(x - this.xAxis._scale.min) * this._getScales()[0] + this._getDims()[this.X],
				1);
		},
		yToChart: function (y) {
			return s.numberFormat(
				this._getDims()[this.H] - ((y - this.yAxis._scale.min) * this._getScales()[1]) + this._getDims()[this.Y],
				1);
		}
	});
}

function initControls() {

	var regexValue = /^(.*)Value$/;

	function blur() {
		$(this).blur();
	}

	const actionsByKey = new Map([
		[keys.r.decrement, (hasShift) => {
			if (hasShift) {
				changeStep("rValue", false);
			} else {
				$('#rValue').logisticspinner("stepDown");
			}
		}],
		[keys.r.increment, (hasShift) => {
			if (hasShift) {
				changeStep("rValue", true);
			} else {
				$('#rValue').logisticspinner("stepUp");
			}
		}],
		[keys.iteractions.decrement, (hasShift) => {
			$('#iteractionsValue').spinner("stepDown");
		}],
		[keys.iteractions.increment, (hasShift) => {
			$('#iteractionsValue').spinner("stepUp");
		}],
		[keys.x0.decrement, (hasShift) => {
			if (hasShift) {
				changeStep("x0Value", false);
			} else {
				$('#x0Value').logisticspinner("stepDown");
			}
		}],
		[keys.x0.increment, (hasShift) => {
			if (hasShift) {
				changeStep("x0Value", true);
			} else {
				$('#x0Value').logisticspinner("stepUp");
			}
		}],
		['S', (hasShift) => {
			if (hasShift) {
				callSound();
			}
		}],
		['L', (hasShift) => {
			if (hasShift) {
				saveLogistic();
			}
		}],
	]);

	function changeTitle(id, currentMagnitude) {
		let key = keys[id];
		let title = `Changes ${key.title} value. Press ${key.increment} to increase its value. Press ${key.decrement} to decrease its value.`;
		if (currentMagnitude > 0) {
			title += ` Type SHIFT + ${key.decrement} to increase its step to ${magnitude.steps[currentMagnitude - 1]}.`
		}
		if (currentMagnitude < (magnitude.steps.length - 1)) {
			title += ` Type SHIFT + ${key.increment} to decrement its step to ${magnitude.steps[currentMagnitude + 1]}.`
		}

		$(`#${id}Value`).attr("title", title);
	}

	function changeStep(spinnerId, decreaseStep) {

		let id = regexValue.exec(spinnerId)[1];
		let delta = 0;
		let currentMagnitude = magnitude[id];

		if (!decreaseStep && (currentMagnitude > 0)) {
			delta = -1;
		} else if (decreaseStep && (currentMagnitude < (magnitude.steps.length - 1))) {
			delta = +1;
		}

		if (!!delta) {
			currentMagnitude = magnitude[id] += delta;
			$("#" + spinnerId)
				.logisticspinner("option", "step", magnitude.steps[currentMagnitude]);
			changeTitle(id, currentMagnitude);
		}
	}

	function initFloatSpinner(id, valueName, max) {

		function handleStep(event, incrementEvent, decrementEvent) {
			if (!event.ctrlKey) {
				return;
			}

			if (incrementEvent(event)) {
				changeStep(event.target.id, false);
			} else if (decrementEvent(event)) {
				changeStep(event.target.id, true);
			}
		}

		let handleMouse = (event) => handleStep(event,
			(e) => (e.which === 1), // Left Button
			(e) => (e.which === 3)); // Right Button

		let handleKey = (event) => handleStep(event,
			(e) => (e.keyCode === 37), // Left Arrow
			(e) => (e.keyCode === 39)); // Right Arrow

		const spinnerOptions = {
			min: 0.00,
			max: max,
			step: magnitude.steps[0],
			numberFormat: "n",
		};

		return $("#" + id)
			.logisticspinner(spinnerOptions)
			.mousedown(handleMouse)
			.keydown(handleKey)
			.bind("contextmenu", () => false)
			.data("valueName", valueName)
			.focus(blur);
	}

	function initIteractionsSpinner() {
		$("#iteractionsValue").spinner({
			min: 50,
			max: 2000,
			step: 50,
		}).data("valueName", "iteractions").focus(blur);
	}

	initFloatSpinner("rValue", "r", 4.0).focus();
	initFloatSpinner("x0Value", "x0", 1.0);
	initIteractionsSpinner();

	changeTitle("r", 0);
	changeTitle("x0", 0);
	changeTitle("iteractions", NaN);

	$(window).keypress(function (event) {
		// Hack to work in older versions of Chrome
		let key = String.fromCharCode(event.charCode).toUpperCase();
		if (actionsByKey.has(key)) {
			actionsByKey.get(key)(event.shiftKey);
		}
	});
}

function initGenerator() {
	let generator = toObservable(new LogisticGenerator(new LogisticParameters(
		$("#rValue").logisticspinner("value"),
		$("#x0Value").logisticspinner("value"),
		$("#iteractionsValue").spinner("value"))));

	return generator;
}

function bindControls(generator) {

	let refreshCharts = (event, ui) => {
		if (_.isNumber(ui.value)) {
			generator.parameters[$(`#${event.target.id}`).data("valueName")] = ui.value;
		}
	}

	let params = {
		spin: refreshCharts,
		change: refreshCharts
	};

	$("#rValue").logisticspinner(params);
	$("#x0Value").logisticspinner(params);
	$("#iteractionsValue").spinner(params);
}

function initPlotter(generator) {
	let logisticPlotter = new LogisticPlotter(magnitude);
	let iteractionsPlotter = new IteractionsPlotter();


	generator.addListener({ class: logisticPlotter, method: "redraw" });
	generator.addListener({ class: iteractionsPlotter, method: "redraw" });

	magnitude.addObserver((evt) => logisticPlotter.magnitude = magnitude);
	callSound = () => iteractionsPlotter.emitSound();
	saveLogistic = () => logisticPlotter.saveChart();

	return { iteractionsPlotter, logisticPlotter };
}

$(document).ready(() => {
	initWidgets();
	initControls();
	let generator = initGenerator();
	bindControls(generator);
	let {iteractionsPlotter, logisticPlotter} = initPlotter(generator);

	generator.generate();
});
