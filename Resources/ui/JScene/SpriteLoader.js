var isAndroid = !!Ti.Android;
var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');
var JScene = require('/ui/JScene');
var Utils = require('/ui/JScene/Utils');

module.exports = {
    init : function(scene, fname, basepath, no_menu) {
        var data;
        function getJsonData(fname) {
            return JScene.getJSON(fname);
        }
        
        scene.loadSprites = function() {
            scene.scaleX = game.scaleX;
            scene.scaleY = game.scaleY;
            data = getJsonData(fname);

            scene.textLayout = data.textLayout;
            scene.setupText();

            var names = {};
            var z = 0;
            //create sprites and return all names back (for onloadsprite waiter)
            
            var slist = [];
            for (var i in data.layers) {
                var l = data.layers[i];

                //language sprite filtering
                if (l.name.match(/_[a-z]+_lang$/)) {
                    var lngSprite = l.name.match(/_([a-z]+)_lang$/)[1];
                    if (scene.lang != lngSprite) {
                        continue;
                    }
                }

                //platform sprite filtering
                if (l.platform && l.platform == 'android' && !scene.android) {
                    continue;
                }
                if (l.platform && l.platform == 'ios' && scene.android) {
                    continue;
                }

                //device filtering
                if (l.type && l.type == 'phone' && !scene.tablet) {
                    continue;
                }
                if (l.type && l.type == 'tablet' && scene.tablet) {
                    continue;
                }

                if (l.name == "menu")
                    continue;
                    
                    
                    
                //parse values and scale them
                l.left = parseInt(l.left, 0) * scene.scaleX;
                l.width = parseInt(l.width, 0) * scene.scaleX;
                l.top = parseInt(l.top, 0) * scene.scaleY;
                l.height = parseInt(l.height, 0) * scene.scaleY;

                var sprite, angle = (l.angle) ? l.angle : 0;
                l.no_easing = true; //prevent easing
                //!l.subsprites || l.no_easing;
                var y = l.no_easing ? l.top : game.screen.height;

                if (l.subsprites) {
                    //create empty sprite
                    var sobj = {
                        x : l.left,
                        y : y,
                        width : l.width,
                        height : l.height,
                        angle : angle,
                        image : "images/clear.png",
                        alpha : l.hidden ? 0 : 1,
                        draggable : !!l.draggable
                    };
                    sprite = game2d.createSprite(sobj);
                    scene.addAndRemember(sprite);
                    sprite.loadedData = l;
                    l.childNames = [];
                    names = scene.loadSubSprites(sprite, l, i, names, l.left, y);
                    sprite.transform(scene.createTransform({
                        x : l.left,
                        y : y,
                        angle : angle,
                        duration : 0
                    }));

                } else if (l.sheet) {
                    //sprite sheet
                    sprite = game2d.createSpriteSheet({
                        x : l.left,
                        y : y,
                        width : l.width / scene.scaleX,
                        height : l.height / scene.scaleY,
                        angle : angle,
                        image : normalize(basepath + l.filename),
                        draggable : !!l.draggable,
                        loadedData : l,
                        alpha : l.hidden ? 0 : 1
                    });
                    scene.addAndRemember(sprite);
                    var tr = scene.createTransform({
                        scale_centerX : 0,
                        scale_centerY : 0,
                        scaleX : scene.scaleX,
                        scaleY : scene.scaleY
                    });
                    //tr.scale(scene.scaleX, scene.scaleY);
                    sprite.transform(tr);
                } else if (l.particle) {
                    sprite = game2d.createParticles({
                        x : l.left,
                        y : y,
                        width : l.width,
                        height : l.height,
                        image : normalize(basepath + l.filename),
                        loadedData : l,
                        alpha : l.hidden ? 0 : 1
                    });
                    scene.add(sprite);
                } else if (l.bgcolor && !l.filename) {
                    sprite = game2d.createSprite({
                        x : l.left,
                        y : y,
                        width : l.width,
                        height : l.height,
                        angle : angle,
                        color : l.bgcolor,
                        loadedData : l,
                        alpha : l.hidden ? 0 : 1
                    });
                    scene.add(sprite);
                } else {
                    //regular sprite
                    names[normalize(basepath + l.filename)] = 1;
                    obj = {
                        x : l.left,
                        y : y,
                        width : l.width,
                        height : l.height,
                        angle : angle,
                        image : normalize(basepath + l.filename),
                        draggable : !!l.draggable
                    };
                    if (l.zIndex)
                        l.z = l.zIndex;
                    if (l.name == 'close_text') {
                        obj.z = 100;
                        l.hidden = true;
                    }
                    if (l.name == 'roll_text_open') {
                        obj.z = 98;
                        obj.alpha = 0;
                        l.hidden = true;
                        l.no_easing = false;
                        l.touchable = false;
                        //sprite.y = game.screen.height;
                    }
                    obj.loadedData = l;
                    sprite = game2d.createSprite(obj);
                    scene.add(sprite);
                    //slist.push(sprite);
                }
                sprites[l.name] = sprite;
            }
            if (slist.length > 0) {
                //scene.scene.addBatch(slist);
            }
            //alert(names);
            ////Ti.API.info('ewee');
            //setup menu at top
            if (!no_menu) {
                var l = {
                    "name" : "menu",
                    "stack" : "20",
                    "left" : 5 * scene.scaleX,
                    "top" : -5 * scene.scaleY,
                    "width" : 244 * scene.scaleX,
                    "height" : 79 * scene.scaleY,
                    subsprites : "../../menu/small/small.jscene"
                };
                //data.layers.push(l);
                var sprite = game2d.createSprite({
                    x : l.left,
                    y : 0,
                    width : l.width,
                    height : l.height,
                    angle : 0,
                    image : "images/clear.png"
                });
                sprite.loadedData = l;
                scene.addAndRemember(sprite);
                sprite.loadedData = l;
                scene.loadSubSprites(sprite, l, 0, names, l.left, l.top);
                //sprite.startAnimation = game2d.createTransform({x:l.left,y:l.top, angle:0, alpha:1});
                //sprite.transform(sprite.startAnimation);
                t = null;
                sprites[l.name] = sprite;
                //data.push(l);
            }
            //remember data with scene
            //game.start();
            return names;
        };

        scene.loadSubSprites = function(parentSprite, parentData, zIndex, hash, px, py) {
            //read json
            var data = getJsonData(Ti.Filesystem.resourcesDirectory + normalize(basepath + parentData.subsprites));
            var childs = [];

            for (var i in data.layers) {
                var l = data.layers[i];

                //language sprite filtering
                if (l.name.match(/_[a-z]+_lang$/)) {
                    var lngSprite = l.name.match(/_([a-z]+)_lang$/)[1];

                    if (scene.lang != lngSprite) {
                        continue;
                    }
                }

                //platform sprite filtering
                if (l.platform && l.platform == 'android' && !scene.android) {
                    continue;
                }
                if (l.platform && l.platform == 'ios' && scene.android) {
                    continue;
                }

                //type
                if (l.type && l.type == 'phone' && !scene.tablet) {
                    continue;
                }
                if (l.type && l.type == 'tablet' && scene.tablet) {
                    continue;
                }

                //var l = data.layers[i];
                l.left = parseInt(l.left, 0) * scene.scaleX;
                l.width = parseInt(l.width, 0) * scene.scaleX;
                l.top = parseInt(l.top, 0) * scene.scaleY;
                l.height = parseInt(l.height, 0) * scene.scaleY;
                if (l.dragStartSound && !l.tapSound) {
                    l.tapSound = l.dragStartSound;
                }
                //data.layers[i] = l;
                var sprite, angle = (l.angle) ? l.angle : 0;

                //l.name = parentData.name + "_" + l.name;
                var child;
                l.no_easing = true;

                if (!l.name_given) {
                    l.name = parentData.name + "_" + l.name;
                    l.name_given = true;
                }
                //make array of childrens (names only)
                if (!parentData.childNames) {
                    parentData.childNames = [];
                    parentData.childNames.push(l.name);
                } else {
                    parentData.childNames.push(l.name);
                }
                var obj = {
                    tag : l.name,
                    alpha : l.hidden ? 0 : 1,
                    x : l.left + px,
                    y : l.top + py,
                    width : l.width,
                    height : l.height,
                    angle : angle,
                    image : normalize(basepath + l.filename),
                    loadedData : l,
                    child : true,
                    parentX : parentData.left,
                    parentY : parentData.top
                };
                if (parentData.zIndex)
                    obj.z = parentData.zIndex;
                if (l.zIndex)
                    obj.z = l.zIndex;
                if (!l.hidden && !parentSprite.loadedData.hidden) {
                    obj.alpha = 1;
                }
                if (l.sheet) {
                    child = game2d.createSpriteSheet(obj);
                } else {
                    hash[normalize(basepath + l.filename)] = 1;
                    child = game2d.createSprite(obj);
                }
                sprites[l.name] = child;
                childs.push(child);

                child = null;
            };
            scene.scene.addBatch(childs);
            if (Ti.Android) {
                parentSprite.addTransformChildWithRelativePositionBatch(childs);
            } else {
                parentSprite.addTransformChildWithRelativePosition(childs);
            }
            childs = null;
            return hash;
        };
    }
}; 