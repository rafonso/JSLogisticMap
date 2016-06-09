const xMin = 0.0;
const xMax = 1.0;
const rMin = 0.0;
const rMax = 4.0;

class LogisticParameters {
	
	constructor(r = 1.00, x0 = 0.50, iteractions = 100) {
		this.r = r;
		this.x0 = x0;
		this.iteractions = iteractions;
	}

}