"use strict";

class BifurcationPlotter extends Plotter {

	constructor() {
		super('bifurcation', { left: 0.06, top: 0.03, right: 0.98, bottom: 0.96, equalXY: false, maxY: 4.0, yTicks: 0.2 });
		// invert y-Axis: https://forum.jquery.com/topic/jquery-svg-how-to-flip-object
		this.plot.xAxis.scale(0.0, 1).ticks(0.1, 0, 0).title("").end()

		this.adjustParameters = {
			posXLabels: 505,
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

		this.height = $(`#${this.chartId} g.background`).attr("height");

		var _chart = this.chart;
		var _plot = this.plot;

		this.plot.bind("mousemove", function (event) {
			var x = _plot.chartToX(event.offsetX);
			var y = _plot.chartToY(event.offsetY);
			$("#bifurcationLegend").remove();
			if ((x >= 0.0 && x <= 1.0) && (y >= 0.0 && y <= 4.0)) {
				let g = _chart.group("bifurcationLegend");
				_chart.text(g, 25, 10, `(${s.numberFormat(x, 3)}, ${s.numberFormat(y, 3)})`);
			}
		});
	}

}