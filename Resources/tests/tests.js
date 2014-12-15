var should = require("tests/should");

function Test() {
	var self = this;

	self.testMap = function(opts) {
		describe('Map.js', function () {
			it('must exists and', function () {
				should.exists(opts.self);
			});
			it('background are created.', function () {
				should.exists(opts.background);
			});
		});

		describe("Pointer", function() {
			it("must exists and", function() {
				should.exists(opts.pointer);
			});
		});

		// run the tests
    	mocha.run();
	}

	return self;
};

module.exports = new Test();