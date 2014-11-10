var game2d = require('com.ti.game2d');
var _ = require("lib/Underscore");

var maxImageNumber = 10;

/*
 * 
 * For use this class you should:
 * In jscene:
 * 
 *       define num-s           sprites and path for them 
 *              smack_ru_lang
 * 
 * In scene code:
 * to counstructor send
 *           count- define top value for counting (maximum 10 because we have 10 images);
 * 
 * Method showNum
 *          i- number
 *          posX, posY - numbers images (and endtext) position on scene
 *          hideEndText- true/false
 * 
 */

function Counting(scene, count) {
    
    var self = this;
    
    self.MAX_NUM = count || maxImageNumber;
    var num = null;
    var prevNum = null;//sprite  1..10

    self.showNum = function(i, posX, posY, hideEndText, soundPlay) {
        //skip at first start 
        self.X = posX; self.Y = posY;
        
        if (prevNum) {
            prevNum.clearTransforms();
            scene.eTransform(prevNum, {
                alpha: 0,
                duration: 500,
                y: prevNum.loadedData.top
            });
        }
        
        //get sprite of Number by name..
        num = scene.spriteByName('numbers_' + i);
        if (num){
            //num.move(posX,posY);  
            num.x = self.X || (scene.game.screen.width / 2);
            num.y = self.Y || (scene.game.screen.height / 2);

            prevNum = num;
            
            if (soundPlay !== undefined) {
                if (soundPlay) {
                    scene.playSound(i);
                    //Ti.API.info('sound true');
                } else {
                    //Ti.API.info('sound false');
                }
            } else {
                    //Ti.API.info('sound def');
                scene.playSound(i);
            }
            
                
            if (i >= self.MAX_NUM) {
                showAnim();
                if (!hideEndText){
                    scene.setTimeout(function(){
                        self.endText({
                            x: posX,
                            y: posY
                        });
                    }, 800);
                }
            } else {
                showAnim();
            }
        }
    };
    
    self.endText = function(pos, callback) {//MOLODEX TEXT
        var smack = scene.spriteByName('numbers_smack_' + scene.lang + '_lang');
        scene.playSound('victory1');
        
        if (pos !== undefined) {
            if (pos.x !== -1) {
                smack.x = pos.x;
            } else {
                smack.x = scene.game.screen.width / 2;
            }
            if (pos.y !== -1) {
                smack.y = pos.y;
            } else {
                smack.y = scene.game.screen.height / 2;
            }
        }
        
        if (smack) {
            smack.x -= smack.width / 2;
            smack.y -= smack.height / 2;
            
            scene.eTransform(smack, {
                alpha: 1,
                scaleX: 2,
                scaleY: 2,
                duration: 1000,
                autoreverse: true
            }, function() {
                smack.hide();
                if (callback !== undefined) {
                    callback();
                }
            });
        }
    };
    
    function showAnim() {
        if (num){
            //show number sprite
            var tr = scene.createTransform({
                alpha : 1,
                scaleX : 1.6,
                scaleY : 1.6,
                y : num.y - 100,
                duration : 500
            });    
            num.transform(tr);
            scene.after(tr, function() {
                  hideAnim();
            });
            
        }
    }
    
    function hideAnim() {
        //hide animations
            
        scene.eTransform(num, {
            alpha : 0,
            scaleX : 0.5,
            scaleY : 0.5,
            y : num.y,
            duration : 500
        }, function() {
            scene.eTransform(num, {
                scaleX : 1,
                scaleY : 1
            });
        });

    }
    
	return self;
}

module.exports = Counting;    