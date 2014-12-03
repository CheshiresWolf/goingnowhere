var should = require("tests/should");

function Test() {
	var self = this;

	self.testMap = function() {
		describe('Map.js', function () {
			it('must exists.', function () {
				var Map = require("ui/scenes/Map");

				should.exists(Map);
			});
		});

		// run the tests
    	mocha.run();
	}

	return self;
};

module.exports = new Test();