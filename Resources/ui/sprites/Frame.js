var _      = require("/lib/Underscore");
var game2d = require("com.ti.game2d");

var debug = Ti.App.deployType !== "production";

var sides = [
	"nw", "n", "ne",
	 "w", "c",  "e",
	"sw", "s", "se"
];

function validatedState(s) {
	return s ? s + "_" : "";
}

function defined(/*arguments*/) {
	var a = Array.prototype.slice.call(arguments);
	for (var i = 0; i < a.length; i++) if (a[i] !== undefined) return a[i];
}



var android = !!Ti.Android;
function applyProperties(obj, props) {
	if (android) {
		for (var key in props) obj[key] = props[key];
	} else {
		obj.applyProperties(props);
	}
}



/**
 * Creates a 9-patch-like frame, based on xml + image.
 * Xml should has frames "nw", "n", "ne", "w", "c", "e", "sw", "s", "se" with
 * optional prefixes, which can be choosen later using `setState`
 *
 * @param {LoadableScene} scene Scene to add frame to
 * @param {Object} params
 * @param {String} params.filename Path to an xml, related to Resources folder
 * @param {Number} [params.left]
 * @param {Number} [params.top]
 * @param {Number} [params.z]
 * @param {Number} [params.width]
 * @param {Number} [params.height]
 * @param {String} [params.state] Prefix of patches to use (i.e. "pressed", "active")
 * @param {Object} [params.loadedData] Value to pass to view
 * @param {Float} [params.angle]
 * @param {Boolean} [params.draggable]
 * @param {Boolean} [params.hidden]
 * @param {String} [params.state]
 * @param {Float} [scaleX] If omitted, will use scene.game.scaleX or scene.scaleX
 * @param {Float} [scaleY] If omitted, will use scene.game.scaleY or scene.scaleY
 *
 * @property {Sprite} view Parent sprite
 *
 * @method resize
 *     Takes new coordinates. Consider they'll be
 *     scaled by values defined at creating moment.
 * @param {Object} params
 * @param {Number} params.left
 * @param {Number} params.top
 * @param {Number} params.width
 * @param {Number} params.height
 * 
 * @method setState
 * @param {String} state
 * 
 * @method unload
 */
function Frame(scene, params, scaleX, scaleY) {

	var self = this;

	// ===== Public fields =====
	
		self.view = null; // transparent parent sprite to manipulate

	// =========================

	// ===== Public methods =====

		this.resize = function(params) {

			params = _.clone(params);
			if (params.left !== undefined) {
				params.x = params.left;
				delete params.left;
			}
			if (params.top !== undefined) {
				params.y = params.top;
				delete params.top;
			}
			if (params.x !== undefined) params.x *= scaleX;
			if (params.y !== undefined) params.y *= scaleY;
			if (params.width  !== undefined) params.width  *= scaleX;
			if (params.height !== undefined) params.height *= scaleY;

			var paddingLeft   = patch.w.width  * scaleX;
			var paddingTop    = patch.n.height * scaleY;
			var paddingRight  = patch.e.width  * scaleX;
			var paddingBottom = patch.s.height * scaleY;

			var centerWidth   = patch.c.width  * scaleX;
			var centerHeight  = patch.c.height * scaleY;

			_.defaults(params, {
				width:  paddingLeft + centerWidth  + paddingRight,
				height: paddingTop  + centerHeight + paddingBottom
			});

			// Size of center patch to reach
			var cw = params.width  - paddingLeft - paddingRight;
			var ch = params.height - paddingTop  - paddingBottom;

			applyProperties(self.view, params);

			sides.forEach(function(e, n) {

				var p = patch[e];

				// position index
				var i = n % 3;
				var j = (n / 3) | 0;

				// offset
				var x = 0, y = 0;

				if (i > 0) { x += paddingLeft; }
				if (i > 1) { x += cw; }
				x |= 0;

				if (j > 0) { y += paddingTop; }
				if (j > 1) { y += ch; }
				y |= 0;

				var sX = scaleX * ((i === 1) ? (cw / centerWidth ) : 1);
				var sY = scaleY * ((j === 1) ? (ch / centerHeight) : 1);

				p.move(x, y);
				applyProperties(p, {
					anchorPoint: { x: 0, y: 0 },
					scaleX: sX,
					scaleY: sY
				});

			});

		};
	
		this.setState = function(state) {

			state = validatedState(state);
			sides.forEach(function(e) {
				patch[e].selectFrame(state + e);
			});

		};

		this.unload = function() {

			scene.removeBatch(
				[self.view].concat(
					sides.map(function(e) {
						return patch[e];
					})
				)
			);

		};

	// ==========================

	// ===== Private fields =====

		var scene = scene;

		var patch = {}; // spritesheet patches
		
	// ===========================


	// ===== Init =====
	
		(function init() {

			var g = scene.game || {};
			scaleX = defined(scaleX, scene.scaleX, g.scaleX, 1);
			scaleY = defined(scaleY, scene.scaleY, g.scaleY, 1);

			switch(true) {
				case (!scene):
					debug && console.error("Scene for creating frame not specified");
					return;
				case (!params || !params.filename):
					debug && console.error("Couldn't create frame: no filename specified");
					return;
			}

			_.defaults(params, {
				left: 0,
				top:  0,
				z: 0,
				width:  1 * scaleX,
				height: 1 * scaleY,
				draggable: false,
				angle: 0,
				hidden: false
			});

			// create transparent placeholder
			self.view = game2d.createSprite({
				image: "images/clear.png",
				x: scaleX * params.left,
				y: scaleY * params.top,
				z: params.z,
				width:  scaleX * params.width,
				height: scaleY * params.height,
				loadedData: params.loadedData,
				draggable: !!params.draggable,
				alpha: params.hidden ? 0 : 1,
				angle: params.angle
			});

			// ===== Create patches =====
			
				var state = validatedState(params.state);

				sides.forEach(function(e) {

					var p = game2d.createSpriteSheet({
						image: params.filename,
						z: params.z + 1
					});

					p.selectFrame(state + e);

					patch[e] = p;

					self.view.addChildNode(patch[e]);

				});

			// ==========================

			self.resize({
				left: params.left,
				top:  params.top,
				width:  params.width,
				height: params.height
			});

			scene.addBatch(
				[self.view].concat(
					sides.map(function(e) {
						return patch[e];
					})
				)
			);

		})();

	// ================

}

module.exports = Frame;