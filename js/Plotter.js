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
		
		this.logisticChart = $('#logisticChart').svg(initLogisticChart).dblclick(saveLogisticChart).svg("get");
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
	

	
	redraw(generator, lastPosition) {
		this.drawIteractions(generator, lastPosition);
	}
	
	clean() {
		$("#iteractionsChart path, #logisticChart path").remove();
	}
}