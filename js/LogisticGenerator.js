const READY = Symbol("Ready");
const RUNNING = Symbol("Running");


class LogisticGenerator {
	
	constructor(parameters = new LogisticParameters()) {
		this.parameters = toObservable(parameters);
		this.values = toObservable([]);
		this.status = READY;
		
		this.parameters.addObserver((evt) => this.generate());
	}
	
	generate() {
		this.status = RUNNING;
		
		this.values.splice(0, this.values.length);
		_.range(0, this.parameters.iteractions).reduce((x) => {
			this.values.push(x);
			return this.parameters.r * x * (1 - x);
		}, this.parameters.x0);
		
		this.status = READY;
	}
	
}


class Foo {
	
	constructor() {
		this.value = 1;
		this.status = READY;
	}
	
	bar() {
		this.status = RUNNING;	
		console.log("bar", this.status );
		this.value = this.value + 10;
		this.status = READY;
		console.log("bar", this.status );
	}
	
}

let foo = toObservable(new Foo());

foo.addObserver((evt) => console.log(`${evt.target.toString()}.${evt.property}: ${evt.oldValue} -> ${evt.newValue}`));

