/**
 * @file Script for configuration of logistic controls and charts.
 */
"use strict";

let worker = {};

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

function initControls() {
	initFloatSpinner("rValue", "r", 4.0);
	initFloatSpinner("x0Value", "x0", 1.0);
	initIntSpinner("iteractionsValue", "iteractions", 50, 2000, 50);
}

function bindControls() {

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

	$("#rValue").logisticspinner(params);
	$("#x0Value").logisticspinner(params);
	$("#iteractionsValue").spinner(params);
}

function initPlotters(worker) {
	let logisticPlotter = new LogisticPlotter(magnitude);
	let iteractionsPlotter = new IteractionsPlotter();

	worker.onmessage = function (e) {
		try {
			if (DEBUG && !e.hasOwnProperty('isTrusted')) console.info(JSON.stringify(e));
			if (!!e.data) {
				console.log(e.data);
				logisticPlotter.redraw(e.data);
				iteractionsPlotter.redraw(e.data);
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

function handleWorkerMessage(e) {
	try {
		if (DEBUG && !e.hasOwnProperty('isTrusted')) console.info(JSON.stringify(e));
		if (!!e.data.type) {
			actionByMessageFromSolver(e.data);
		} else {
			if (DEBUG) console.info(e.data);
		}
	} catch (err) {
		if (DEBUG) console.error(err);
	}
}

/**
 * Initialize WebWorker.
 */
function initWorker() {
	if (!!window.Worker) {
		worker = new Worker('js/workers/logisticWorker.js');
		//		worker.onmessage = handleWorkerMessage;
		return worker;
	} else {
		$("#rValue").logisticspinner("disable");
		$("#x0Value").logisticspinner("disable");
		$("#iteractionsValue").spinner("disable");
		throw "Browser not compatible. Web Worker is not present.";
	}
}

$(document).ready(() => {
	initControls();
	bindControls();
	let worker = initWorker();
	initPlotters(worker);
	worker.postMessage({
		type: MessageToWorker.INIT,
		r: $("#rValue").logisticspinner("value"),
		x0: $("#x0Value").logisticspinner("value"),
		iteractions: $("#iteractionsValue").spinner("value")
	});
	/*
	let generator = initGenerator();
	
	generator.generate();
	*/
});
