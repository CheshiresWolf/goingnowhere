var Config = require("config");
var _      = require("/lib/Underscore");

exports.rate = function(window) {

	var self = this;

	var lng = Config.getCurrentLanguage();



	var SCALE_X = window.width  / 1024;
	var SCALE_Y = window.height / 768;

	var DEFAULT_FONT = {
		fontFamily: "Gabriola",
		fontSize: 50 * SCALE_Y
	};

	var width  = 1024; // window.width;
	var height = 768;  // window.height;

	var holderWidth  = width  * 2 / 3;
	var holderHeight = height * 2 / 3;



	var parent, holder, stars, starsHolder, closeButton;

	function init() {

		window.add(parent = Ti.UI.createView({
			width:  width,
			height: height,
			zIndex: 150
		}));

		
		// background
		parent.add(Ti.UI.createView({
			width:  width,
			height: height,
			backgroundColor: "#000",
			opacity: 0.66
		}));


		// holder
		parent.add(holder = Ti.UI.createView({
			width:  holderWidth,
			height: holderHeight,
			backgroundColor: "#fff",
			layout: "vertical"
		}));

		// task description
		holder.add(Ti.UI.createLabel({
			text: L(lng + "_rate_description"),
			font: DEFAULT_FONT,
			// top: 85 * SCALE_Y,
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
		}));

		holder.add(starsHolder = Ti.UI.createView({
			layout: "horizontal",
			backgroundColor: "#777"
		}));

		stars = _.range(5).map(function(e) {

			var star = Ti.UI.createButton({
				title: e,
				font: DEFAULT_FONT,
				left:  10 * SCALE_X,
				right: 10 * SCALE_X,
				width:  50 * SCALE_X,
				height: 50 * SCALE_Y
			});

			starsHolder.add(star);

			star.addEventListener("click", function() {
				clickStar(e);
			});

		});

		// close button
		holder.add(closeButton = Ti.UI.createButton({
			title: "X",
			// font: DEFAULT_FONT,
			top:   10 * SCALE_X,
			right: 10 * SCALE_Y,
			width:  50 * SCALE_X,
			height: 50 * SCALE_Y,
			backgroundColor: "faa"
		}));

		closeButton.addEventListener("click", function() {
			callbackFail && callbackFail();
			callbackAnyway && callbackAnyway();
			unload();
		});

	}



	function clickStar(n) {
		// console.debug("clicked star ", n);
	}



	function unload() {

		window.remove(parent);
		
		closeButton      = null;
		buttonsHolder    = null;
		pseudoInputField = null;
		taskText         = null;
		holder           = null;
		parent           = null;

	}



	init();
	setTimeout(unload, 5000);


}