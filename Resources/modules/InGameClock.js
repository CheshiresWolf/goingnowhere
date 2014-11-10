var quicktigame2d = require("com.ti.game2d");

function InGameClock(scene, game) {
    Ti.API.debug("InGameClock | Init start...");

	var self = this;

	var templates = [];//new Array(3);
    var numbers = [];

	var clockSprite, pauseSprite;
	var clockTime;

    var clockTimeout = null;
    var pauseFlag = false;

	var clockCallback;

	self.initClock = function(opts, time, callback) {
		clockSprite = quicktigame2d.createSprite({
            x      : (opts.x) ? opts.x : 0,
            y      : (opts.y) ? opts.y : 0,
            z      : 1,
            width  : 180 * game.scaleX,   
            height : 180 * game.scaleY,
            image  : "images/scenes/common/clock/clock.png",
            touchEnabled : true
        });
        clockSprite.addEventListener("singletap", function() {
            scene.playSound("button_click");
            pauseFunction();
        });
        scene.add(clockSprite);

        pauseSprite = quicktigame2d.createSprite({
            x      : clockSprite.x + 60  * game.scaleX,
            y      : clockSprite.y + 134 * game.scaleY,
            z      : 5,
            width  : 59 * game.scaleX,   
            height : 54 * game.scaleY,
            image  : "images/scenes/common/clock/pause.png",
            touchEnabled : true
        });
        pauseSprite.addEventListener("singletap", function() {
            scene.playSound("button_click");
            pauseFunction()
        });
        scene.add(pauseSprite);

        clockTime     = time;
		clockCallback = callback;

        self.drawTime();

        function pauseFunction() {
            self.stop();
            game.uiScreen.pause.open(function() {
                self.start();
            });
        }

        Ti.API.debug("InGameClock | initClock | Clock was sucessfuly inited.");
	};

	self.drawTime = function() {
		var holder = quicktigame2d.createSprite({
			x      : clockSprite.x,
            y      : clockSprite.y,
            width  : clockSprite.width,
            height : clockSprite.height,
            z 	   : 4,
            alpha  : 1,
            image  : "images/clear.png"
		});
		scene.add(holder);

        var spriteW = 80 * game.scaleX;
        var spriteH = 80 * game.scaleY;
        for (var i = 0; i <= 20; i++) {
            numbers.push(
                loadNumber({
                    x      : clockSprite.x + clockSprite.width / 2 - spriteW / 2,
                    y      : clockSprite.y + 2 * clockSprite.height / 3 - spriteH / 2,
                    width  : spriteW,
                    height : spriteH,
                    time   : i
                })
            );
        }

        templates[0] = {
            x        : clockSprite.x + clockSprite.width  / 2 - spriteW / 2,
            y        : clockSprite.y + clockSprite.height / 3 - spriteH / 2,
            z        : 3,
            scaleX   : 0.7,
            scaleY   : 0.7,
            alpha    : 0.6,
            duration : 200,
            scale_centerX : spriteW / 2,
            scale_centerY : spriteH / 2
        };

        templates[1] = {
            x        : clockSprite.x + clockSprite.width  / 2 - spriteW / 2,
            y        : clockSprite.y + clockSprite.height / 2 - spriteH / 2,
            z        : 4,
            scaleX   : 1,
            scaleY   : 1,
            alpha    : 1,
            duration : 200,
            scale_centerX : spriteW / 2,
            scale_centerY : spriteH / 2
        };
        scene.eTransform(numbers[20], templates[1]);

        templates[2] = {
            x        : clockSprite.x + clockSprite.width / 2 - spriteW / 2,
            y        : clockSprite.y + 2 * clockSprite.height / 3 - spriteH / 2,
            z        : 3,
            scaleX   : 0.7,
            scaleY   : 0.7,
            alpha    : 0.6,
            duration : 200,
            scale_centerX : spriteW / 2,
            scale_centerY : spriteH / 2
        };
        scene.eTransform(numbers[19], templates[2]);
    };

    function loadNumber(opts) {
        var bufSprite  = quicktigame2d.createSprite({
            x      : opts.x,
            y      : opts.y,
            width  : opts.width,
            height : opts.height,
            z      : 4,
            image  : "images/scenes/common/clock/numbers/" + opts.time + ".png"
        });
        scene.add(bufSprite);

        bufSprite.time  = opts.time;

        bufSprite.hide();

        return bufSprite;
    }

    self.start = function() {
        self.stop();
        pauseFlag = false;
    	clockTimeout = scene.setTimeout(animationCycle, 1000);

    	function animationCycle() {
    		clockTime -= 1;

            if (clockTime + 2 <= 20) {
                numbers[clockTime + 2].hide();
            }

            scene.eTransform(numbers[clockTime + 1], templates[0]);
            scene.eTransform(numbers[clockTime],     templates[1]);
            if (clockTime - 1 >= 0) {
                scene.eTransform(numbers[clockTime - 1], templates[2]);
            }

            if (clockTime < 5) {
                scene.playSound("clock_tick");
            }

    		if (clockTime > 0) {
    			if (!pauseFlag) clockTimeout = scene.setTimeout(animationCycle, 1000);
    		} else {
    			clockCallback();
    		}
    	}
    };

    self.stop = function() {
        pauseFlag = true;
        if (clockTimeout != null) {
            clearTimeout(clockTimeout);
            clockTimeout = null;
        }

        return clockTime;
    };

    return self;
}

module.exports = InGameClock;