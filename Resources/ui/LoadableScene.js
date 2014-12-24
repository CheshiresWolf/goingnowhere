var _      = require("/lib/Underscore");
var game2d = require("com.ti.game2d");
var JScene = require("/ui/JScene");
var Config = require("config");
var Utils  = require("/ui/JScene/Utils");


var isTablet = Ti.Platform.osname == "ipad";
var isAndroid = !!Ti.Android;



function applyProperties(obj, props) {
    if (isAndroid) {
        for (var key in props) obj[key] = props[key];
    } else {
        obj.applyProperties(props);
    }
}



function LoadableScene(game, fname, basepath, no_menu) {

    // scene data
    var data; 
    // main scene
    var scene = this;

    scene.game = game;
    scene.basepath = basepath;

    // scene.soundFormat = Ti.Android ? ".mp3" : ".mp3";
    scene.soundFormat = ".mp3";
    scene.pageMode = "normal";
    scene.forcedEnterframe = true;
    // ===== Shortcuts =====
    
        scene.getScene = function(){
            return scene.scene;
        }
        scene.add = function(s) {
            scene.scene.add(s);
        }
        scene.addBatch = function(p) {
            scene.scene.addBatch(p);
        }
        scene.remove = function(s) {
            scene.scene.remove(s);
        }
        scene.removeBatch = function(p) {
            scene.scene.removeBatch(p);
        }
        scene.addEventListener = function(e, f) {
            scene.scene.addEventListener(e,f);
        }
        scene.removeEventListener = function(e, f) {
            scene.scene.removeEventListener(e,f);
        }
        scene.fireEvent = function(e, f) {
            scene.scene.fireEvent(e,f);
        }
        scene.spritesAtXY = function(o) {
            return scene.scene.spritesAtXY(o); 
        }

    // =====================

    scene.scene = game2d.createScene({ alpha: 0 });
    scene.scene.obj = scene;
    scene.lang = Config.getCurrentLanguage();
    
    function px2dip(ThePixels) {
        return scene.android ? (ThePixels / (Titanium.Platform.displayCaps.dpi / 160)) : ThePixels;
    };

    var osname = Ti.Platform.osname,
        height = Ti.Platform.displayCaps.platformHeight,
        width  = Ti.Platform.displayCaps.platformWidth;

    scene.android = osname === "android";
    scene.tablet  = osname === "ipad" || (
        osname === "android" && (px2dip(width) >= 900 || px2dip(height) >= 900)
    );
    
    
    game.enableOnDrawFrameEvent = (scene.forcedEnterframe ? true : false);
    
    //canvas - base background for each scene
    var canvas;
    var sprites = {};
    var wordSprites = [];

    // var skeletons = {};

    //load sprites    
    canvas = game2d.createSprite({
        x : 0,
        y : 0,
        width  : Config.UI_WIDTH,
        height : Config.UI_HEIGHT,
        image  : "images/scenes/canva.png"
    });
    scene.add(canvas);    //reference helper for spriteByName
    
    // Coordinates helper
    var helper = null;
    // helper = new CoordinatesHelper(scene);
    
    function getJsonData(fname) {
    	return JScene.getJSON(fname);
        var file = Ti.Filesystem.getFile(fname);
        var content = file.read().text;
        file = null;
        return eval("("+ content + ")");
    };



    scene.loadSprites = function() {
        //game.stop();

        scene.isRetina = game.isRetina();
        scene.scaleX   = game.scaleX;
        scene.scaleY   = game.scaleY;
        //Ti.API.info('LOADING');
        //load canva
        
        
        //read json
        data = getJsonData(fname);
        scene.data = data;
        scene.box2d = !!data.box2d;
        
        //remember data
        //scene.pageData = data;
        if (Config.Globals.startRecording) {
            //scene.pageMode = "record";
        } else if (Config.Globals.startReplay) {
           // scene.pageMode = "replay";
        }

        if (scene.data.gameData) {
            scene.pageMode = "game";
        }

        //box2d
        var names = {};
        var z = 0;

        // Create sprites and return all names back (for onloadsprite waiter)
        var slist = [];

        for (var i in data.layers) {

            //Ti.API.info(z++);
            var l = data.layers[i];
            
            // Language sprite filtering
            if (l.name.match(/_[a-z]+_lang$/)) {
                var lngSprite = l.name.match(/_([a-z]+)_lang$/)[1];
                if (scene.lang != lngSprite) {
                    continue;
                }
            }
            
            if (Config.ONE_LANGUAGE && l.multilanguage) {
                continue;
            }
            
            // Type and platform sprite filtering
            if (
                (l.platform && (
                    ( scene.android && (l.platform === "ios"    )) ||
                    (!scene.android && (l.platform === "android"))
                )) ||
                (l.type && (
                    ( scene.tablet && (l.type === "phone" )) ||
                    (!scene.tablet && (l.type === "tablet"))
                ))
            ) {
                continue;
            }
            
            if (l.name == "menu") continue;


            var scale = l.scale || 1;
            if (scale !== 1) {
                l.left && l.width  && (l.left = l.left + (l.width  * (1 - scale) / 2));
                l.top  && l.height && (l.top  = l.top  + (l.height * (1 - scale) / 2));
                l.width  && (l.width  *= scale);
                l.height && (l.height *= scale);
            }


            // Parse values and scale them
            if (l.width == "fill") {
                l.width = Config.UI_WINDOW_WIDTH;
            } else {
                l.width  = parseInt(l.width,  0) * scene.scaleX;
            }
            if (l.height == "fill") {
                l.height = Config.UI_WINDOW_HEIGHT;
            } else {
                l.height = parseInt(l.height, 0) * scene.scaleY;
            }

            if (l.top == "center") {
                l.top = parseInt(Config.UI_WINDOW_HEIGHT / 2 - l.height / 2, 0);
            } else {
                l.top = parseInt(l.top, 0) * scene.scaleY;
            }

            if (l.left == "center") {
                l.left = parseInt(Config.UI_WINDOW_WIDTH / 2 - l.width / 2, 0);
            } else {
                l.left = parseInt(l.left, 0) * scene.scaleX;
            }

            if (l.right != undefined) {
                l.left = parseInt(Config.UI_WINDOW_WIDTH - l.right * scene.scaleX - l.width, 0);
            }

            if (l.bottom != undefined) {
                l.top = parseInt(Config.UI_WINDOW_HEIGHT - l.bottom * scene.scaleY - l.height, 0);
            }

            if (l.name.match(/arrow_(left|right)/)) {
               // l.top = (parseInt(l.top, 0) - 20) * scene.scaleY;
               l.zIndex = 100;
            }

            var sprite;
            l.no_easing = true; // !l.subsprites || l.no_easing;

            var localAlpha = 1;
            if (l.alpha != undefined) {
                localAlpha = l.alpha;
            }
            if (l.hidden != undefined) {
                localAlpha = l.hidden ? 0 : 1;
            }
            var baseParams = {
                x : l.left,
                y : l.top, // l.no_easing ? l.top : game.screen.height;
                width  : l.width,
                height : l.height,
                angle : l.angle || 0,
                image : Utils.normalize(basepath + l.filename),
                alpha : localAlpha, 
                draggable : !!l.draggable,
                loadedData : l
            };

            !isNaN(l.zIndex)  && (baseParams.z = l.zIndex | 0);
            !isNaN(l.centerX) && (baseParams.centerX = l.centerX *= scene.scaleX);
            !isNaN(l.centerY) && (baseParams.centerY = l.centerY *= scene.scaleY);


            if (l.subsprites) {

                baseParams.image = "images/clear.png";

                sprite = game2d.createSprite(baseParams);
                scene.add(sprite);
                l.childNames = [];
                names = scene.loadSubSprites(sprite, l, i, names, baseParams.x, baseParams.y);
                sprite.transform(scene.createTransform({
                    x: baseParams.x, 
                    y: baseParams.y,
                    angle: baseParams.angle
                }));
                
            } else

            if (l.sheet) {

                baseParams.width  /= scene.scaleX;
                baseParams.height /= scene.scaleY;
                sprite = game2d.createSpriteSheet(baseParams);
                scene.add(sprite);
                applyProperties(sprite, {
                    scale_centerX: 0,
                    scale_centerY: 0,
                    scaleX: scene.scaleX,
                    scaleY: scene.scaleY
                });

            } else

            if (l.particle) {

                baseParams.file = baseParams.image;
                baseParams.name = l.name;
                delete baseParams.angle;
                delete baseParams.draggable;
                delete baseParams.image;
                // console.debug("creating particles from jscene: ", baseParams);
                sprite = scene.createParticles(baseParams);

            } else

            if (!l.filename && l.bgcolor) {

                baseParams.color = l.bgcolor;
                delete baseParams.image;
                delete baseParams.draggable;

                // console.debug("creating colored sprite: ", l.bgcolor, baseParams);

                delete baseParams.color;
                baseParams.image = "images/clearw.png";
                sprite = game2d.createSprite(baseParams);
                
                if (l.bgcolor[0] === "#" && l.bgcolor.length === 7) {
                    var r = parseInt(l.bgcolor.substr(1, 2), 16) / 255;
                    var g = parseInt(l.bgcolor.substr(3, 2), 16) / 255;
                    var b = parseInt(l.bgcolor.substr(5, 2), 16) / 255;
                    // console.debug("sprite color:", r, g, b);
                    sprite.color(r, g, b);
                }

                scene.add(sprite);

            } else

            if (l.childrens) {

                sprite = game2d.createSprite(baseParams);
                scene.add(sprite);
                l.childNames = [];
                names = scene.loadChildrens(sprite, l, names);
                sprite.transform(scene.createTransform({
                    x: baseParams.x, 
                    y: baseParams.y,
                    angle: baseParams.angle
                }));

            } else {

                // regular sprite

                names[Utils.normalize(basepath + l.filename)] = 1;

                sprite = game2d.createSprite(baseParams);
                scene.add(sprite);

            }

            sprites[l.name] = sprite;

        }

        //setup menu at top
        scene.onSpritesLoaded && scene.onSpritesLoaded(data, sprites);

        return names;
    };
    
    scene.loadChildrens = function(parentSprite, parentData, hash) {

        var childsArray = [];
            
        for (var i in parentData.childrens) {

            var l = parentData.childrens[i];

            Ti.API.debug("LoadableScene | scene.loadChildrens | l : ", l);
            
            // Language sprite filtering
            if (l.name.match(/_[a-z]+_lang$/)) {
                var lngSprite = l.name.match(/_([a-z]+)_lang$/)[1];
                if (scene.lang != lngSprite) {
                    continue;
                }
            }
            
            // Type and platform sprite filtering
            if (
                (l.platform && (
                    ( scene.android && (l.platform === "ios"    )) ||
                    (!scene.android && (l.platform === "android"))
                )) ||
                (l.type && (
                    ( scene.tablet && (l.type === "phone" )) ||
                    (!scene.tablet && (l.type === "tablet"))
                ))
            ) {
                continue;
            }

            // Parse values and scale them
            if (l.left != undefined) {
                l.left = parseInt(l.left, 0) * scene.scaleX;
            }
            if (l.top != undefined) {
                l.top = parseInt(l.top, 0) * scene.scaleY;
            }

            l.width  = parseInt(l.width, 0) * scene.scaleX; 
            l.height = parseInt(l.height,0) * scene.scaleY;

            if (l.right != undefined) {
                l.left = parseInt(parentData.width - l.right * scene.scaleX - l.width, 0);
            }

            if (l.bottom != undefined) {
                l.top = parseInt(parentData.height - l.bottom * scene.scaleY - l.height, 0);
            }

            if (l.dragStartSound && !l.tapSound) {
                l.tapSound = l.dragStartSound;
            }

            var sprite;

            l.no_easing = true;
            
            if (!l.name_given) {
                l.name = parentData.name + "_" + l.name;
                l.name_given = true;
            }
            
            //name of parent subSprite
            l.parent_name = parentData.name;
            
            var localAlpha = 1;
            if (l.alpha != undefined) {
                localAlpha = l.alpha;
            }
            if (l.hidden != undefined) {
                localAlpha = l.hidden ? 0 : 1;
            }

            var child;

            var baseParams = {
                x : l.left,
                y : l.top,
                width  : l.width,
                height : l.height,
                angle : l.angle || 0,
                image : Utils.normalize(basepath + l.filename),
                alpha : localAlpha,
                loadedData : l,
                tag   : l.name,
                child : true,
                parentX : parentData.left,
                parentY : parentData.top
            };

            !isNaN(parentData.zIndex) && (baseParams.z = parentData.zIndex);
            !isNaN(l.zIndex)          && (baseParams.z = l.zIndex);
            !isNaN(l.centerX)         && (baseParams.centerX = l.centerX * scene.scaleX);
            !isNaN(l.centerY)         && (baseParams.centerY = l.centerY * scene.scaleY);

            if (l.sheet) {

                baseParams.width  /= scene.scaleX;
                baseParams.height /= scene.scaleY;

                child = game2d.createSpriteSheet(baseParams);
                applyProperties(child, {
                    anchorPoint: { x : 0, y : 0 },
                    scaleX: scene.scaleX,
                    scaleY: scene.scaleY
                });

            } else {

                hash[Utils.normalize(basepath + l.filename)] = true;
                child = game2d.createSprite(baseParams);

            }

            sprites[l.name] = child;

            parentSprite.addChildNode(child);
            childsArray.push(child);

        };  
        
        scene.scene.addBatch(childsArray);

        childsArray = null;  
        return hash;

    };

    scene.loadSubSprites = function(parentSprite, parentData, zIndex, hash, px, py) {

        // read json
        var data = getJsonData(
            Ti.Filesystem.resourcesDirectory +
            Utils.normalize(basepath + parentData.subsprites)
        );

        var childs = [];
            
        for (var i in data.layers) {

            var l = data.layers[i];
            
            // Language sprite filtering
            if (l.name.match(/_[a-z]+_lang$/)) {
                var lngSprite = l.name.match(/_([a-z]+)_lang$/)[1];
                if (scene.lang != lngSprite) {
                    continue;
                }
            }
            
            // Type and platform sprite filtering
            if (
                (l.platform && (
                    ( scene.android && (l.platform === "ios"    )) ||
                    (!scene.android && (l.platform === "android"))
                )) ||
                (l.type && (
                    ( scene.tablet && (l.type === "phone" )) ||
                    (!scene.tablet && (l.type === "tablet"))
                ))
            ) {
                continue;
            }
            

            var scale = parentData.scale || 1;
            if (scale !== 1) {
                l.left && (l.left *= scale); // + parentData.width  / 2 * scale;
                l.top  && (l.top  *= scale); // + parentData.height / 2 * scale;
                l.width  && (l.width  *= scale);
                l.height && (l.height *= scale);
            }

            // Parse values and scale them
            l.left   = parseInt(l.left,  0) * scene.scaleX;
            l.width  = parseInt(l.width, 0) * scene.scaleX; 
            l.top    = parseInt(l.top,   0) * scene.scaleY;
            l.height = parseInt(l.height,0) * scene.scaleY;

            if (l.dragStartSound && !l.tapSound) {
                l.tapSound = l.dragStartSound;
            }
            //data.layers[i] = l;
            var sprite;

            //l.name = parentData.name + "_" + l.name;
            var child;
            l.no_easing = true;
            
            if (!l.name_given) {
                l.name = parentData.name + "_" + l.name;
                l.name_given = 1;
            }
            //make array of childrens (names only)            
            if (!parentData.childNames) {
                parentData.childNames = [];
                parentData.childNames.push(l.name);
            } else {
                parentData.childNames.push(l.name);
            }
            //name of parent subSprite
            l.parent_name = parentData.name;
            
            var localAlpha = 1;
            if (l.alpha != undefined) {
                localAlpha = l.alpha;
            }
            if (l.hidden != undefined) {
                localAlpha = l.hidden ? 0 : 1;
            }

            var baseParams = {
                x: l.left + px,
                y: l.top  + py,
                width:  l.width,
                height: l.height,
                angle: l.angle || 0,
                image: Utils.normalize(basepath + l.filename),
                alpha: localAlpha,//(l.hidden || parentData.hidden) ? 0 : 1,
                loadedData: l,
                tag: l.name,
                child: true,
                parentX: parentData.left,
                parentY: parentData.top
            };

            !isNaN(parentData.zIndex) && (baseParams.z = parentData.zIndex);
            !isNaN(l.zIndex)          && (baseParams.z = l.zIndex);
            !isNaN(l.centerX)         && (baseParams.centerX = l.centerX * scene.scaleX);
            !isNaN(l.centerY)         && (baseParams.centerY = l.centerY * scene.scaleY);

            if (l.sheet) {

                baseParams.width  /= scene.scaleX;
                baseParams.height /= scene.scaleY;

                child = game2d.createSpriteSheet(baseParams);
                applyProperties(child, {
                    anchorPoint: { x: 0, y: 0 },
                    scaleX: scene.scaleX,
                    scaleY: scene.scaleY
                });

            } else {

                hash[Utils.normalize(basepath + l.filename)] = 1;
                child = game2d.createSprite(baseParams);

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



    //unload spries and force GC   
    scene.unloadSprites = function(game){
        //_.each(sprites, function(sprite, key) {
        ////Ti.API.info('DEACTIVATED');
        //scene.removeEventListener("enterframe" , scene.onFrame);
        /*
         * FINISH ACTIONS
         */
        
        if (helper) {
            helper.destroy();
        }
        scene.clearAllFrameAnimations();
        
        scene.beforeUnload && scene.beforeUnload();
        /*
         * 
         */
        scene.clearTimeouts();
        scene.clearIntervals();
         
        if (scene.box2d) {
            if (game && game.world) {
                game.world.stop();
                game.world.clean();
                game.removeWorld();
                game.world = null;
            }
            worldJoints = {};
            worldObjects = {};
        }
        
        scene.scene.removeBatch(_.values(sprites));
        for(var i in sprites) {
//            sprites[i].clearTransforms();
            if (sprites[i].image && sprites[i].image.match(basepath)) {
                game.unloadTexture(sprites[i].image);
            }
            sprites[i].dragTransform = null;
            sprites[i] = null;
        }

        /*for (var i in skeletons) {
            // fixme: unload skeleton

        }*/

        if (scene.tl){
            wordSprites = null;
            scene.tl.unloadSprites();
            scene.tl = null;
        }    
        sprites = {};
        // skeletons = {};
 
        scene.clearTransforms();
        
        //if (Config.OS_FAMILY === "ios") Ti.Media.stopMicrophoneMonitor();
        if (scene.audioRecorder) {
            scene.audioRecorder.stop();
            scene.audioRecorder = null;
        }
        
        if (scene.audioPlayer) {
            scene.audioPlayer.stop();
            scene.audioPlayer.release();
            scene.audioPlayer = null;
        }

        if (scene.unloadOther) scene.unloadOther(); 

    };



    //helper functions
    scene.addSpriteToScene = function(sprite) {
        sprites[sprite.loadedData.name] = sprite;
        return true;
    };
    
    //return sprites by name
    scene.spriteByName = function(name){
        return sprites[name];
    };

    /*scene.skeletonByName = function(name) {
        return skeletons[name];
    };*/

    scene.wordSpriteByIndex = function(index){
        return wordSprites[index];
    };
    
    scene.wordSpriteCount = function(){
        return wordSprites.length;
    };
    
    scene.wordSpriteArray = function(){
        return wordSprites;
    };
    


    //apply easing and start animations
    var transforms = [];
    scene.createTransform = function(options) {
        var tr = game2d.createTransform(options);
        if (!transforms) {
            transforms = [];
        }
        transforms.push(tr);
        return tr;
    };
    
    scene.clearTransforms = function(options) {
        for (var i=0; i < transforms.length; i++) {
            //transforms[i].dispose();
            transforms[i] = null;
        };
        transforms = [];
    };
    



    // ===== Timeouts =====
        
        var timeouts = [];
        scene.setTimeout = function(func, delay) {
            var t = setTimeout(func, delay);
            if (!timeouts) {
                timeouts = [];
            }
            timeouts.push(t);
            return t;
        }
        scene.clearTimeout = function(id) {
            for (var i = 0; i < timeouts.length; i++) {
                if (timeouts[i] == id) {
                    clearTimeout(id);
                    timeouts.splice(i, 1);
                    return;
                }
            }
        };
        scene.clearTimeouts = function(options) {
            for (var i=0; i < timeouts.length; i++) {
                clearTimeout(timeouts[i]);
                timeouts[i] = null;
            };
            timeouts = [];
        }

    // ====================



    // ===== Intervals =====
        
        var intervals = [];
        scene.setInterval = function(func, interval) {
            var i = setInterval(func, interval);
            if (!intervals) {
                intervals = [];
            }
            intervals.push(i);
            return i;
        };
        scene.clearInterval = function(id) {
            for (var i = 0; i < intervals.length; i++) {
                if (intervals[i] == id) {
                    clearInterval(id);
                    intervals.splice(i, 1);
                    return;
                }
            }
        };
        scene.clearIntervals = function(options) {
            for (var i = 0; i < intervals.length; i++) {
                clearInterval(intervals[i]);
                intervals[i] = null;
            }
            intervals = [];
        };
    
    // =====================
    
    
    scene = game.require("ui/JScene/DragHandler").init(scene);
    scene = game.require("ui/JScene/TouchHandler").init(scene);
    scene = game.require("ui/JScene/Box2DHandler").init(scene, data);
    scene = game.require("ui/JScene/SceneHelpers").init(scene);
    scene = game.require("ui/JScene/SceneEnterFrameAnimations").init(scene);
    scene = game.require("ui/JScene/EventRecorder").init(scene);
    //scene = game.require("modules/MultiPuzzleGame").init(scene);
    
    
    scene = game.require("ui/JScene/CustomSceneHandlers").init(scene);
    
    scene.prepareStart = function(){
        
        //game.addEventListener((scene.android ? "touchend" : "singletap"), scene.onSingleTap);
        //Ti.Gesture.addEventListener("shake", scene.onShake);
        //Ti.API.info('ON SHAKE', scene.onShake);

        scene.setupBox2D(sprites, data); 
        if (scene.box2d) {
            game.world.start();
        } 
        //Ti.API.info('TOUCH START SUBSCRIBED');
        game.addEventListener("touchstart_pointer", scene.onTouchStart);
        game.addEventListener("touchstart", scene.onTouchStart);
        
        game.addEventListener("touchend", scene.onTouchEnd)
        game.addEventListener("touchend_pointer", scene.onTouchEnd)
        
        game.addEventListener("touchmove", scene.onTouchMove);
        game.addEventListener("touchmove_pointer", scene.onTouchMove);
        
        game.addEventListener("touchcancel", scene.onTouchEnd);
        game.addEventListener("touchcancel_pointer", scene.onTouchEnd);
        
        scene.started = true;
        scene.showArrows();
        scene.showTopMenu(1000);

    };
    scene.addEventListener("prepareStart", scene.prepareStart);
    scene.prepareRelease = function(){ 
        //PREPARE RELEASE
        //game.removeEventListener((scene.android ? "touchend" : "singletap"), scene.onSingleTap);
        //Ti.API.info('TOUCH START UNSUBSCRIBED');
        game.removeEventListener("touchend", scene.onTouchEnd)
        game.removeEventListener("touchmove", scene.onTouchMove);
        game.removeEventListener("touchcancel", scene.onTouchEnd);
        game.removeEventListener("touchstart", scene.onTouchStart);
        
        game.removeEventListener("touchend_pointer", scene.onTouchEnd)
        game.removeEventListener("touchstart_pointer", scene.onTouchStart);
        game.removeEventListener("touchmove_poninter", scene.onTouchMove);
        game.removeEventListener("touchcancel_pointer", scene.onTouchEnd);
        //Ti.Gesture.removeEventListener("shake", scene.onShake);
        if (readSound) {
            scene.stopEnterframe();
            if (readSound.playing) {
                readSound.stop();
                readSoundPaused = true;
            }
            readSound.release();
            readSound = null;
        }
        scene.freeCompletedSounds();
    };
    scene.onShowScene = function(e) {

    	if (scene.beforeStartAnimation) 
            scene.beforeStartAnimation();
        for (var i in sprites) {
            var s = sprites[i];
            var l = s.loadedData;
            if (l) {
                if (!l.no_easing) {
                    s.transform( scene.createTransform({
                        x: l.left, y:l.top,
                        duration: 1900,  
                        easing: game2d.ANIMATION_CURVE_ELASTIC_OUT
                    }));
                } 
                if (l.startAnimation) {
                    //HARD FIX 4 3LP ONLY!!!
                    if (l.startAnimation.scale_centerY) {
                        l.startAnimation.scale_centerY = l.startAnimation.scale_centerY * scene.scaleY;
                    }
                    if (l.startAnimation.rotate_centerY) {
                        l.startAnimation.rotate_centerY = l.startAnimation.rotate_centerY * scene.scaleY;
                    }
                    if (l.startAnimation.rotate_centerX) {
                        l.startAnimation.rotate_centerX = l.startAnimation.rotate_centerX * scene.scaleX;
                    }
                    s.transform(scene.createTransform(l.startAnimation));
                }
                if (l.hidden) s.hide();
            }
        };
        scene.hideArrows();
        //setTimeout(        scene.setupText, 1000);
        //scene.addEventListener("prepareStart");
        scene.prepareStart();
        scene.fireEvent("startAnimationFinished");

        //Ti.API.info('ON SHOW SCENE');
    };

    /*
     * TEXT READING FACTORY
     */
    scene.topMenu = function() {
        var s = scene.spriteByName("menu");
        return s;
    };
     
    var hidderTimeout;
    var hideTopMenuTransform = scene.createTransform({x:-200*game.scaleX, duration: 500});
    scene.hideTopMenu = function() {
        var sprite = scene.spriteByName("menu");
        if (sprite) {
            //sprite.transform(hideTopMenuTransform);
        }
    };
    
    scene.updatePlayButtons = function(e) {
       // scene.spriteByName("menu_play").y = e.stop ? 13* game.scaleY : -1000;
        //scene.spriteByName("menu_pause").y = e.play ? 13* game.scaleY : -1000;
        var sprite = scene.spriteByName("menu_play");
        if (sprite) {
       		sprite.alpha = !e.play ? true : false;
       	}
       	sprite = scene.spriteByName("menu_pause");
       	if (sprite) {
       		sprite.alpha = e.play ? true : false;
		}
    };
    
    scene.updateButtons = function() {
        if (!readSound) return;
        if (!readSoundPaused) {
            game.updatePlayButtons({play: true});
        } else {
            game.updatePlayButtons({play: false});
        }    
    };
    
    var showTopMenuTransform = scene.createTransform({x:5*game.scaleX, duration: 500});
    scene.showTopMenu = function() {
        var sprite = scene.spriteByName("menu");
        if (sprite && sprite.x !=5) {
            scene.updateButtons();
            //sprite.transform(showTopMenuTransform);
            //if (hidderTimeout) clearTimeout(hidderTimeout);
            //hidderTimeout = setTimeout(scene.hideTopMenu, 5000);
        }
    }; 
    
    var listeningEnterframe = 0;
    scene.startEnterframe = function() {
        if (!listeningEnterframe) {
            scene.addEventListener("enterframe", scene.onFrame);
            game.enableOnDrawFrameEvent = (scene.forcedEnterframe ? true : false);
            listeningEnterframe = true;
        }
    };
    
    scene.stopEnterframe = function() {
        if (listeningEnterframe) {
            scene.removeEventListener("enterframe", scene.onFrame);
            game.enableOnDrawFrameEvent = scene.forcedEnterframe ? true : false
            listeningEnterframe = false;
        }
    };
    
    var sounds = {};
    var freeSoundTimer; 
    scene.stopSound = function(name) {
        if (!sounds) {
            return;
        }
        
        if (typeof name == "object") {
            for (var i=0; i < name.length; i++) {
                if (sounds && sounds[name[i]]) {
                    sounds[name[i]].stop();
                };
            };
            return;
        }
        if (sounds[name]) {
            sounds[name].stop();
        };
    };

    /*
        name is:
            <array> ||
            <string> ||
            <object> // sound object
     */
    scene.playSound = function(name, volume) {
        //only for testing
        return;


        if (scene.MUTE) return;

        var lname = L(scene.lang+"_"+name, "non_i18n_sound");
        if (lname != "non_i18n_sound") {
            name = lname;
        }
        if (!sounds) {
            return;
        }
        
        var urlObj = null;
        if (_.isArray(name)) {
            scene.playRandomSound(name, volume, allow_sim);
            return;
        } else
        if (_.isObject(name)) {
            urlObj = _.clone(name);
            //if (isAndroid) urlObj.url = "Resources/" + urlObj.url;
            name = urlObj.url;
        } else {
            var n = L(name) || name;
            urlObj = { url: "/sounds/" + n + scene.soundFormat };
        }

        var sound = null;
        if (sounds[name]) {
            sounds[name].stop();
            sound = sounds[name];
        };
        
        if (sound == null) {
            sound = Ti.Media.createSound(urlObj);
            sounds[name] = sound;
        } 
        sound.volume = Ti.App.Properties.getDouble("effects_sound", 0.6);
        
        sound.play();
    };


    scene.playRandomSound = function(names, volume, allow_sim) {
        //scene.freeCompletedSounds();
        //Ti.API.info(JSON.stringify(names));
        scene.stopSound(names);
        var index = Math.floor(Math.random()*names.length);
        scene.playSound(names[index], volume, allow_sim);
    };
    scene.freeCompletedSounds = function() {
        _.each(sounds, function(snd, i) {
            snd.stop();
            snd.release();
            sounds[i] = null;
        });
        sounds = {};
    };


    
    scene.hideArrows = function() {
        var al = scene.spriteByName("arrow_left");
        if (al) al.hide();
        var ar = scene.spriteByName("arrow_right");
        if (ar) ar.hide();
    };
    scene.showArrows = function() {
        var al = scene.spriteByName("arrow_left");
        if (al) al.show();
        var ar = scene.spriteByName("arrow_right");
        if (ar) ar.show();
    };
    
    scene.getSprites = function() {
        return sprites;
    };

    return scene;    
    
}

module.exports = LoadableScene;