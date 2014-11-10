var quicktigame2d = require("com.ti.game2d");
var Config = require("config");

function Map(game, window) {

    var LoadableScene = game.require("/ui/LoadableScene");
    var scene = new LoadableScene(
        game,
        Ti.Filesystem.resourcesDirectory + "images/scenes/map/map.jscene",
        "images/scenes/map/",
        false
    );
    scene.page_index = 0;

    var background;

	scene.addEventListener('startAnimationFinished', function(e) {

        background = scene.spriteByName("background");

        window.addEventListener( 'touchmove',  touchmoveListener  );
        window.addEventListener( 'touchstart', touchstartListener );
    
    });

    scene.beforeUnload = function() {
        window.removeEventListener( 'touchmove',  touchmoveListener  );
        window.removeEventListener( 'touchstart', touchstartListener );
    };

    var touchstartPos = {};
    function touchstartListener(e) {
        touchstartPos.x = e.x;
        touchstartPos.y = e.y;
    }

    function touchmoveListener(e) {
        var x = touchstartPos.x - e.x;
        var y = touchstartPos.y - e.y;
        
        Ti.API.debug("Map | touchmoveListener | s(" + touchstartPos.x + ", " + touchstartPos.y + ") - e(" + e.x + ", " + e.y + ") = (" + x + ", " + y + ")");
    }


    return scene;
}

module.exports = Map;