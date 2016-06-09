"use strict";

function init() {
	
    function centralize() {
        $("#main").position({
            of : "body"
		});
	}
	
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
				return (x - this.xAxis._scale.min) * this._getScales()[0] + this._getDims()[this.X];
			},
			yToChart : function (y) {
				return this._getDims()[this.H] - ((y - this.yAxis._scale.min) * this._getScales()[1]) + this._getDims()[this.Y];
			}
		});
	}
	
	function initControls() {
		
	
		
		const steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];
		
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
		
		function changeStep(id, decreaseStep) {
			let stepPos = $("#" + id).logisticspinner("option", "stepPos");
			let delta = 0;
			if (!decreaseStep && (stepPos > 0)) {
				delta = -1;
				} else if (decreaseStep && (stepPos < (steps.length - 1))) {
				delta = +1;
			}
			
			if (!!delta) {
				stepPos += delta;
				$("#" + id)
				.logisticspinner("option", "step", steps[stepPos])
				.logisticspinner("option", "stepPos", stepPos);
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
				stepPos : 1,
				step : steps[0],
				numberFormat : "n",
			};
			
			return $("#" + id)
			.logisticspinner(spinnerOptions)
			.mousedown(handleMouse)
			.keydown(handleKey)
			.bind("contextmenu", () => false)
			.data("valueName", valueName);
		}
		
		function initIteractionsSpinner() {
			$("#iteractionsValue").spinner({
				min : 0,
				max : 2000,
				step : 50,
			}).data("valueName", "iteractions");
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
			change : refreshCharts,
		};

		$("#rValue").logisticspinner(params);
		$("#x0Value").logisticspinner(params);
		$("#iteractionsValue").spinner(params);
	}

	function initPlotter(generator) {
		let plotter = new Plotter();

		generator.parameters.addObserver((evt) => plotter.redraw(generator, evt.newValue));
		
		generator.values.addObserver((evt) => {
			if(evt.property === "length" && (evt.newVaue === 0)) {
				plotter.clean();
			} 
			// else {
				// plotter.redraw(generator, evt.newValue);
			// }
		});
		
		
		return plotter;
	}
	
	
	$(window).resize(centralize);
	
	initWidgets();
	initControls();
	let generator = initGenerator();
	bindControls(generator);
	let plotter = initPlotter(generator);
	
	centralize();
	generator.generate();
	plotter.redraw(generator);
}

$(document).ready(init);
