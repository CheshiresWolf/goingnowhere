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

    var tsPos = {};
    var tsBackPos = {};
    function touchstartListener(e) {
        tsPos.x = e.x;
        tsPos.y = e.y;

        tsBackPos.x = background.x;
        tsBackPos.y = background.y;
    }

    function touchmoveListener(e) {
        var newX = tsBackPos.x - ( tsPos.x - e.x );
        var newY = tsBackPos.y - ( tsPos.y - e.y );

        if ( newX > 0 ) newX = 0;
        if ( newY > 0 ) newY = 0;

        if ( ( newX + background.width  ) < Config.UI_WIDTH  ) newX = Config.UI_WIDTH  - background.width;
        if ( ( newY + background.height ) < Config.UI_HEIGHT ) newY = Config.UI_HEIGHT - background.height;

        background.x = newX;
        background.y = newY;
    }


    return scene;
}

module.exports = Map;