var fs = require('fs');
var pathLib = require('path'); 

var filePath = process.argv[2];

var specialRules = [
	{ name : 1,  connected : [0,  2,  7 ] },
	{ name : 15, connected : [14, 16, 20] },
	{ name : 25, connected : [24, 26, 34] },
	{ name : 30, connected : [29, 31, 41] },
	{ name : 34, connected : [25, 26, 35] }
];

if (filePath) {
	fs.readFile(filePath, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}

		console.log("File read was sucess.");

		var pathIn = JSON.parse(data);

		for (var i in pathIn.path) {
			check(pathIn.path[i]);
		}

		var pathOut = JSON.stringify(pathIn, null, 4);
		
		fs.writeFile(filePath, pathOut, function (err2) {
			if (err2) {
				return console.log(err2);
			}

			console.log(filePath + " was rewrited.");
		});
	});
}

function commonRule(dot, index) {
	dot.connected = [index - 1, index + 1];
}

function specialRule(dot, rule) {
	for (var key in rule) {
		dot[key] = rule[key];
	}
}

function check(dot) {
	for (var i in specialRules) {
		if (specialRules[i].name == dot.name) {
			specialRule(dot, specialRules[i]);
			return;
		}
	}

	commonRule(dot, dot.name);
}