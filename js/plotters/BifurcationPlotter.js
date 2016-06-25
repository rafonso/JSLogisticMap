"use strict";

class BifurcationPlotter extends Plotter {

	constructor() {
		super('bifurcation', { left: 0.06, top: 0.02, right: 0.98, bottom: 0.96, equalXY: false, maxY: 4.0, yTicks: 0.2 });
		// invert y-Axis: https://forum.jquery.com/topic/jquery-svg-how-to-flip-object
		this.plot.xAxis.scale(0.0, 1).ticks(0.1, 0, 0).title("").end()

		this.adjustParameters = {
			posXLabels: 520,
			fontSize: 11,
			adjustLabels: (index, element) => {
				let el = $(element);
				if (el.parent().attr("class") === "xAxisLabels") {
					el.text($.number((1 + index) / 10, 1));
				} else {
					el.text($.number(el.text(), 1));
				}
			}
		};
		super._adjustChart();

		var _chart = this.chart;
		var _plot = this.plot;
		this.plot.bind("click", function(event) {
			var x = _plot.chartToX(event.offsetX);
			var y = _plot.chartToY(event.offsetY);
			console.log(event.offsetX, event.offsetY);
			console.log(x, y);

			_chart.point(_plot.xToChart(x), _plot.yToChart(y));
		});

	}

}