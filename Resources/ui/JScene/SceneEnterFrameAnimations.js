var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');

module.exports = {
    init : function(scene) {
        //game.enableOnDrawFrameEvent = true;
        var frameAnimations = [];
        var game = scene.game;
        scene.onFrameAnimation = function(e) {
            for (var i = 0; i < frameAnimations.length; i++) {
                //Ti.API.info('update', frameAnimations[i].isLive)
                if (frameAnimations[i] && frameAnimations[i].isLive) {
                    //Ti.API.info('update')
                    frameAnimations[i].update();
                }
            }
            scene.cleanFrameAnimation();
        };
        
        scene.cleanFrameAnimation = function() {
            for (var i = frameAnimations.length - 1; i >= 0; i--) {
                if (frameAnimations[i].readyToDestroy) {
                    frameAnimations[i].destroy();
                    frameAnimations[i] = null;
                    frameAnimations.splice(i, 1);
                }
            };
        };

        scene.clearAllFrameAnimations = function() {
            for (var i = frameAnimations.length - 1; i >= 0; i--) {
                frameAnimations[i].destroy();
                frameAnimations[i] = null;
                frameAnimations.splice(i, 1);
            };
        };

        scene.addFrameAnimation = function(obj, autostart) {
            frameAnimations.push(obj);
            if (!scene.onFrameAnimationStarted) {
                scene.addEventListener('enterframe', scene.onFrameAnimation);
                scene.onFrameAnimationStarted = true;
            }
            if (autostart) {
                obj.start();
            }
        };
        
        scene.removeFrameAnimation = function(obj) {
            var pos = frameAnimations.indexOf(obj);
            if (pos != -1) {
                frameAnimations.splice(pos, 1);
            }
            if (frameAnimations.length == 0 && scene.onFrameAnimationStarted) {
                scene.removeEventListener('enterframe', scene.onFrameAnimation);
                scene.onFrameAnimationStarted = false;
            }

        };
        return scene;
    }
}; 