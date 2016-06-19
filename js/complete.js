/**
 * @file Script for configuration of bifurcation controls and charts.
 */
"use strict";

keys.skip = {
	title: "Skip",
	increment: 'K',
	decrement: 'H'
};

actionsByKey.set(keys.skip.decrement, (hasShift) => {
	$('#skipValue').logisticspinner("stepDown");
}).set(keys.skip.increment, (hasShift) => {
	$('#skipValue').logisticspinner("stepUp");
});

function initControls() {
	initFloatSpinner("x0Value", "x0", 1.0);
	initIntSpinner("iteractionsValue", "iteractions", 50, 2000, 50);
	initIntSpinner("skipValue", "skip", 0, 10, 1);
}

function initGenerator() {
	/*
		let generator = toObservable(new LogisticGenerator(new LogisticParameters(
		$("#skipValue").logisticspinner("value"),
		$("#x0Value").logisticspinner("value"),
		$("#iteractionsValue").spinner("value"))));
	*/

	let generator = toObservable(new LogisticGenerator());
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

	$("#skipValue").logisticspinner(params);
	$("#x0Value").logisticspinner(params);
	$("#iteractionsValue").spinner(params);
}

function initPlotter(generator) {
	let logisticPlotter = new LogisticPlotter(magnitude);
	let iteractionsPlotter = new IteractionsPlotter();
	let bifurcationPlotter = new BifurcationPlotter();


	generator.addListener({ class: logisticPlotter, method: "redraw" });
	generator.addListener({ class: iteractionsPlotter, method: "redraw" });

	magnitude.addObserver((evt) => logisticPlotter.magnitude = magnitude);
	callSound = () => iteractionsPlotter.emitSound();
	saveLogistic = () => logisticPlotter.saveChart();

	return null; //{iteractionsPlotter, logisticPlotter};
}

$(document).ready(() => {
	initWidgets();
	initControls();
	let generator = initGenerator();
	bindControls(generator);
	//	let {iteractionsPlotter, logisticPlotter} = 
	initPlotter(generator);

	generator.generate();
});
