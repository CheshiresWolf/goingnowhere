var quicktigame2d = require("com.ti.game2d");
var Config = require("config");

var debug = true;

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

    var path = readPath();

    drawMap();

    //===================</init>====================

    //====================<Scene>====================

	scene.addEventListener('startAnimationFinished', function(e) {

        window.addEventListener( 'touchmove',  touchmoveListener  );
        window.addEventListener( 'touchstart', touchstartListener );

        for (var i in pointers) {
            drawPointers(pointers[i]);
        }

        /*for (var i in towns) {
            drawTown(towns[i]);
        }*/

        for (var i in path) {
            drawPath(path[i], i);
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

        //roadMaker(tsPos.x - background.x, tsPos.y - background.y);
        if (debug) Ti.API.debug("Map.js | touchstartListener | e(" + e.x + ", " + e.y + "), localE(" + tsPos.x + ", " + tsPos.y + "), globalE(" + (tsBackPos.x * -1 + tsPos.x) + ", " + (tsBackPos.y * -1 + tsPos.y) + ")");
    }

    function touchmoveListener(e) {
        var newX = tsBackPos.x - ( tsPos.x - getLocal(e.x) );
        var newY = tsBackPos.y - ( tsPos.y - getLocal(e.y) );

        
        if ( newX > 0 ) newX = 0;
        if ( newY > 0 ) newY = 0;

        if ( ( newX + background.designedWidth  ) < Config.UI_WIDTH  ) newX = Config.UI_WIDTH  - background.designedWidth;
        if ( ( newY + background.designedHeight ) < Config.UI_HEIGHT ) newY = Config.UI_HEIGHT - background.designedHeight;
        

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
            width  : 1,//mapParts.dimensions.width  * mapParts.blockSize.width  * game.scaleX,
            height : 1,//mapParts.dimensions.height * mapParts.blockSize.height * game.scaleY,
            image  : "images/clearb.png"
        });
        bufArray.push(background);

        background.designedWidth  = mapParts.dimensions.width  * mapParts.blockSize.width  * game.scaleX;
        background.designedHeight = mapParts.dimensions.height * mapParts.blockSize.height * game.scaleY;

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

        if (debug) Ti.API.debug("Map.js | drawMap | map drawing finished.");
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

    function drawPath(dot, name) {
        var dotSprite = quicktigame2d.createSprite({
            x : dot.x,// * game.scaleX,
            y : dot.y,// * game.scaleY,
            z : 2,
            width  : ( (dot.type) ? dot.w : 20 ) * game.scaleX,
            height : ( (dot.type) ? dot.h : 20 ) * game.scaleY,
            image  : "images/scenes/map/" + ( (dot.type) ? dot.image : "dot.png" ),
            touchEnabled : true
        });
        background.addChildNode(dotSprite);
        scene.add(dotSprite);

        if (dot.type) {
            setColor(dotSprite, dot.fraction);
        }

        dotSprite.addEventListener("singletap", function() {
            Ti.API.debug("Dot(" + name + ") : " + JSON.stringify(dot));
        });

        dot.sprite = dotSprite;
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

    var roadDots = [];
    var roadDotIndex = 0;
    function roadMaker(x, y) {
        var roadDot = quicktigame2d.createSprite({
            x : x,
            y : y,
            z : 2,
            width  : 20 * game.scaleX,
            height : 20 * game.scaleY,
            image  : "images/scenes/map/pointer.png"
        });
        background.addChildNode(roadDot);
        scene.add(roadDot);

        roadDots.push({name : roadDotIndex, x : x, y : y, connected : []});

        var roadText = quicktigame2d.createTextSprite({
            x : x,
            y : y,
            z : 3,
            width  : 200 * game.scaleX,
            height : 200 * game.scaleY,
            text : roadDotIndex,
            fontSize : 40,
            fontFamily : "Gabriola"
        });
        roadText.color(1, 1, 1);
        background.addChildNode(roadText);
        scene.add(roadText);

        roadDotIndex++;

        if (debug) Ti.API.debug(JSON.stringify(roadDots));
    }

    function readPath() {
        var file = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "images/scenes/map/path.json");
        var data = null;

        if (file.exists()) {
            data = JSON.parse(file.read()); 
        } else {
            Ti.API.debug("Map | readPath | file not found error.");
        }

        return data;
    }

    //===================</Utils>====================

    return scene;
}

//====================<Tests>====================

function testMap(opts) {
    if (debug) Ti.API.debug("Map | start testing");

    require('tests/ti-mocha');

    require('tests/tests').testMap(opts);
}

//===================</Tests>====================

module.exports = Map;