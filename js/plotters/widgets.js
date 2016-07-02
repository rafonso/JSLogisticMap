/**
 * @file Add extensions to JQuery UI Spinner and SVG.
 */

/**
 * Creates a LogistiSpinner extending the JQuery UI Spinner, Adding handling float values.
 */
$.widget("ui.logisticspinner", $.ui.spinner, {
	_format: function (value) {
		return (value === "") ? "" : $.number(value, this._precision());
	}
});

/**
 * Adds point plotting
 */
$.extend($.svg._wrapperClass.prototype, {
	/** @function Draw a point. Actually a circle with raidius 1.
		@param cx {number} The x-coordinate for the centre of the circle.
		@param cy {number} The y-coordinate for the centre of the circle.
		@param [settings] {object} Additional settings for this node.
		@param [parent] {SVGElement|jQuery} The parent node for the new node, or SVG root if not specified.
		@return {SVGElement} The new circle node. 
	*/
	point: function (cx, cy, r, settings, parent) {
		return this.circle(parent, cx, cy, r, settings);
	},
});

/**
	* Workaround to add functionality to SVGPlot.
*/
$.extend($.svg._extensions[0][1].prototype, {
	/**
	 * @function Converts a x chart position to a equivalent x cartesian position.
	 * 
	 * @param x {Number} x chart position
	 * @returns {Number} the equivalent x cartesian position.
	 */
	xToChart: function (x) {
		return (x - this.xAxis._scale.min) * this._getScales()[0] + this._getDims()[this.X];
	},
	/**
	 * @function Converts a y chart position to a equivalent y cartesian position.
	 * 
	 * @param y {Number} y chart position
	 * @returns {Number} the equivalent y cartesian position.
	 */
	yToChart: function (y) {
		return this._getDims()[this.H] - ((y - this.yAxis._scale.min) * this._getScales()[1]) + this._getDims()[this.Y];
	},
	/**
	 * @function Converts a x cartesian position to a equivalent x chart position.
	 * 
	 * @param x {Number} x cartesian position
	 * @returns {Number} the equivalent x chart position.
	 */
	chartToX: function (xChart) {
		return (xChart - this._getDims()[this.X]) / this._getScales()[0] + this.xAxis._scale.min;
	},
	/**
	 * @function Converts a y cartesian position to a equivalent y chart position.
	 * 
	 * @param y {Number} y cartesian position
	 * @returns {Number} the equivalent y chart position.
	 */
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
