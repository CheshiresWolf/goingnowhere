var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');
var BounceAnimation = require("modules/AnimationHelper").BounceAnimation;

var android = !!Ti.Android;
function applyProperties(obj, props) {
	if (android) {
		for (var key in props)
		obj[key] = props[key];
	} else {
		obj.applyProperties(props);
	}
}

module.exports = {
	init : function(scene) {
		var game = scene.game;
		/////////////

		scene.after = function(transform, func) {
			transform.addEventListener('complete', func);
		};
		scene.afterStartAnimation = function(func) {
			scene.addEventListener('startAnimationFinished', func);
		};
		scene.isArray = function(inputArray) {
			return ( typeof inputArray == "object") && ( inputArray instanceof Array);
		};
		scene.makeDroppable = function(arr) {
			for (var i = 0; i < arr.length; i++) {
				scene['onClick_' + arr[i]] = function(e) {
					scene.copyBodyBySprite(e.sprite);
					e.sprite.hide();
				};
			};
		};
		//INVOKE SEVERAL TRANSFORMS
		scene.batchTransforms = function(s, arr, afterFunc) {
			//CHECK FOR ARRAY

			var spriteArray = false;
			if (scene.isArray(s)) {
				if (s.length == arr.length) {
					spriteArray = true;
				} else {
					//Ti.API.info('Error:batchTransforms -> arrays length isn\'t equal');
					return;
				}
			};

			//EVERY NEW TR
			var nextSprite = s;
			for (var i = 0; i < arr.length; i++) {
				if (!arr[i + 1]) {
					scene.after(arr[i], function() {
						if (afterFunc) {
							afterFunc();
						}
					})
					break;
				}
				(function(i) {
					scene.after(arr[i], function() {
						if (spriteArray) {
							nextSprite = s[i + 1];
						}
						nextSprite.transform(arr[i + 1]);
					})
				})(i)
			};
			//FIRST TR
			if (spriteArray) {
				nextSprite = s[0];
			}

			nextSprite.transform(arr[0]);
		};

		scene.copyBodyBySprite = function(sprite, opts) {

			opts = opts || {};

			var new_sprite = game2d.createSprite({
				image : sprite.image,
				width : sprite.width,
				height : sprite.height,
				x : opts.x !== undefined ? opts.x : sprite.x,
				y : opts.y !== undefined ? opts.y : sprite.y,
				z : 50,
				loadedData : sprite.loadedData
			});

			scene.add(new_sprite);

			var oRef = game.world.addBody(new_sprite, {
				density : opts.density !== undefined ? opts.density : 3.5,
				friction : 0.5,
				restitution : 0.5,
				radius : opts.radius !== undefined ? opts.radius : null,
				type : "dynamic",
				filter : 1,
				maskBits : 1
			});

			// XXX
			// Get rid of this, but aware of back compability >_>
			new_sprite.draggable = true;
			new_sprite.mouseJoint = true;

			return [new_sprite, oRef];

		};

		scene.copySprite = function(sprite) {
			var new_sprite = game2d.createSprite({
				width : sprite.width,
				height : sprite.height,
				x : sprite.x,
				y : sprite.y,
				image : sprite.image
			});
			scene.add(new_sprite);
			new_sprite.loadedData = sprite.loadedData;
			return new_sprite;
		}
		//MAKE BODY
		scene.makeBodyForSprite = function(sprite, opts) {
			if (!opts) {
				opts = {};
			}

			sprite.draggable = true;
			sprite.mouseJoint = true;

			var oRef = game.world.addBody(sprite, {
				density : opts.density || 3.5,
				friction : 0.5,
				restitution : 0.5,
				radius : opts.radius || null,
				type : "dynamic",
				filter : 1,
				maskBits : 1
			});

			return oRef;
		};

		scene.bounce = function(sprite, jump) {
			if (!sprite)
				return;
			var jump = jump || 20,
			    B = 0.005;
			sprite.bounceAnimation = new BounceAnimation(sprite, jump, B, game.scaleY);
			sprite.bounceAnimation.start();
		};

		//SWAY OBJECT
		scene.sway = function(s, opts) {
			var opts = opts || {};

			var trReset = scene.createTransform({
				rotate_centerX : opts.rotate_centerX || s.width / 2,
				rotate_centerY : opts.rotate_centerY || s.height,
				angle : 0,
			});

			s.clearTransforms();
			s.transform(trReset);

			//Ti.API.info('sway', s.loadedData.name);
			var tr = scene.createTransform({
				rotate_centerX : opts.rotate_centerX || s.width / 2,
				rotate_centerY : opts.rotate_centerY || 0,
				angle : opts.angle_left || -5,
				duration : (opts.duration) ? opts.duration / 2 : 100
			});
			var trBack = scene.createTransform({
				rotate_centerX : opts.rotate_centerX || s.width / 2,
				rotate_centerY : opts.rotate_centerY || 0,
				angle : opts.angle_right || 5,
				duration : opts.duration || 200,
				repeat : opts.repeat || 2,
				autoreverse : opts.reverse || 1
			});
			var trFinish = scene.createTransform({
				rotate_centerX : opts.rotate_centerX || s.width / 2,
				rotate_centerY : opts.rotate_centerY || 0,
				angle : 0,
				duration : (opts.duration) ? opts.duration / 2 : 100
			});
			scene.after(tr, function() {
				s.transform(trBack);

				scene.after(trBack, function() {
					s.transform(trFinish);

					scene.after(trFinish, opts.callback ||
					function() {
					});
				});
			});

			s.transform(tr);
		};
		//...
		scene.applyToSubs = function(parent, opts) {
			if (!parent || !parent.loadedData.supersprite) {
				//Ti.API.info('not a supersprite for action');
				return;
			}

			for (var name in parent.loadedData.childNames) {
				var s = scene.spriteByName(parent.loadedData.childNames[name]);
				if (s && s.loadedData) {
					for (var o in opts) {
						s[o] = opts[o];
					}
				}
			};
		};
		//...
		scene.applyToSubsTransform = function(parent, opts, callback) {
			if (!parent || !parent.loadedData.supersprite) {
				//Ti.API.info('not a supersprite for action');
				return;
			}

			var counter = 0;
			for (var name in parent.loadedData.childNames) {
				var s = scene.spriteByName(parent.loadedData.childNames[name]);
				scene.eTransform(s, opts, function() {
					if (++counter == parent.loadedData.childNames) {
						callback();
					}
				});
			};
		};

		var singleTransformsArray = [];
		scene.singleTransform = function(sprite, opts, callback) {
			if (!sprite || !opts) {
				return;
			}

			if (!(opts.name)) {
				Ti.API.debug("SceneHelpers | scene.singleTransform | error : name doesn't set");
				return;
			}

			var tr = null;
			for (var key in singleTransformsArray) {
				if (singleTransformsArray[key].name == opts.name) {
					tr = singleTransformsArray[key];
					break;
				}
			}

			if (tr == null) {
				tr = scene.createTransform(opts);
				tr.name = opts.name;
				singleTransformsArray.push(tr);
			}

			_.extend(tr, opts);

			if (callback != undefined) {
				tr.addEventListener('complete', transformCallback);
			}
			sprite.transform(tr);

			function transformCallback() {
				tr.removeEventListener('complete', transformCallback);
				callback();
			}

		};
		//EASY TRANSFORM
		scene.eTransform = function(sprite, opts, callback) {
			if (!sprite || !opts) {
				//Ti.API.info('eTransform: params error');
				return;
			}
			var callback = callback ||
			function() {
			};
			if (sprite.draggable) {
				sprite.draggable = false;
				opts.isDraggable = true;
			}

			var customCallback = function() {
				if (opts.isDraggable) {
					sprite.draggable = true;
					delete opts.isDraggable;
				}

				if (callback) {
					callback();
				}
			};

			var tr = scene.createTransform(opts);
			scene.after(tr, customCallback);
			sprite.transform(tr);
			/*if (!sprite || !opts) {
			 //Ti.API.info('eTransform: params error');
			 return;
			 }
			 var callback = callback ||
			 function() {
			 };

			 var tr = scene.createTransform(opts);
			 scene.after(tr, callback);
			 sprite.transform(tr);*/
		};
		//AUTOREBERSE & DELAY TRANSFORM
		scene.rdTransform = function(sprite, opts, delay, callback) {
			if (!sprite || !opts) {
				//Ti.API.info('rdTransform: params error');
				return;
			}
			var delay = delay || 1000;
			var callback = callback ||
			function() {
			};

			var tr = scene.createTransform(opts);
			var trBack = scene.createTransform({
				angle : 0,
				rotate_centerX : opts.rotate_centerX || sprite.width / 2,
				rotate_centerY : opts.rotate_centerY || sprite.height / 2,
				scaleX : 1,
				scaleY : 1,
				scale_centerX : opts.scale_centerX || sprite.height / 2,
				scale_centerY : opts.scale_centerY || sprite.height / 2,
				x : (sprite.parentX) ? sprite.loadedData.left + sprite.parentX : sprite.loadedData.left,
				y : (sprite.parentX) ? sprite.loadedData.top + sprite.parentY : sprite.loadedData.top,
				duration : opts.duration || 0
			});

			scene.batchTransforms(sprite, [tr, scene.createTransform({
				delay : delay
			}), trBack], callback);
		};

		//PSEUDOSCALE
		scene.pseudoScale = function(sprite, e, name, offset, x, duration) {
			var duration = (duration || duration == 0) ? duration : 500;

			//Ti.API.info('width', sprite.width, x)

			scene.eTransform(sprite, {
				x : sprite.x + offset.x * x - sprite.width / 2,
				y : sprite.y + offset.y * x - sprite.height / 2,
				width : sprite.loadedData.width * x,
				height : sprite.loadedData.height * x,
				duration : duration,
				easing : game2d.ANIMATION_CURVE_EASE_OUT
			}, function() {
				sprite.pseudoScale = x;
			});
			//Ti.API.info('widthAfter', sprite.width, x)
			scene.scaleDragOffset(name, 2, 2);
		};

		scene.simpleScale = function(sprite, x, y) {
			var y = y || x;
			scene.eTransform(sprite, {
				width : sprite.loadedData.width * x,
				height : sprite.loadedData.height * y,
			});
		};

		//shuffle array)
		scene.shuffle = function(o) {//v1.0
			for (var j,
			    x,
			    i = o.length; i; j = parseInt(Math.random() * i),
			x = o[--i], o[i] = o[j], o[j] =
			x);
			return o;
		};

		// http://stackoverflow.com/questions/11716268/point-in-polygon-algorithm
		// scale is ratio of point coords scale to poly coords scale
		scene.isPointInPoly = function(poly, point, scaleX, scaleY) {

			var sx = scaleX !== undefined ? scaleX : scene.scaleX;
			var sy = scaleY !== undefined ? scaleY : scene.scaleY;

			var testX = point.x / sx;
			var testY = point.y / sy;

			var length = poly.length;

			var result = false;

			// ray-casting to the right
			for (var i = 0,
			    j = length - 1; i < length; j = i++) {

				var pix = poly[i][0];
				var piy = poly[i][1];

				var pjx = poly[j][0];
				var pjy = poly[j][1];

				if (((piy > testY) != (pjy > testY)) && (testX < (pjx - pix) * (testY - piy) / (pjy - piy) + pix)) {
					result = !result;
				}

			}

			return result;

		};

		scene.lengthOf = function(x1, y1, x2, y2) {
			return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
		};

		scene.middleOf = function(x1, y1, x2, y2) {
			return {
				x : Math.round((x2 + x1) / 2),
				y : Math.round((y2 + y1) / 2)
			};
		};

		scene.enlargeSpriteTouchZone = function(sprite, width, height) {
			if (width === undefined)
				width = 100 * scene.scaleX;
			if (height === undefined)
				height = 100 * scene.scaleY;
			var newSprite = game2d.createSprite({
				image : "images/clear.png",
				x : (sprite.loadedData.width - width) / 2,
				y : (sprite.loadedData.height - height) / 2,
				width : width,
				height : height,
				z : sprite.z,
				tapTarget : sprite.loadedData.name,
				dragTarget : sprite.loadedData.name,
				loadedData : {
					tapTarget : sprite.loadedData.name,
					dragTarget : sprite.loadedData.name
				}
				// image: "images/clearb.png",
				// alpha: 0.25
			});
			sprite.addChildNode(newSprite);
			scene.add(newSprite);
		};

		/*
		 * Turns raw points to scene coords (0..1024, 0..768)
		 * Supports retina and camera movement (only movement)
		 *
		 * @points
		 *   object with points fields
		 */
		scene.screenToScene = function(points) {
			var camera = scene.game.camera;
			var screen = scene.game.screen;
			var dx = camera.centerX - (screen.width / 2);
			var dy = (screen.height / 2) - camera.centerY;
			var scale = scene.isRetina ? 2 : scene.isRetinaHD ? 3 : 1;
			
			for (var point in points) {
				var p = points[point];
				p.hudX = p.x * scale;
				p.hudY = p.y * scale;
				p.x = p.hudX + dx;
				p.y = p.hudY - dy;
			}
			return points;
		};

		/*
		 * Returns object - modified array with all childs and fields to them,
		 * using ComTiBox2dBody if available or ComTi2dSprite otherwise
		 * May not work properly if partNames contains names made of numbers only
		 *
		 * @partNames: Array[String]
		 *     - array of names of its childs, without parent's prefix if any
		 *
		 * @subsprite: ComTiGame2dSprite OR String
		 *     - Optional, the subsprite or its name
		 *
		 * Usage example:
		 *
		 *     // Assuming that we have subsprite "goat", made of head, body,
		 *     // 2 hands and 2 legs:
		 *
		 *     var goat, goatParts;
		 *     goatParts = scene.linkParts([
		 *             "body", "handLeft", "handRight",
		 *             "legLeft", "legRight", "head"
		 *         ],
		 *         goat = scene.spriteByName("goat")
		 *     );
		 *
		 *     // Now we can work with it as with array:
		 *     goatParts.forEach(...);
		 *
		 *     // Or using fields:
		 *     goatParts.handLeft.type = "dynamic";
		 *
		 */

		scene.linkParts = function(partNames, subsprite) {

			var result = [];
			var prefix = subsprite ? ((( typeof subsprite === "string") ? subsprite : subsprite.loadedData.name
			) + "_"
			) : "";

			partNames.forEach(function(e) {
				var name = prefix + e;
				result.push(result[e] = scene.bodyByName(name) || scene.spriteByName(name));
			});

			return result;

		};

		/*
		 * params:
		 *   file:    required field, url to pex file
		 *   name:    required field, a unique name for the particles
		 *   x:       X coord, relative to sprite if any
		 *   y:       Y coord, relative to sprite if any
		 *   z:       Z index
		 *   alpha:   transparency (0..1)
		 *   follow:  sprite to follow // or box2d body to pin - not working yet
		 *   timeout: time in ms to destroy the particle generator
		 *   loadedData
		 */
		scene.createParticles = function(params) {

			switch(false) {

			case (params):
				// console.error("Can't create particles without parameters");
				return;

			case (params.file):
				// console.error("File for particles not specified", params);
				return;

			case (params.name):
				// console.error("name for particles isn't provided", params);
				return;

			}

			_.defaults(params, {
				x : 0,
				y : 0,
				z : 0,
				alpha : 1
			});

			var x = params.x;
			var y = params.y;
			var target,
			    followTarget;

			if (params.follow) {
				target = params.follow.view || params.follow;
				x += target.x;
				y += target.y;
			}

			var sprite = game2d.createParticles({
				x : x,
				y : y,
				z : params.z,
				alpha : params.alpha,
				image : params.file,
				loadedData : params.loadedData
			});

			sprite.scaleFromCenter(scene.scaleX, scene.scaleY, 0, 0);

			// if (scene.isRetina) {

			function rescaleFx() {
				var properties = {};
				var everythingIsZero = true;
				["sourcePositionVariance_X", "gravity_X", "startParticleSize", "sourcePositionVariance_Y", "gravity_Y", "finishParticleSize", "startParticleSizeVariance", "maxRadius", "maxRadiusVariance", "finishParticleSizeVariance", "minRadius", "radiusSpeed", "speed", "speedVariance"].forEach(function(e) {
					var a = sprite[e];
					if (a !== 0) {
						everythingIsZero = false;
					}
					properties[e] = sprite[e] * scene.scaleX;
				});
				if (!everythingIsZero) {
					// console.debug("particles were scaled");
					applyProperties(sprite, properties);
				} else {
					// console.debug("can't scale particles: they haven't been loaded yet");
				}
				return !everythingIsZero;
			}

			// console.debug("Scaling particles for retina");

			if (!rescaleFx()) {

				sprite.tag = params.name;

				function loadListener(e) {

					// console.debug("load listener", e);
					if (e.tag !== params.name)
						return;

					sprite.removeEventListener("onloadsprite", loadListener);

					(function tryUntillSucceed() {
						// console.debug("trying to scale particles again");
						if (!rescaleFx()) {
							// console.debug("Particles has not loaded yet, delaying scaling by 500 ms");
							scene.setTimeout(tryUntillSucceed, 500);
						}
					})();

				}

				// console.debug("setting listener");
				sprite.addEventListener("onloadsprite", loadListener);

			}

			// }

			scene.add(sprite);

			if (target) {

				sprite.move(params.x, params.y);
				target.addChildNode(sprite);

				/*

				 // fixme: update to following being true child

				 / *var distance =
				 Math.sqrt(params.x * params.x + params.y * params.y) -
				 Math.sqrt(target.width * target.width / 4 + target.height * target.height / 4);
				 var angleChild = Math.atan2(params.y, params.x);* /

				 // target.addChildNode(sprite); // isn't working
				 // target.addTransformChildWithRelativePosition(sprite);
				 // target.addChildNode(testSprite);
				 // target.addTransformChild(sprite);

				 followTarget = function() {
				 var angle = target.angle * Math.PI / 180.0;
				 sprite.move(
				 // target.x + distance * Math.cos(angle + angleChild),
				 // target.y - distance * Math.sin(angle + angleChild)
				 // target.x + params.x * Math.cos(angle),
				 // target.y - params.y * Math.sin(angle)
				 target.x + params.x,
				 target.y + params.y
				 );
				 // weld using box2d?
				 // console.debug("Forcing fx to be at ", target.x + params.x, target.y + params.y);
				 };
				 followTarget();
				 scene.addEventListener("enterframe", followTarget);*/

			}

			if (isFinite(params.timeout) && !isNaN(parseFloat(params.timeout))) {
				scene.setTimeout(function() {
					if (target) {
						// console.debug("removing event listener");
						//scene.removeEventListener("enterframe", followTarget);
					}
					scene.remove(sprite);
					sprite = null;
				}, params.timeout);
			}

			return sprite;

		};

		/*
		 * pos : {x, y} - new camera position
		 * time - duration off camera movement (if undefined = 1)
		 */
		scene.moveCamera = function(pos, time) {
	        var transform_camera = quicktigame2d.createTransform();

	        transform_camera.duration = (time != undefined) ? time : 1;
	        if (pos.x != undefined) transform_camera.lookAt_eyeX = pos.x;
	        if (pos.y != undefined) transform_camera.lookAt_eyeY = pos.y;
	               
	        game.moveCamera(transform_camera);
	    }

		return scene;

	}
};
