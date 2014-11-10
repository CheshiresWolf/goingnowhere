var quicktigame2d = require('com.ti.game2d');

/*
 * 	FrameAnimationHelper.animate(scene, 1, 6, 100, "rubka_bruzgi");
 * 		or
 *  FrameAnimationHelper.animate(scene, [6,5,4,3,2,1], 100, "rubka_bruzgi");
 */
function frameAnimation(scene, startFrameIndex, count, delay, frameName, callBackFunc) {
	
	var arr = startFrameIndex;
	if ( typeof (arr) == "object") {
		var isArray = true;
		callBackFunc = frameName;
		frameName = delay;
		delay = count;

		startFrameIndex = 0;
		count = arr.length;
	}

	var currentFrameIndex = startFrameIndex;
	var lastFrameIndex = startFrameIndex + count;

	(function setTimeoutForNextFrame() {
		showAndHide(currentFrameIndex);
		currentFrameIndex++
		if (currentFrameIndex > lastFrameIndex) {
			if (callBackFunc)
				if ( typeof (callBackFunc) == "function")
					callBackFunc();
			return;
		}
		scene.setTimeout(function() {
			setTimeoutForNextFrame();
		}, delay);
	})();

	function showAndHide(index) {
		if (isArray) {
			hideSpiteByName(frameName + arr[index - 1]);
			showSpiteByName(frameName + arr[index]);
		} else {
			hideSpiteByName(frameName + (index - 1));
			showSpiteByName(frameName + index);
		}
	}

	function showSpiteByName(name) {
		var sprite = scene.spriteByName(name);
		if (sprite)
			sprite.show();
	}

	function hideSpiteByName(name) {
		var sprite = scene.spriteByName(name);
		if (sprite)
			sprite.hide();
	}
	
	this.start = function(){
		
	}
	this.stop = function(){
		
	}

}

module.exports.animate = frameAnimation;
module.exports.Animator = frameAnimation;
