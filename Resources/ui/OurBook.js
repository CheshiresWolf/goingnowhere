var isAndroid = !!Ti.Android;
module.exports = function(book, lng, game) {
    var appstoreImgPath;
    var appstoreSoonImgPath;
    
    var scaleX = isAndroid ? game.scaleX : 1;
    var scaleY = isAndroid ? game.scaleY : 1;
    
    appstoreImgPath = (isAndroid) ?'/images/scenes/common/End/google_play_'+lng+'_lang.png' :'/images/scenes/common/End/appstore_'+lng+'_lang.png';
    appstoreSoonImgPath = (isAndroid) ?'/images/scenes/common/End/google_play-soon_'+lng+'_lang.png' :'/images/scenes/common/End/appstore-soon_'+lng+'_lang.png';
    
    if (lng == 'en') {
        book.published = book.published_en;
    }
    
    if (isAndroid) {
        book.published = book.published_google;
    }
    
    var flag = (Ti.Platform.osname === "iphone");
    
    var self = Ti.UI.createView({
        left: 0,
        width: flag ? 112 : 241,//241 * scaleX,
        height: flag ? 100 : 241,//241* scaleY,
        right: flag ? 23 : 50
    });
    
    var bookView = Ti.UI.createImageView({
        top: 0, 
        width: flag ? 112 : 241,//242* scaleX,
        height: flag ? 82 : 198,//198* scaleY,
        image: book.image_url
    });  

    self.add(bookView);
    
    var appstore = Ti.UI.createView({
        bottom: 0, 
        width: flag ? 60 : 128,//128* scaleX,
        height: flag ? 20 : 44,//44* scaleY,
        backgroundImage: book.published? appstoreImgPath:appstoreSoonImgPath,
    });  
    // /self.add(book);
    self.add(appstore);
    
    self.addEventListener("singletap", function(e) {
        try { game.window.topScene().playSound("menu"); } catch(e) {};
        game.window.confirmParent(game.window, function() {
            var url = book.published ? book.appstore_url : "http://tales.ipublisher.com.ua?from=ua.com.ipublisher.tales.thumbeline.ru.free";
            var list = url.match(/id=(\d+?)&/);
            if (list) {
                if ( isiOS7Plus() ) {
                    url = "itms-apps://itunes.apple.com/app/id" + list[1];
                } else {
                    //Ti.API.info("itms-apps://itunes.apple.com/app/id" + list[1]);
                }
            }
            Titanium.Platform.openURL(url);
        });
    });
    return self;
};

function isiOS7Plus() {
    // iOS-specific test
    if (Titanium.Platform.name == 'iPhone OS') {
        var version = Titanium.Platform.version.split(".");
        var major = parseInt(version[0], 10);

        // Can only test this support on a 3.2+ device
        if (major >= 7) {
            return true;
        }
    }
    return false;
}
