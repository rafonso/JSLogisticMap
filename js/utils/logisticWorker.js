// Web Worker for data Generation

"use strict";



/*
 * See
 * http://stackoverflow.com/questions/14500091/uncaught-referenceerror-importscripts-is-not-defined
 */
if ('function' === typeof importScripts) {
	importScripts(
		"utils.js",
		"Observers.js",
		"LogisticGenerator.js",
		"LogisticParameters.js");

	var generator; 

	addEventListener('message', function (e) {
		if(e.data.type === MessageToWorker.INIT && !generator) {
			generator = new LogisticGenerator(new LogisticParameters(e.data.r, e.data.x0, e.data.iteractions));
			generator.addListener((g) => {
				postMessage({type: MessageToView.DRAW, data: {parameters: {r: g.parameters.r, x0: g.parameters.x0, iteractions: g.parameters.iteractions}, values: g.values}});
			});

			generator.generate();
		} else if(e.data.type === MessageToWorker.PARAM_CHANGE) {
			postMessage({type: MessageToView.CLEAN});
			generator.parameters[e.data.param] = e.data.value;
//			generator.generate();
		}
	});

}
