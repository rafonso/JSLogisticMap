"use strict";

class Plotter {
	
	constructor(id, initParams) {
		function initChart(svg) { 
			return svg.plot
			.area(initParams.left, initParams.top, initParams.right, initParams.bottom)
			.equalXY(initParams.equalXY)
			.legend.show(false).end()
			.gridlines('lightgrey', 'lightgrey')
			.yAxis.scale(0.0, 1.0).ticks(initParams.yTicks, 0, 0).title("").end();
		}
		
		this.id = id;
		this.chartId = `${id}Chart`;
		this.chart = $(`#${this.chartId}`).svg(initChart).svg("get");
		this.foreground = $(`#${this.chartId} g.foreground`).svg("get");
		
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
	}
	
	_drawSerie(serie) {
		
		function calculateColor(i) {
			const stage = Math.floor(i / stageSize);
			const color = self.heatTrace.get(stage);
			const pos = (i / stageSize);
			
			const r = Math.floor(color.r(pos));
			const g = Math.floor(color.g(pos));
			const b = Math.floor(color.b(pos));
			const a = s.numberFormat(self.drawFunctions.alpha(serie, i), 3); 
			
			return `rgba(${r}, ${g}, ${b}, ${a})`;
		}
		
		function plot(i) {
			const path = self.chart.createPath();
			const plot = self.chart.plot;
			const color = calculateColor(i);
			
			path.moveTo(plot.xToChart(self.drawFunctions.getX(serie, i-1)), plot.yToChart(self.drawFunctions.getY(serie, i-1)));
			path.line(plot.xToChart(self.drawFunctions.getX(serie, i)), plot.yToChart(self.drawFunctions.getY(serie, i)));
			self.chart.path(self.foreground, path, {
				id : `${self.id}${i}`,
				fill : 'none',
				stroke : color,
				strokeWidth : 1,
				class : self.id
			});
		}
		
		let self = this;
		const stageSize = parseInt(serie.length / 5);
		
		_.range(1, serie.length).forEach(plot);
	}
	redraw(generator) {
		let t0 = Date.now();
		
		this._clean();
		this.prepareDraw(generator);
		let serie = this.generateSerie(generator);
		this._drawSerie(serie);
		this.chart.plot.redraw();
		this._adjustChart();
		
		return Date.now() - t0;
	}
	
	_clean() {
		$(`#${this.chartId} path`).remove();
	}
	
}

class LogisticPlotter extends Plotter {
	
	constructor(magnitude) {
		super('logistic', { left: 0.06, top: 0.02, right: 0.98, bottom: 1.00, equalXY: true, yTicks: 0.1 });
		
		this.fileName = "";
		this.magnitude = magnitude;
		$(this.chart._container).dblclick((evt) => this.saveChart());
		
		const a0 = 0.5;
		const aMax = 0.95;
		this.drawFunctions = {
			getX: (series, i) => series[i].x, 
			getY: (series, i) => series[i].y, 
			alpha: (series, i) => a0 + (aMax - a0) * (i / series.length)
		};
		this.adjustParameters = {
			posXLabels: 395, 
			fontSize: 13, 
			adjustLabels: (index, element) => {
				$(element).text($.number((1 + index) / 10, 1));
			}
		};
		
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
		this.chart.text(g, 30, 32, `R = ${s.numberFormat(generator.parameters.r, (this.magnitude['r'] + 1))}`);
		this.chart.text(g, 30, 44, `x0 = ${s.numberFormat(generator.parameters.x0, (this.magnitude['x0'] + 1))}`);
		$("#chart .foreground").prepend($("#legends"));
	}
	
	
	prepareDraw(generator) {
		this.fileName = `x0=${s.numberFormat(generator.parameters.x0, (this.magnitude['x0'] + 1))},r=${s.numberFormat(generator.parameters.r, (this.magnitude['r'] + 1))},it=${generator.parameters.iteractions}.svg`;
	
		this.drawParable(generator);
		this.writeLegends(generator);
	}
	
	generateSerie(generator)  {
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
	
	saveChart() {
		saveAs(new Blob([this.chart.toSVG()], {type:"application/svg+xml"}), this.fileName); 
	}
	
}

class IteractionsPlotter extends Plotter {
	
	constructor() {
		super('iteractions', { left: 0.06, top: 0.05, right: 0.98, bottom: 0.90, equalXY: false, yTicks: 0.25 });
		
		$(this.chart._container).dblclick((evt) => this.emitSound());
		this.timeByI = 10;
		this.soundFactor = 10000;
		
		
		
		this.drawFunctions = {
			getX: (series, i) => i + 1, 
			getY: (series, i) => series[i], 
			alpha: (series, i) => 1
		};
		this.adjustParameters = {
			posXLabels: 99, 
			fontSize: 10, 
			adjustLabels: (index, element) => {
				let el = $(element);
				if (el.parent().attr("class") === "yAxisLabels") {
					el.text($.number(el.text(), 2));
				}
			}
		};
	}
	
	prepareDraw(generator) {
		this.values = generator.values;
		
		let ticksDistance = generator.values.length? (generator.values.length / 10): 1;
		this.chart.plot.xAxis
		.scale(0, Math.max(generator.values.length, 1))
		.ticks(ticksDistance, 0, 0)
		.title("");
	}
	
	generateSerie(generator) {
		return generator.values;
	}
	
	emitSound() {
		
		function beep(i, colorPrior){
			if(colorPrior) {
				$(paths[i - 1]).attr("stroke", colorPrior).attr("stroke-width", 1);
			}
			if(i < self.values.length) {
				let color = $(paths[i]).attr("stroke");
				$(paths[i]).attr("stroke", "black").attr("stroke-width", 3);
				oscillator.frequency.value = self.values[i] * self.soundFactor;
				setTimeout(() => beep(i + 1, color), self.timeByI);
			} else {
				oscillator.stop();
				if(context.close) { // MS has not context.close
					context.close();
				} 
				console.timeEnd("emitSound");
			}
		}
		
		let self = this;
		let paths = $(`#iteractionsChart g.foreground path`);
		
		let context = new AudioContext();
		let oscillator = context.createOscillator();
		oscillator.type = "square";
		
		let gain = context.createGain();
		oscillator.connect(gain);
		gain.connect(context.destination);
		
		oscillator.start(0);
		
		console.time("emitSound");
		beep(0);
	}
}