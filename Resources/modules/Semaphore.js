function Semaphore(func) {

	var counter = -1;
	var callback = func;


	this.increase = function(msg) {
		// console.debug("semaphore increase:", msg);
		if (counter === -1) {
			counter = 1;
		} else {
			counter++;
		}
	};


	this.decrease = function(msg) {
		// console.debug("semaphore decrease:", msg);
		// if (counter <= 0) console.log("Semaphore went negative");
		counter -= 1;
		if (counter === 0 && typeof callback === "function") {
			callback();
		}
	};


	this.setCallback = function(func) {
		callback = func;
		if (counter === 0 && typeof callback === "function") {
			callback();
		}
	};


	this.getCounter = function() {
		return counter;
	};

}



module.exports = Semaphore;