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

function initControls() {
	initFloatSpinner("rValue", "r", 4.0);
	initFloatSpinner("x0Value", "x0", 1.0);
	initIntSpinner("iteractionsValue", "iteractions", 50, 2000, 50);
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
