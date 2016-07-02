"use strict";

class Plotter {

	constructor(id, initParams) {
		function initChart(svg) {
			return svg.plot
				.area(initParams.left, initParams.top, initParams.right, initParams.bottom)
				.equalXY(initParams.equalXY)
				.legend.show(false).end()
				.gridlines('lightgrey', 'lightgrey')
				.yAxis.scale(0.0, initParams.maxY).ticks(initParams.yTicks, 0, 0).title("").end();
		}

		this.id = id;
		this.chartId = `${id}Chart`;
		this.chart = $(`#${this.chartId}`).svg(initChart).svg("get");
		this.plot = this.chart.plot
		this.foreground = $(`#${this.chartId} g.foreground`).svg("get");

/*
		this.plot.bind("click", function(event) {
			console.log(event.offsetX, plot.chartToX(event.offsetX), event.offsetY, plot.chartToY(event.offsetY));
		})
*/
		this.heatTrace = new Map([
			[0, { // From Indigo [rgb( 75,   0, 130)] to Blue [rgb(  0,   0, 255)]
				r: (pos) => (75 * (- pos + 1)),
				g: (pos) => 0,
				b: (pos) => (125 * pos + 130)
			}]
			,
			[1, { // From Blue [rgb(  0,   0, 255)] to Green [rgb(  0, 255,   0)]
				r: (pos) => 0,
				g: (pos) => (255 * (+ pos - 1)),
				b: (pos) => (255 * (- pos + 2))
			}],
			[2, { // From Green [rgb(  0, 255,   0)] to Yellow [rgb(255, 255,   0)]
				r: (pos) => (255 * (pos - 2)),
				g: (pos) => 255,
				b: (pos) => 0
			}],
			[3, { // From Yellow [rgb(255, 255,   0)] to Orange [rgb(222, 127,   0)] 
				r: (pos) => (- 33 * pos + 354),
				g: (pos) => 255 * (- pos + 5) / 2,
				b: (pos) => 0
			}],
			[4, { // From Orange [rgb(222, 127,   0)] to Red [rgb(255,   0,   0)]
				r: (pos) => (33 * pos + 90),
				g: (pos) => 255 * (- pos + 5) / 2,
				b: (pos) => 0
			}],
			[5, { // Red [rgb(255,   0,   0)]
				r: (pos) => 255,
				g: (pos) => 0,
				b: (pos) => 0
			}]
		]);
	}

	/**
		* Make adjusts on charts which can not be done using the JQuary.SVG.plot API.
	*/
	_adjustChart() {

		function formatAxis(idAxis, axisType, pos, axis0Type, _0Type) {
			const axis = $(`#${self.chartId} g.${idAxis}`);
			axis.appendTo(`#${self.chartId} g.background`);

			return axis.children("text")
				.attr(axisType, pos)
				.css("font-size", self.adjustParameters.fontSize + "px")
				.each(self.adjustParameters.adjustLabels);
		}

		let self = this;
		formatAxis("xAxisLabels", "y", this.adjustParameters.posXLabels, "x", "23");
		formatAxis("yAxisLabels", "x", 20, "y", "381").each(function () {
			$(this).attr("y", parseInt($(this).attr("y")) + 5);
		});
		$(`#${this.chartId} g.background rect`).appendTo(`#${this.chartId} g.background`);
		$(`#${this.chartId} path`).appendTo(`#${this.chartId} g.foreground`);
		$(`#${this.chartId} g.xAxis, #${this.chartId} g.yAxis`).remove();
		// Clean Axis labels
		$(`#${this.chartId} svg svg > text`).remove();
	}

	_drawSerie(serie) {

		let self = this;
		const stageSize = parseInt(serie.length / 5);

		function calculateColor(i) {
			const pos = (i / stageSize);
			const stage = pos | 0;
			const color = self.heatTrace.get(stage);

			const r = color.r(pos) | 0;
			const g = color.g(pos) | 0;
			const b = color.b(pos) | 0;
			const a = self.drawFunctions.alpha(serie, i);

			return `rgba(${r}, ${g}, ${b}, ${a})`;
		}

		function _plot(i) {
			const path = self.chart.createPath();
			const color = calculateColor(i);

			path.moveTo(self.plot.xToChart(self.drawFunctions.getX(serie, i - 1)), self.plot.yToChart(self.drawFunctions.getY(serie, i - 1)));
			path.line(self.plot.xToChart(self.drawFunctions.getX(serie, i)), self.plot.yToChart(self.drawFunctions.getY(serie, i)));
			self.chart.path(self.foreground, path, {
				id: `${self.id}${i}`,
				fill: 'none',
				stroke: color,
				strokeWidth: 1,
				class: self.id
			});
		}

		for (let i = 1; i < serie.length && !!serie[i]; i++) {
			_plot(i);
		}
	}
	
	redraw(generator) {
		if (DEBUG) var t0 = Date.now();

		this._clean();
		this.prepareDraw(generator);
		let serie = this.generateSerie(generator);
		this._drawSerie(serie);
		this.plot.redraw();
		this._adjustChart();

		if (DEBUG) console.log('\t', this.id, (Date.now() - t0));
	}

	_clean() {
		$(`#${this.chartId} path`).remove();
	}

}



