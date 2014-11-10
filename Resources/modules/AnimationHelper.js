var game2d = require("com.ti.game2d");

// ===== Tools =====

    function isObject(obj) {
        return obj === Object(obj);
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

    function clone(obj) {
        var result = {};
        for (var key in obj) result[key] = obj[key];
        return obj;
    }

    function getEasing(name) {
        // first check easing by direct name
        var result = game2d[name] || game2d[name.toUpperCase()];
        if (!result) {
            // correct it if it's in camel case
            if (name.indexOf("_") === -1) {
                name = name.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
                result = game2d[name];
            }
            // add animation_curve_ if it was omited
            if (!result) result = game2d["ANIMATION_CURVE_" + name.toUpperCase()];
        }
        return result;
    }

    function calcOffset(sprite, t) {
        if (t.dx) { t.x = sprite.x + t.dx; delete t.dx; }
        if (t.dy) { t.y = sprite.y + t.dy; delete t.dy; }
    }

// =================



/**
 * Proceeds transform template(s).
 * Validates easing (string to constant) and scales
 * everything that need to be scaled.
 * Boolean flag `scaleScales` determines whether scales
 * should be scaled as well (usefull for spritesheets).
 * Easing string may omit "ANIMATION_CURVE_", may be in
 * lower case and use camel case instead of underscores.
 * Examples for easing:
 *    "ANIMATION_CURVE_EASE_IN"
 *    "EASE_IN"
 *    "ease_in"
 *    "easeIn"
 */
function preCookTemplate(templates, scaleScales, scaleX, scaleY) {

	var t = templates;

    if (!isObject(t)) return;

    if (isArray(t)) {
        t.forEach(function(e) {
        	preCookTemplate(e, scaleScales, scaleX, scaleY);
    	});
        return;
    }

    if (t.easing) t.easing = getEasing(t.easing);

    if (scaleX === undefined) scaleX = 1;
    if (scaleY === undefined) scaleY = scaleX;
    if (scaleX === 1 && scaleY === 1) return;

    ["x", "dx", "scale_centerX", "rotate_centerX", "width"].forEach(
        function(n) { if (t[n] !== undefined) t[n] *= scaleX; }
    );
    ["y", "dy", "scale_centerY", "rotate_centerY", "height"].forEach(
        function(n) { if (t[n] !== undefined) t[n] *= scaleY; }
    );
    if (t.anchorPoint) {
        var ap = t.anchorPoint;
        if (ap.x !== undefined) ap.x *= scaleY;
        if (ap.y !== undefined) ap.y *= scaleY;
    }
    if (t.center) {
        if (t.center.x !== undefined) t.center.x *= scaleY;
        if (t.center.y !== undefined) t.center.y *= scaleY;
    }
    if (scaleScales) {
        if (t.scaleX !== undefined) t.scaleX *= scaleX;
        if (t.scaleY !== undefined) t.scaleY *= scaleY;
    }

}



function BounceAnimation(sprite, jump, B, scaleY) {
	var baseY = sprite.loadedData.top;
	if (sprite.baseY)			//for page2 improve Y coordinate when jscene object animated
		baseY = sprite.baseY;

	var baseX = sprite.x;
	if (sprite.baseX)			//for page2 improve X coordinate when jscene object animated
		baseX = sprite.baseX;

	var list = [];
	var D = 2000, C = 5, A = jump, T = D / C;
	if (!B)
		B = 0.005;
	B = (A / C) / D;
	//A = 20;
	for (var t = 0; t < D; t += T / 2) {
		var y = A * Math.pow(Math.E, -B * t) * Math.cos((Math.PI * 2 / T) * t);
		list.push({
			y : baseY - y,
			x : baseX,
			t : t
		});
		if (Math.round(baseY - y) == baseY)
			break;
	};
	list.push({
		y : baseY
	});
	return new StepAnimation(sprite, D, list);
}



function StepAnimation(sprite, duration, list, stepCallback, finishCallback) {
	var self = {};
	self.list = list;
	self.stepDuration = Math.round(duration / list.length);
	self.step = function() {
		if (self.list.length == 0) {
			self.anim.removeEventListener("complete", self.step);
			self.anim = null;
			self = null;
			if (finishCallback)
				finishCallback();
			return;
		}
		//Ti.API.info('SteP : ' + self.list.length + " " + self.list[0].y);
		if (self.anim) {
			self.anim.removeEventListener("complete", self.step);
			self.anim = null;
		}
		self.anim = game2d.createTransform(self.list.shift());
		//self.anim.easing = game2d.ANIMATION_CURVE_CUBIC_IN_OUT;
		self.anim.duration = self.stepDuration;
		self.anim.addEventListener("complete", self.step);
		sprite.transform(self.anim);
	};
	self.start = function() {
		self.step();
	}
	return self;
}



function setRandomPositions(sprite, positionArray) {

	sprite.randomPositions = null;

	if (positionArray !== undefined) {
		if (positionArray.length > 0) {
			sprite.randomPositions = positionArray;
		}
	} 
	
	function getRandomPos() {
		if (sprite.randomPositions === null) {
			return [
				sprite.loadedData.left,
				sprite.loadedData.top,
				sprite.loadedData.angle,
				sprite.loadedData.alpha
			];
		} else {
			return sprite.randomPositions[Math.floor(Math.random() * sprite.randomPositions.length)];
		}
	}
	
	sprite.moveToRandomPos = function(scene) {
		var pos = getRandomPos(), angle = 0, a=1;
		
		if (pos[2] !== undefined) {
			angle = pos[2];
		}
		
		if (pos[3] !== undefined) {
            a = pos[3];
        }
		
		sprite.lastPos = {
			x: pos[0] * scene.scaleX,
			y: pos[1] * scene.scaleY,
			angle: angle,
			alpha: a,
		};
		scene.eTransform(sprite, {
			x: pos[0] * scene.scaleX,
			y: pos[1] * scene.scaleY,
			angle: angle,
			alpha: a,
			duration: 0.1
	    });
	};
	
}


/**
 * Applies transform or set of transform to the sprite.
 * Transform could have dx and dy, which are offsets to
 * current coords. Optionally fires callback after
 * all transforms were finished
 */
function animate(sprite, transformTemplates, scene, callback) {

    var t = transformTemplates;

    if (!sprite || !scene || !isObject(t) && !isArray(t)) return;

    if (isArray(t) && t.length === 1) t = t[0];

    if (!isArray(t)) {

        t = clone(t);
        calcOffset(sprite, t);
        t = scene.createTransform(t);
        sprite.transform(t);
        callback && t.addEventListener("complete", callback);

    } else {

        if (t.length === 0) return;

        (function iteration(list) {
            var t = clone(list[0]);
            calcOffset(sprite, t);
            var transform = scene.createTransform(t);
            if (list.length > 1) {
                transform.addEventListener("complete", function() {
                    iteration(list.slice(1));
                });
            } else
            if (callback) transform.addEventListener("complete", callback);
            sprite.transform(transform);
        })(t);

    }

}



module.exports = {
	BounceAnimation:    BounceAnimation,
	StepAnimation:      StepAnimation,
	setRandomPositions: setRandomPositions,
	preCookTemplate:    preCookTemplate,
	animate:            animate
};