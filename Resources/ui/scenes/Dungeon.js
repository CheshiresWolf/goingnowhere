var quicktigame2d = require("com.ti.game2d");
var Config = require("config");
var tileChooser = require("modules/TileChooser");

var debug = true;

function Dungeon(game, window) {

    var LoadableScene = game.require("/ui/LoadableScene");
    var basepath = "images/scenes/dungeon/";
    var scene = new LoadableScene(
        game,
        Ti.Filesystem.resourcesDirectory + "images/scenes/dungeon/dungeon.jscene",
        basepath,
        false
    );
    scene.page_index = 1;

    //====================<init>====================

    var currentTile, currentTileIndex;

    var tileArray = {};

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
            arrows.left.event();
        });
        scene.add(arrows.left);
    }

    function drawMap() {
        var tile = new mapTile(tileChooser.getRandomTile(), {
            x : Config.UI_WIDTH  / 2 - 150 * game.scaleX,
            y : Config.UI_HEIGHT / 2 - 150 * game.scaleY,
            width  : 300 * game.scaleX,
            height : 300 * game.scaleY,
        }, "0,0");

        currentTile = tile;
        currentTileIndex = 4;

        refreshArrows();
    }

    function drawCard(direction) {
        var bx = currentTile.sprite.x;
        var by = currentTile.sprite.y;

        var bufIndex = currentTile.name.split(",");
        bufIndex[0] = parseInt(bufIndex[0]);
        bufIndex[1] = parseInt(bufIndex[1]);

        switch (direction) {
            case "top" :
                by -= 300 * game.scaleY;
                bufIndex[1] -= 1;
            break;
            case "right" :
                bx += 300 * game.scaleX;
                bufIndex[0] += 1;
            break;
            case "left" :
                bx -= 300 * game.scaleX;
                bufIndex[0] -= 1;
            break;
            case "bottom" :
                by += 300 * game.scaleY;
                bufIndex[1] += 1;
            break;
        }

        var restrictions = [
            ( formRuleByName( bufIndex[0] + "," + (bufIndex[1] - 1), "top"    ) ),
            ( formRuleByName( (bufIndex[0] + 1) + "," + bufIndex[1], "right"  ) ),
            ( formRuleByName( bufIndex[0] + "," + (bufIndex[1] + 1), "bottom" ) ),
            ( formRuleByName( (bufIndex[0] - 1) + "," + bufIndex[1], "left"   ) )
        ];


        var tile = new mapTile(tileChooser.getRandomRestrictedTile(restrictions), {
            x : bx,
            y : by,
            width  : 300 * game.scaleX,
            height : 300 * game.scaleY,
        }, bufIndex[0] + "," + bufIndex[1]);

        if (debug) Ti.API.debug("Dungeon | drawCard | name : (" + bufIndex[0] + "," + bufIndex[1] + "), pos(" + tile.sprite.x + "," + tile.sprite.y + ")");

        return tile;
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
        if (debug) Ti.API.debug("Dungeon | refreshArrows | currentTileIndex : " + currentTileIndex + ", currentTile.name : " + currentTile.name);
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

        useCard();
        refreshArrows();
    }

    function useCard() {
        if (currentTile.tileMap[currentTileIndex] == 1) {
            var buf;
            switch (currentTileIndex) {
                case 1 :
                    if (currentTile.neighbors.top == null) {
                        buf = drawCard("top");
                        currentTile.neighbors.top = buf;
                        buf.neighbors.bottom = currentTile;
                    }
                break;
                case 3 :
                    if (currentTile.neighbors.left == null) {
                        buf = drawCard("left");
                        currentTile.neighbors.left = buf;
                        buf.neighbors.right = currentTile;
                    }
                break;
                case 5 :
                    if (currentTile.neighbors.right == null) {
                        buf = drawCard("right");
                        currentTile.neighbors.right = buf;
                        buf.neighbors.left = currentTile;
                    }
                break;
                case 7 :
                    if (currentTile.neighbors.bottom == null) {
                        buf = drawCard("bottom");
                        currentTile.neighbors.bottom = buf;
                        buf.neighbors.top = currentTile;
                    }
                break;
            }
        }
    }

    //===================</Logic>====================

    //====================<Class>====================

    function mapTile(tileOpts, rect, gridName) {
        var self = this;

        self.name = gridName;//tileOpts.name;
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
                                currentTileIndex = 6;
                                currentTile = self.neighbors.top;
                                move("top");
                            };
                        } else {
                            res.top = null;
                        }

                        if (self.neighbors.left != null) {
                            res.left = function() {
                                currentTileIndex = 2;
                                currentTile = self.neighbors.left;
                                move("left");
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
                            currentTileIndex = 1;
                            move("right");
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[3] != -1) {
                        res.bottom = function() {
                            currentTileIndex = 3;
                            move("bottom");
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
                                currentTileIndex = 7;
                                currentTile = self.neighbors.top;
                                move("top");
                            };
                        } else {
                            res.top = null;
                        }
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[2] != -1) {
                        res.right = function() {
                            currentTileIndex = 2;
                            move("right");
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[4] != -1) {
                        res.bottom = function() {
                            currentTileIndex = 4;
                            move("bottom");
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[0] != -1) {
                        res.left = function() {
                            currentTileIndex = 0;
                            move("left");
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
                                currentTileIndex = 8;
                                currentTile = self.neighbors.top;
                                move("top");
                            };
                        } else {
                            res.top = null;
                        }

                        if (self.neighbors.right != null) {
                            res.right = function() {
                                currentTileIndex = 0;
                                currentTile = self.neighbors.right;
                                move("right");
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
                            currentTileIndex = 4;
                            move("bottom");
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[1] != -1) {
                        res.left = function() {
                            currentTileIndex = 1;
                            move("left");
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 3 :
                    if (self.tileMap[0] != -1) {
                        res.top = function() {
                            currentTileIndex = 0;
                            move("top");
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[4] != -1) {
                        res.right = function() {
                            currentTileIndex = 4;
                            move("right");
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[6] != -1) {
                        res.bottom = function() {
                            currentTileIndex = 6;
                            move("bottom");
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[3] == 1) {
                        if (self.neighbors.left != null) {
                            res.left = function() {
                                currentTileIndex = 5;
                                currentTile = self.neighbors.left;
                                move("left");
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
                            currentTileIndex = 1;
                            move("top");
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[5] != -1) {
                        res.right = function() {
                            currentTileIndex = 5;
                            move("right");
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[7] != -1) {
                        res.bottom = function() {
                            currentTileIndex = 7;
                            move("bottom");
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[3] != -1) {
                        res.left = function() {
                            currentTileIndex = 3;
                            move("left");
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 5 :
                    if (self.tileMap[2] != -1) {
                        res.top = function() {
                            currentTileIndex = 2;
                            move("top");
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[5] == 1) {
                        if (self.neighbors.right != null) {
                            res.right = function() {
                                currentTileIndex = 3;
                                currentTile = self.neighbors.right;
                                move("right");
                            };
                        } else {
                            res.right = null;
                        }
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[8] != -1) {
                        res.bottom = function() {
                            currentTileIndex = 8;
                            move("bottom");
                        };
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[4] != -1) {
                        res.left = function() {
                            currentTileIndex = 4;
                            move("left");
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 6 :
                    if (self.tileMap[3] != -1) {
                        res.top = function() {
                            currentTileIndex = 3;
                            move("top");
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[7] != -1) {
                        res.right = function() {
                            currentTileIndex = 7;
                            move("right");
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[6] == 1) {
                        if (self.neighbors.bottom != null) {
                            res.bottom = function() {
                                currentTileIndex = 0;
                                currentTile = self.neighbors.bottom;
                                move("bottom");
                            };
                        } else {
                            res.bottom = null;
                        }

                        if (self.neighbors.left != null) {
                            res.left = function() {
                                currentTileIndex = 8;
                                currentTile = self.neighbors.left;
                                move("left");
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
                            currentTileIndex = 4;
                            move("top");
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[8] != -1) {
                        res.right = function() {
                            currentTileIndex = 8;
                            move("right");
                        };
                    } else {
                        res.right = null;
                    }

                    if (self.tileMap[7] == 1) {
                        if (self.neighbors.bottom != null) {
                            res.bottom = function() {
                                currentTileIndex = 1;
                                currentTile = self.neighbors.bottom;
                                move("bottom");
                            };
                        } else {
                            res.bottom = null;
                        }
                    } else {
                        res.bottom = null;
                    }

                    if (self.tileMap[6] != -1) {
                        res.left = function() {
                            currentTileIndex = 6;
                            move("left");
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
                case 8 :
                    if (self.tileMap[5] != -1) {
                        res.top = function() {
                            currentTileIndex = 5;
                            move("top");
                        };
                    } else {
                        res.top = null;
                    }

                    if (self.tileMap[8] == 1) {
                        if (self.neighbors.right != null) {
                            res.right = function() {
                                currentTileIndex = 6;
                                currentTile = self.neighbors.right;
                                move("right");
                            };
                        } else {
                            res.right = null;
                        }

                        if (self.neighbors.bottom != null) {
                            res.bottom = function() {
                                currentTileIndex = 2;
                                currentTile = self.neighbors.bottom;
                                move("bottom");
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
                            currentTileIndex = 7;
                            move("left");
                        };
                    } else {
                        res.left = null;
                    }

                    return res;
                break;
            }
        };

        tileArray[gridName] = self;
        
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

    function getTileByName(name) {
        if (tileArray[name] != undefined) {
            return tileArray[name];
        }

        return null;
    }

    function formRuleByName(name, direction) {
        var tile = getTileByName(name);

        if (tile != null) {
            switch (direction) {
                case "top" :
                    if (tile.tileMap[7] == 1) {
                        return 1;
                    } else {
                        return 0;
                    }
                break;
                case "right" :
                    if (tile.tileMap[3] == 1) {
                        return 1;
                    } else {
                        return 0;
                    }
                break;
                case "left" :
                    if (tile.tileMap[5] == 1) {
                        return 1;
                    } else {
                        return 0;
                    }
                break;
                case "bottom" :
                    if (tile.tileMap[1] == 1) {
                        return 1;
                    } else {
                        return 0;
                    }
                break;
            }
        }

        return -1;
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