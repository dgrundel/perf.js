var perf = function(testName) {
	this.testName = testName;
	this.formattedTestName = '<span class="testName">' + testName + '</span>';
	this.iterations = perf.config.defaultIterations;
	this.setups = [];
	this.tests = [];
	this.teardowns = [];
	this.lastRunTime = 0;
	this.hasErrors = false;
	this.errors = {};
	
	return this;
};

perf.prototype.setIterations = function(iterations) {
	this.iterations = iterations;
	return this;
};

perf.prototype.test = function(callback) {
	this.tests.push(callback);
	return this;
};

perf.prototype.setup = function(callback) {
	this.setups.push(callback);
	return this;
};

perf.prototype.teardown = function(callback) {
	this.teardowns.push(callback);
	return this;
};

perf.prototype.addError = function(type, message) {
	this.hasErrors = true;
	this.errors[type] = this.errors[type] || [];
	this.errors[type].push(message);
};

perf.prototype.clearErrors = function() {
	this.hasErrors = false;
	this.errors = {};
};

perf.prototype.run = function() {
	var thisPerf = this;
	var t0;
	var t1;
	var namespace = {};
	var error = false;
	var runAll = function(type, arrayOfFunctions) {
		for(var i = 0, l = arrayOfFunctions.length; i < l; i++) {
			try {
				arrayOfFunctions[i](namespace);
			} catch(e) {
				onError(type, e);
				return false;
			}
		}
	};
	var onError = function(type, error) {
		var errorMessage = 'Unknown error.';
		if(error.message) {
			errorMessage = error.message;
		} else if(typeof e === 'string') {
			errorMessage = e;
		}

		perf.log(errorMessage, 'error');
		thisPerf.addError(type, errorMessage);
	};

	this.clearErrors();
	
	if(runAll('setup', this.setups) === false) {
		perf.log('Exception thrown in setup, ' + this.formattedTestName + ' ended prematurely.', 'alert');
	}

	if(!this.hasErrors) {
		t0 = performance.now();
		for(var iterationIndex = 0; iterationIndex < this.iterations; iterationIndex++) {
			if(runAll('test', this.tests) === false) {
				perf.log('Exception thrown in test, ' + this.formattedTestName + ' ended prematurely.', 'alert');
				break;
			}
		}
		t1 = performance.now();
	}

	if(!this.hasErrors) {
		if(runAll('teardown', this.teardowns) === false) {
			perf.log('Exception thrown in teardown, ' + this.formattedTestName + ' ended prematurely.', 'alert');
		}
	}

	if(!this.hasErrors) {
		this.lastRunTime = (t1 - t0);
		perf.log(this.formattedTestName + ' (x ' + this.iterations + ') <span class="time">' + this.lastRunTime.toFixed(8) + ' ms</span>');
	}

	return this;
};

perf.log = function(message, cssClass) {
	if(perf.config.logNode) {
		var messageNode = document.createElement('li');
		if(cssClass) {
			messageNode.className = cssClass;
		}
		messageNode.innerHTML = (message + '').replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
		perf.config.logNode.appendChild(messageNode);
	}

	return this;
};

perf.compare = function() {
	var fastest = null;
	for(var i = 0, l = arguments.length; i < l; i++) {
		if(typeof arguments[i] === 'string') {
			perf.log(arguments[i], 'note');

		} else {
			if(arguments[i].lastRunTime === 0) {
				arguments[i].run();
			}
			if(fastest === null || arguments[i].lastRunTime < fastest.lastRunTime) {
				fastest = arguments[i];
			}
		}
	}

	if(fastest) {
		perf.log(fastest.formattedTestName + ' is fastest.', 'result');
	}
	return fastest;
};

perf.config = {
	defaultIterations: 500000,
	logNode: document.getElementById('testLog')
};