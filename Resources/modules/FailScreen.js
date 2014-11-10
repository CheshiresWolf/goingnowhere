var Config = require("config");
var LevelManager  = require("modules/LevelManager");

function FailScreen(game, window) {

    var self = this;
    var closeCallback = null;

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
        //top  : 160 * Config.UI_SCALE_Y,
        bottom : 0,
        width  : 768 * Config.UI_SCALE_X,
        height : 864 * Config.UI_SCALE_Y,
        z : 2,
        backgroundImage : "/images/common/fail/box.png"
    });
    holder.add(box);

    var lang = Config.getCurrentLanguage();

    var text = Ti.UI.createImageView({
        left : ( (lang == "en") ? 149 : 140 ) * Config.UI_SCALE_X,
        bottom : ( (lang == "en") ? 354 : 400 ) * Config.UI_SCALE_Y,
        width  : 487 * Config.UI_SCALE_X,
        height : ( (lang == "en") ? 157 : 91 ) * Config.UI_SCALE_Y,
        z : 2,
        image : "/images/common/fail/fail_" + lang + ".png"
    });
    holder.add(text);

    var resumeButton = Ti.UI.createButton({
        left : 396 * Config.UI_SCALE_X,
        //top  : 801 * Config.UI_SCALE_Y,
        bottom : 82  * Config.UI_SCALE_Y,
        width  : 149 * Config.UI_SCALE_X,
        height : 141 * Config.UI_SCALE_Y,
        z : 3,
        backgroundImage : "/images/common/fail/resume_off.png"
    });
    resumeButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        resumeButton.backgroundImage = "/images/common/fail/resume_on.png";
        setTimeout(function() {
            resumeButton.backgroundImage = "/images/common/fail/resume_off.png";
            self.close();
            LevelManager.restartLevel();
        }, 100);
    });
    holder.add(resumeButton);

    var menuButton = Ti.UI.createButton({
        left : 210 * Config.UI_SCALE_X,
        //top  : 802 * Config.UI_SCALE_Y,
        bottom : 81  * Config.UI_SCALE_Y,
        width  : 150 * Config.UI_SCALE_X,
        height : 141 * Config.UI_SCALE_Y,
        z : 3,
        backgroundImage : "/images/common/fail/menu_off.png"
    });
    menuButton.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        menuButton.backgroundImage = "/images/common/fail/menu_on.png";
        setTimeout(function() {
            menuButton.backgroundImage = "/images/common/fail/menu_off.png";
            self.openMenu();
        }, 100);
    });
    holder.add(menuButton);

    self.close = function() {
        holder.opacity = 0;
        holder.hide();
        if (closeCallback != null) {
            closeCallback();
        }
    };

    self.open = function(callback) {
        holder.opacity = 1;
        if (callback) {
            closeCallback = callback;
        }
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

    return self;

}

module.exports = FailScreen;