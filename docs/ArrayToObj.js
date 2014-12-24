var fs = require('fs');
var pathLib = require('path'); 

var filePath = process.argv[2];

if (filePath) {
	fs.readFile(filePath, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}

		console.log("File read was sucess.");

		var pathIn = JSON.parse(data);

		var result = {};

		var bufObj, name;
		for (var i in pathIn.path) {
			name = pathIn.path[i].name;
			bufObj = pathIn.path[i];
			delete bufObj["name"];

			result[ name ] = bufObj;
		}

		var pathOut = JSON.stringify(result, null, 4);
		
		fs.writeFile(filePath, pathOut, function (err2) {
			if (err2) {
				return console.log(err2);
			}

			console.log(filePath + " was rewrited.");
		});
	});
}