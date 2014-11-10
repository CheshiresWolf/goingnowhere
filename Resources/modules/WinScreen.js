var Config = require("config");
var LevelManager = require("modules/LevelManager");
var SocialButtons = require("lib/SocialButtons");

function WinScreen(game, window) {

    var self = this;
    var closeCallback = null;

    self.stars = [];

    var holder = Ti.UI.createView({
        left : 0,
        top : 0,
        width  : Ti.UI.FILL,
        height : Ti.UI.FILL
    });

    var background = Ti.UI.createImageView({
        left : 0,
        top : 0,
        z : 1,
        width   : Ti.UI.FILL,
        height  : Ti.UI.FILL,
        opacity : 0.75,
        image   : "/images/clearb.png"
    });
    holder.add(background);

    var box = Ti.UI.createView({
        left : 0   * Config.UI_SCALE_X,
        //top  : 158 * Config.UI_SCALE_Y,
        bottom : 0,
        z : 2,
        width  : 768 * Config.UI_SCALE_X,
        height : 866 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/win/box.png"
    });
    holder.add(box);

    var fontSize = 45 * Config.UI_SCALE_Y;
    if (Config.IS_RETINA) fontSize /= 2;

    var newLng = Config.getCurrentLanguage();

    var textTop = Ti.UI.createLabel({
        left : 0,
        //top  : 353 * Config.UI_SCALE_Y,
        bottom : 607 * Config.UI_SCALE_Y,
        width  : 768 * Config.UI_SCALE_X,
        height : 64 * Config.UI_SCALE_Y,
        text : L("win_clear_" + newLng),//"STAGE CLEARED",
        textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
        color : "#ff9933",
        font : {
            fontSize : fontSize,
            fontFamily : (newLng == "en") ? "Questrian" : "ObelixPro"
        }
    });
    holder.add(textTop);

    var textTime = Ti.UI.createLabel({
        left : 0,
        //top  : 600 * Config.UI_SCALE_Y,
        bottom : 360 * Config.UI_SCALE_Y,
        width  : 768 * Config.UI_SCALE_X,
        height : 64 * Config.UI_SCALE_Y,
        text : L("win_run_" + newLng) + "00",//"RUN TIME 00:00",
        textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
        color : "#ff9933",
        font : {
            fontSize : fontSize,
            fontFamily : (newLng == "en") ? "Questrian" : "ObelixPro"
        }
    });
    holder.add(textTime);

    var textBestTime = Ti.UI.createLabel({
        left : 0,
        //top  : 665 * Config.UI_SCALE_Y,
        bottom : 295 * Config.UI_SCALE_Y,
        width  : 768 * Config.UI_SCALE_X,
        height : 64 * Config.UI_SCALE_Y,
        text : L("win_best_" + newLng) + "00",//"BEST TIME 00:00",
        textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
        color : "#cc3333",
        font : {
            fontSize : fontSize / 2,
            fontFamily : (newLng == "en") ? "Questrian" : "ObelixPro"
        }
    });
    holder.add(textBestTime);

    var starsBase = Ti.UI.createView({
        left : 187 * Config.UI_SCALE_X,
        //top  : 432 * Config.UI_SCALE_Y,
        bottom : 450 * Config.UI_SCALE_Y,
        width  : 411 * Config.UI_SCALE_X,
        height : 142 * Config.UI_SCALE_Y,
        z : 2,
        backgroundImage : "/images/common/win/star_base.png"
    });
    holder.add(starsBase);

    self.stars[0] = Ti.UI.createView({
        left : 187 * Config.UI_SCALE_X,
        //top  : 472 * Config.UI_SCALE_Y,
        bottom : 450 * Config.UI_SCALE_Y,
        z : 2,
        width  : 101 * Config.UI_SCALE_X,
        height : 102 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/win/star1.png"
    });
    self.stars[0].hide();
    holder.add(self.stars[0]);

    self.stars[1] = Ti.UI.createView({
        left : 327 * Config.UI_SCALE_X,
        //top  : 431 * Config.UI_SCALE_Y,
        bottom : 469 * Config.UI_SCALE_Y,
        width  : 129 * Config.UI_SCALE_X,
        height : 123 * Config.UI_SCALE_Y,
        z : 2,
        backgroundImage : "/images/common/win/star2.png"
    });
    self.stars[1].hide();
    holder.add(self.stars[1]);

    self.stars[2] = Ti.UI.createView({
        left : 497 * Config.UI_SCALE_X,
        //top  : 470  * Config.UI_SCALE_Y,
        bottom : 451 * Config.UI_SCALE_Y,
        width  : 103 * Config.UI_SCALE_X,
        height : 102 * Config.UI_SCALE_Y,
        z : 2,
        backgroundImage : "/images/common/win/star3.png"
    });
    self.stars[2].hide();
    holder.add(self.stars[2]);

    var resumeButton = Ti.UI.createButton({
        left : 313 * Config.UI_SCALE_X,
        //top  : 782 * Config.UI_SCALE_Y,
        bottom : 81  * Config.UI_SCALE_Y,
        width  : 149 * Config.UI_SCALE_X,
        height : 141 * Config.UI_SCALE_Y,
        z : 3,
        backgroundImage : "/images/common/win/resume_off.png"
    });
    resumeButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        resumeButton.backgroundImage = "/images/common/win/resume_on.png";
        setTimeout(function() {
            resumeButton.backgroundImage = "/images/common/win/resume_off.png";
            self.close();
            LevelManager.restartLevel();
        }, 100);
    });
    holder.add(resumeButton);

    var menuButton = Ti.UI.createButton({
        left : 128 * Config.UI_SCALE_X,
        //top  : 783 * Config.UI_SCALE_Y,
        bottom : 81  * Config.UI_SCALE_Y,
        width  : 149 * Config.UI_SCALE_X,
        height : 140 * Config.UI_SCALE_Y,
        z : 3,
        backgroundImage : "/images/common/win/menu_off.png"
    });
    menuButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        menuButton.backgroundImage = "/images/common/win/menu_on.png";
        setTimeout(function() {
            menuButton.backgroundImage = "/images/common/win/menu_off.png";
            self.openMenu();
        }, 100);
    });
    holder.add(menuButton);

    var nextButton = Ti.UI.createButton({
        left : 501 * Config.UI_SCALE_X,
        //top  : 783 * Config.UI_SCALE_Y,
        bottom : 81  * Config.UI_SCALE_Y,
        width  : 149 * Config.UI_SCALE_X,
        height : 140 * Config.UI_SCALE_Y,
        z : 3,
        backgroundImage : "/images/common/win/next_off.png"
    });
    nextButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        nextButton.backgroundImage = "/images/common/win/next_on.png";
        setTimeout(function() {
            nextButton.backgroundImage = "/images/common/win/next_off.png";
            self.close();
            var nextLevel = LevelManager.getNextLevel();

            if (nextLevel != -1) {
                Ti.App.fireEvent("goToPage", {
                    index : 2,
                    packName : nextLevel.packName,
                    levelIndex : nextLevel.index
                });
            } else {
                game.uiScreen.comingSoon.open();
                Ti.App.fireEvent("goToPage", {
                    index : 1
                });
            }
        }, 100);
    });
    holder.add(nextButton);

    var shareButton = Ti.UI.createButton({
        right  : 10 * Config.UI_SCALE_X,
        bottom : 40 * Config.UI_SCALE_Y,
        width  : 54 * Config.UI_SCALE_X,
        height : 41 * Config.UI_SCALE_Y,
        z : 3,
        backgroundImage : "/images/common/win/share.png"
    });
    shareButton.addEventListener("click", function() {
        Ti.API.debug("WinScreen | shareButton | social");
        socialGo();
        Ti.App.fireEvent("trackShare");
    });
    holder.add(shareButton);

    self.close = function() {
        if (closeCallback != null) {
            closeCallback();
        }

        for (var key in self.stars) {
            self.stars[key].hide();//opacity = 0;
        }

        holder.hide();
    };

    self.open = function(opts, callback) {
        window.topScene().playSound("victory");
        if (callback) {
            closeCallback = callback;
        }

        if (opts.score != undefined) {
            
            for (var i = 0; i < opts.score; i++) {
                self.stars[i].show();
            }

            var newLng = Config.getCurrentLanguage();

            textTime.text = L("win_run_" + newLng) + ((opts.time < 10) ? "0" + opts.time : opts.time);
            textBestTime.text = L("win_best_" + newLng) + ((opts.bestTime < 10) ? "0" + opts.bestTime : opts.bestTime);

        }

        var nextLevel = LevelManager.getNextLevel();
        if (nextLevel != -1) {
            nextLevel.unlock();
            Ti.API.debug("WinScreen | self.open | level(" + nextLevel.index + ") was ulocked.");
        }

        shareOpts = opts;
        holder.show();

        Ti.App.fireEvent("trackWin", {
            index : opts.index,
            score : opts.score
        });
    };

    self.openMenu = function() {
        self.close();
        Ti.App.fireEvent("goToPage", {
            index : 1,
            returnFromGame : true
        });
    };

    window.add(holder);
	holder.hide();

    return self;

}

var shareOpts;
function socialGo(carrots, bestTime, levelIndex) {
    if (shareOpts == undefined) {
        return;
    }

    var Social = require('com.0x82.social');
    var lng = Config.getCurrentLanguage();
    var imageBlob = Ti.UI.createImageView({
        image : "images/common/appicon.png"
    }).toBlob();

    Social.showActivityItems({
        activityItems : [
            //"RunRabbitRun.",
            //"I just finished level " + shareOpts.index + " in " + shareOpts.bestTime + " seconds.",
            //"My total carrots score : " + Ti.App.Properties.getInt("global_score", 0),
            //"",
            "https://www.facebook.com/runrabbitrunapp"
        ],
    });
}

module.exports = WinScreen;