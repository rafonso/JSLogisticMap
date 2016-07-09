// Web Worker for data Generation

"use strict";

const DEBUG = true;

var generator;

function generatorEvent(evt) {
	console.log(evt);
	postMessage({
		convergence: evt.convergence,
		convergencePosition: evt.convergencePosition,
		convergenceType: evt.convergenceType,
		values: evt.values,
		parameters: { 
			r: evt.parameters.r, 
			x0: evt.parameters.x0, 
			iteractions: evt.parameters.iteractions 
		}
	});
}

function handleWorkerMessage(data) {
	console.log(data);
	if (data.type === MessageToWorker.INIT && !generator) {
		generator = new LogisticGenerator(new LogisticParameters(data.r, data.x0, data.iteractions));
		generator.addListener(generatorEvent);
		generator.generate();
	} else if (data.type === MessageToWorker.PARAMETER) {
		generator.parameters[data.property] = data.value;
	}
}

/*
 * See
 * http://stackoverflow.com/questions/14500091/uncaught-referenceerror-importscripts-is-not-defined
 */
if ('function' === typeof importScripts) {
	importScripts(
		"/js/workers/logisticMessages.js",
		"/js/utils/Observers.js",
		"/js/generator/LogisticGenerator.js",
		"/js/generator/logisticConstants.js",
		"/js/generator/LogisticParameters.js");

	addEventListener('message', (e) => handleWorkerMessage(e.data));

}
