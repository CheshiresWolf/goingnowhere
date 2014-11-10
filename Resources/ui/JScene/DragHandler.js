var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');
var isAndroid = !!Ti.Android;



module.exports = {

    init: function(scene) {

        var mouseJoints = {};
        var draggedBodies = {};
        var draggedSprites = {};
        var dragOffsets = {};
        var dragStartTimes = {};
        var dragStartSoundsPlayed = {};
        var debugTouchSprites = {};
        var lastX = {}, lastY = {}, lastInX = {}, lastInY = {};
        var touchStarts = {};
        var game = scene.game;



        // ===== Preprocessing raw events =====

            scene.onTouchStart = function(e) {
                if (scene.recording) {
                	Ti.API.debug("DragHandler | scene.onTouchStart | if (scene.recording)");
                    if (!scene.recordOneEvent(e)) {
                    	Ti.API.debug("DragHandler | scene.onTouchStart | if (scene.recording) | scene.recordOneEvent = false");
                    	return;
                    }
                    Ti.API.debug("DragHandler | scene.onTouchStart | if (scene.recording) | scene.recordOneEvent = true");
                }
                if (scene.pageMode == "replay" && !e.isReplay) {
                    //ignore touch in replay mode
                    return;
                }

                var points = scene.screenToScene(e.points);
                
                scene.debugTouches = false;
                if (scene.debugTouches) {
                    for (var m in debugTouchSprites) {
                        if (!points[m] && debugTouchSprites[m]) {
                            scene.remove(debugTouchSprites[m]);
                            debugTouchSprites[m] = null;
                            delete debugTouchSprites[m];
                        }
                    }
                }

                for (var point in points) {

                    if (scene.debugTouches) {
                        if (!debugTouchSprites[point]) {
                            debugTouchSprites[point] = game2d.createSprite({
                                image: "images/circle.png",
                                width:  60 * scene.scaleX,
                                height: 60 * scene.scaleY,
                                x: points[point].x - 30 * scene.scaleX,
                                y: points[point].y - 30 * scene.scaleY
                            });
                            scene.add(debugTouchSprites[point]);
                        }
                    }

                    if (
                        !draggedBodies[point] &&
                        !draggedSprites[point] &&
                        !mouseJoints[point]
                    ) {
                        scene.startDrag(point, points[point]);
                    }

                }
            };



            scene.onTouchMove = function(e) {
                if (scene.recording) {
                    if (!scene.recordOneEvent(e)) return;
                }
                if (scene.pageMode == "replay" && !e.isReplay) {
                    //ignore touch in replay mode
                    return;
                }
                
                var points = scene.screenToScene(e.points);

                // var points = e.points;
                //Ti.API.info("POINTS MOVE " + e.type + " " + JSON.stringify(e.points));
                //if (!scene.box2d) return;

                for (var point in points) {

                    if (scene.debugTouches) {
                        var s = debugTouchSprites[point];
                        // if (s) s.move(points[point].x *game.scaleX - s.width/2, points[point].y*game.scaleY - s.height/2);
                        if (s) {
                            s.move(
                                points[point].x - s.width  / 2,
                                points[point].y - s.height / 2
                            );
                        }
                    }
                    
                    scene.moveDrag(point, points[point]);

                }

            };



            scene.onTouchEnd = function(e) {
                if (scene.recording) {
                    if (!scene.recordOneEvent(e)) return;
                }
                if (scene.pageMode == "replay" && !e.isReplay) {
                    //ignore touch in replay mode
                    return;
                }
                
                var points = scene.screenToScene(e.points);

                // var points = e.points;
                //Ti.API.info("POINTS END " + e.type + " " + JSON.stringify(e.points) + " " + game.uptime());
                //if (!scene.box2d) return;

                for (var point in points) {

                    if (scene.debugTouches) {
                        if (debugTouchSprites[point]) {
                            scene.remove(debugTouchSprites[point])
                            debugTouchSprites[point] = null;
                        }
                    }
                    
                    scene.endDrag(point, points[point]);

                }

            };
    
        // ====================================



        scene.startDrag = function(name, e) {

            if (e.phase != "began" && !Ti.Android) return;

            //Ti.API.info('DRAG START ' + JSON.stringify(e) + game.uptime());
            // e = game.applyTouchRetina(e);
            touchStarts[name] = _.extend(e, {uptime: game.uptime()});
            var body = null;
            //Ti.API.info('RETINA X'+e.x + " Y:"+e.y);

            // find body in touched sprites
            var list = scene.game.hudScene().spritesAtXY({               
                x: e.hudX,
                y: e.hudY
            }).concat(scene.spritesAtXY({
                x: e.x,
                y: e.y
            }));
            /*console.debug("sprites at this point: ", list.map(function(e) {
                return (e.loadedData && e.loadedData.name) || JSON.stringify(e);
            }));*/

            var dragSprite = null;
            for (var i = 0; i < list.length; i++) {
                var l = list[i].loadedData;
                //Ti.API.info('list',l.name)
                if (l && l.box2d) {
                    body = scene.bodyByName(l.name);
                    //Ti.API.info('DRAG START BODY FOUND IN SPRITE' + body);
                    if (body && (body.view.draggable || body.view.loadedData.dragTarget)) {
                        break;
                    }
                }
                if (l && !l.box2d && (l.draggable || list[i].draggable)) {
                    //Ti.API.info('DRAG START SPRITE FOUND' + list[i]);
                    dragSprite = list[i];
                    break;
                } else
                if (list[i].dragTarget || l && l.dragTarget) {

                    var dt = list[i].dragTarget || (l || {}).dragTarget;

                    body = scene.bodyByName(dt);
                    if (body) break;

                    body = null;
                    dragSprite = scene.spriteByName(dt);
                    if (dragSprite) break;
                    
                    dragSprite = null;
                    
                }
                list[i] = null;
            }
            list = null;
            if (game.world && !body && !dragSprite) {
                body = game.world.findBody({posX:e.x, posY:e.y});
                //Ti.API.info('DRAG START BODY FOUND ' + body);
            }
            if (!body && !dragSprite) {
                //Ti.API.info('DRAG START NOTHING TO DRAG');
                delete touchStarts[name];
                scene.onSingleTap(e);
                return;
            }
            dragOffsets[name] = {x:0, y:0};
            var sprite;
            if (dragSprite) {
                sprite = dragSprite;
            } else {
                if (body.view.loadedData && body.view.loadedData.dragTarget) {
                    var b = scene.bodyByName(body.view.loadedData.dragTarget);
                    //Ti.API.info('DRAG START APPLY DRAG TARGET ' + body.view.loadedData.dragTarget);
                    if (b) {
                        body = b;
                    }
                }
                sprite = body.view;
            }               
            var l = sprite.loadedData || {};
            if (sprite.draggable) {
                //Ti.API.info('DRAG START IS DRAGGABLE');
                dragOffsets[name].x = (sprite.x + sprite.width  / 2) - e.x;
                dragOffsets[name].y = (sprite.y + sprite.height / 2) - e.y; 
                
                if (scene.onDragStart)
                    if (body){
                        scene.onDragStart(body, e, name, dragOffsets[name]);
                    }
                        
                //Ti.API.info('sprite', l)
                if (body && sprite.mouseJoint) {
                    //Ti.API.info('DRAG START IS MOUSE JOINT');
                    //Ti.API.info('DRAG mouseJoint')
                    if (mouseJoints[name]) {
                        //Ti.API.info('DRAG START MOUSE JOINT ALREADY EXISTS UNDER THIS FINGER ' + _.keys(mouseJoints).join(",") );
                    }
                    //Ti.API.info('MOUSE JOINT CREATE ' + name);
                    var joint = game.world.createMouseJoint(game.world.groundBody, body, {
                        targetX: e.x,
                        targetY: e.y,
                        //frequencyHz: 30,
                        //dampingRatio: 5,
                        maxForce: 20000000,
                        collideConnected : true
                    });
                    joint.body = body;
                    mouseJoints[name] = joint;
                    // if (!mouseJoint[name] instanceof Array) {
                    //     mouseJoint[name] = [];
                    // }
                    // mouseJoints[name][FINGER] = joint;
                    body.dragName = name;
                } else if (l.box2d) {
                    //Ti.API.info('DRAG box2d')
                    if (draggedBodies[name]) return;
                    if (_.indexOf(_.values(draggedBodies), body) > -1) return;
                    dragStartTimes[name] = new Date().getTime();
                    dragStartSoundsPlayed[name] = false;
                    sprite.clearTransforms();
                    draggedBodies[name] = body;
                    body.dragName = name;     
                    //Ti.API.info('BODY', body)   
                    //Ti.API.info(body.view.loadedData.name);
                } else {
                    //Ti.API.info('DRAG sprite')
                    //is already dragged
                    if (_.indexOf(_.values(draggedSprites), sprite) > -1) return;
                    if (scene.onDragStart) 
                        scene.onDragStart(sprite, e, name, dragOffsets[name]);
                    dragStartTimes[name] = new Date().getTime();
                    dragStartSoundsPlayed[name] = false;
                    sprite.clearTransforms();
                    draggedSprites[name] = sprite;        
                    sprite.dragName = name;
                    if (scene.onAfterDragStart) 
                        if (sprite) 
                            scene.onAfterDragStart(sprite, e, name, dragOffsets[name]);
                }
    //            body.setAwake(true);
            } else {
                delete touchStarts[name];
                scene.onSingleTap(e);
            }
            /*if (scene.onDragStart) 
                if (draggedBodies[name]) 
                    scene.onDragStart(draggedBodies[name]);*/
            sprite = null;
            return true;
        };
        


        scene.moveDrag = function(name, e) {

            if (scene.onDragMove) {
                if (draggedBodies[name]) {
                    scene.onDragMove(draggedBodies[name], null);
                } else
                if (mouseJoints[name]) {
                    scene.onDragMove(mouseJoints[name].body, mouseJoints[name]);
                } else
                if (draggedSprites[name]) {
                    scene.onDragMove(draggedSprites[name], null);
                }
            }
            
            // e = game.applyTouchRetina(e);
            if (mouseJoints[name]) {
                mouseJoints[name].SetTarget({posX:e.x, posY:e.y});
                return;
            } 

            if (draggedBodies[name] || draggedSprites[name]) {

                var s = draggedBodies[name] ? draggedBodies[name].view : draggedSprites[name];
                //Ti.API.info(dragOffsets[name])
                // var s = draggedBodies[name].view;
                //scene.scaleDragOffset(name, s.scaleX, s.scaleY);
                var x = e.x + dragOffsets[name].x, 
                    y = e.y + dragOffsets[name].y,
                    l = s.loadedData || {};

                if (l.dragPolygone) {

                    if (!lastInX[name] || !lastInX[name]) {
                        lastInX[name] = x;
                        lastInY[name] = y;
                        
                    }
                    if (scene.isPointInPoly(l.dragPolygone,{x:x,y:y}, game.scaleX, game.scaleY)) {
                        lastInX[name] = x;
                        lastInY[name] = y;
                    } else {
                        if (lastInX[name] && lastInX[name]) {
                            var mid = scene.middleOf(lastInX[name], lastInY[name], x, y);
                            x = mid.x;
                            y = mid.y;
                        }
                    }

                }

                if (draggedBodies[name]) {

                    draggedBodies[name].SetTransform({posX: x, posY: y});

                } else {

                    var sprite = s;
                    var dt = sprite.dragTransform;
                    var mx = x - sprite.width  / 2;
                    var my = y - sprite.height / 2;
                    if (!dt) {
                        dt = sprite.dragTransform = scene.createTransform({
                            duration: 0,
                            x: mx, //center.x,
                            y: my  //center.y
                        });
                    } else {
                        // dt.move(center.x, center.y);
                        // var mx = x-sprite.width/2;
                        // var my = y-sprite.height/2;
                        dt.move(mx, my);
                    }
                    // dt.move(mx, my);
                    sprite.transform(dt);
                    //Ti.API.info("WORD: " + (!!sprite.is_word) + " " + scene.lengthOf(x,y,s.baseX, s.baseY));

                    // sprite.move(mx, my);
                    
                    //MODIFY: DRAG TEXT CHANGES 
                    if (sprite.is_word && scene.lengthOf(mx,my,s.baseX, s.baseY) < s.height) {
                        scene.moveTextSpriteToPlace(name);
                    }

                }
                
                // play sounds
                var ct = new Date().getTime();
                var delta = ct - dragStartTimes[name]; 
                if (l.dragStartSound && delta > 300 && !dragStartSoundsPlayed[name]) {
                    setTimeout(function(){scene.playSound(l.dragStartSound)}, 0);
                    dragStartSoundsPlayed[name] = true;
                }
                if (l.dragTimeoutSound) {
                    var to = l.dragTimeout || 5*1000;
                    if (delta > to) {
                        setTimeout(function(){scene.playSound(l.dragTimeoutSound)}, 0);
                        dragStartTimes[name] = ct; 
                    }
                }

            }
        };



        
        scene.endDrag = function (name, e) {
            
            if (e.phase == "ended" || e.phase == "cancelled" || Ti.Android) {
                if (mouseJoints[name]) {
                    //Ti.API.info('MOUSE JOINT DESTROY ' + name);
                    var body = mouseJoints[name].bodyB;
                    // if (mouseJoints[name][FINGER]) {
                    //     game.world.destroyJoint(mouseJoints[name][FINGER]);
                    //     mouseJoints[name][FINGER] = null;
                    // }
                    game.world.destroyJoint(mouseJoints[name]);
                    mouseJoints[name]= null;
                    if (scene.onDragEnd){
                        e.body = body;
                        scene.onDragEnd(e, body.view);
                    }
                    // return;
                } else
                if (draggedBodies[name] || draggedSprites[name]) {
                    var delta = new Date().getTime() - dragStartTimes[name]; 
                    var s = draggedBodies[name] ? draggedBodies[name].view : draggedSprites[name];
                    var l = s.loadedData;
                    if (s.loadedData && s.loadedData.dragEndSound && delta > 2000) {
                        scene.playSound(s.loadedData.dragEndSound);
                    }
                    //Ti.API.info('DROP ' + s.image);
                    if (l && l.dragPolygone) {
                        // e = game.applyTouchRetina(e);
                        var x = e.x+ dragOffsets[name].x, 
                            y = e.y+ dragOffsets[name].y;
                        
                        if (!scene.isPointInPoly(l.dragPolygone,{x:x,y:y}, scene.scaleX, scene.scaleY)) {
                            if (!lastInX[name] || isNaN(lastInX[name])) {
                                lastInX[name] = s.center.x;
                                lastInY[name] = s.center.y;
                            }
                            s.transform(scene.createTransform({x:lastInX[name]-s.width/2, y:lastInY[name]-s.height/2, duration:500, easing: game2d.ANIMATION_CURVE_ELASTIC_OUT})); 
                        }
                    }

                    scene.onDragEnd && scene.onDragEnd(e, s);

                    draggedBodies[name] = null;
                    draggedSprites[name] = null;
                    delete dragOffsets[name];
                    delete dragStartTimes[name];
                    delete dragStartSoundsPlayed[name];
                    delete lastX[name];
                    delete lastY[name];
                    delete lastInX[name];
                    delete lastInY[name];
                    s = null;
                }
                if (touchStarts[name]) {
                    if (game.uptime()*1000 - touchStarts[name].uptime*1000 < 300) {
                        scene.onSingleTap(touchStarts[name]);
                        delete touchStarts[name];
                    }  
                }
            }
        };
        



        scene.scaleDragOffset = function(name, x,y) {
                if (dragOffsets[name].scaled) return;
                dragOffsets[name].baseX = dragOffsets[name].x;
                dragOffsets[name].baseY = dragOffsets[name].y;
                dragOffsets[name].x *= x;
                dragOffsets[name].y *= y;
                dragOffsets[name].scaled = true;
        };

        scene.destroyMouseJoint = function(joint) {
            //Ti.API.info('MOUSE JOINT DESTROY ' + joint.body.dragName);
            game.world.destroyJoint(joint);
            mouseJoints[joint.body.dragName]= null;
        };

        scene.forceEndDragBody = function(body) {
            scene.endDrag(body.dragName, {phase: "ended"});
        };

        scene.forceEndDragSprite = function(sprite) {
            scene.endDrag(sprite.dragName, {phase: "ended"});
        };



        return scene;

    }

};
