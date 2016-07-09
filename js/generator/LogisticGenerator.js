/*jshint -W079 */
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
		 * @member Listeners of values generation.
		 * @see {@link #addListener}
		 */
		this.listeners = [];


		this.convergenceType = null;

		this.convergence = NaN;

		this.convergencePosition = NaN;

		this.parameters.addObserver((evt) => {
			if (evt.property === 'iteractions') {
				this.values.length = evt.newValue;
				if (evt.newValue < evt.oldValue) {
					// do nothing, 
				} else if (this.convergenceType === CONVERGENT) {
					this.values.fill(this.convergence, evt.oldValue);
				} else if (this.convergenceType === CYCLE_2) {
					this._fillCycle2(this.values, evt.oldValue, this.convergence);
				} else {
					// TODO:insr this.convergenceType === CHAOS
					this.generate(evt.oldValue);
				}
				this._notifyListeners();
			} else {
				this.generate();
			}
		});
	}

	/**
	 * Notify the generation values listeners.
	 */
	_notifyListeners() {
		this.listeners.forEach(l => l(this));
	}

	/**
	 * 
	 * 
	 * @param {Array} arr
	 * @param {number} start
	 * @param {array} convergenceValues
	 */
	_fillCycle2(arr, start, convergenceValues) {
		let convpos = (arr[start - 1] == convergenceValues[0]) ? 1 : 0;
		for (var i = start; i < arr.length; i++) {
			arr[i] = convergenceValues[convpos];
			convpos = convpos ? 0 : 1;
		}
	}

	/**
	 * Calculates the next term of logistic series.
	 * 
	 * @param {number} x the prior term of logistic series.
	 * @returns {number} the next term of logistic series.
	 */
	_logistic(x) {
		return this.parameters.r * x * (1 - x);
	}

	/**
	 * 
	 * 
	 * @param {boolean} [converged=() => false] the function which will determinate if the series converged or not.
	 * @param {number} [initialI=0] The initial position of iteraction.
	 * @returns
	 */
	_generateValues(converged = () => false, initialI = 0) {
		let val = new Array(this.parameters.iteractions);
		let x = this.parameters.x0;
		for (var i = initialI; i < this.parameters.iteractions && !converged(val, x, i); i++) {
			val[i] = x;
			x = this._logistic(x);
		}

		return { val, i };
	}

	/**
	 * 
	 * 
	 * @param {number} [initialI=0]
	 */
	generate(initialI = 0) {

		let convergeToConstant = (convergence) => () => {
			let {val, i} = this._generateValues((arr, x, index) => (Math.abs(x - convergence) < DELTA));
			if (i < this.parameters.iteractions) {
				val.fill(convergence, i);
			}

			return [val, convergence, i];
		};

		let cycle2 = () => {
			let {val, i} = this._generateValues((arr, x, index) => (index >= 2 && (Math.abs(x - arr[index - 2]) < DELTA)));
			let convergence = [val[i - 1], val[i - 2]];
			this._fillCycle2(val, i, convergence);

			return [val, convergence, i];
		};

		let generalCase = () => {
			let {val, i} = this._generateValues((arr, x, index) => (false));

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

		var t0 = Date.now();

		let result = strategy();
		this.values = result[0];
		this.convergence = result[1];
		this.convergencePosition = result[2];

		if (DEBUG) console.log("generate", this.parameters, (Date.now() - t0));

		this._notifyListeners();
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

}
