"use strict";

const STARTING = Symbol("STARTING");
const RUNNING = Symbol("RUNNING");
const READY = Symbol("READY");

/**
 * Generate the values of a Logistic series.
 */
class BifurcationGenerator {

	/**
	 * 
	 * @param {BifurcationParameters} parameters 
	 */
	constructor(parameters = new BifurcationParameters()) {
		this.parameters = toObservable(parameters);

		this.series = new Map();

		/**
		 * @member F
		 */
		this.listeners = [];

		this.parameters.addObserver((evt) => this.generate());
	}

	_notifyListeners(obj) {
		this.listeners.forEach(l => l(obj));
	}

	generate() {
		var t0 = Date.now();

		let self = this;
		var qtyToRemove = (this.parameters.iteractions / 100 * this.parameters.skipFirstPercent) | 0;
		this.series.clear();
		this._notifyListeners({status: STARTING});
		for (let r of this.parameters.rValues()) {
			let logisticGenerator = new LogisticGenerator(new LogisticParameters(r, this.parameters.x0, this.parameters.iteractions));
			logisticGenerator.generate();
			let serie = {r, x0: this.parameters.x0, iteractions: this.parameters.iteractions, values: logisticGenerator.values}
			serie.values.splice(0, qtyToRemove);

			this.series.set(r, serie);
			this._notifyListeners({status: RUNNING, serie});
		}

		this._notifyListeners({status: READY, time: (Date.now() - t0)});
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

}