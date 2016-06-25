/**
 * @file Commons script for configuration of controls and charts.
 */
"use strict";

/**
 * activates debubbing.
 * 
 * @const
 * @type {boolean}
 * @default
 */
const DEBUG = false;

let magnitude = toObservable({
	steps: [0.1, 0.01, 0.001, 0.0001, 0.00001],
	r: 0,
	x0: 0
});

/**
 * 
 * @type {Map}
 */
let keys = {
	x0: {
		title: "x0",
		increment: 'C',
		decrement: 'Z'
	},
	iteractions: {
		title: "Iteractions",
		increment: 'O',
		decrement: 'U'
	}
};

/**
 * @const 
 */
const actionsByKey = new Map([
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


var callSound = () => (console.log("callSound"));
var saveLogistic = () => (console.log("saveLogistic"));

/**
 * @function Initialize the JQuery UI Widgets.
 */
function initWidgets() {
	$.widget("ui.logisticspinner", $.ui.spinner, {
		_format: function (value) {
			return (value === "") ? "" : $.number(value, this._precision());
		}
	});


	$.extend($.svg._wrapperClass.prototype, {
	/** Draw a point. Actually a circle with raidius 1.
		@param cx {number} The x-coordinate for the centre of the circle.
		@param cy {number} The y-coordinate for the centre of the circle.
		@param [settings] {object} Additional settings for this node.
		@param [parent] {SVGElement|jQuery} The parent node for the new node, or SVG root if not specified.
		@return {SVGElement} The new circle node. */
		point: function( cx, cy, settings, parent) {
			return this.circle(parent, cx, cy, 1, settings);
		},
/*
		circle: function( cx, cy, r, settings) {
		var args = this._args(arguments, ['parent', 'cx', 'cy', 'r']);
		return this._makeNode(args.parent, 'circle', $.extend(
			{cx: args.cx, cy: args.cy, r: args.r}, args.settings || {}));
	},
	*/
	});

	/**
		* Workaround to add functionality to SVGPlot.
	*/
	$.extend($.svg._extensions[0][1].prototype, {
		xToChart: function (x) {
			return (x - this.xAxis._scale.min) * this._getScales()[0] + this._getDims()[this.X];
		},
		yToChart: function (y) {
			return this._getDims()[this.H] - ((y - this.yAxis._scale.min) * this._getScales()[1]) + this._getDims()[this.Y];
		},
		chartToX: function (xChart) {
			return (xChart - this._getDims()[this.X]) / this._getScales()[0] + this.xAxis._scale.min;
		},
		chartToY: function (yChart) {
			return (this._getDims()[this.H] + this._getDims()[this.Y] - yChart) / this._getScales()[1] + this.yAxis._scale.min;
		},
		/**
		 * Bind a event to the plot.
		 * 
		 * @param {string} eventType - A string containing one or more DOM event types, such as "click" or "submit," or custom event names.
		 * @param {any} eventData - object containing data that will be passed to the event handler.
		 * @param {eventHandler} handler - A function to execute each time the event is triggered.
		 * @see {@link http://api.jquery.com/bind/|Jquery´s bind()}
		 */
		bind: function (eventType, eventData, handler) {
			$(this._wrapper._container).bind(eventType, eventData, handler);
			return this;
		}
		/**
		 * @callback eventHandler 
		 * @param {Event} A Jquery Event Object
		 * @see {@link http://api.jquery.com/Types/#Event}
		 */
	});
}

const regexValue = /^(.*)Value$/;

function blur() {
	$(this).blur();
}

function getTitle(id, currentMagnitude) {
	let key = keys[id];

	let title = `Changes ${key.title} value. Press ${key.increment} to increase its value. Press ${key.decrement} to decrease its value.`;
	if (currentMagnitude > 0) {
		title += ` Type SHIFT + ${key.decrement} to increase its step to ${magnitude.steps[currentMagnitude - 1]}.`
	}
	if (currentMagnitude < (magnitude.steps.length - 1)) {
		title += ` Type SHIFT + ${key.increment} to decrement its step to ${magnitude.steps[currentMagnitude + 1]}.`
	}

	return title;
}

function changeTitle(id, currentMagnitude) {
	let key = keys[id];

	let title = `Changes ${key.title} value. Press ${key.increment} to increase its value. Press ${key.decrement} to decrease its value.`;
	if (currentMagnitude > 0) {
		title += ` Type SHIFT + ${key.decrement} to increase its step to ${magnitude.steps[currentMagnitude - 1]}.`
	}
	if (currentMagnitude < (magnitude.steps.length - 1)) {
		title += ` Type SHIFT + ${key.increment} to decrement its step to ${magnitude.steps[currentMagnitude + 1]}.`
	}

	$(`#${id}Value`).attr("title", getTitle(id, currentMagnitude));
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

/**
 * Creates and initialize a Spinner to handle FLoat values.
 * 
 * @param {string} id - Component id
 * @param {string} valueName - value to be associated to Spinner.
 * @param {number} max - The maximum allowed value
 * @returns {Spinner} The created Spinner to handle FLoat values.
 */
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
		.focus(blur)
		.attr("title", getTitle(valueName, 0));
}

/**
 * Creates and initialize a Spinner to handle Integer values.
 * 
 * @param {string} id - Component id
 * @param {string} valueName - value to be associated to Spinner.
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @param {number} step - The size of the step to take when spinning
 * @returns {Spinner} The created Spinner to handle integer values.
 */
function initIntSpinner(id, valueName, min, max, step) {
	return $(`#${id}`).spinner({
		min,
		max,
		step,
	})
		.data("valueName", valueName)
		.focus(blur)
		.attr("title", getTitle(valueName, NaN));
}

$(window).keypress(function (event) {
	// Hack to work in older versions of Chrome
	let key = String.fromCharCode(event.charCode).toUpperCase();
	if (actionsByKey.has(key)) {
		actionsByKey.get(key)(event.shiftKey);
	}
});



