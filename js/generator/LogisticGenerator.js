/*jshint -W079 */
"use strict";

const DELTA = 1 / 10000;

const LIMIT_CYCLE_2 = 1 + Math.sqrt(6);

const CONVERGENT = Symbol("CONERGENCE");

const CYCLE_2 = Symbol("CYCLE_2");

const CHAOS = Symbol("CHAOS");

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

		this.convergenceType = null;

		this.convergence = NaN;

		this.convergencePosition = NaN;

		this.parameters.addObserver((evt) => {
			/*
			console.log(evt);
			if (evt.property === 'iteractions' && (evt.oldValue > evt.newValue)) {
				this.generate(evt.oldValue);
			} else if (evt.property === 'iteractions' && (evt.oldValue < evt.newValue)) {
				this.generate(evt.oldValue);
			} else {
			}
			*/
				this.generate();
		});
	}




	generate(initialI = 0) {

		let logistic = (x) => this.parameters.r * x * (1 - x);

		let convergeToConstant = (convergence) => () => {
			let val = new Array(this.parameters.iteractions);
			var x = this.parameters.x0;
			for (var i = 0; i < this.parameters.iteractions && (Math.abs(x - convergence) > DELTA); i++) {
				val[i] = x;
				x = logistic(x);
			}
			if (i < this.parameters.iteractions) {
				val.fill(convergence, i);
			}

			return [val, convergence, i];
		};

		let cycle2 = () => {
			var root = Math.sqrt((this.parameters.r - 3) * (this.parameters.r - 1));
			var term1 = this.parameters.r + 1;
			var divisor = 2 * this.parameters.r;

			let val = new Array(this.parameters.iteractions);
			var x = this.parameters.x0;
			for (var i = 0; i < this.parameters.iteractions && (i < 2 || (Math.abs(x - val[i - 2]) > DELTA)); i++) {
				val[i] = x;
				x = logistic(x);
			}

			let convergence = [val[i - 1], val[i - 2]];
			let convergencePos = i;

			let convpos = 1;
			while (i < val.length) {
				val[i] = convergence[convpos];
				convpos = convpos ? 0 : 1;
				i++;
			}

			return [val, convergence, convergencePos];
		};

		let generalCase = () => {
			let val = new Array(this.parameters.iteractions);
			var x = this.parameters.x0;
			for (var i = 0; i < this.parameters.iteractions; i++) {
				val[i] = x;
				x = logistic(x);
			}
			return [val, NaN, NaN];
		};

		let strategy;
		if (this.parameters.r < 1) {
			strategy = convergeToConstant(0);
			this.convergenceType = CONVERGENT;
		} else if (this.parameters.r < 3) {
			strategy = convergeToConstant((this.parameters.r - 1) / this.parameters.r);
			this.convergenceType = CONVERGENT;
		} else if (this.parameters.r < LIMIT_CYCLE_2) {
			strategy = cycle2;
			this.convergenceType = CYCLE_2;
		} else {
			strategy = generalCase;
			this.convergenceType = CHAOS;
		}

		if (DEBUG) var t0 = Date.now();

		let result = strategy();
		this.values = result[0];
		this.convergence = result[1];
		this.convergencePosition = result[2];

		if (DEBUG) console.log("generate", this.parameters, (Date.now() - t0));

		this.listeners.forEach(l => l.class[l.method](this));
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

}
