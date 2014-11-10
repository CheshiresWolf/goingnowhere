// FirstView Component Constructor
var LoadableSceneUI = require("/ui/LoadableSceneUI");
var Config          = require("config");

var isAndroid = !!Ti.Android;

module.exports = function(game) {

    //Ti.API.info("About | init | start");
    
    var scene = new LoadableSceneUI(
        Ti.Filesystem.resourcesDirectory +
            "images/about/about.jscene",
        "/images/about/", game, true
    );
    
    scene.navBarHidden = true; 
    var rx = game.isRetina() ? 0.5 : 1;
    var lng = Config.getCurrentLanguage();

    var iphone = Ti.Platform.osname === "iphone";
    var iphoneScaleX = iphone ? 1 / 2.133 : 1;
    var iphoneScaleY = iphone ? 1 / 2.4   : 1;


    var webView = Ti.UI.createWebView({
        left: 0,
        top:  iphoneScaleY * 110, 
        width:  iphone ? 600 : 400,
        bottom: iphoneScaleY * 64,
        url: Ti.Filesystem.resourcesDirectory + "/common/about_" + lng + "_lang" + (isAndroid ? "_android.html" : ".html"),
        backgroundColor: '#01FFFFFF',//"transparent",
        disableBounce: !iphone,
        visible: false
        //touchEnabled: false
    });
    scene.add(webView);
    //webView.setBackgroundColor(0x00000000);

    //webView.addEventListener('load', function() {
    //    webView.show();
    //});

    setTimeout(function() {
        webView.show();
    }, 1000);

    // var buttonBack     = scene.spriteByName("buttonBack");
    // var buttonBackText = scene.spriteByName("backToTale_" + lng + "_lang");
    // var previews       = scene.spriteByName("previews");
    


    scene.spriteByName("back_" + lng + "_lang").addEventListener(
        "singletap",
        function(e) {

            // console.log("button back");
            var sound = Ti.Media.createSound({
                url: "/sounds/menu" + scene.soundFormat
            });
            sound.play();

            // console.debug(JSON.stringify(e));
            // scene.spriteByName("buttonBack").color(0.5, 0.5, 0.5);
            
            // e.source.animate({
            scene.spriteByName("back_" + lng + "_lang").animate({
                duration: 200,
                top: scene.spriteByName("back_" + lng + "_lang").top + 3
            }, function() {
                // scene.spriteByName("buttonBack").color(1, 1, 1);
                scene.close();
            });

        }
    );


/*
    scene.spriteByName("previews").addEventListener(
        "singletap",
        function(e) {
            game.window.confirmParent(scene, function() {
                // console.log("previews");
                var url = "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewArtist?id=468043785";
                Titanium.Platform.openURL(url);
            })
        }
    );*/



    return scene;

};