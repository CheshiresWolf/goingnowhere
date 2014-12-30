var basepath = "images/scenes/dungeon/";

var tiles = [
    { name : "b0.png", tileMap : [  0,  1,  0,  1, 0,  1,  0,  1,  0] },
    { name : "q0.png", tileMap : [ -1,  1, -1,  0, 0,  1,  0,  0, -1] },
    { name : "q1.png", tileMap : [  0,  0, -1,  0, 0,  1, -1,  1, -1] },
    { name : "q2.png", tileMap : [ -1,  0,  0,  1, 0,  0, -1,  1, -1] },
    { name : "q3.png", tileMap : [ -1,  1, -1,  1, 0,  0, -1,  0,  0] },
    { name : "t0.png", tileMap : [ -1,  1, -1,  1, 0,  1, -1, -1, -1] },
    { name : "t1.png", tileMap : [ -1,  1, -1, -1, 0,  1, -1,  1, -1] },
    { name : "t2.png", tileMap : [ -1, -1, -1,  1, 0,  1, -1,  1, -1] },
    { name : "t3.png", tileMap : [ -1,  1, -1,  1, 0, -1, -1,  1, -1] },
    { name : "e0.png", tileMap : [ -1,  1, -1, -1, 0, -1, -1, -1, -1] },
    { name : "e1.png", tileMap : [ -1, -1, -1, -1, 0,  1, -1, -1, -1] },
    { name : "e2.png", tileMap : [ -1, -1, -1, -1, 0, -1, -1,  1, -1] },
    { name : "e3.png", tileMap : [ -1, -1, -1,  1, 0, -1, -1, -1, -1] }
];

function formArray(direction) {
	var res = [];
	var directionIndex = 0;

	switch (direction) {
		case "top" :
			directionIndex = 7;
		break;
		case "right" :
			directionIndex = 3;
		break;
		case "left" :
			directionIndex = 5;
		break;
		case "bottom" :
			directionIndex = 1;
		break;
	}

	for (var i = 0; i < tiles.length; i++) {
		if (tiles[i].tileMap[directionIndex] == 1) {
			res.push(tiles[i]);
		}
	}

	return res;
}

function getRandomFromArray(array) {

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return array[getRandomInt(0, array.length - 1)];
}

module.exports = {
	getRandomTile : function(direction) {
		if (direction == undefined) {
			return getRandomFromArray(tiles);
		} else {
			return getRandomFromArray(formArray(direction));
		}
	},
	getRandomRestrictedTile : function(restrictions) {
		var res = [];

		for (var i = 0; i < tiles.length; i++) {
			if ( rule(restrictions, tiles[i]) ) {
				res.push(tiles[i]);
			}
		}

		Ti.API.debug("TileChooser | getRandomRestrictedTile | restrictions : ", restrictions);//, "; res : ", res);
		return getRandomFromArray(res);

		/* restrictions [ (-1 / 0 / 1), (...), (...), (...) ]
		 * -1 : in this direction can be anything
		 *  0 : only wall or empty
		 *  1 : only door
		 */
		function rule(restrictions, tile) {

			var res0 = false;
			switch (restrictions[0]) {
				case -1 :
					res0 = true;
				break;
				case 0 :
					res0 = (tile.tileMap[1] != 1) ? true : false;
				break;
				case 1 :
					res0 = (tile.tileMap[1] == 1) ? true : false;
				break;
			}

			var res1 = false;
			switch (restrictions[1]) {
				case -1 :
					res1 = true;
				break;
				case 0 :
					res1 = (tile.tileMap[5] != 1) ? true : false;
				break;
				case 1 :
					res1 = (tile.tileMap[5] == 1) ? true : false;
				break;
			}

			var res2 = false;
			switch (restrictions[2]) {
				case -1 :
					res2 = true;
				break;
				case 0 :
					res2 = (tile.tileMap[7] != 1) ? true : false;
				break;
				case 1 :
					res2 = (tile.tileMap[7] == 1) ? true : false;
				break;
			}

			var res3 = false;
			switch (restrictions[3]) {
				case -1 :
					res3 = true;
				break;
				case 0 :
					res3 = (tile.tileMap[3] != 1) ? true : false;
				break;
				case 1 :
					res3 = (tile.tileMap[3] == 1) ? true : false;
				break;
			}

			//Ti.API.debug("TileChooser | getRandomRestrictedTile | rule : ", restrictions, "; tileMap : ", tile.tileMap, "; result : ", res);

			return res0 && res1 && res2 && res3;
		}
	}
};