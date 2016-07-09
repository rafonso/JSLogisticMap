/**
 * @file Script for configuration of logistic controls and charts.
 */
"use strict";

keys.r = {
	title: "R",
	increment: 'T',
	decrement: 'E'
};

actionsByKey.set(keys.r.decrement, (hasShift) => {
	if (hasShift) {
		changeStep("rValue", false);
	} else {
		$('#rValue').logisticspinner("stepDown");
	}
}).set(keys.r.increment, (hasShift) => {
	if (hasShift) {
		changeStep("rValue", true);
	} else {
		$('#rValue').logisticspinner("stepUp");
	}
});

/**
 * Initialize the controls.
 */
function initControls() {
	initFloatSpinner("rValue", "r", R_MAX);
	initFloatSpinner("x0Value", "x0", X_MAX);
	initIntSpinner("iteractionsValue", "iteractions", 50, 2000, 50);
}

/**
 * Initialize WebWorker.
 */
function initWorker() {
	if (!window.Worker) {
		$("#rValue").logisticspinner("disable");
		$("#x0Value").logisticspinner("disable");
		$("#iteractionsValue").spinner("disable");
		throw "Browser not compatible. Web Worker is not present.";
	}

	return new Worker('js/workers/logisticWorker.js');
}

/**
 * Bind the controls to messages sendint to the worke thread.
 * 
 * @param {Worker} worker
 */
function bindControls(worker) {

	let refreshCharts = (event, ui) => {
		if (_.isNumber(ui.value)) {
			worker.postMessage({
				type: MessageToWorker.PARAMETER,
				property: $(`#${event.target.id}`).data("valueName"),
				value: ui.value
			});
		}
	};

	let params = {
		spin: refreshCharts,
		change: refreshCharts
	};

	$("#rValue, #x0Value").logisticspinner(params);
	$("#iteractionsValue").spinner(params);
}

/**
 * Initialize the charts, binding them to the messages sent by worker thread.
 * 
 * @param {Worker} worker
 */
function initPlotters(worker) {
	let logisticPlotter = new LogisticPlotter(magnitude);
	let iteractionsPlotter = new IteractionsPlotter();

	worker.onmessage = function (e) {
		try {
			if (DEBUG && !e.hasOwnProperty('isTrusted')) console.info(JSON.stringify(e));
			if (!!e.data) {

				var tL = logisticPlotter.redraw(e.data);
				if (DEBUG) console.info(`Logistic: ${tL}`);

				var tI = iteractionsPlotter.redraw(e.data);
				if (DEBUG) console.info(`Iteractions: ${tI}`);
			} else {
				if (DEBUG) console.info(e.data);
			}
		} catch (err) {
			if (DEBUG) console.error(err);
		}
	};

	magnitude.addObserver((evt) => logisticPlotter.magnitude = magnitude);
	callSound = () => iteractionsPlotter.emitSound();
	saveLogistic = () => logisticPlotter.saveChart();
}

$(document).ready(() => {
	initControls();
	let worker = initWorker();
	bindControls(worker);
	initPlotters(worker);

	worker.postMessage({
		type: MessageToWorker.INIT,
		r: $("#rValue").logisticspinner("value"),
		x0: $("#x0Value").logisticspinner("value"),
		iteractions: $("#iteractionsValue").spinner("value")
	});
});
