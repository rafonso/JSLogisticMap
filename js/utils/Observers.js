// Implementation of Observer pattern
"use strict";


function toObservable(obj) {

	var observers = [];

	var observer = {
		set: function (obj, prop, value) {
			let result = true;
			let oldValue = obj[prop];

			if (oldValue != value) {
				result = Reflect.set(obj, prop, value);

				let event = { target: obj, property: prop, oldValue: oldValue, newValue: value };
				observers.forEach((f) => f(event));
			}

			return result;
		}
	};

	return Object.assign(new Proxy(obj, observer), {
		addObserver: function (f) {
			observers.push(f);
			return f;
		},
		removeObserver(f) {
			let fIndex = observers.findIndex((o) => (o === f));
			observers.splice(fIndex, 1);
		},
		toString() {
			return obj.toString();
		}
	});
}
