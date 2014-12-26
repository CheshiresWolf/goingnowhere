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
            //move("top");
            arrows.top.event();
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
            //move("right");
            arrows.right.event();
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
            //move("bottom");
            arrows.bottom.event();
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
            //move("left");
            arrows.left.event();
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
        var buf = currentTile.templator(currentTileIndex);

        if (buf.top == null) {
            arrows.top.color(0.5, 0.5, 0.5);
            arrows.top.touchEnabled = false;
            arrows.top.event = null;
        } else {
            arrows.top.color(1, 1, 1);
            arrows.top.touchEnabled = true;
            arrows.top.event = buf.top;
        }
        if (buf.right == null) {
            arrows.right.color(0.5, 0.5, 0.5);
            arrows.right.touchEnabled = false;
            arrows.right.event = null;
        } else {
            arrows.right.color(1, 1, 1);
            arrows.right.touchEnabled = true;
            arrows.right.event = buf.right;
        }
        if (buf.bottom == null) {
            arrows.bottom.color(0.5, 0.5, 0.5);
            arrows.bottom.touchEnabled = false;
            arrows.bottom.event = null;
        } else {
            arrows.bottom.color(1, 1, 1);
            arrows.bottom.touchEnabled = true;
            arrows.bottom.event = buf.bottom;
        }
        if (buf.left == null) {
            arrows.left.color(0.5, 0.5, 0.5);
            arrows.left.touchEnabled = false;
            arrows.left.event = null;
        } else {
            arrows.left.color(1, 1, 1);
            arrows.left.touchEnabled = true;
            arrows.left.event = buf.left;
        }

        if (debug) Ti.API.debug("Dungeon | refreshArrows | buf : ", buf);
    }

    function move(direction) {
        switch (direction) {
            case "top" :
                //currentTileIndex -=3;
                parent.y += 100 * game.scaleY;
                player.y -= 100 * game.scaleY;
            break;
            case "right" :
                //currentTileIndex++;
                parent.x -= 100 * game.scaleX;
                player.x += 100 * game.scaleX;
            break;
            case "bottom" :
                //currentTileIndex +=3;
                parent.y -= 100 * game.scaleY;
                player.y += 100 * game.scaleY;
            break;
            case "left" :
                //currentTileIndex--;
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
        self.neighbors = {
            top    : null,
            right  : null,
            bottom : null,
            left   : null
        };

        self.templator = function(index) {
            var res = [];

            switch(index) {
                case 0 :
                    if (self.tileMap[0] == 1) {
                        if (self.neighbors.top != null) {
                            res.top = function() {
                                move("top");
                                currentTileIndex = 6;
                                currentTile = self.neighbors.top;
                            };
                        } else {
                            res.top = null;
                        }

                        if (self.neighbors.left != null) {
                            res.left = function() {
                                move("left");
                                currentTileIndex = 2;
                                currentTile = self.neighbors.left;
                            };
                        } else {
                            res.left = null;
                        }
                    } else {
                        res.top  = null;
                        res.left = null;
                    }

                    if (self.tileMap[1] != -1) {
                        res.right = function() {
                            move("right");
                            currentTileIndex = 1;
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[3] != -1) {
                        res.bottom = function() {
                            move("bottom");
                            currentTileIndex = 3;
                        };
                    } else {
                        res.bottom = null;
                    }

                    return res;
                break;
                case 1 :
                    if (self.tileMap[1] == 1) {
                        if (self.neighbors.top != null) {
                            res.top = function() {
                                move("top");
                                currentTileIndex = 7;
                                currentTile = self.neighbors.top;
                            };
                        } else {
                            res.top = null;
                        }
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[2] != -1) {
                        res.right = function() {
                            move("right");
                            currentTileIndex = 2;
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[4] != -1) {
                        res.bottom = function() {
                            move("bottom");
                            currentTileIndex = 4;
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[0] != -1) {
                        res.left = function() {
                            move("left");
                            currentTileIndex = 0;
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 2 :
                    if (self.tileMap[2] == 1) {
                        if (self.neighbors.top != null) {
                            res.top = function() {
                                move("top");
                                currentTileIndex = 8;
                                currentTile = self.neighbors.top;
                            };
                        } else {
                            res.top = null;
                        }

                        if (self.neighbors.right != null) {
                            res.right = function() {
                                move("right");
                                currentTileIndex = 0;
                                currentTile = self.neighbors.right;
                            };
                        } else {
                            res.right = null;
                        }
                    } else {
                        res.top   = null;
                        res.right = null;
                    }

                    if (self.tileMap[4] != -1) {
                        res.bottom = function() {
                            move("bottom");
                            currentTileIndex = 4;
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[1] != -1) {
                        res.left = function() {
                            move("left");
                            currentTileIndex = 1;
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 3 :
                    if (self.tileMap[0] != -1) {
                        res.top = function() {
                            move("top");
                            currentTileIndex = 0;
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[4] != -1) {
                        res.right = function() {
                            move("right");
                            currentTileIndex = 4;
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[6] != -1) {
                        res.bottom = function() {
                            move("bottom");
                            currentTileIndex = 6;
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[3] == 1) {
                        if (self.neighbors.left != null) {
                            res.left = function() {
                                move("left");
                                currentTileIndex = 5;
                                currentTile = self.neighbors.left;
                            };
                        } else {
                            res.left = null;
                        }
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 4 :
                    if (self.tileMap[1] != -1) {
                        res.top = function() {
                            move("top");
                            currentTileIndex = 1;
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[5] != -1) {
                        res.right = function() {
                            move("right");
                            currentTileIndex = 5;
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[7] != -1) {
                        res.bottom = function() {
                            move("bottom");
                            currentTileIndex = 7;
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[3] != -1) {
                        res.left = function() {
                            move("left");
                            currentTileIndex = 3;
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 5 :
                    if (self.tileMap[2] != -1) {
                        res.top = function() {
                            move("top");
                            currentTileIndex = 2;
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[5] == 1) {
                        if (self.neighbors.right != null) {
                            res.right = function() {
                                move("right");
                                currentTileIndex = 5;
                                currentTile = self.neighbors.right;
                            };
                        } else {
                            res.right = null;
                        }
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[8] != -1) {
                        res.bottom = function() {
                            move("bottom");
                            currentTileIndex = 8;
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[4] != -1) {
                        res.left = function() {
                            move("left");
                            currentTileIndex = 4;
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 6 :
                    if (self.tileMap[3] != -1) {
                        res.top = function() {
                            move("top");
                            currentTileIndex = 3;
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[7] != -1) {
                        res.right = function() {
                            move("right");
                            currentTileIndex = 7;
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[6] == 1) {
                        if (self.neighbors.bottom != null) {
                            res.bottom = function() {
                                move("bottom");
                                currentTileIndex = 0;
                                currentTile = self.neighbors.bottom;
                            };
                        } else {
                            res.bottom = null;
                        }

                        if (self.neighbors.left != null) {
                            res.left = function() {
                                move("left");
                                currentTileIndex = 8;
                                currentTile = self.neighbors.left;
                            };
                        } else {
                            res.left = null;
                        }
                    } else {
                        res.bottom = null;
                        res.left   = null;
                    }

                    return res;
                break;
                case 7 :
                    if (self.tileMap[4] != -1) {
                        res.top = function() {
                            move("top");
                            currentTileIndex = 4;
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[8] != -1) {
                        res.right = function() {
                            move("right");
                            currentTileIndex = 8;
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[7] == 1) {
                        if (self.neighbors.bottom != null) {
                            res.bottom = function() {
                                move("bottom");
                                currentTileIndex = 1;
                                currentTile = self.neighbors.bottom;
                            };
                        } else {
                            res.bottom = null;
                        }
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[6] != -1) {
                        res.left = function() {
                            move("left");
                            currentTileIndex = 6;
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 8 :
                    if (self.tileMap[5] != -1) {
                        res.top = function() {
                            move("top");
                            currentTileIndex = 5;
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[8] == 1) {
                        if (self.neighbors.right != null) {
                            res.right = function() {
                                move("right");
                                currentTileIndex = 6;
                                currentTile = self.neighbors.right;
                            };
                        } else {
                            res.right = null;
                        }

                        if (self.neighbors.bottom != null) {
                            res.bottom = function() {
                                move("bottom");
                                currentTileIndex = 2;
                                currentTile = self.neighbors.bottom;
                            };
                        } else {
                            res.bottom = null;
                        }
                    } else {
                        res.right  = null;
                        res.bottom = null;
                    }

                    if (self.tileMap[7] != -1) {
                        res.left = function() {
                            move("left");
                            currentTileIndex = 7;
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
            }
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