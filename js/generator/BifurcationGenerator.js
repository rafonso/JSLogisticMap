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
		let self = this;

		function generateSerie(r) {
			let logisticGenerator = new LogisticGenerator(new LogisticParameters(r, self.parameters.x0, self.parameters.iteractions));
			logisticGenerator.generate();
			let serie = {r, x0: self.parameters.x0, iteractions: self.parameters.iteractions, 
				convergenceType: logisticGenerator.convergenceType, 
				convergence: logisticGenerator.convergence, 
				values: logisticGenerator.values}
			serie.values.splice(0, qtyToRemove);

			self.series.set(r, serie);
			self._notifyListeners({status: RUNNING, serie});
		}

		var t0 = Date.now();

		var qtyToRemove = (this.parameters.iteractions / 100 * this.parameters.skipFirstPercent) | 0;
		this.series.clear();
		this._notifyListeners({status: STARTING});
		for (let r of this.parameters.rValues()) {
			generateSerie(r);
		}
		generateSerie(4);

		this._notifyListeners({status: READY, time: (Date.now() - t0)});
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

}