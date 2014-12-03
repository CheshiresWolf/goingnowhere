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

    //====================<init>====================

    var background;

    var mapParts = {
        dimensions : {
            width  : 4,
            height : 4
        },
        blockSize  : {
            width  : 300,
            height : 300
        },
        spriteNames : ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png", "14.png", "15.png", "16.png"],
        folderPath  : "images/scenes/map/"
    }

    drawMap();

    //===================</init>====================

    //====================<Scene>====================

	scene.addEventListener('startAnimationFinished', function(e) {

        window.addEventListener( 'touchmove',  touchmoveListener  );
        window.addEventListener( 'touchstart', touchstartListener );

        //ti-mocha tests
        testMap();
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

    //===================/<Scene>====================

    //====================<Draw>====================

    function drawMap() {
        var bufArray = [];

        background = quicktigame2d.createSprite({
            x : 0,
            y : 0,
            z : 0,
            width  : mapParts.dimensions.width  * mapParts.blockSize.width  * game.scaleX,
            height : mapParts.dimensions.height * mapParts.blockSize.height * game.scaleY,
            image  : "images/clearb.png"
        });
        bufArray.push(background);

        var i = 0, j = 0, bufSprite;

        for (var index = 0; index < mapParts.spriteNames.length; index++) {
            if (i >= mapParts.dimensions.width) {
                i = 0;
                j++;
            }

            bufSprite = quicktigame2d.createSprite({
                x : i * mapParts.blockSize.width  * game.scaleX,
                y : j * mapParts.blockSize.height * game.scaleY,
                z : 1,
                width  : mapParts.blockSize.width  * game.scaleX,
                height : mapParts.blockSize.height * game.scaleY,
                image  : mapParts.folderPath + mapParts.spriteNames[index]
            });

            background.addChildNode(bufSprite);
            bufArray.push(bufSprite);

            i++;
        }

        scene.addBatch(bufArray);
    }

    //===================</Draw>====================


    return scene;
}

//====================<Tests>====================

function testMap() {
    require('tests/ti-mocha');

    require('tests/tests').testMap();
}

//===================</Tests>====================

module.exports = Map;