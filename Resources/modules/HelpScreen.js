var Config = require("config");
var LevelManager  = require("modules/LevelManager");

function HelpScreen(game, window) {

    var self = this;

    var scrollerIndex = 0;

    var holder = Ti.UI.createView({
        left : 0,
        top : 0,
        width  : Ti.UI.FILL,
        height : Ti.UI.FILL,
        zIndex : 5
    });

    var background = Ti.UI.createImageView({
        left : 0,
        top : 0,
        zIndex : 5,
        width   : Ti.UI.FILL,
        height  : Ti.UI.FILL,
        opacity : 0.75,
        image   : "/images/clearb.png"
    });
    holder.add(background);

    var backButton = Ti.UI.createButton({
        left : 5 * Config.UI_SCALE_X,
        top  : 9 * Config.UI_SCALE_Y,
        width  : 125 * Config.UI_SCALE_X,
        height : 116 * Config.UI_SCALE_Y,
        zIndex : 7,
        backgroundImage : "/images/common/help/backoff.png"
    });
    backButton.addEventListener("click", function() {
        backButton.backgroundImage = "/images/common/help/backon.png";
        setTimeout(function() {
            backButton.backgroundImage = "/images/common/help/backoff.png";
            self.close();
        }, 100);
    });
    holder.add(backButton);

    var views = [];
    var lang = Config.getCurrentLanguage();

    views.push(Ti.UI.createImageView({
        width  : 568 * Config.UI_SCALE_X,
        height : 824 * Config.UI_SCALE_Y, 
        backgroundImage : "/images/common/help/h0_" + lang + ".png"
    }));

    views.push(Ti.UI.createImageView({
        width  : 568 * Config.UI_SCALE_X,
        height : 824 * Config.UI_SCALE_Y, 
        backgroundImage : "/images/common/help/h1_" + lang + ".png"
    }));

    views.push(Ti.UI.createImageView({
        width  : 568 * Config.UI_SCALE_X,
        height : 824 * Config.UI_SCALE_Y, 
        backgroundImage : "/images/common/help/h2_" + lang + ".png"
    }));

    var helpScroller = Ti.UI.createScrollableView({
        top  : 150 * Config.UI_SCALE_Y,
        left : 100 * Config.UI_SCALE_X,
        bottom : 100 * Config.UI_SCALE_Y,
        right  : 100 * Config.UI_SCALE_X,
        zIndex : 6,
        views : views
    });
    helpScroller.addEventListener("scrollend", function(e) {
        scrollerIndex = e.currentPage;
        Ti.API.debug("HelpScreen | event : scrollend | index : " + scrollerIndex);
        checkArrows();
    });
    holder.add(helpScroller);

    var topOffset = 485 * Config.UI_SCALE_Y;
    if (Config.UI_TOP_OFFSET > 0) {
        topOffset = Config.UI_WINDOW_HEIGHT / 2 - 27 * Config.UI_SCALE_Y;
    }

    var leftScrollArrow = Ti.UI.createView({
        left : 20  * Config.UI_SCALE_X,
        top  : topOffset,
        width  : 55 * Config.UI_SCALE_X,
        height : 55 * Config.UI_SCALE_Y,
        zIndex : 6,
        backgroundImage : "/images/common/help/arrow_left_on.png"
    });
    leftScrollArrow.addEventListener("singletap", function() {
        window.topScene().playSound("button_click");
        scrollRight();
    });
    holder.add(leftScrollArrow);
    leftScrollArrow.hide();

    var rightScrollArrow = Ti.UI.createView({
        right : 20  * Config.UI_SCALE_X,
        top   : topOffset,
        width  : 55 * Config.UI_SCALE_X,
        height : 55 * Config.UI_SCALE_Y,
        zIndex : 6,
        backgroundImage : "/images/common/help/arrow_right_on.png"
    });
    rightScrollArrow.addEventListener("singletap", function() {
        window.topScene().playSound("button_click");
        scrollLeft();
    });
    holder.add(rightScrollArrow);
    //rightScrollArrow.hide();

    function scrollLeft() {
        if (scrollerIndex + 1 < views.length) {
            scrollerIndex++;
            helpScroller.moveNext();
        }
    };
    
    function scrollRight() {
        if (scrollerIndex - 1 >= 0) {
            scrollerIndex--;
            helpScroller.movePrevious();
        }
    };

    function checkArrows() {
        if (scrollerIndex == 0) {
            leftScrollArrow.hide();
        } else {
            leftScrollArrow.show();
        }

        if (scrollerIndex == views.length - 1) {
            rightScrollArrow.hide();
        } else {
            rightScrollArrow.show();
        }
    }

    //===============<self>===============

    self.close = function() {
        holder.opacity = 0;
        holder.hide();
    };

    self.open = function() {
        holder.opacity = 1;
        holder.show();

        helpScroller.scrollToView(0);
        //checkArrows();
    };

    window.add(holder);
	holder.hide();

    return self;

}

module.exports = HelpScreen;