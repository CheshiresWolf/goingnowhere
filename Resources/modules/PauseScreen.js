var Config = require("config");
var LevelManager = require("modules/LevelManager");
var SoundManager = require("modules/SoundManager");

function PauseScreen(game, window) {

    var self = this;
    var closeCallback = null;

    var holder = Ti.UI.createView({
        left : 0,
        top  : 0,
        width   : Ti.UI.FILL,
        height  : Ti.UI.FILL
    });

    var background = Ti.UI.createImageView({
        left : 0,
        top  : 0,
        z : 1,
        width   : Ti.UI.FILL,
        height  : Ti.UI.FILL,
        opacity : 0.75,
        image   : "/images/clearb.png"
    });
    holder.add(background);

    var box = Ti.UI.createView({
        left : 0,
        //top  : 610 * Config.UI_SCALE_Y,
        bottom : 0,
        z : 2,
        width  : 768 * Config.UI_SCALE_X,
        height : 414 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/pause/box.png"
    });
    holder.add(box);

    var text = Ti.UI.createImageView({
        left : 279 * Config.UI_SCALE_X,
        //top  : 268 * Config.UI_SCALE_Y,
        bottom : 707 * Config.UI_SCALE_Y,
        z : 3,
        width  : 200 * Config.UI_SCALE_X,
        height : 49 * Config.UI_SCALE_Y,
        image  : "/images/common/pause/pause_" + Config.getCurrentLanguage() + ".png"
    });
    holder.add(text);

    var backButton = Ti.UI.createButton({
        left : 537 * Config.UI_SCALE_X,
        //top  : 699 * Config.UI_SCALE_Y,
        bottom : 184 * Config.UI_SCALE_Y,
        z : 4,
        width  : 149 * Config.UI_SCALE_X,
        height : 141 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/pause/play_off.png"
    });
    backButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        backButton.backgroundImage = "/images/common/pause/play_on.png";
        setTimeout(function() {
            backButton.backgroundImage = "/images/common/pause/play_off.png";
            self.close();
        }, 100);
    });
    holder.add(backButton);

    var resumeButton = Ti.UI.createButton({
        left : 300 * Config.UI_SCALE_X,
        bottom : 186 * Config.UI_SCALE_Y,
        z : 4,
        width  : 149 * Config.UI_SCALE_X,
        height : 141 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/pause/resume_off.png"
    });
    resumeButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        resumeButton.backgroundImage = "/images/common/pause/resume_on.png";
        setTimeout(function() {
            resumeButton.backgroundImage = "/images/common/pause/resume_off.png";
            self.close();
            LevelManager.restartLevel();
        }, 100);
    });
    holder.add(resumeButton);

    var menuButton = Ti.UI.createButton({
        left : 78  * Config.UI_SCALE_X,
        //top  : 698 * Config.UI_SCALE_Y,
        bottom : 186 * Config.UI_SCALE_Y,
        z : 4,
        width  : 148 * Config.UI_SCALE_X,
        height : 140 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/pause/menu_off.png"
    });
    menuButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        menuButton.backgroundImage = "/images/common/pause/menu_on.png";
        setTimeout(function() {
            menuButton.backgroundImage = "/images/common/pause/menu_off.png";
            self.openMenu();
        }, 100);
    });
    holder.add(menuButton);

    var soundButton = Ti.UI.createButton({
        left : 89  * Config.UI_SCALE_X,
        //top  : 860 * Config.UI_SCALE_Y,
        bottom : 58 * Config.UI_SCALE_Y,
        z : 4,
        width  : 116 * Config.UI_SCALE_X,
        height : 106 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/pause/sound_on.png"
    });
    soundButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");

        var effects_sound = Ti.App.Properties.getDouble("effects_sound", 0.6);
        var soundFlag = true;
        if (effects_sound == 0) {
            soundFlag = false;
        }

        Ti.App.Properties.setDouble("effects_sound", (soundFlag) ? 0.0 : 0.6);
        soundButton.backgroundImage = "/images/common/pause/sound_" + ( (soundFlag) ? "on.png" : "off.png" );
    });
    holder.add(soundButton);

    var musicButton = Ti.UI.createButton({
        left : 311 * Config.UI_SCALE_X,
        //top  : 860 * Config.UI_SCALE_Y,
        bottom : 58 * Config.UI_SCALE_Y,
        z : 4,
        width  : 116 * Config.UI_SCALE_X,
        height : 106 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/pause/music_on.png"
    });
    musicButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        var musicFlag = !Ti.App.Properties.getBool("music", true);
        musicButton.backgroundImage = "/images/common/pause/music_" + ( musicFlag ? "off.png" : "on.png" );
        
        Ti.App.Properties.setBool("music", musicFlag);
        if (musicFlag) {
            SoundManager.unmute();
        } else {
            SoundManager.mute();
        }
    });
    holder.add(musicButton);

    var pauseButton = Ti.UI.createButton({
        left : 552 * Config.UI_SCALE_X,
        //top  : 859 * Config.UI_SCALE_Y,
        bottom : 58 * Config.UI_SCALE_Y,
        z : 4,
        width  : 116 * Config.UI_SCALE_X,
        height : 106 * Config.UI_SCALE_Y,
        backgroundImage : "/images/common/pause/pause_off.png"
    });
    pauseButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        pauseButton.backgroundImage = "/images/common/pause/pause_on.png";
        setTimeout(function() {
            pauseButton.backgroundImage = "/images/common/pause/pause_off.png";
            game.uiScreen.help.open();
            Ti.App.fireEvent("trackHelp");
        }, 100);
    });
    holder.add(pauseButton);

    self.close = function() {
        if (closeCallback != null) {
            closeCallback();
        }
        holder.hide();
    };

    self.open = function(callback) {
        if (callback) {
            closeCallback = callback;
        }

        refreshButtons();
        holder.show();
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

    function refreshButtons() {
        var musicFlag = Ti.App.Properties.getBool("music", true);
        musicButton.backgroundImage = "/images/common/pause/music_" + ( musicFlag ? "off.png" : "on.png" );

        var effects_sound = Ti.App.Properties.getDouble("effects_sound", 0.6);
        var soundFlag = true;
        if (effects_sound == 0) {
            soundFlag = false;
        }
        soundButton.backgroundImage = "/images/common/pause/sound_" + ( soundFlag ? "off.png" : "on.png" );
    }

    return self;

}

module.exports = PauseScreen;