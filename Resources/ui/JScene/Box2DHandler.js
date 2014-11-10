var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');
var Box2dWorld = require('/ui/Box2dWorld');

module.exports = {
    init : function(scene) {
        //Ti.API.info(data);
        var data = scene.data;
        var game = scene.game;
        /*
         * BOX2D STAFF (DRAGGING DRAGGABLE BODIES WITH MOUSE JOINT)
         */
        var worldObjects = [];
        scene.addWorldObjects = function(obj) {
            worldObjects.push(obj);
        };
        var worldJoints = [];

        scene.addJointToWorld = function(joint) {
            worldJoints.push(joint);
        };

        scene.setupBox2D = function(sprites, data) {
            if (!scene.box2d)
                return;
            //clear transforms from box 2d sprites
            //game.stop();
            scene.box2d = true;
            game.world = new Box2dWorld(game, scene);
            game.world.createBox();
            for (var i in sprites) {
                var s = sprites[i];
                var l = s.loadedData;
                if (l.box2d) {
                    var defaults = {
                        density : 1,
                        friction : 0.5,
                        restitution : 0.5,
                    };
                    if (l.box2d.radius)
                        l.box2d.radius *= game.scaleX;
                    var o = _.defaults(l.box2d, defaults);
                    s.clearTransforms();
                    var body = game.world.addBody(s, o);
                    if (l.box2d.bullet) {
                        body.setBullet(true);
                    }
                    body.name = l.name;
                    s.draggable = !!l.draggable;
                    s.mouseJoint = !!l.mouseJoint;
                    scene.addWorldObjects(body);
                    //body.viewproxy.loadedData = sprites[i].loadedData;
                    //delete sprites[i];
                }
            };
            if (data.joints) {
                //{bodyA:"ded_body", bodyB:"ded_hand_2", type:"Revolute", anchorX:81, anchorY:71, enabeLimits: true, upperAngle: 10, lowerAngle:-10}}
                //_.each(scene.pageData.joints, function(s,i) {
                for (var i in data.joints) {
                    var s = data.joints[i];

                    var scale = s.scale || 1;
                    if (scale !== 1) {
                        s.anchorX   && (s.anchorX   *= scale);
                        s.anchorY   && (s.anchorY   *= scale);
                        s.maxLength && (s.maxLength *= scale);
                        s.anchorA_x && (s.anchorA_x *= scale);
                        s.anchorA_y && (s.anchorA_y *= scale);
                        s.anchorB_x && (s.anchorB_x *= scale);
                        s.anchorB_y && (s.anchorB_y *= scale);
                    }

                    var joint;
                    var opt, bodyA, bodyB;
                    if (s.type == "Revolute") {
                        opt = _.extend({
                            enableLimit : false,
                            enableMotor : false,
                            collideConnected : false
                        }, s);
                        bodyB = scene.bodyByName(s.bodyB);
                        if (!bodyB || !bodyB.view) {
                            alert("Body is not found: " + s.bodyB);
                            continue;
                        }

                        opt.anchorX = bodyB.view.child ? opt.anchorX * scene.scaleX + bodyB.view.parentX + bodyB.view.loadedData.left : opt.anchorX * scene.scaleX + bodyB.view.loadedData.left;
                        opt.anchorY = bodyB.view.child ? opt.anchorY * scene.scaleY + bodyB.view.parentY + bodyB.view.loadedData.top : opt.anchorY * scene.scaleY + bodyB.view.loadedData.top;
                        joint = game.world.createRevoluteJoint(scene.bodyByName(s.bodyA), bodyB, opt);
                        joint.name = s.bodyA + " " + s.bodyB;
                        worldJoints.push(joint);
                    } else if (s.type == "Rope") {
                        opt = _.extend({
                            collideConnected : false
                        }, s);
                        bodyA = scene.bodyByName(s.bodyA);
                        bodyB = scene.bodyByName(s.bodyB);

                        /*opt.anchorA_x = opt.anchorA_x * scene.scaleX;
                        opt.anchorA_y = opt.anchorA_y * scene.scaleY;

                        opt.anchorB_x = opt.anchorB_x * scene.scaleX;
                        opt.anchorB_y = opt.anchorB_y * scene.scaleY;*/
                       
                        opt.anchorA_x = bodyA.view.child ? opt.anchorA_x*scene.scaleX+bodyA.view.parentX+bodyA.view.loadedData.left : opt.anchorA_x*scene.scaleX+bodyA.view.loadedData.left;
                        opt.anchorA_y = bodyA.view.child ? opt.anchorA_y*scene.scaleY+bodyA.view.parentY+bodyA.view.loadedData.top : opt.anchorA_y*scene.scaleY+bodyA.view.loadedData.top;

                        opt.anchorB_x = bodyB.view.child ? opt.anchorB_x*scene.scaleX+bodyB.view.parentX+bodyB.view.loadedData.left : opt.anchorB_x*scene.scaleX+bodyB.view.loadedData.left;
                        opt.anchorB_y = bodyB.view.child ? opt.anchorB_y*scene.scaleY+bodyB.view.parentY+bodyB.view.loadedData.top : opt.anchorB_y*scene.scaleY+bodyB.view.loadedData.top;

                        opt.maxLength = opt.maxLength * scene.scaleX;
                        joint = game.world.createRopeJoint(bodyA, bodyB, opt);
                        joint.name = s.bodyA + " " + s.bodyB;
                        worldJoints.push(joint);
                    } else if (s.type == "Weld") {
                        opt = _.extend({
                            collideConnected : false
                        }, s);
                        bodyB = scene.bodyByName(s.bodyB);
                        opt.anchorX = bodyB.view.child ? opt.anchorX * scene.scaleX + bodyB.view.parentX + bodyB.view.loadedData.left : opt.anchorX * scene.scaleX + bodyB.view.loadedData.left;
                        opt.anchorY = bodyB.view.child ? opt.anchorY * scene.scaleY + bodyB.view.parentY + bodyB.view.loadedData.top : opt.anchorY * scene.scaleY + bodyB.view.loadedData.top;
                        bodyA = scene.bodyByName(s.bodyA);
                        joint = game.world.createWeldJoint(bodyA, bodyB, opt)
                        joint.name = bodyA.view.loadedData.name + " " + bodyB.view.loadedData.name;
                        //Ti.API.info(joint.name);
                        worldJoints.push(joint);
                    }
                    joint = null;
                };
            }
            game.world.clearBodiesTransforms();
            //game.start();
        };
        scene.finderFunction = function(item) {
            return item.name === scene.lookingForName
        };

        scene.bodyByName = function(name) {
            for (var i = 0, j = worldObjects.length; i < j; i++) {
                var wo = worldObjects[i];
                if (wo.name == name)
                    return wo;
            };
            return null;
            scene.lookingForName = name;
            return _.find(worldObjects, scene.finderFunction);
        };
        scene.jointByName = function(name) {
            for (var i = 0, j = worldJoints.length; i < j; i++) {
                var wj = worldJoints[i];
                if (wj.name == name)
                    return wj;
            };
            return null;
        };
        scene.destroyJoint = function(joint) {
            var idx = worldJoints.indexOf(joint);
            if (idx == -1) {
                //Ti.API.info('UNKNOWN JOINT');
                return;
            }
            game.world.destroyJoint(joint);
            worldJoints.splice(idx, 1);
        };
        return scene;
    }
};