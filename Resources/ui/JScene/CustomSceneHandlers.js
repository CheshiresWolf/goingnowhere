var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');

module.exports = {
    init : function(scene) {
        var game = scene.game;
        /*
         * CLOUD MOVING MAGIC
         */
        scene.onClick_any = function(e) {
            //scene.playSound("rustle");
            var sprite = e.sprite;
            if (sprite.loadedData.name.match(/^cloud/)) {
                sprite.clearTransforms();
                tr = scene.createTransform({
                    x : -sprite.loadedData.width,
                    easing : game2d.ANIMATION_CURVE_CUBIC_IN,
                    duration : 1000,
                });
                scene.playSound("fly_over");
                sprite.transform(tr);
                setTimeout(function() {
                    sprite.x = game.screen.width;
                    sprite.transform(scene.createTransform(sprite.loadedData.startAnimation || sprite.cloudAnimation));
                }, 1500);

            } else if (sprite.loadedData.name.match(/^smoke_home/)) {
                scene.playSound(["dym1", "dym2", "dym3", "dym4"]);
                //Ti.API.info('sadasdas')
                sprite = scene.spriteByName(e.sprite.loadedData.smoke_name);
                sprite.clearTransforms();
                sprite.y = sprite.loadedData.top;
                sprite.scaleX = 1;
                sprite.scaleY = 1;
                sprite.alpha = 1;
                sprite.transform(scene.createTransform({
                    scaleX : 1.8,
                    scaleY : 1.8,
                    y : sprite.y - sprite.height,
                    alpha : 0,
                    //easing: game2d.ANIMATION_CURVE_ELASTIC_OUT,
                    duration : 900,
                }));

            } else if (sprite.loadedData.name.match(/^flo/) || sprite.loadedData.name.match(/^grib/)) {
                var scale, easing;

                if (sprite.scaleX === 0.5) {
                    scale = 1;
                    easing = game2d.ANIMATION_CURVE_BACK_IN_OUT;
                } else if (sprite.scaleX === 1) {
                    scale = 0.5;
                    easing = game2d.ANIMATION_CURVE_BACK_IN_OUT;
                } else {
                    return;
                }

                sprite.transform(scene.createTransform({
                    scaleX : scale,
                    scaleY : scale,
                    scale_centerX : sprite.width / 2,
                    scale_centerY : sprite.height,
                    duration : 900,
                    easing : easing
                }));
            }
        };

        scene.onClick_menu_menu_item = function(e) {
            Ti.App.fireEvent("showMenu");
        };
        /*
         * EEGS FALLING MAGIC
         */

        scene.onClick_crow = function(e) {
            var sprite = scene.spriteByName("egg");
            if (!sprite)
                return;
            if (!sprite.dropped)
                sprite.dropped = 0;
            if (!sprite.loadedData.limit)
                sprite.loadedData.limit = 70;
            if (sprite.dropped > 70)
                return;

            var new_sprite = game2d.createSprite({
                image : sprite.image,
                x : e.x,
                y : e.y,
                width : sprite.width,
                height : sprite.height
            });
            new_sprite.draggable = true;
            new_sprite.mouseJoint = true;

            sprite.dropped++;
            scene.add(new_sprite);
            var oRef = game.world.addBody(new_sprite, {
                radius : new_sprite.width / 2,
                density : 1.0,
                friction : 0.5,
                restitution : 0.5,
                type : "dynamic"
            });
            oRef.draggable = true;
            scene.addWorldObjects(oRef);
            scene.playSound("Yaytso1");

        };

        return scene;
    }
};
