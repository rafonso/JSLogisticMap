/**
* @file contains the type of messages to be exchanged between view logistic thread and the worker one.
*/
/*jshint -W079 */
"use strict";

/**
	* Type of message to be sent from view to worker.
	*/
const MessageToWorker = {
	/**
	 * The Logistic Generator must be initialized.
	 */
	INIT: "INIT",
	/**
	* Indicates that a Logistic parameter was changed.
	*/
	PARAMETER: "PARAMETER"
};

/**
 * @constant {object}
* Type of message to be sent from worker to view.
*/
const MessageToView = {
	/**
	* The view must be cleaned.
	*/
	CLEAR: "CLEAR",
	/**
	* The serie generation is starting.
	*/
	STARTING: "STARTING",
	/**
	* The serie generation is running.
	*/
	RUNNING: "RUNNING",
	/**
		* The serie generation is complete.
	*/
	COMPLETED: "COMPLETED"
};		