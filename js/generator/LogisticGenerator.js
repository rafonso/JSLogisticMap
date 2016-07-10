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

		this.parameters.addObserver((evt) => this._parametersChanged(evt));
	}

	_parametersChanged(evt) {
		if (evt.property === 'iteractions') {
			this._iteractionsChanged(evt);
		} else {
			this.generate();
		}
	}

	_iteractionsChanged(evt) {
		if (evt.newValue > evt.oldValue) {
			this.generate(evt.oldValue);
		} else {
			this.values.length = evt.newValue;
			this._notifyListeners();
		}
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
		if(convergenceValues) {
			let convpos = (arr[start - 1] == convergenceValues[0]) ? 1 : 0;
			for (var i = start; i < arr.length; i++) {
				arr[i] = convergenceValues[convpos];
				convpos = convpos ? 0 : 1;
			}
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
			x =  this.parameters.r * x * (1 - x);
		}

		return { val, i };
	}

	_convergeToConstant(convergence) {
		return () => {
			let {val, i} = this._generateValues((arr, x, index) => (Math.abs(x - convergence) < DELTA));
			let convPos = Number.MAX_VALUE;
			if (i < this.parameters.iteractions) {
				val.fill(convergence, i);
				convPos = i;
			}

			return [val, convergence, convPos];
		};
	}

	_cycle2() {
		let {val, i} = this._generateValues((arr, x, index) => (index >= 2 && (Math.abs(x - arr[index - 2]) < DELTA)));
		let convergence = null;
		let convPos = Number.MAX_VALUE;
		if (i < this.parameters.iteractions) {
			convPos = i;
			convergence = [val[convPos -1], val[convPos-2]];
			this._fillCycle2(val, i, convergence);
		}

		return [val, convergence, convPos];
	}

	_generalCase() {
		let {val, i} = this._generateValues((arr, x, index) => (false));

		return [val, NaN, NaN];
	}

	_getStrategy() {
		let strategy = this._generalCase;
		if (this.parameters.r < 3) {
			let limit = (this.parameters.r < 1)? 0: ((this.parameters.r - 1) / this.parameters.r);
			strategy = this._convergeToConstant(limit);
		} else if (this.parameters.r < LIMIT_CYCLE_2) {
			strategy = this._cycle2;
		}

		return strategy;
	}

	_getConvergenceType() {
		let type = CHAOS;
		if (this.parameters.r < 3) {
			type = CONVERGENT;
		} else if (this.parameters.r < LIMIT_CYCLE_2) {
			type = CYCLE_2;
		}
		return type;
	}

	/**
	 * 
	 * 
	 * @param {number} [initialI=0]
	 */
	generate(initialI = 0) {
		let strategy = this._getStrategy();

		this.convergenceType = this._getConvergenceType();
		var t0 = Date.now();

		[this.values, this.convergence, this.convergencePosition] = strategy.apply(this);

		if (DEBUG) console.log("generate", this.parameters, (Date.now() - t0));

		this._notifyListeners();
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

}
