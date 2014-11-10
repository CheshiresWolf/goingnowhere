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

	scene.addEventListener('startAnimationFinished', function(e) {
    
    });

    scene.beforeUnload = function() {
        
    };


    return scene;
}

module.exports = Map;