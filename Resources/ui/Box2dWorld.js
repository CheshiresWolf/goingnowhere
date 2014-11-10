var game2d = require('com.ti.game2d');
var Config = require('config');
function Box2dWorld(game, scene) {
    
    var world = game2d.createBox2dWorld({surface:game});
    //world.setInterval(10);
    /*var model = Titanium.Platform.model;
    if (Ti.Android || model.match(/iPad1/)) {
        world.setIterations(8,8,Config.SMALL_FPS);
    } else {
        world.setIterations(12,12,Config.FULL_FPS);
    }    */
    world.setIterations(12,12,Config.FPS);
    world.setGravity(0.0, -9.81);
    game.addWorld(world);
    game.world = world;
    //box2d - create box
    var leftWall = game2d.createSprite({image:"images/clear.png"}),
    rightWall = game2d.createSprite({image:"images/clear.png"}),
    topWall = game2d.createSprite({image:"images/clear.png"}),
    floor = game2d.createSprite({image:"images/clear.png"});
    
    var leftWallRef,rightWallRef,topWallRef,floorRef;

    world.createBox = function(){
                //setup box2d box
        floor.width     = game.screen.width;
        topWall.width     = game.screen.width;
        leftWall.width  = 1;
        rightWall.width = 1;
        
        floor.height     = 1;
        topWall.height     = 1;
        leftWall.height  = game.screen.height;
        rightWall.height = game.screen.height;

        
        floor.move(0, game.screen.height);
        topWall.move(0, 0);
        leftWall.move(0, 0);
        rightWall.move(game.screen.width - rightWall.width, 0);
        scene.add(leftWall);
        scene.add(rightWall);
        scene.add(topWall);
        scene.add(floor); 
        floorRef = world.addBody(floor, {
            density:1.0,
            friction:0.3,
            restitution:0.4,
            filter:false, groupIndex: -999,
            type:"static"
        });
        topWallRef = world.addBody(topWall, {
            density:1.0,
            friction:0.3,
            restitution:0.4,
            filter:false, groupIndex: -999,
            type:"static"
        });
        leftWallRef = world.addBody(leftWall, {
            density:1.0,
            friction:0.3,
            restitution:0.4,
            filter:false, groupIndex: -999,
            type:"static"
        });
        rightWallRef = world.addBody(rightWall, {
            density:1.0,
            friction:0.3,
            restitution:0.4,
            filter:false, groupIndex: -999,
            type:"static"
        });
        world.groundBody = floorRef;
    };    
    return world;
} 

module.exports = Box2dWorld; 