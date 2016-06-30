"use strict";

const DELTA = 1 / 10000;

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

		this.convergence = NaN;

		this.parameters.addObserver((evt) => this.generate());
	}

	generate() {

		let logistic = (x) => this.parameters.r * x * (1 - x);

		let convergeToConstant = (convergence) => () => {
			let val = new Array(this.parameters.iteractions);
			var x = this.parameters.x0;
			for (var i = 0; i < this.parameters.iteractions && (Math.abs(x - convergence) > DELTA); i++) {
				val[i] = x;
				x = logistic(x);
			}
			if(i < this.parameters.iteractions) {
				val.fill(convergence, i);
			}

			return [val, convergence];
		}

		let generalCase = () => {
			let val = new Array(this.parameters.iteractions);
			var x = this.parameters.x0;
			for (var i = 0; i < this.parameters.iteractions; i++) {
				val[i] = x;
				x = this.parameters.r * x * (1 - x);
			}
			return [val, NaN];
		}

		let strategy = generalCase;
		if (this.parameters.r < 1) {
			strategy = convergeToConstant(0);
		} else if (this.parameters.r <= 3) {
			strategy = convergeToConstant((this.parameters.r - 1) / this.parameters.r);
		}

		if (DEBUG) var t0 = Date.now();

		let result = strategy();
		this.values = result[0];
		this.convergence = result[1];

		if (DEBUG) console.log("generate", this.parameters, (Date.now() - t0));

		this.listeners.forEach(l => l.class[l.method](this));
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

}
