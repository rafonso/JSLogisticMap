"use strict";

/**
 * Generate the values of a Logistic series.
 */
class LogisticGenerator {
	
	/**
	 * Create a new Logistic Generator.
	 * 
	 * @param {LogisticParameters} parameters Generator Parameters
	 */
	constructor(parameters = new LogisticParameters()) {
		/**
		 * @member {LogisticParameters} the Observable Generator Parameters
		 */
		this.parameters = toObservable(parameters);
		/**
		 * @member Values of the Logistic series.
		 * @type {Array}
		 */
		this.values = [];
		/**
		 * @member F
		 */
		this.listeners = [];
		
		this.parameters.addObserver((evt) => this.generate());
	}
	
	generate() {
		if(DEBUG) var t0 = Date.now();
		
		var x = this.parameters.x0;
		let val = new Array(this.parameters.iteractions);
		for(var i = 0; i < this.parameters.iteractions; i ++) {
			val[i] = x;
			x = this.parameters.r * x * (1 - x);
		}
		this.values = val;
		
		if(DEBUG) console.log("generate", this.parameters, (Date.now() - t0));

		this.listeners.forEach(l => l.class[l.method](this));
	}
	
	addListener(listener) {
		this.listeners.push(listener);
	}
	
}
