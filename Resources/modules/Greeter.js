var game2d = require("com.ti.game2d");
var Config = require("config");


function Greeter(scene) {

	var scene = scene;
	var sprite;

	/*
	 * params
	 *	x
	 *	y
	 *	callback
	 */
	this.showGreetings = function(params) {

		params = params || {};

		if (!scene) {
			// console.error("Can't show greetings without scene");
			return;
		}

		var lng = Config.getCurrentLanguage();

		scene.playSound("victory1");

		var greetings = game2d.createSprite({
			image: "images/scenes/common/wellDone_" + lng + ".png",
			width: 1024 * scene.scaleX,
			height: 768 * scene.scaleY
		});
		greetings.applyProperties({
			scaleX: 0,
			scaleY: 0,
			alpha: 0,
			z: 75
		});
		greetings.applyProperties({
			x: (params.x !== undefined ? params.x : scene.game.screen.width  / 2) - greetings.width  / 2,
			y: (params.y !== undefined ? params.y : scene.game.screen.height / 2) - greetings.height / 2
		});
		scene.add(greetings);
		var tr = scene.createTransform({
			alpha: 1,
			scaleX: 1,
			scaleY: 1,
			duration: 2000,
			autoreverse: true
		});
		scene.after(tr, function() {
			scene.remove(greetings);
			params.callback && params.callback();
		});
		greetings.transform(tr);

		/*greetings.scaleX = 1;
		greetings.scaleY = 1;

		var trAppear = scene.createTransform({
			duration: 100,
			alpha: 1
		});
		var tr = scene.createTransform({
			duration: 2500,
			scaleX: 4,
			scaleY: 4,
			easing: quicktigame2d.ANIMATION_CURVE_SINE_OUT
		});
		var trHide = scene.createTransform({
			delay: 300,
			duration: 700,
			alpha: 0,
		});

		trAppear.addEventListener("complete", function() {
			greetings.transform(tr);
		});
		tr.addEventListener("complete", function() {
			greetings.transform(trHide);
		});
		trHide.addEventListener("complete", function() {
			scene.remove(greetings);
			params.callback && params.callback();
		});

		greetings.transform(trAppear);*/

	};



}

module.exports = Greeter;