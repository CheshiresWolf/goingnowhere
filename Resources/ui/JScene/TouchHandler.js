var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');
var BounceAnimation = require('modules/AnimationHelper').BounceAnimation;
var isAndroid = !!Ti.Android;

module.exports = {
    init : function(scene) {
        var game = scene.game;
        scene.onSingleTap = function(e) {
            if (!e.points) {
                scene.processSingleTap("singletap", e);
            } else {
                for (var point in e.points) {
                    if (e.points[point].phase === 'began' || isAndroid) {
                        scene.processSingleTap(point, e.points[point]);
                    }
                }
            }
        };

        scene.processSingleTap = function(name, e) {
            var sprites = scene.getSprites();

            var camera = game.camera;

            var clicked = false;
            var list = scene.game.hudScene().spritesAtXY({               
                x: e.hudX,
                y: e.hudY
            }).concat(scene.spritesAtXY({
                x: e.x,
                y: e.y
            }));

            var i = 0;
            
            var soundPlayed = false;
            for (var i = 0; i < list.length; i++) {
                var s = list[i];
                if (s.is_word || s.touchEnabled) {
                    s.fireEvent("singletap");
                    return;
                }
                var l = s.loadedData;
                if (l) {
                    //process tap sound
                    //Ti.API.info("TAP" + l.name);
                    if (!soundPlayed) {
                        var tapSound = l.tapSound, tapSoundData = l;
                        if (!tapSound && l.dragTarget) {
                            tapSoundData = sprites[l.dragTarget].loadedData
                            tapSound = tapSoundData.tapSound;
                        }
                        if (tapSound) {
                            //Ti.API.info("SOUND FOUND" + tapSound);
                            scene.playSound(tapSound, tapSoundData.tapSoundVolume, tapSoundData.tapSoundRepeat);
                            soundPlayed = true;
                        }
                    }
                    if (l.tapTarget) {
                        var sprite = sprites[l.tapTarget];
                        if (sprite) {
                            s = sprite;
                            l = s.loadedData;
                        }
                    }

                    if (l.touchable) {
                        scene.onClickSprite({
                            name : l.name,
                            sprite : s,
                            x : e.x,
                            y : e.y
                        });
                        clicked = true;
                        break;
                    }
                }
                s = null;
                list[i] = null;
            }
            list = null;
            e.type = "singletap";
            //scene.fireSpriteEventAt(e);
            if (!clicked) {
                scene.showTopMenu();
            }
        };

        scene.onClickSprite = function(e) {
            scene.defaultTouchHandler(e);
            if ( typeof scene["onClick_" + e.name] == 'function') {
                scene["onClick_"+e.name](e);
            } else {
                scene.onClick_any(e);
            }
        };

        scene.defaultTouchHandler = function(e) {
            var s = e.sprite, l = s.loadedData;
            if (l.tapAnimation) {
                if (l.tapAnimation.type == "bounce") {
                    var jump = l.tapAnimation.jump || 20, B = l.tapAnimation.B || 0.005;
                    e.sprite.bounceAnimation = new BounceAnimation(e.sprite, jump, B, scene.scaleY);
                    e.sprite.bounceAnimation.start();
                    if (l.tapAnimation.subtype == "rotate") {
                        var tr = scene.createTransform({
                            angle : 360,
                            duration : 1000
                        });
                        e.sprite.angle = 0;
                        e.sprite.transform(tr);
                    }
                } else if (l.tapAnimation.type == "rotate") {
                    var tr = scene.createTransform({
                        angle : 360,
                        duration : 1000
                    });
                    e.sprite.angle = 0;
                    e.sprite.transform(tr);
                } else if (l.tapAnimation.type == "jump") {
                    if (Math.floor(s.y) != Math.floor(s.loadedData.top))
                        return;  

                    //Ti.API.info(s.loadedData);
                    s.clearTransforms();
                    s.y = s.loadedData.top;
                    s.angle = s.loadedData.angle || 0;
                    //s.clearTransforms();

                    var jumpHeight = l.tapAnimation.jumpHeight || 70;
                    var angle = l.tapAnimation.angle || 30;

                    var tr = scene.createTransform({
                        duration : 300,
                        y : s.y - jumpHeight * game.scaleY,
                        easing : game2d.ANIMATION_CURVE_SINE_OUT,
                    });
                    var tr_a1 = scene.createTransform({
                        duration : 150,
                        angle : angle,
                        autoreverse : true
                    });

                    tr.addEventListener('complete', function() {
                        var tr_a2 = scene.createTransform({
                            duration : 150,
                            autoreverse : true,
                            angle : -angle
                        });

                        var tr = scene.createTransform({
                            duration : 300,
                            y : s.y + jumpHeight * game.scaleY,
                            easing : game2d.ANIMATION_CURVE_SINE_IN,
                        });

                        //Ti.API.info(s.y);
                        s.transform(tr);
                        s.transform(tr_a2);
                    });

                    s.transform(tr);
                    s.transform(tr_a1);

                }
                if (l.tapAnimation.sound) {
                    scene.playSound(l.tapAnimation.sound);
                }
            }
        };
        //abstract
        scene.onClick_any = function(e) {
        };

        var arrow_left_clicked = false;
        scene.onClick_arrow_left = function(e) {
            if (arrow_left_clicked)
                return;
            arrow_left_clicked = true;
            if (!scene.started)
                return;
            /*var arrow = scene.spriteByName("arrow_left");
             arrow.startAnimation  = game2d.createTransform({
             scaleX: 1.05,
             scaleY: 1.05,
             duration: 300,
             autoreverse: true
             });
             arrow.transform(arrow.startAnimation);*/
            Ti.App.fireEvent("prevPage");
        };
        var arrow_right_clicked = false;
        scene.onClick_arrow_right = function(e) {
            if (arrow_right_clicked)
                return;
            arrow_right_clicked = true;
            if (!scene.started)
                return;
            /*var arrow = scene.spriteByName("arrow_right");
             arrow.startAnimation  = game2d.createTransform({
             scaleX: 1.05,
             scaleY: 1.05,
             duration: 300,
             autoreverse: true
             });
             arrow.transform(arrow.startAnimation);*/
            Ti.App.fireEvent("nextPage");
        };
        
        return scene;
    }
};
