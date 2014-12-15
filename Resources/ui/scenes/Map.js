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
            width  : 450,
            height : 450
        },
        spriteNames : ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png", "14.png", "15.png", "16.png"],
        folderPath  : "images/scenes/map/"
    }

    var pointers = [
        {
            name : "Persival Green",
            sprite : null,
            fraction : "green",
            opts : {
                x : 100,
                y : 100,
                r : 0.5,
                g : 1,
                b : 0.5
            }
        },
        {
            name : "Baron Red",
            sprite : null,
            fraction : "red",
            opts : {
                x : 700,
                y : 700,
                r : 1,
                g : 0.5,
                b : 0.5
            }
        },
        {
            name : "Sir Blue",
            sprite : null,
            fraction : "blue",
            opts : {
                x : 720,
                y : 300,
                r : 0.5,
                g : 0.5,
                b : 1
            }
        }
    ];

    var towns = [
        {
            name : "Green Lake",
            sprite : null,
            fraction : "green",
            opts : {
                x : 50,
                y : 100,
                image : "castle.png"
            }
        },
        {
            name : "Red Mountain",
            sprite : null,
            fraction : "red",
            opts : {
                x : 730,
                y : 720,
                image : "castle.png"
            }
        },
        {
            name : "HiddenGard",
            sprite : null,
            fraction : null,
            opts : {
                x : 300,
                y : 700,
                image : "castle.png"
            }
        }
    ];

    drawMap();

    //===================</init>====================

    //====================<Scene>====================

	scene.addEventListener('startAnimationFinished', function(e) {

        window.addEventListener( 'touchmove',  touchmoveListener  );
        window.addEventListener( 'touchstart', touchstartListener );

        for (var i in pointers) {
            drawPointers(pointers[i]);
        }

        for (var i in towns) {
            drawTown(towns[i]);
        }

        //ti-mocha tests
        if (Config.TEST_VERSION) testMap({
            self : this,
            background : background,
            pointer : pointers.length
        });
    });

    scene.beforeUnload = function() {
        window.removeEventListener( 'touchmove',  touchmoveListener  );
        window.removeEventListener( 'touchstart', touchstartListener );
    };

    var tsPos = {};
    var tsBackPos = {};
    function touchstartListener(e) {
        tsPos.x = getLocal(e.x);
        tsPos.y = getLocal(e.y);

        tsBackPos.x = background.x;
        tsBackPos.y = background.y;
    }

    function touchmoveListener(e) {
        var newX = tsBackPos.x - ( tsPos.x - getLocal(e.x) );
        var newY = tsBackPos.y - ( tsPos.y - getLocal(e.y) );

        
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
        //scene.add(background);
        Ti.API.debug("Map.js | drawMap | map drawing finished.");
    }

    function drawPointers(pointerObj) {
        var pointer = quicktigame2d.createSprite({
            x : pointerObj.opts.x * game.scaleX,
            y : pointerObj.opts.y * game.scaleY,
            z : 2,
            width  : 40 * game.scaleX,
            height : 40 * game.scaleY,
            image  : "images/scenes/map/pointer.png"
        });
        background.addChildNode(pointer);
        scene.add(pointer);

        //pointer.color(pointerObj.opts.r, pointerObj.opts.g, pointerObj.opts.b);
        setColor(pointer, pointerObj.fraction);

        pointerObj.sprite = pointer;
    }

    function drawTown(townObj) {
        var town = quicktigame2d.createSprite({
            x : townObj.opts.x * game.scaleX,
            y : townObj.opts.y * game.scaleY,
            z : 2,
            width  : 50 * game.scaleX,
            height : 50 * game.scaleY,
            image  : "images/scenes/map/" + townObj.opts.image
        });
        background.addChildNode(town);
        scene.add(town);

        //pointer.color(pointerObj.opts.r, pointerObj.opts.g, pointerObj.opts.b);
        setColor(town, townObj.fraction);

        townObj.sprite = town;
    }

    //===================</Draw>====================

    //====================<Utils>====================

    function getLocal(x) {
        if (Config.IS_RETINA)    x *= 2;
        if (Config.IS_RETINA_HD) x *= 3;

        return x;
    }

    function setColor(sprite, fraction) {
        if (fraction == null) {
            sprite.color(1, 1, 1);
        } else {
            switch (fraction) {
                case "red" :
                    sprite.color(1, 0.5, 0.5);
                    break;
                case "green" :
                    sprite.color(0.5, 1, 0.5);
                    break;
                case "blue" :
                    sprite.color(0.5, 0.5, 1);
                    break;
            }
        }
    }

    //===================</Utils>====================

    return scene;
}

//====================<Tests>====================

function testMap(opts) {
    Ti.API.debug("Map.js | start testing");

    require('tests/ti-mocha');

    require('tests/tests').testMap(opts);
}

//===================</Tests>====================

module.exports = Map;