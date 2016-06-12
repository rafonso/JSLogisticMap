"use strict";

function centralize() {
	$("#main").position({
		of : "body"
	});
}

let magnitude = toObservable({
	steps: [0.1, 0.01, 0.001, 0.0001, 0.00001],
	r: 0,
	x0: 0
});

function initWidgets() {
	$.widget("ui.logisticspinner", $.ui.spinner, {
		_format : function (value) {
			return (value === "") ? "" : $.number(value, this._precision());
		}
	});
	
	/**
		* Workaround to add functionality to SVGPlot.
	*/
	$.extend($.svg._extensions[0][1].prototype, {
		xToChart : function (x) {
			return s.numberFormat(
				(x - this.xAxis._scale.min) * this._getScales()[0] + this._getDims()[this.X], 
				1);
		},
		yToChart : function (y) {
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
		['E', (hasShift) => {
			if(hasShift) {
				changeStep("rValue", false);
			} else {
				$('#rValue').logisticspinner( "stepDown" );
			}
		}],
		['T', (hasShift) => {
			if(hasShift) {
				changeStep("rValue", true);
			} else {
				$('#rValue').logisticspinner( "stepUp" );
			}
		}],
		['U', (hasShift) => {
			$('#iteractionsValue').spinner( "stepDown" );
		}],
		['O', (hasShift) => {
			$('#iteractionsValue').spinner( "stepUp" );
		}],
		['Z', (hasShift) => {
			if(hasShift) {
				changeStep("x0Value", false);
			} else {
				$('#x0Value').logisticspinner( "stepDown" );
			}
		}],
		['C', (hasShift) => {
			if(hasShift) {
				changeStep("x0Value", true);
				} else {
				$('#x0Value').logisticspinner( "stepUp" );
			}
		}]
	]);
	
	function changeStep(spinnerId, decreaseStep) {
		let id = regexValue.exec(spinnerId)[1];
		let delta = 0;
		if (!decreaseStep && (magnitude[id] > 0)) {
			delta = -1;
		} else if (decreaseStep && (magnitude[id] < (magnitude.steps.length - 1))) {
			delta = +1;
		}
		
		if (!!delta) {
			magnitude[id] += delta;
			$("#" + spinnerId)
			.logisticspinner("option", "step", magnitude.steps[magnitude[id]]);
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
		
		let handleKey = (event) =>  handleStep(event, 
		(e) => (e.keyCode === 37), // Left Arrow
		(e) => (e.keyCode === 39)); // Right Arrow
		
		const spinnerOptions = {
			min : 0.00,
			max : max,
			step : magnitude.steps[0],
			numberFormat : "n",
		};
		
		return $("#" + id)
		.logisticspinner(spinnerOptions)
		.mousedown(handleMouse)
		.keydown(handleKey)
		.bind("contextmenu", () => false)
		.data("valueName", valueName).focus(blur);
	}
	
	function initIteractionsSpinner() {
		$("#iteractionsValue").spinner({
			min : 0,
			max : 2000,
			step : 50,
		}).data("valueName", "iteractions").focus(blur);
	}
	
	
	initFloatSpinner("rValue", "r", 4.0).focus();
	initFloatSpinner("x0Value", "x0", 1.0);
	initIteractionsSpinner();
	
	$(window).keypress(function(event) {
		let key = event.key.toUpperCase();
		if(actionsByKey.has(key)) {
			actionsByKey.get(key)(event.shiftKey);
		}});
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
		spin : refreshCharts,
		change : refreshCharts
	};
	
	$("#rValue").logisticspinner(params);
	$("#x0Value").logisticspinner(params);
	$("#iteractionsValue").spinner(params);
}

var showTime = false;

function redraw(generator, logisticPlotter, iteractionsPlotter) {
	if(showTime) {
		console.time(`${generator.parameters.r}`);
	}
	
	iteractionsPlotter.redraw(generator);
	logisticPlotter.redraw(generator);
	
	if(showTime) {
		console.timeEnd(`${generator.parameters.r}`);
	}
}

function initPlotter(generator) {
	let logisticPlotter = new LogisticPlotter(magnitude);
	let iteractionsPlotter = new IteractionsPlotter();
	
	generator.parameters.addObserver((evt) => {
		redraw(generator, logisticPlotter, iteractionsPlotter);
	});
	
	magnitude.addObserver((evt) => logisticPlotter.magnitude = magnitude);

	
	/*
	generator.values.addObserver((evt) => {
		if(evt.property === "length" && (evt.newVaue === 0)) {
			plotter.clean();
		} 
	});
	*/
	
	
	return {iteractionsPlotter, logisticPlotter};
}

$(document).ready(() => {
	$(window).resize(centralize);
	
	initWidgets();
	initControls();
	let generator = initGenerator();
	bindControls(generator);
	let {iteractionsPlotter, logisticPlotter} = initPlotter(generator);
	
	
	centralize();
	generator.generate();
	redraw(generator, logisticPlotter, iteractionsPlotter);
});
