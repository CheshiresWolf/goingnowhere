var quicktigame2d = require("com.ti.game2d");
var Config = require("config");

var debug = true;

function Dungeon(game, window) {

    var LoadableScene = game.require("/ui/LoadableScene");
    var basepath = "images/scenes/dungeon/"
    var scene = new LoadableScene(
        game,
        Ti.Filesystem.resourcesDirectory + "images/scenes/dungeon/dungeon.jscene",
        basepath,
        false
    );
    scene.page_index = 1;

    //====================<init>====================

    var currentTile, currentTileIndex;

    var background = quicktigame2d.createSprite({
        x : 0,
        y : 0,
        z : 0,
        width  : Config.UI_WIDTH,
        height : Config.UI_HEIGHT,
        image  : "images/clearb.png"
    });
    scene.add(background);

    var arrows = {
        top    : null,
        right  : null,
        bottom : null,
        left   : null
    };
    drawArrows();

    var parent = quicktigame2d.createSprite({
        x : 0,
        y : 0,
        z : 0,
        width  : 1,
        height : 1,
        image  : "images/clear.png"
    });
    scene.add(parent);

    var player = null;
    drawPlayer();

    var tiles = [
        { name : "b0.png", tileMap : [  0,  1,  0,  1, 0,  1,  0,  1,  0] },
        { name : "q0.png", tileMap : [ -1,  1, -1,  0, 0,  1,  0,  0, -1] },
        { name : "q1.png", tileMap : [  0,  0, -1,  0, 0,  1, -1,  1, -1] },
        { name : "q2.png", tileMap : [ -1,  0,  0,  1, 0,  0, -1,  1, -1] },
        { name : "q3.png", tileMap : [ -1,  1, -1,  1, 0,  0, -1,  0,  0] },
        { name : "t0.png", tileMap : [ -1,  1, -1,  1, 0,  1, -1, -1, -1] },
        { name : "t1.png", tileMap : [ -1,  1, -1, -1, 0,  1, -1,  1, -1] },
        { name : "t2.png", tileMap : [ -1, -1, -1,  1, 0,  1, -1,  1, -1] },
        { name : "t3.png", tileMap : [ -1,  1, -1,  1, 0, -1, -1,  1, -1] },
        { name : "e0.png", tileMap : [ -1,  1, -1, -1, 0, -1, -1, -1, -1] },
        { name : "e1.png", tileMap : [ -1, -1, -1, -1, 0,  1, -1, -1, -1] },
        { name : "e2.png", tileMap : [ -1, -1, -1, -1, 0, -1, -1,  1, -1] },
        { name : "e3.png", tileMap : [ -1, -1, -1,  1, 0, -1, -1, -1, -1] }
    ];
    drawMap();

    //===================</init>====================

    //====================<Scene>====================

	scene.addEventListener('startAnimationFinished', function(e) {


        /*ti-mocha tests
        if (Config.TEST_VERSION) testDungeon({
            self : this,
            background : background,
            pointer : pointers.length
        });
            */
    });

    scene.beforeUnload = function() {
        
    };

    //===================</Scene>====================
    
    //====================<Draw>====================

    function drawArrows() {
        arrows.top = quicktigame2d.createSprite({
            x : Config.UI_WIDTH  - 210 * game.scaleX,
            y : Config.UI_HEIGHT - 310 * game.scaleY,
            z : 10,
            width  : 100 * game.scaleX,
            height : 100 * game.scaleY,
            image  : basepath + "arrow0.png",
            touchEnabled : true
        });
        arrows.top.addEventListener("singletap", function() {
            if (debug) Ti.API.debug("Dungeon | drawArrows | arrows.top event : singletap");
            move("top");
        });
        scene.add(arrows.top);

        arrows.right = quicktigame2d.createSprite({
            x : Config.UI_WIDTH  - 110 * game.scaleX,
            y : Config.UI_HEIGHT - 210 * game.scaleY,
            z : 10,
            width  : 100 * game.scaleX,
            height : 100 * game.scaleY,
            image  : basepath + "arrow1.png",
            touchEnabled : true
        });
        arrows.right.addEventListener("singletap", function() {
            if (debug) Ti.API.debug("Dungeon | drawArrows | arrows.right event : singletap");
            move("right");
        });
        scene.add(arrows.right);

        arrows.bottom = quicktigame2d.createSprite({
            x : Config.UI_WIDTH  - 210 * game.scaleX,
            y : Config.UI_HEIGHT - 110 * game.scaleY,
            z : 10,
            width  : 100 * game.scaleX,
            height : 100 * game.scaleY,
            image  : basepath + "arrow2.png",
            touchEnabled : true
        });
        arrows.bottom.addEventListener("singletap", function() {
            if (debug) Ti.API.debug("Dungeon | drawArrows | arrows.bottom event : singletap");
            move("bottom");
        });
        scene.add(arrows.bottom);

        arrows.left = quicktigame2d.createSprite({
            x : Config.UI_WIDTH  - 310 * game.scaleX,
            y : Config.UI_HEIGHT - 210 * game.scaleY,
            z : 10,
            width  : 100 * game.scaleX,
            height : 100 * game.scaleY,
            image  : basepath + "arrow3.png",
            touchEnabled : true
        });
        arrows.left.addEventListener("singletap", function() {
            if (debug) Ti.API.debug("Dungeon | drawArrows | arrows.left event : singletap");
            move("left");
        });
        scene.add(arrows.left);
    }

    function drawMap() {
        var tile = new mapTile(getRandomFromArray(tiles), {
            x : Config.UI_WIDTH  / 2 - 150 * game.scaleX,
            y : Config.UI_HEIGHT / 2 - 150 * game.scaleY,
            width  : 300 * game.scaleX,
            height : 300 * game.scaleY,
        });

        currentTile = tile;
        currentTileIndex = 4;

        refreshArrows();
    }

    function drawCards() {

    }

    function drawPlayer() {
        player = quicktigame2d.createSprite({
            x : Config.UI_WIDTH  / 2 - 35 * game.scaleX,
            y : Config.UI_HEIGHT / 2 - 35 * game.scaleY,
            z : 3,
            width  : 70 * game.scaleX,
            height : 70 * game.scaleY,
            image  : "images/clearr.png"
        });
        parent.addChildNode(player);
        scene.add(player);
    }

    //===================</Draw>====================

    //====================<Logic>====================

    function refreshArrows() {
        var buf = currentTile.isPathOpen(currentTileIndex);

        if (!buf[0]) {
            arrows.top.color(0.5, 0.5, 0.5);
            arrows.top.touchEnabled = false;
        } else {
            arrows.top.color(1, 1, 1);
            arrows.top.touchEnabled = true;
        }
        if (!buf[1]) {
            arrows.right.color(0.5, 0.5, 0.5);
            arrows.right.touchEnabled = false;
        } else {
            arrows.right.color(1, 1, 1);
            arrows.right.touchEnabled = true;
        }
        if (!buf[2]) {
            arrows.bottom.color(0.5, 0.5, 0.5);
            arrows.bottom.touchEnabled = false;
        } else {
            arrows.bottom.color(1, 1, 1);
            arrows.bottom.touchEnabled = true;
        }
        if (!buf[3]) {
            arrows.left.color(0.5, 0.5, 0.5);
            arrows.left.touchEnabled = false;
        } else {
            arrows.left.color(1, 1, 1);
            arrows.left.touchEnabled = true;
        }

        if (debug) Ti.API.debug("Dungeon | refreshArrows | buf : ", buf);
    }

    function move(direction) {
        switch (direction) {
            case "top" :
                currentTileIndex -=3;
                parent.y += 100 * game.scaleY;
                player.y -= 100 * game.scaleY;
            break;
            case "right" :
                currentTileIndex++;
                parent.x -= 100 * game.scaleX;
                player.x += 100 * game.scaleX;
            break;
            case "bottom" :
                currentTileIndex +=3;
                parent.y -= 100 * game.scaleY;
                player.y += 100 * game.scaleY;
            break;
            case "left" :
                currentTileIndex--;
                parent.x += 100 * game.scaleX;
                player.x -= 100 * game.scaleX;
            break;
        }

        refreshArrows();
    }

    //===================</Logic>====================

    //====================<Class>====================

    function mapTile(tileOpts, rect) {
        var self = this;

        self.name = tileOpts.name;
        self.sprite = quicktigame2d.createSprite({
            x : rect.x,
            y : rect.y,
            z : 2,
            width  : rect.width,
            height : rect.height,
            image  : basepath + "tile/" + tileOpts.name
        });
        parent.addChildNode(self.sprite);
        scene.add(self.sprite);

        self.tileMap = tileOpts.tileMap;
        self.neighbors = [null, null, null, null];//, null, null, null, null, null];

        self.isPathOpen = function(index) {
            var res = [];

            //top
            var ti = index - 3;
            if (ti >= 0 && self.tileMap[ti] != -1) {
                res[0] = true;
            } else {
                if (self.tileMap[index] == 1 && self.neighbors[0] != null) {
                    res[0] = true;
                } else {
                    res[0] = false;
                }
            }

            //right
            ti = index + 1;
            if (ti < 9 && self.tileMap[ti] != -1) {
                res[1] = true;
            } else {
                if (self.tileMap[index] == 1 && self.neighbors[1] != null) {
                    res[1] = true;
                } else {
                    res[1] = false;
                }
            }

            //bottom
            ti = index + 3;
            if (ti < 9 && self.tileMap[ti] != -1) {
                res[2] = true;
            } else {
                if (self.tileMap[index] == 1 && self.neighbors[2] != null) {
                    res[2] = true;
                } else {
                    res[2] = false;
                }
            }

            //left
            ti = index - 1;
            if (ti >= 0 && self.tileMap[ti] != -1) {
                res[3] = true;
            } else {
                if (self.tileMap[index] == 1 && self.neighbors[3] != null) {
                    res[3] = true;
                } else {
                    res[3] = false;
                }
            }

            return res;
        };
        
        return self;
    }

    //===================</Class>====================

    //====================<Utils>====================

    function getLocal(x) {
        if (Config.IS_RETINA)    x *= 2;
        if (Config.IS_RETINA_HD) x *= 3;

        return x;
    }

    function getRandomFromArray(array) {

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        return array[getRandomInt(0, array.length - 1)];
    }

    //===================</Utils>====================

    return scene;
}

//====================<Tests>====================

function testDungeon(opts) {
    if (debug) Ti.API.debug("Dungeon | start testing");

    require('tests/ti-mocha');

    require('tests/tests').testDungeon(opts);
}

//===================</Tests>====================

module.exports = Dungeon;