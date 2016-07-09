/*jshint -W079 */
"use strict";

/**
 * @const {symbol}
 * @description Indicates That the BifurcationGenerator will start to generate the serie.
 */
const STARTING = Symbol("STARTING");
/**
 * @const {symbol}
 * @description Indicates That the BifurcationGenerator is generating the serie.
 */
const RUNNING = Symbol("RUNNING");
/**
 * @const {symbol}
 * @description Indicates That the BifurcationGenerator just ended to generate the serie.
 */
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

		/**
		 * @member {Map} The series of values to be generated. The key is the R value, 
		 * while the values are the values created by logistic equation for R value.
		 */
		this.series = new Map();

		/**
		 * @member {array} listeners of this Generator.
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
				values: logisticGenerator.values};

			self.series.set(r, serie);
			self._notifyListeners({status: RUNNING, serie});
		}

		var t0 = Date.now();

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