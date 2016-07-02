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
		//		super._adjustChart();

		const a0 = 0.5;
		const aMax = 0.95;
		this.drawFunctions = {
			getX: (series, i) => series[i].x,
			getY: (series, i) => series[i].y,
			alpha: (series, i) => ((1000 * (a0 + (aMax - a0) * (i / series.length))) | 0) / 1000
		};


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

	redraw(generator) {
		let pointConvergence = (serie, x) => this.chart.point(
			this.plot.xToChart(x),
			this.plot.yToChart(serie.r),
			0.5,
			{ stroke: "red" });

		let notConverged = new Map([
			[CONVERGENT, (serie, i) => (serie.values[i] === serie.convergence)],
			[CYCLE_2, (serie, i) => (serie.values[i] === serie.convergence[1])],
			[CHAOS, (serie, i) => false]
		]);

		let drawConvergence = new Map([
			[CONVERGENT, (serie) => {
				pointConvergence(serie, serie.convergence);
			}],
			[CYCLE_2, (serie) => {
				pointConvergence(serie, serie.convergence[0]);
				pointConvergence(serie, serie.convergence[1]);
			}],
			[CHAOS, (serie) => {

			}]
		]);

		//if (DEBUG)
		var t0 = Date.now();

		this._clean();
		// Remove the prior (if exisits) point of convergence.
		$(`#${this.chartId} circle`).remove();
		//		this.prepareDraw(generator);

		//		let serie = this.generateSerie(generator);
		//		this._drawSerie(serie);

		generator.series.forEach((serie, r) => {
			const stageSize = parseInt(serie.values.length / 5);
			let points = new Array(serie.values.length);
			let stop = notConverged.get(serie.convergenceType);
			for (var i = 0; i < serie.values.length && !stop(serie, i); i++) {
				this.chart.point(
					this.plot.xToChart(serie.values[i]),
					this.plot.yToChart(serie.r),
					0.1,
					{ stroke: this._calculateColor(i, stageSize, serie.values) });
			}

			this._drawSerie(points);
			drawConvergence.get(serie.convergenceType)(serie);
			//			console.log(points);
		});

		this.plot.redraw();
		this._adjustChart();

		//if (DEBUG) 
		console.log('\t', this.id, (Date.now() - t0));
	}


}