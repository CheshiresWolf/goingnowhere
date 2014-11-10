var _ = require('/lib/Underscore');
var Config = require("config");

function LoadableSceneUI(fname, basepath, game, windowFlag) {

    //scene data
    var data; 
    //main scene
    var sprites = {};

    var rx = game.isRetina() ? 0.5: 1;
    var scaleX = rx * game.scaleX;
    var scaleY = rx * game.scaleY;

    var isIphone = Ti.Platform.osname === "iphone";
    var SCREEN_WIDTH  = Config.UI_WIDTH;
    var SCREEN_HEIGHT = Config.UI_HEIGHT;
    
    var scene;
    if (windowFlag == undefined) {
        scene = Ti.UI.createView({
            width:  SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            zIndex: 100
        });
    } else {
        scene = Ti.UI.createWindow({
            width:  SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            orientationModes: [
                Titanium.UI.PORTRAIT
            ],
            fullscreen: true,
            hideNavBar: true,
            navBarHidden: true
        });
    }
    
    scene.soundFormat = Ti.Android ? ".mp3" : ".mp3";
    function px2dip(ThePixels) {
        return scene.android ? (ThePixels / (Titanium.Platform.displayCaps.dpi / 160)) : ThePixels;
    };
    var osname = Ti.Platform.osname,
        height = Ti.Platform.displayCaps.platformHeight,
        width = Ti.Platform.displayCaps.platformWidth;
    scene.android = !!Ti.Android;
    scene.tablet = osname === 'ipad' || (osname === 'android' && (px2dip(width) >= 900 || px2dip(height) >= 900));
    
    function getJsonData(fname) {
        var file = Ti.Filesystem.getFile(fname);
        var content = file.read().text;
        file = null;
        return eval("("+ content + ")");
    }
    
    scene.loadSprites = function(){
        //read json
        data = getJsonData(fname);
        
        //remember data
        scene.pageData = data;
        var lng  = Config.getCurrentLanguage();
        data.layers.forEach(function(l,i) {
            
            //language sprite filtering
            if (l.name.match(/_[a-z]+_lang$/)) {
                var lngSprite = l.name.match(/_([a-z]+)_lang$/)[1];
                
                if (lng != lngSprite) {
                    return;
                }
            }
            if (Config.ONE_LANGUAGE && l.multilanguage) {
                l.hidden = true;
            }
            
            
            //platform sprite filtering
            if (l.platform && l.platform == 'android' && !scene.android) {
                return;
            }
            if (l.platform && l.platform == 'ios' && scene.android) {
                return;
            }
            
            //type
            if (l.type && l.type == 'phone' && !scene.tablet) {
                return;
            }
            if (l.type && l.type == 'tablet' && scene.tablet) {
                return;
            }
            
            l.left  = parseInt(l["left_" + lng], 0) * scaleX || parseInt(l.left, 0) * scaleX;
            l.width = parseInt(l.width, 0) * scaleX; 
            l.top    = parseInt(l["top_" + lng], 0) * scaleY || parseInt(l.top, 0) * scaleY;
            l.height = parseInt(l.height, 0) * scaleY;
            var sprite;
            var angle = l.angle || 0;
            var y = l.top;
            sprite = Ti.UI.createView({
                visible: !l.hidden,
                left: l.left,
                top: y,
                width:  l.width,
                height: l.height,
                angle: angle,
                backgroundImage: basepath + l.filename,
                loadedData: l
            });
            scene.add(sprite);
            sprites[l.name] = sprite;
        });    
    };
    
    //helper functions
    //return sprites by name
    scene.spriteByName = function(name){
        return sprites[name];
    };

    scene.loadSprites();
    return scene;    
    
}

module.exports = LoadableSceneUI;