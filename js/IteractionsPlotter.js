"use strict";

class IteractionsPlotter extends Plotter {
	
	constructor() {
		super('iteractions', { left: 0.06, top: 0.05, right: 0.98, bottom: 0.90, equalXY: false, maxY: 1.0, yTicks: 0.25 });
		
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
		
		// Performance note: The bottleneck here is when it was change the color (stroke). 
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
				if(DEBUG) console.timeEnd(`emitSound ${self.values.length}`);
			}
		}
		
		let self = this;
		let paths = $(`#iteractionsChart g.foreground path`);
		
		let context = new AudioContext();
		let oscillator = context.createOscillator();
		oscillator.type = "square";
		
		let gain = context.createGain();
		gain.gain.value = 0.2;
		oscillator.connect(gain);
		gain.connect(context.destination);
		
		oscillator.start(0);
		
		if(DEBUG) console.time(`emitSound ${this.values.length}`);
		
		beep(0);
	}
}
