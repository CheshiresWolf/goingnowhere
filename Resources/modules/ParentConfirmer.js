var Config = require("config");
var _      = require("/lib/Underscore");



exports.confirm = function(game, window, callbackOk, callbackFail, callbackAnyway) {

	function playSound(url) {
		var scene = window.topScene && window.topScene();
		scene && scene.playSound && scene.playSound(url);
	}

	var self = this;

	var lng = Config.getCurrentLanguage();

	var iphone = Ti.Platform.osname === "iphone";

	var WIDTH   = iphone ? 480 : 1024;
	var HEIGHT  = iphone ? 320 : 768;

	var uiWidth  = 500;
	var uiHeight = 500;

	
	var uiScale = iphone ? Math.min(WIDTH / (uiWidth * 1.1), HEIGHT / (uiHeight * 1.1)) : 1;



	var NUMBERS_TO_ENTER = 3;

	var FONT_COLOR = "#543724";

	var CAPITAL_FONT = {
		fontFamily: "Gabriola",
		fontSize: 60 * uiScale,
		fontWeight: "bold"
	};

	var DEFAULT_FONT = {
		fontFamily: "Gabriola",
		fontSize: 40 * uiScale
	};

	var INPUT_FONT = {
		fontFamily: "superclarendon",
		fontSize: 30 * uiScale
	};

	// ===== Buttons =====

		var BUTTON_FONT = {
			fontFamily: "superclarendon",
			fontSize: 40 * uiScale
		};

		function genGradient(colors) {
			return {
				type: "linear",
				startPoint: { x: "0%", y:   "0%" },
				endPoint:   { x: "0%", y: "100%" },
				colors: colors
			}
		}

		var BUTTON_STYLE = {

			font: BUTTON_FONT,
			width:  75 * uiScale, 
			height: 75 * uiScale, 
			left:  7.5 * uiScale, 
			right: 7.5 * uiScale, 
			top:    0, 
			bottom: 15 * uiScale, 

			borderColor: "#ababab",
			borderWidth: uiScale + "dp",
			borderRadius: 7 * uiScale + "dp",
			
			backgroundGradient: genGradient([
				{ color: "white",   offset: 0.0 },
				{ color: "#f0f0f0", offset: 0.5 }
			]),

			color: "#000000"

		};

		var BUTTON_TOUCH_STYLE = {
			backgroundGradient: genGradient([
				{ color: "#3294e0", offset: 0.0 },
				{ color: "#015ee6", offset: 1.0 }
			]),
			color: "white"
		};

		function buttonTouchStart(btn) {
			for (var key in BUTTON_TOUCH_STYLE) {
				btn[key] = BUTTON_TOUCH_STYLE[key];
			}
		}

		function buttonTouchEnd(btn) {
			for (var key in BUTTON_TOUCH_STYLE) {
				btn[key] = BUTTON_STYLE[key];
			}
		}

	// ===================


	var parent, holder, taskText, pseudoInputField,
		buttonsHolder, closeButton, inputDataLabel;
	var task;
	var inputData = [];



	function init() {


		// parent
		window.add(parent = Ti.UI.createView({
			width:  WIDTH,
			height: HEIGHT,
			zIndex: 150
		}));

		
		// background
		parent.add(Ti.UI.createView({
			width:  WIDTH,
			height: HEIGHT,
			backgroundColor: "#000",
			opacity: 0.71
		}));


		// holder
		parent.add(holder = Ti.UI.createView({
			width:  uiWidth  * uiScale,
			height: uiHeight * uiScale,
			backgroundColor: "#E4E3E3",
			borderRadius: 15 * uiScale,
			borderWidth: uiScale
		}));


		// header shadow
		holder.add(Ti.UI.createLabel({
			text: L(lng + "_parent_confirmer_header"),
			font: CAPITAL_FONT,
			center: { x: (uiWidth / 2 + 1) * uiScale },
			top: 36 * uiScale,
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
			color: "#aaaaaa"
		}));
		// header
		holder.add(Ti.UI.createLabel({
			text: L(lng + "_parent_confirmer_header"),
			font: CAPITAL_FONT,
			center: { x: (uiWidth / 2) * uiScale },
			top: 35 * uiScale,
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
			color: FONT_COLOR
		}));


		// task description
		holder.add(Ti.UI.createLabel({
			text: L(lng + "_parent_confirmer_task_description"),
			font: DEFAULT_FONT,
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
			top: 120 * uiScale
		}));

		// pseudo input field
		holder.add(pseudoInputField = Ti.UI.createView({
			top: 225 * uiScale, 
			width: 100 * uiScale, 
			height: 52 * uiScale,
			backgroundGradient: genGradient([
				{ color: "#e3e3e3", offset: 0.00 },
				{ color: "white",   offset: 0.15 }
			]),
			borderRadius: 10 * uiScale,
			borderWidth: uiScale,
			borderColor: "#ababab"
		}));
		pseudoInputField.add(inputDataLabel = Ti.UI.createLabel({
			left: 20 * uiScale,
			top: 5 * uiScale,
			font: INPUT_FONT
		}));

		
		// dial buttons holder
		holder.add(buttonsHolder = Ti.UI.createView({
			top: 300 * uiScale, 
			width: Math.ceil(5 * (7.5 + 75 + 7.5) * uiScale),
			layout: "horizontal"
		}));


		// dial buttons
		_.each("1234567890", function(number) {

			number = number | 0;

			var button = Ti.UI.createView(BUTTON_STYLE);

			buttonsHolder.add(button);

			var label = Ti.UI.createLabel({
				text: number,
				font: BUTTON_FONT,
				top: 13 * uiScale
			});

			button.add(label);

			button.addEventListener("touchstart", function() {
				playSound("parentConfirmButtonClick");
				inputNumber(number);
				buttonTouchStart(button);
			});
			button.addEventListener("touchend", function() {
				buttonTouchEnd(button);
			});

		});


		// close button
		holder.add(closeButton = Ti.UI.createView({
			backgroundImage: "images/ParentConfirmer/closeButton.png",
			right: -4.5 * uiScale, // 321.5
			top:   -5.5 * uiScale, 
			width:  50 * uiScale, 
			height: 50 * uiScale 
		}));

		closeButton.addEventListener("click", function() {
			playSound("button_click");
			callbackFail && callbackFail();
			callbackAnyway && callbackAnyway();
			unload();
		});



		generateTask();

	}



	function generateTask() {

		task = _.shuffle(_.range(0, 10)).splice(0, NUMBERS_TO_ENTER);

		var text = task.map(function(e) {
			return L(lng + "_number_" + e);
		}).join(", ");
		text = text[0].toUpperCase() + text.substr(1) + ".";

		// task text
		holder.add(Ti.UI.createLabel({
			text: text,
			font: DEFAULT_FONT,
			top: 170 * uiScale, 
			textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
			color: "#aa3333"
		}));

	}



	function inputNumber(number) {

		inputData.push(number);

		if (inputData.length === NUMBERS_TO_ENTER) {

			var callback = task.every(function(e, i) {
				return e === inputData[i];
			}) ? callbackOk : callbackFail;

			unload();

			callback && callback();
			callbackAnyway && callbackAnyway();

		} else {

			inputDataLabel.text = inputData.join("");

		}

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

};