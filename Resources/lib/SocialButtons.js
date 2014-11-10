var Config = require("config");

if (Ti.Android || 1) {

module.exports = {

    shareFacebook : function(data) {
        var lng = Config.getCurrentLanguage();
    },
    shareTwitter : function(data) {
        var lng = Config.getCurrentLanguage();
    },
    shareEmail : function(data) {
        var lng = Config.getCurrentLanguage();
    },

    shareVKontakte : function(data) {
        var lng = Config.getCurrentLanguage();
    }
};

} else {


//Consumer key    B24rPBPAZSXIys5EZPBmew
//Consumer secret uTZDBiuZ3CS4Tzjobh0gQpQQc3oEndDqXeLuJpt27Co

//Facebook App Id: 418453781583748
//App Secret: 11336c7b0d856d60916ffa6009200497(reset)
var lng = Config.getCurrentLanguage();

var sharekit = require('com.0x82.sharekit');
var APP_NAME = L(lng + '_appname');
var LINK = "https://itunes.apple.com/ru/app/id623858130?mt=8";
//Ti.Facebook.appid = '418453781583748';
//Titanium.Facebook.permissions = ['publish_stream'];
//Ti.Facebook.forceDialogAuth = true;

sharekit.configure({
    // Required: set your app name and url
    //sharers_plist_name : '/Sharers.plist',
    my_app_name : APP_NAME,
    my_app_url : 'http://tales.ipublisher.com.ua/three_little_pigs',

    twitter_consumer_key : 'B24rPBPAZSXIys5EZPBmew',
    twitter_consumer_secret : 'uTZDBiuZ3CS4Tzjobh0gQpQQc3oEndDqXeLuJpt27Co',
    twitter_callback_url : 'http://tales.ipublisher.com.ua/three_little_pigs',
    // twitter_use_xauth: true
    // twitter_username: 'rubenfonseca'

    // For shortening URLs on Twitter
    // See the documentation/configuration.html
    bit_ly_login : 'o_7m99ujgapu',
    bit_ly_key : 'R_c07c37eadaf6fdd4a6894f524d8b3678',

    // See documentation/configuration.html
    facebook_key : '418453781583748',
    // See documentation/configuration.html
    readitlater_key : '',

    vkontakte_app_id : '3525007',

    evernote_user_store_url : '',
    evernote_net_store_url : '',
    evernote_consumer_key : '',
    evernote_secret : '',

    flickr_consumer_key : '',
    flickr_secret_key : '',
    flickr_callback_url : '',

    linked_in_consumer_key : '',
    linked_in_secret : '',
    linked_in_callback_url : '',

    foursquare_client_id : '',
    foursquare_redirect_uri : '',

    // Optional. See: http://developer.apple.com/iphone/library/documentation/UIKit/Reference/UIKitDataTypesReference/Reference/reference.html#//apple_ref/c/econst/UIBarStyleDefault
    bar_style : "UIBarStyleDefault",

    // Optional. Value between 0-255, set all to -1 to default
    form_font_color_red : -1,
    form_font_color_green : -1,
    form_font_color_blue : -1,
    form_bg_color_red : -1,
    form_bg_color_green : -1,
    form_bg_color_blue : -1,

    // Optional. See: http://developer.apple.com/iphone/library/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle
    ipad_modal_presentation_style : "UIModalPresentationFormSheet",
    // Optional. See: http://developer.apple.com/iphone/library/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle
    ipad_modal_transition_style : "UIModalTransitionStyleCoverVertical",

    use_placeholders : false,

    max_fav_count : 3,
    allow_offline : true,
    allow_auto_share : true

});

module.exports = {

    shareFacebook : function(data) {
        var lng = Config.getCurrentLanguage();
        
        sharekit.share({
            link : LINK,
            title : L(lng + '_appname'),
            view : data.view,
            sharer : "Facebook"
        });

    },
    shareTwitter : function(data) {
        var lng = Config.getCurrentLanguage();
        
        sharekit.share({
            title : L(lng + '_appname'),
            link : LINK,
            view : data.view,
            sharer : "Twitter"
        });
    },
    shareEmail : function(data) {
        var lng = Config.getCurrentLanguage();
        
        sharekit.share({
            title : L(lng + '_appname'),
            link : LINK,
            view : data.view,
            sharer : "Mail"
        });
    },

    shareVKontakte : function(data) {
       var lng = Config.getCurrentLanguage();
        
        //Ti.API.info(data.view);
        sharekit.share({
            title : L(lng + '_appname'),
            link : LINK,
            view : data.view,
            sharer : "Vkontakte"
        });
    }
};
}