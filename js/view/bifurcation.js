/**
 * @file Script for configuration of bifurcation controls and charts.
 */
"use strict";

keys.skipFirstPercent = {
	title: "Skip",
	increment: 'K',
	decrement: 'H'
};
keys.drawPercent = {
	title: "Draw",
	increment: 'F',
	decrement: 'S'
};


actionsByKey.set(keys.skipFirstPercent.decrement, (hasShift) => {
	$('#skipValue').spinner("stepDown");
}).set(keys.skipFirstPercent.increment, (hasShift) => {
	$('#skipValue').spinner("stepUp");
}).set(keys.drawPercent.decrement, (hasShift) => {
	$('#drawValue').spinner("stepDown");
}).set(keys.drawPercent.increment, (hasShift) => {
	$('#drawValue').spinner("stepUp");
});

function initControls() {
	initFloatSpinner("x0Value", "x0", 1.0);
	initIntSpinner("iteractionsValue", "iteractions", 50, 2000, 50);
	initIntSpinner("drawValue", "drawPercent", 10, 100, 10);
	initIntSpinner("skipValue", "skipFirstPercent", 0, 10, 1);
}

function initGenerator() {
	/*
		let generator = toObservable(new LogisticGenerator(new LogisticParameters(
		$("#skipValue").logisticspinner("value"),
		$("#x0Value").logisticspinner("value"),
		$("#iteractionsValue").spinner("value"))));
	*/

	let generator = toObservable(new BifurcationGenerator(new BifurcationParameters(
		$("#x0Value").logisticspinner("value"),
		$("#iteractionsValue").spinner("value"),
		$("#drawValue").spinner("value"),
		$("#skipValue").spinner("value"),
		($("#bifurcationChart g.background rect").attr("height") | 0)
	)));
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

	$("#x0Value").logisticspinner(params);
	$("#iteractionsValue").spinner(params);
	$("#drawValue").spinner(params);
	$("#skipValue").spinner(params);
}

function initPlotter(generator) {
	let bifurcationPlotter = new BifurcationPlotter(); 
	generator.parameters.numMaxOfYPoints = ($("#bifurcationChart g.background rect").attr("height") | 0);

	generator.parameters.addObserver((evt) => console.log(`Changing parameter ${evt.property} to ${evt.newValue}`, generator.parameters));
	generator.addObserver((evt) => console.log(generator.parameters));
	let series = [];
	generator.addListener((evt) => {
		if(evt.status === STARTING) {
			console.log(evt);
			series = [];
		} else if(evt.status === RUNNING) {
			series.push(evt.serie);
		} else {
			console.log(evt);
			console.log(series);
		}
	});

	/*
	let logisticPlotter = new LogisticPlotter(magnitude);
	let iteractionsPlotter = new IteractionsPlotter();


	generator.addListener({ class: logisticPlotter, method: "redraw" });
	generator.addListener({ class: iteractionsPlotter, method: "redraw" });

	magnitude.addObserver((evt) => logisticPlotter.magnitude = magnitude);
	callSound = () => iteractionsPlotter.emitSound();
	saveLogistic = () => logisticPlotter.saveChart();
*/
	return null; //{iteractionsPlotter, logisticPlotter};
}

$(document).ready(() => {
	initControls();
	let generator = initGenerator();
	bindControls(generator);
	//	let {iteractionsPlotter, logisticPlotter} = 
	initPlotter(generator);

//	generator.generate();
});
