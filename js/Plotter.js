"use strict";

class Plotter {
	
	constructor(id, left, top, right, bottom, equalXY, yTicks, drawFunctions, adjustParameters) {
		function initChart(svg) {
			return svg.plot
			.area(left, top, right, bottom)
			.equalXY(equalXY)
			.legend.show(false).end()
			.gridlines('lightgrey', 'lightgrey')
			.yAxis.scale(0.0, 1.0).ticks(yTicks, 0, 0).title("").end();
		}
		
		this.id = id;
		this.chartId = `${id}Chart`;
		this.chart = $(`#${this.chartId}`).svg(initChart).svg("get");
		this.foreground = $(`#${this.chartId} g.foreground`).svg("get");
		this.drawFunctions = drawFunctions;
		this.adjustParameters = adjustParameters;
		
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
		
		let formatAxis = (idAxis, axisType, pos, axis0Type, _0Type) => {
			const axis = $(`#${this.chartId} g.${idAxis}`);
			axis.appendTo(`#${this.chartId} g.background`);
			
			return axis.children("text")
			.attr(axisType, pos)
			.css("font-size", this.adjustParameters.fontSize + "px")
			.each(this.adjustParameters.adjustLabels);
		}
		
		formatAxis("xAxisLabels", "y", this.adjustParameters.posXLabels, "x", "23");
		formatAxis("yAxisLabels", "x", 20, "y", "381").each(function () {
			$(this).attr("y", parseInt($(this).attr("y")) + 5);
		});
		$(`#${this.chartId} g.background rect`).appendTo(`#${this.chartId} g.background`);
		$(`#${this.chartId} path`).appendTo(`#${this.chartId} g.foreground`);
		$(`#${this.chartId} g.xAxis, #${this.chartId} g.yAxis`).remove();
	}
	
	_drawSerie(serie) {
		
		let calculateColor = (i) => {
			const stage = Math.floor(i / stageSize);
			const color = this.heatTrace.get(stage);
			const pos = (i / stageSize);
			
			const r = Math.floor(color.r(pos));
			const g = Math.floor(color.g(pos));
			const b = Math.floor(color.b(pos));
			const a = s.numberFormat(this.drawFunctions.alpha(serie, i), 3); 
			
			return `rgba(${r}, ${g}, ${b}, ${a})`;
		}
		
		let plot = (i) => {
			const path = this.chart.createPath();
			const plot = this.chart.plot;
			const color = calculateColor(i);
			
			path.moveTo(plot.xToChart(this.drawFunctions.getX(serie, i-1)), plot.yToChart(this.drawFunctions.getY(serie, i-1)));
			path.line(plot.xToChart(this.drawFunctions.getX(serie, i)), plot.yToChart(this.drawFunctions.getY(serie, i)));
			this.chart.path(this.foreground, path, {
				id : `${this.id}${i}`,
				fill : 'none',
				stroke : color,
				strokeWidth : 1,
				class : this.id
			});
		}
		
		var stageSize = parseInt(serie.length / 5);
		
		_.range(1, serie.length).forEach(plot);
	}
	
	_clean() {
		$(`#${this.chartId} path`).remove();
	}
	
}

class LogisticPlotter extends Plotter {
	
	constructor() {
		const a0 = 0.5;
		const aMax = 0.95;
		let drawFunctions = {
			getX: (series, i) => series[i].x, 
			getY: (series, i) => series[i].y, 
			alpha: (series, i) => a0 + (aMax - a0) * (i / series.length)
		};
		let adjustParameters = {
			posXLabels: 395, 
			fontSize: 13, 
			adjustLabels: (index, element) => {
				$(element).text($.number((1 + index) / 10, 1));
			}
		};
		super('logistic', 0.06, 0.02, 0.98, 1.00, true, 0.1, drawFunctions, adjustParameters);
		
		this.chart.plot.xAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
		.addFunction("linear", (x) =>  x, [0, 1], 1, "GoldenRod", 2);
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
			fill : 'none',
			stroke : "Violet",
			strokeWidth : 2,
			class : "quadratic"
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
		this.chart.text(g, 30, 32, `R = ${generator.parameters.r}`);
		this.chart.text(g, 30, 44, `x0 = ${generator.parameters.x0}`);
		$("#chart .foreground").prepend($("#legends"));
	}
	
	prepareLogistic(generator)  {
		let logistic = [];
		let x = generator.values[0];
		let y = 0;
		logistic.push({x, y});
		_.range(1, generator.values.length).forEach((it) => {
			y = generator.values[it];
			logistic.push({x, y : x});
			logistic.push({x, y});
			x = y;
		});
		logistic.splice(1, 1); // workaround
		
		return logistic;
	}
	
	redraw(generator) {
		this._clean();
		
		this.drawParable(generator);
		this.writeLegends(generator);
		
		
		let serie = this.prepareLogistic(generator);

		this._drawSerie(serie);
		this.chart.plot.redraw();
		this._adjustChart();
		
	}
	
	saveLogisticChart() {
		let chart = $("#chart");
		let filename = encodeURIComponent(`r=${generator.parameters.r},x0=${generator.parameters.x0},iteractions=${generator.parameters.iteractions}.png`);
		let code = `<meta http-equiv="content-type" content="image/svg+xml"/>
		<meta name="content-disposition" content="inline; filename=${filename}">
		<link rel="stylesheet" type="text/css" href="css/style.css">
		${chart.svg('get').toSVG()}`;
		let uriContent = "data:image/svg+xml"; //," + filename;
		
		let chartWindow = window.open(filename, filename, `left=0,top=0,menubar=1,titlebar=0,width=${chart.width() + 50},height=${chart.height() +50},toolbar=0,scrollbars=0,status=0`);
		chartWindow.document.write(code);
		chartWindow.document.close();
		chartWindow.focus();
	}
	
}

class IteractionsPlotter extends Plotter {
	
	constructor() {
		let drawFunctions = {
			getX: (series, i) => i + 1, 
			getY: (series, i) => series[i], 
			alpha: (series, i) => 1
		};
		let adjustParameters = {
			posXLabels: 99, 
			fontSize: 10, 
			adjustLabels: (index, element) => {
				let el = $(element);
				if (el.parent().attr("class") === "yAxisLabels") {
					el.text($.number(el.text(), 2));
				}
			}
		};
		super('iteractions', 0.06, 0.05, 0.98, 0.90, false, 0.25, drawFunctions, adjustParameters);
	}
	
	redraw(generator) {
		this._clean();
		
		let ticksDistance = generator.values.length? (generator.values.length / 10): 1;
		this.chart.plot.xAxis
		.scale(0, Math.max(generator.values.length, 1))
		.ticks(ticksDistance, 0, 0)
		.title("");
		
		let serie = generator.values;
		
		super._drawSerie(serie);
		this.chart.plot.redraw();
		this._adjustChart();
	}
	
	
}