var Config         = require("config");
var InAppPurchases = require("lib/InAppPurchases");

var isAndroid = !!Ti.Android;

var THUMBNAILS_FORMAT = Config.THUMBNAILS_FORMAT || ".png";

var clickSound = Ti.Media.createSound({
    url: "/sounds/menu.mp3"
});



function ContentMenu(game, win) {

    var self = this;

    var rx = game.isRetina() ? 0.5 : 1;
    var sx = game.scaleX * rx;
    var sy = game.scaleY * rx;

    var margin = 22;

    var iPhone = Ti.Platform.osname === "iphone";


    var view = Ti.UI.createView({
        backgroundImage: "/images/navigation/background.png",
        opacity: 0,
        visible: false,
        zIndex: 50,
    });
    win.add(view);


    var scroller = Ti.UI.createScrollView({
        top: 	(iPhone ? 25  : 84 ) * Config.UI_SCALE_Y,
        left: 	(iPhone ? 55  : 112) * Config.UI_SCALE_X,
        width:  (iPhone ? 370 : 800) * Config.UI_SCALE_X,
        height: (iPhone ? 270 : 600) * Config.UI_SCALE_Y,
        contentHeight: "auto",
        contentWidth: Ti.UI.FILL
    });
    view.add(scroller);


    var holder = Ti.UI.createView({
        layout: "horizontal",
        height: Ti.UI.SIZE,
        horizontalWrap: true
    });
    scroller.add(holder);
    

    var close = Ti.UI.createButton({
        right:  (iPhone ? 40 : 82) * Config.UI_SCALE_X,
        top:    (iPhone ? 20 : 54) * Config.UI_SCALE_Y,
        width:  (iPhone ? 22 : 47) * Config.UI_SCALE_X,
        height: (iPhone ? 22 : 48) * Config.UI_SCALE_Y,
        backgroundImage: "/images/navigation/close.png"
    });
    view.add(close);


    var thumbs = [];

    self.fill = function() {

        var rect = scroller.rect;
        var w = Math.floor(rect.width / 4);
        var h = Math.floor((w * 3 / 4) * sy / sx);
        var lockedFromIndex = InAppPurchases.isFullVersion() ? 9999 : Config.LAST_FREE_PAGE;
        thumbs = [];
        holder.removeAllChildren();
        var lastPage = Ti.App.Properties.getInt("lastPage", 0);
        for (var i = 0, j = Config.ALL_PAGES.length - 2; i < j; i++) {//MAGIC - two last pages disabled!
            var p = Config.ALL_PAGES[i];
            var thumb = new Thumb(w, h, p, i, i >= lockedFromIndex, self);
            holder.add(thumb);
            thumbs.push(thumb);
            //Ti.API.info('ADDED ' + thumb)
            if (i == lastPage) {
                self.selectedThumb = thumb;
                thumb.select();
            }
        };
        holder.height = Ti.UI.SIZE;

    };

    self.selectThumb = function(i) {
        if (self.selectedThumb) {
            self.selectedThumb.deselect();
        }
        var t = thumbs[i];
        t.select();
        self.selectedThumb = t;
    };

    self.show = function() {
    	Ti.API.debug("ContentMenu | self.show");
        view.show();
        view.animate({
            opacity: 1,
            duration: 300
        }, function() {
    		Ti.API.debug("ContentMenu | self.show | animate end");
        });
    };

    self.hide = function() {
        view.animate({
            opacity: 0,
            duration: 300
        }, function() {
            view.hide();
        });
    };

    close.addEventListener("click", self.hide);

    return self;

}



function Thumb(w, h, page, index, locked, parent) {

    var mx = Math.floor(w / 20);
    //Ti.API.info(w);
    var self = Ti.UI.createView({
        width:  w - 2 * mx,
        height: h - 2 * mx,
        top:    mx,
        bottom: mx,
        left:  mx,
        right: mx,
        pageIndex: index,
        backgroundImage: "/images/thumbs/" + (index + 1) + THUMBNAILS_FORMAT
    });
    if (locked) {
        self.add(Ti.UI.createView({
            touchEnabled: false,
            backgroundImage: "/images/thumbs/locked.png"
        }));
    }

    self.select = function() {
        if (locked) return;
        self.add(Ti.UI.createView({
            touchEnabled: false,
            backgroundImage: "/images/thumbs/selected.png"
        }));
    };

    self.deselect = function() {
        if (locked) return;
        self.removeAllChildren();
    };

    self.addEventListener("touchstart",  self.select);
    self.addEventListener("touchend",    self.deselect);
    self.addEventListener("touchcancel", self.deselect);
    self.addEventListener("singletap", function() {
        clickSound.play();
        parent.hide(true);
        Ti.App.fireEvent("goToPage", { index: index });
    });

    return self;

}



module.exports = ContentMenu;