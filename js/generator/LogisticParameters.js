"use strict";

/**
 * Represents Logistic equation parameters. 
 */
class LogisticParameters {
	
	/**
	 * Creates a new Logistic equation parameters. 4
	 * 
	 * @param {number} r The R value
	 * @param {number} x0 The firs value of serie.
	 * @param {number} iteractions The number of iteractions in the serie.
	 */
	constructor(r = 1.00, x0 = 0.50, iteractions = 100) {
		this.r = r;
		this.x0 = x0;
		this.iteractions = iteractions;
	}

}