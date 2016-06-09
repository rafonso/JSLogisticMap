"use strict";

class Plotter {

	constructor() {
		function initChart(svg, left, top, right, bottom, equalXY, yTicks) {
			return svg.plot
			.area(left, top, right, bottom)
			.equalXY(equalXY)
			.legend.show(false).end()
			.gridlines('lightgrey', 'lightgrey')
			.yAxis.scale(0.0, 1.0).ticks(yTicks, 0, 0).title("").end();
		}
		
		function initLogisticChart(svg) {
			initChart(svg, 0.06, 0.02, 0.98, 1.00, true, 0.1)
			.xAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
			.addFunction("linear", (x) =>  x, [0, 1], 1, "GoldenRod", 2);
		}
		
		function initIteractonsChart(svg) {
			initChart(svg, 0.06, 0.05, 0.98, 0.90, false, 0.25);
		}
		
		this.logisticChart = $('#logisticChart').svg(initLogisticChart).svg("get"); //.dblclick(this.saveLogisticChart);
		this.logisticForeground = $("#logisticChart g.foreground").svg("get")
		this.iteractionsChart = $('#iteractionsChart').svg(initIteractonsChart).svg("get");
		this.iteractionsForeground = $("#iteractionsChart g.foreground").svg("get")
		
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
	adjustChart(chartId, posXLabels, fontSize, adjustLabels) {

		function formatAxis(idAxis, axisType, pos, axis0Type, _0Type) {
			const axis = $(`#${chartId} g.${idAxis}`);
			axis.appendTo(`#${chartId} g.background`);

			return axis.children("text")
				.attr(axisType, pos)
				.css("font-size", fontSize + "px")
				.each(adjustLabels);
		}

		formatAxis("xAxisLabels", "y", posXLabels, "x", "23");
		formatAxis("yAxisLabels", "x", 20, "y", "381").each(function () {
			$(this).attr("y", parseInt($(this).attr("y")) + 5);
		});
		$(`#${chartId} g.background rect`).appendTo(`#${chartId} g.background`);
		$(`#${chartId} path`).appendTo(`#${chartId} g.foreground`);
		$(`#${chartId} g.xAxis, #${chartId} g.yAxis`).remove();
	}

	drawSerie(serie, getX, getY, alpha, serieName, svg, svgForeground) {
		
		let calculateColor = (i) => {
			const stage = Math.floor(i / stageSize);
			const color = this.heatTrace.get(stage);
			const pos = (i / stageSize);
			
			const r = Math.floor(color.r(pos));
			const g = Math.floor(color.g(pos));
			const b = Math.floor(color.b(pos));
			const a = s.numberFormat(alpha(i), 3); 
			
			return `rgba(${r}, ${g}, ${b}, ${a})`;
		}
		
		function plot(i) {
			const path = svg.createPath();
			const plot = svg.plot;
			const color = calculateColor(i);
			
			path.moveTo(plot.xToChart(getX(i-1)), plot.yToChart(getY(i-1)));
			path.line(plot.xToChart(getX(i)), plot.yToChart(getY(i)));
			svg.path(svgForeground, path, {
				id : (serieName + i),
				fill : 'none',
				stroke : color,
				strokeWidth : 1,
				class : serieName
			});
		}
		
		var stageSize = parseInt(serie.length / 5);
		
		_.range(1, serie.length).forEach(plot);
	}

	drawLogistic(generator) {
		
		/*
			* Draw quadratic equation using quadratic Bézier curve.
			* The parable extremities are the points (0,0) and (1, 0).
			*
		*/
		let drawParable = () => {
			let plot = this.logisticChart.plot;
			let y0 = plot.yToChart(0);
			let x0 = plot.xToChart(0);
			let x1 = plot.xToChart(1);
			let x_5 = plot.xToChart(0.5);
			let y_5 = plot.yToChart(generator.parameters.r / 2);
			
			let quadraticPath = this.logisticChart.createPath();
			quadraticPath
			.move(x0, y0)
			.curveQ(x_5, y_5, x1, y0);
			this.logisticChart.path(this.logisticForeground,
			quadraticPath, {
				id: 'parable',
				fill : 'none',
				stroke : "Violet",
				strokeWidth : 2,
				class : "quadratic"
			});
		}
		
		let writeLegends = () => {
			$("#legends").remove();
			let g = this.logisticChart.group("legends");
			this.logisticChart.text(g, 30, 20, `Iteractions = ${generator.parameters.iteractions}`); 
			this.logisticChart.text(g, 30, 32, `R = ${generator.parameters.r}`);
			this.logisticChart.text(g, 30, 44, `x0 = ${generator.parameters.x0}`);
			$("#logisticChart .foreground").prepend($("#legends"));
		}
	
		let prepareLogistic = () => {
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
		
		drawParable();
		
		let logistic = prepareLogistic();
		
		const a0 = 0.5;
		const aMax = 0.95;
		this.drawSerie(logistic, 
		(i) => logistic[i].x, 
		(i) => logistic[i].y, 
		(i) => a0 + (aMax - a0) * (i / logistic.length),
		"logistic", this.logisticChart, this.logisticForeground);
		
		this.logisticChart.plot.redraw();
		
		writeLegends();
		this.adjustChart("logisticChart", 395, 13, function (index, element) {
			$(element).text($.number((1 + index) / 10, 1));
		});
	}

	drawIteractions(generator, lastPosition) {
		let ticksDistance = generator.values.length? (generator.values.length / 10): 1;
		this.iteractionsChart.plot.xAxis
			.scale(0, Math.max(generator.values.length, 1))
			.ticks(ticksDistance, 0, 0)
			.title("");

		this.drawSerie(generator.values, 
			(i) =>  i + 1,
			(i) => generator.values[i],
			(i) => 1,
			"iteractions", this.iteractionsChart, this.iteractionsForeground)

		this.iteractionsChart.plot.redraw();
		this.adjustChart("iteractionsChart", 99, 10, function (index, element) {
			let el = $(element);
			if (el.parent().attr("class") === "yAxisLabels") {
				el.text($.number(el.text(), 2));
			}
		});
	}

	saveLogisticChart() {
		let logisticChart = $("#logisticChart");
		let filename = encodeURIComponent(`r=${generator.parameters.r},x0=${generator.parameters.x0},iteractions=${generator.parameters.iteractions}.png`);
		let code = `<meta http-equiv="content-type" content="image/svg+xml"/>
		<meta name="content-disposition" content="inline; filename=${filename}">
		<link rel="stylesheet" type="text/css" href="css/style.css">
		${logisticChart.svg('get').toSVG()}`;
		let uriContent = "data:image/svg+xml"; //," + filename;
		
		let chartWindow = window.open(filename, filename, `left=0,top=0,menubar=1,titlebar=0,width=${logisticChart.width() + 50},height=${logisticChart.height() +50},toolbar=0,scrollbars=0,status=0`);
		chartWindow.document.write(code);
		chartWindow.document.close();
		chartWindow.focus();
	}

	redraw(generator, lastPosition) {
		$("#iteractionsChart path, #logisticChart path").remove();
		this.drawLogistic(generator, lastPosition);
		this.drawIteractions(generator, lastPosition);
	}

	clean() {
		$("#iteractionsChart path, #logisticChart path").remove();
	}
}