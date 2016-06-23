"use strict";

/**
 * @class
 */
class LogisticPlotter extends Plotter {

	constructor(magnitude) {
		super('logistic', { left: 0.06, top: 0.02, right: 0.98, bottom: 1.00, equalXY: true, maxY: 1.0, yTicks: 0.1 });

		this.fileName = "";
		this.magnitude = magnitude;
		$(this.chart._container).dblclick((evt) => this.saveChart());

		const a0 = 0.5;
		const aMax = 0.95;
		this.drawFunctions = {
			getX: (series, i) => series[i].x,
			getY: (series, i) => series[i].y,
			alpha: (series, i) => ((1000 * (a0 + (aMax - a0) * (i / series.length))) | 0) / 1000
		};
		this.adjustParameters = {
			posXLabels: 395,
			fontSize: 13,
			adjustLabels: (index, element) => {
				$(element).text($.number((1 + index) / 10, 1));
			}
		};

		this.chart.plot.xAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
			.addFunction("linear", (x) => x, [0, 1], 1, "GoldenRod", 2);
	}

	drawParable(generator) {
		let plot = this.chart.plot;
		let y0 = plot.yToChart(0);
		let x0 = plot.xToChart(0);
		let x1 = plot.xToChart(1);
		let x_5 = plot.xToChart(0.5);
		let y_5 = plot.yToChart(generator.parameters.r / 2);

		let quadraticPath = this.chart.createPath();
		quadraticPath
			.move(x0, y0)
			.curveQ(x_5, y_5, x1, y0);
		this.chart.path(this.foreground,
			quadraticPath, {
				id: 'parable',
				fill: 'none',
				stroke: "Violet",
				strokeWidth: 2,
				class: "quadratic"
			});
	}

	/*
		* Draw quadratic equation using quadratic Bézier curve.
		* The parable extremities are the points (0,0) and (1, 0).
		*
	*/
	writeLegends(generator) {
		$("#legends").remove();
		let g = this.chart.group("legends");
		this.chart.text(g, 30, 20, `Iteractions = ${generator.parameters.iteractions}`);
		this.chart.text(g, 30, 32, `R = ${s.numberFormat(generator.parameters.r, (this.magnitude['r'] + 1))}`);
		this.chart.text(g, 30, 44, `x0 = ${s.numberFormat(generator.parameters.x0, (this.magnitude['x0'] + 1))}`);
		$("#chart .foreground").prepend($("#legends"));
	}


	prepareDraw(generator) {
		this.fileName = `x0=${s.numberFormat(generator.parameters.x0, (this.magnitude['x0'] + 1))},r=${s.numberFormat(generator.parameters.r, (this.magnitude['r'] + 1))},it=${generator.parameters.iteractions}.png`;

		this.drawParable(generator);
		this.writeLegends(generator);
	}

	generateSerie(generator) {
		let logistic = new Array(2 * generator.values.length - 2);
		let x = generator.values[0];
		let y = 0;
		logistic[0] = { x, y };
		for (var i = 1; i < generator.values.length; i++) {
			y = generator.values[i];
			logistic[2 * i - 1] = { x, y: x };
			logistic[2 * i] = { x, y };
			x = y;
		}
		logistic.splice(1, 1); // workaround

		return logistic;
	}

	saveChart() {
		saveSvgAsPng($(`#${this.chartId}`).children()[0], this.fileName);
	}

}