var lastFreePage = 1;
var talePagesAmount = 1;

var allPages = ["Map"];

// ===== UI size stuff =====

var DESIGNED_WIDTH  = 1024;
var DESIGNED_HEIGHT = 768;

var maxAspectRatio = 1024 / 768;
var uiWidth, uiHeight;

// Calculate uiWidth and uiHeight
calculateUIDimension();

// =========================

module.exports = {

    APP_ID : "806813956",
    APP_DOMAIN : "ua.com.ipublisher.tales.goingnowhere",

    IAP_PRODUCT_NAME  : "GoingNowhere",
    IAP_SHARED_SECRET : "7d5c7531f97348fc90ecafb49ccf725e",

    GIAB_PRODUCT_NAME : "ua.com.ipublisher.tales.goingnowhere",
    GIAB_PUBLIC_KEY : "",
    
    //googleAnalyticsId : "UA-49989685-11",

    DEVELOPER_PAGE : isiOS7Plus() ? "itms://itunes.apple.com/ua/artist/ipublisher-ua" : "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewArtist?id=468043785",
    
    // make sure it's false for release
    // TEST_PURCHASES: true && Ti.App.deployType !== "production",
    TEST_VERSION : false,
    PAID_VERSION : true,

    FPS : getFPS(),
    // NO_MUSIC: false,

    LAST_FREE_PAGE : lastFreePage, 
    ALL_PAGES  : allPages,
    FREE_PAGES : allPages.slice(0, lastFreePage).concat("Buy"),

    LANGUAGES : ["ru", "en"],
    DEFAULT_LANGUAGE : "en",
    //ONE_LANGUAGE : "ru",

    getCurrentLanguage : function() {
        if (this.ONE_LANGUAGE) {
            return this.ONE_LANGUAGE;
        }
        var lang = Ti.App.Properties.getString("language", Ti.Locale.currentLanguage);
        if (this.LANGUAGES.indexOf(lang) == -1) {
            lang = this.DEFAULT_LANGUAGE;
        }
        return lang;
    },

    HAS_GAMES : false,

    DEBUG_LOADER : false, // && Ti.Platform.model === "Simulator",

    // ios | android | tizen | mobileweb
    OS_FAMILY : getOSFamily(),
    ios7 : isiOS7Plus(),
    
    // tablet | phone
    DEVICE_TYPE : getDeviceType(),

    THUMBNAILS_FORMAT : ".jpg",

    baseAdsUrl : "http://tales.ipublisher.com.ua/ads/api.php",

    twitter_url  : "https://twitter.com/rabbit_run_app",
    facebook_url : "https://www.facebook.com/runrabbitrunapp",

    MUSIC_PLAYLIST : [],

    IS_RETINA : isRetina(),

    UI_SCALE_X : uiWidth  / DESIGNED_WIDTH,
    UI_SCALE_Y : uiHeight / DESIGNED_HEIGHT,
    UI_WIDTH   : uiWidth,
    UI_HEIGHT  : uiHeight,

    //UI_TOP_OFFSET : topOffset,

    //UI_WINDOW_HEIGHT : uiHeight + topOffset * 2,
    
    Globals : {}
};



function isiOS7Plus() {
    // iOS-specific test
    if (Titanium.Platform.name === "iPhone OS") {
        var version = Titanium.Platform.version.split(".");
        var major = parseInt(version[0], 10);

        // Can only test this support on a 3.2+ device
        if (major >= 7) {
            return true;
        }
    }
    return false;
}



function getFPS() {

    var LOW_FPS    = 15;
    var MEDIUM_FPS = 30;
    var HIGH_FPS   = 60;
    
    var model = Titanium.Platform.model;

    var version = Titanium.Platform.version.split(".");
    var major = parseInt(version[0], 10);

    switch(true) {

        case Ti.Android :
        case model === "iPad1" :
        case model === "iPhone 4" :
            return MEDIUM_FPS;
            
        case model === "iPhone 3G" :
        case model === "iPhone 3GS" :
            return LOW_FPS;
        
        case major <= 4 :
            return LOW_FPS;

        default :
            return HIGH_FPS;

    }
    
}

function isRetina() {
    if (!!Ti.Android) {
        return false;
    }

	var dpi = Ti.Platform.displayCaps.dpi;
	var osname = Ti.Platform.osname; 
    return dpi > 163 && (osname == 'ipad' || osname == 'iphone');  
};

function getDeviceType() {

    var height = Ti.Platform.displayCaps.platformHeight;
    var width  = Ti.Platform.displayCaps.platformWidth;

    function px2dip(px) {
        if (Ti.Platform.osname === "android") {
            return (px / (Ti.Platform.displayCaps.dpi / 160));
        } else {
            return px;
        }
    }

    var retina = (
        Ti.Platform.osname === "android" && (px2dip(width) >= 900 || px2dip(height) >= 900)
    );

    return Ti.Platform.osname === "ipad" || retina ? "tablet" : "phone";
}

function getOSFamily() {
    var osname = Ti.Platform.osname;
    if (osname === "ipad" || osname === "iphone") osname = "ios";
    return osname;
}

function calculateUIDimension() {
    var displayCaps = Ti.Platform.displayCaps;
    var w = Math.max(displayCaps.platformWidth, displayCaps.platformHeight);

    uiWidth   = w;
    uiHeight  = (uiWidth * 768) / 1024;
    //topOffset = (displayCaps.platformHeight - uiHeight) / 2;
    
    if (isRetina()) {
    	uiWidth   *= 2;
    	uiHeight  *= 2;
        //topOffset *= 2;
    }
}