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

		const a0 = 0.5;
		const aMax = 0.95;
		this.drawFunctions = {
			getX: (series, i) => series[i].x,
			getY: (series, i) => series[i].y,
			alpha: (series, i) => ((1000 * (a0 + (aMax - a0) * (i / series.length))) | 0) / 1000
		};

		let self = this;
		this.notConverged = new Map([
			[CONVERGENT, (serie, i) => (serie.values[i] === serie.convergence)],
			[CYCLE_2, (serie, i) => (serie.values[i] === serie.convergence[1])],
			[CHAOS, (serie, i) => false]
		]);

		this.drawConvergence = new Map([
			[CONVERGENT, (serie, r, rChart) => {
				self._plotPoint(serie.convergence, r, rChart, 0.2, "red");
			}],
			[CYCLE_2, (serie, r, rChart) => {
				self._plotPoint(serie.convergence[0], r, rChart, 0.2, "red");
				self._plotPoint(serie.convergence[1], r, rChart, 0.2, "red");
			}],
			[CHAOS, (serie, rChart) => {
			}]
		]);

		this.plot
		.bind("mousemove", function (event) {
			$("#bifurcationLegend").remove();
			var x = self.plot.chartToX(event.offsetX);
			var y = self.plot.chartToY(event.offsetY);
			if ((x >= 0.0 && x <= 1.0) && (y >= 0.0 && y <= 4.0)) {
				let g = self.chart.group("bifurcationLegend");
				self.chart.text(g, 25, 10, `(${s.numberFormat(x, 3)}, ${s.numberFormat(y, 3)})`);
			}
		}).bind("mouseleave", function (event) {
			$("#bifurcationLegend").remove();
		});
	}

	_plotPoint(x, r, rChart, radius, color) {
		this.chart.point(this.plot.xToChart(x), rChart, radius, { id:`r_${r}_x_${x}`, stroke: color, fill: color });
	}

	clean() {
		super._clean();
		// Remove all prior points
		$(`#${this.chartId} circle`).remove();
	}

	plotSerie(serie, generator) {
		const inicialI = (generator.parameters.iteractions * generator.parameters.skipFirstPercent / 100) | 0;
		const stageSize = parseInt(serie.values.length / 5);
		let stop = this.notConverged.get(serie.convergenceType);
		let rChart = this.plot.yToChart(serie.r);
		
		for (var i = inicialI; i < serie.values.length && !stop(serie, i); i++) {
			this._plotPoint(serie.values[i], serie.r, rChart, 0.1, this._calculateColor(i, stageSize, serie.values));
		}
		this.drawConvergence.get(serie.convergenceType)(serie, serie.r, rChart);
	}

	plotComplete() {
		this.plot.redraw();
		this._adjustChart();
		$("#bifurcationChart circle").appendTo($("#bifurcationChart g.foreground"));
	}


}
