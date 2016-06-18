"use strict";

class BifurcationPlotter extends Plotter {

	constructor() {
		super('bifurcation', { left: 0.06, top: 0.02, right: 0.98, bottom: 0.96, equalXY: false, maxY: 4.0, yTicks: 0.1 });
		// invert y-Axis: https://forum.jquery.com/topic/jquery-svg-how-to-flip-object
		//		console.log($("#" + this.chartId, this.chart.root()));

		this.adjustParameters = {
			posXLabels: 520,
			fontSize: 11,
			adjustLabels: (index, element) => {
				$(element).text($.number((1 + index) / 10, 1));
			}
		};

		super._adjustChart();
	}

}