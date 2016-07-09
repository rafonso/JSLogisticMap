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

		this.plot.xAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
			.addFunction("linear", (x) => x, [0, 1], 1, "GoldenRod", 2);
	}

	drawParable(generator) {
		let y0 = this.plot.yToChart(0);
		let x0 = this.plot.xToChart(0);
		let x1 = this.plot.xToChart(1);
		let x_5 = this.plot.xToChart(0.5);
		let y_5 = this.plot.yToChart(generator.parameters.r / 2);

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
		$("#logisticLegend").remove();
		let g = this.chart.group("logisticLegend");
		this.chart.text(g, 30, 20, `Iteractions = ${generator.parameters.iteractions}`);
		this.chart.text(g, 30, 32, `R = ${s.numberFormat(generator.parameters.r, (this.magnitude['r'] + 1))}`);
		this.chart.text(g, 30, 44, `x0 = ${s.numberFormat(generator.parameters.x0, (this.magnitude['x0'] + 1))}`);
		$("#chart .foreground").prepend($("#logisticLegend"));
	}


	prepareDraw(generator) {
		this.fileName = `x0=${s.numberFormat(generator.parameters.x0, (this.magnitude['x0'] + 1))},r=${s.numberFormat(generator.parameters.r, (this.magnitude['r'] + 1))},it=${generator.parameters.iteractions}.png`;

		this.drawParable(generator);
		this.writeLegends(generator);
	}

	generateSerie(generator) {
		let continueGeneralCase = (index) => index < generator.values.length;
		let continueConvergence = (index) => continueGeneralCase(index) && (index < generator.convergencePosition); // (Math.abs(value - generator.convergence) > DELTA);

		let continueSerie = (generator.convergenceType === CHAOS)? continueGeneralCase: continueConvergence;

		let logistic = new Array(2 * generator.values.length - 2);
		let x = generator.values[0];
		let y = 0;

		logistic[0] = { x, y };
		for (var i = 1; continueSerie(i); i++) {
			y = generator.values[i];
			logistic[2 * i - 1] = { x, y: x };
			logistic[2 * i] = { x, y };
			x = y;
		}
		logistic.splice(1, 1); // workaround

		return logistic;
	}

	redraw(generator) {
		super.redraw(generator);

		// Remove the prior (if exisits) point of convergence.
		$("#logisticChart circle").remove();
		if (generator.convergenceType === CONVERGENT) {
			// Adds the point of convergence
			this.chart.point(
				this.plot.xToChart(generator.convergence),
				this.plot.yToChart(generator.convergence),
				1,
				{ stroke: 'red' });
		} else if (generator.convergenceType === CYCLE_2) {
			// Draws the cycle of convergence.
			const path = this.chart.createPath();

			path.moveTo(this.plot.xToChart(generator.convergence[0]), this.plot.yToChart(generator.convergence[0]))
				.line(this.plot.xToChart(generator.convergence[1]), this.plot.yToChart(generator.convergence[0]))
				.line(this.plot.xToChart(generator.convergence[1]), this.plot.yToChart(generator.convergence[1]))
				.line(this.plot.xToChart(generator.convergence[0]), this.plot.yToChart(generator.convergence[1]))
				.line(this.plot.xToChart(generator.convergence[0]), this.plot.yToChart(generator.convergence[0]));
			this.chart.path(this.foreground, path, {
				id: "cycle2",
				fill: 'none',
				stroke: 'red',
				strokeWidth: 1,
				class: this.id
			});
		}
	}

	saveChart() {
		saveSvgAsPng($(`#${this.chartId}`).children()[0], this.fileName);
	}

}
