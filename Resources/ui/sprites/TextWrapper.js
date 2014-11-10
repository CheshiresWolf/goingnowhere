var _     = require("/lib/Underscore");
var Frame = require("/ui/sprites/Frame");

var debug = Ti.App.deployType !== "production";

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

/*
 * params:
 *   filename: optional .xml or image for custom skin
 *   left
 *   top
 *   z
 *   width
 *   height
 *   paddingLeft
 *   paddingTop
 *   paddingRight
 *   paddingBottom
 *   closeButtonDx
 *   closeButtonDy
 *   hidden
 */
function TextWrapper(scene, game, params, onClose, scaleX, scaleY) {

	var self = this;

	// ===== Public fields =====
	
		// transparent parent to manipulate
		self.view = null;
		self.closeButton = null;
		
	// =========================

	// ===== Public methods =====

		this.resize = function(params) {

			var newRect = {
				x: params.x - params.paddingLeft,
				y: params.y - params.paddingTop,
				width:  params.paddingLeft + params.width  + params.paddingRight,
				height: params.paddingTop  + params.height + params.paddingBottom
			};

			if (frame) {
				frame.resize(newRect);
			} else {
				image && applyProperties(image, newRect);
			}

			self.closeButton.move(
				newRect.width * scaleX - self.closeButton.width + closeButtonDx,
				closeButtonDy
			);

		};
	
		this.unload = function() {

			frame && frame.unload();
			frame = null;

			image && scene.remove(image);
			image = null;

			scene.remove(self.closeButton);

		};
		
	// ==========================

	// ===== Private fields =====
	
		var scene = scene;
		var game  = game;

		var frame, image;

		var closeButtonDx, closeButtonDy;
		
	// ==========================

	// ===== Init =====
	
		(function init() {

			if (!scene) {
				debug && console.error("Scene for creating text wrapper not specified");
				return;
			}

			var g = scene.game || {};
			scaleX = defined(scaleX, scene.scaleX, g.scaleX, 1);
			scaleY = defined(scaleY, scene.scaleY, g.scaleY, 1);

			_.defaults(params, {
				filename: "images/scenes/common/textWrapper/textWrapper.xml",
				left: 0,
				top:  0,
				z: 100,
				width:  100 * scaleX,
				height: 100 * scaleY,
				paddingLeft:   10 * scaleX,
				paddingTop:    10 * scaleY,
				paddingRight:  10 * scaleX,
				paddingBottom: 10 * scaleY,
				closeButtonDx: -0 * scaleX,
				closeButtonDy:  5 * scaleY,
				hidden: false
			});

			closeButtonDx = params.closeButtonDx;
			closeButtonDy = params.closeButtonDy;

			var w = params.paddingLeft + params.width  + params.paddingRight;
			var h = params.paddingTop  + params.height + params.paddingBottom;

			// console.debug("creating wrapper with params", params, w, h);

			if (!params.filename && params.sprite) {

				scene.add(self.view = image = params.sprite);
				
			} else {

				var obj = {
					filename: params.filename,
					left: params.left - params.paddingLeft,
					top:  params.top  - params.paddingTop,
					width:  w,
					height: h,
					z: params.z,
					hidden: !!params.hidden
				};

				if (params.filename.match(/\.xml$/)) {

					frame = new Frame(scene, obj, scaleX, scaleY);

					self.view = frame.view;

				} else {

					obj.image = obj.filename;
					delete obj.filename;

					if (obj.hidden) obj.alpha = 0;
					if (obj.left)   obj.x = obj.left;
					if (obj.top)    obj.y = obj.top;

					scene.add(self.view = image = game.createSprite(obj));

					// scale image?

				}

			}

			self.closeButton = game.createSprite({
				image: "images/scenes/common/close_text.png",
				x: closeButtonDx + self.view.width,
				y: closeButtonDy,
				z: params.z + 3,
				touchEnabled: true,
			});
			self.closeButton.width  *= scaleX;
			self.closeButton.height *= scaleY;
			self.closeButton.x -= self.closeButton.width;

			self.closeButton.addEventListener("singletap", onClose);
			self.view.addChildNode(self.closeButton);

			scene.add(self.closeButton);

		})();
		
	// ================

}

module.exports = TextWrapper;