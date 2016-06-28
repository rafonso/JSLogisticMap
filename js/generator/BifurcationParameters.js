"use strict";

/**
 * Represents a bifurcation parameters. 
 */
class BifurcationParameters {

	/**
	 * Creates a new bifurcation parameters.
	 * 
	 * @param {number} x0 Initial value of x 
	 * @param {number} iteractions How many iteractions in the logistic equation.
	 * @param {number} drawPercent The percentage of possible values of R that will be used 
	 * @param {number} skipFirstPercent How many of the first iteractions will be skipped (in percent)
	 * @param {number} rMin Minimum value of R
	 * @param {number} rMax Maximum value of R
	 */
	constructor(x0, iteractions, drawPercent, skipFirstPercent, numMaxOfYPoints, rMin = 0.0, rMax = 4.0) {
		this.x0 = x0;
		this.iteractions = iteractions;
		this.drawPercent = drawPercent;
		this.skipFirstPercent = skipFirstPercent;
		this.numMaxOfYPoints = numMaxOfYPoints;
		this.rMin = rMin;
		this.rMax = rMax;
	}

	* rValues() {
		/**
		 * {number}
		 */
		var numPoints = this.numMaxOfYPoints * this.drawPercent / 100;
		const step =  (this.rMax - this.rMin) / numPoints;		
		console.log(this.drawPercent, numPoints, step);
		let r = this.rMin;
		while (r < this.rMax) {
			yield r;
			r += step;
		}
	}

}