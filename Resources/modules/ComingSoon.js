var Config = require("config");

function ComingSoon(game, window) {

    var self = this;

    var holder = Ti.UI.createView({
        top  : 0,
        left : 0,
        width  : Ti.UI.FILL,
        height : Ti.UI.FILL,
        zIndex : 50,
        backgroundImage : "images/common/comingsoon/fon_2x.png"
    });
    holder.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        self.close();
    });

    var twit = Ti.UI.createButton({
        top  : bottom(50, 100),
        left : 463 * Config.UI_SCALE_X,
        width  : 241 * Config.UI_SCALE_X,
        height : 100 * Config.UI_SCALE_Y,
        backgroundImage : "images/common/comingsoon/twitter_2h.png"
    });
    twit.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        Ti.App.fireEvent("trackSocial", {
            social : "Twitter"
        });

        if (Config.twitter_url) {
            Titanium.Platform.openURL(Config.twitter_url);
        }
        self.close();
    });
    holder.add(twit);

    var or = Ti.UI.createView({
        top  : bottom(70, 47),
        left : 360  * Config.UI_SCALE_X,
        width  : 47 * Config.UI_SCALE_X,
        height : 47 * Config.UI_SCALE_Y,
        backgroundImage : "images/common/comingsoon/or.png"
    });
    holder.add(or);

    var face = Ti.UI.createButton({
        top  : bottom(50, 100),
        left : 61  * Config.UI_SCALE_X,
        width  : 238 * Config.UI_SCALE_X,
        height : 100 * Config.UI_SCALE_Y,
        backgroundImage : "images/common/comingsoon/facebook_2h.png"
    });
    face.addEventListener("click", function() {
        window.topScene().playSound("button_click");
        Ti.App.fireEvent("trackSocial", {
            social : "Facebook"
        });

        if (Config.facebook_url) {
            Titanium.Platform.openURL(Config.facebook_url);
        }
        self.close();
    });
    holder.add(face);

    window.add(holder);
    holder.hide();

    self.close = function() {
        holder.hide();
    };

    self.open = function() {
        holder.show();
    };
    
    return self;

}

function bottom(y, h) {
    return Config.UI_WINDOW_HEIGHT - y * Config.UI_SCALE_Y - h * Config.UI_SCALE_Y;
}

module.exports = ComingSoon;