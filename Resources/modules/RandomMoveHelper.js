var quicktigame2d = require('com.ti.game2d');

function RandomMoveHelper(scene, sprite, borderCoords) {
    //init
    var s, spW, spH, bx1, bx2, by1, by2, iVar;

    //Ti.API.info('RandomMove works!')
    s = sprite;
    spW = s.width;
    spH = s.height;
    bx1 = borderCoords.x1;
    bx2 = borderCoords.x2;
    by1 = borderCoords.y1;
    by2 = borderCoords.y2;

    //coords
    function makeNewCoords() {
        var rX = bx1 + Math.random() * (bx2 - bx1 - spW);
        var rY = by1 + Math.random() * (by2 - by1 - spH);

        return {
            x : rX,
            y : rY
        }
    }

    //bezier
    function randomBezierConfig(s, newCoords) {
        var len = Math.sqrt(Math.pow(s.x - newCoords.x, 2) + Math.pow(s.y - newCoords.y, 2));
        var bezierMaxR = len / 10;
        //Ti.API.info('xxxxxxxxxxxxxxxxBEZIER STARTS')
        //Ti.API.info('len  ' + len);
        //Ti.API.info('bezierMaxR  ' + bezierMaxR);

        function getBezierXY(base) {
            var signX = (Math.random() > 0.5) ? -1 : 1;
            var x = base.x + signX * Math.random() * bezierMaxR;
            var localX = Math.abs(base.x - x);
            var signY = (Math.random() > 0.5) ? -1 : 1;
            var y = base.y + signY * Math.sqrt(bezierMaxR * bezierMaxR - localX * localX);

            return {
                x : x,
                y : y
            };
        }

        var begPoint = getBezierXY(s);
        var endPoint = getBezierXY(newCoords);

        //Ti.API.info('---->points')
        //Ti.API.info(begPoint.x + ', ' + begPoint.y)
        //Ti.API.info(endPoint.x + ', ' + endPoint.y)
        //Ti.API.info('xxxxxxxxxxxxxxxxBEZIER ENDS')
        return {
            cx1 : begPoint.x,
            cy1 : begPoint.y,
            cx2 : endPoint.x,
            cy2 : endPoint.y
        }
    }

    function makeTransform(duration, info) {
        var newCoords;
        var bezier = true, easing = quicktigame2d.ANIMATION_CURVE_LINEAR;
        var iDuration = duration;
        duration = duration * 4 / 6;

        if (info && !info.bezier) {
            bezier = false;
            if (!info.delay) {
                duration = iDuration;
                if (!info.after)
                    after = false;
            }
        }
        if (info && info.easing) {
            easing = info.easing;
        }

        //transform

        var intervalActs = function() {
            newCoords = makeNewCoords();

	        var tr = scene.createTransform({
	            bezier : bezier,
	            easing : easing
	        });
            //Ti.API.info('coords - ' + s.x + ', ' + s.y);
            //Ti.API.info('new Coords - ' + newCoords.x + ', ' + newCoords.y);

            tr.duration = duration;
            tr.bezierConfig = randomBezierConfig(s, newCoords);
            tr.x = newCoords.x;
            tr.y = newCoords.y;

            var after = function(e) {
                //Ti.API.info(e.source);
                e.source.removeEventListener('complete', after);

               //Ti.API.info('Fly animation finished!')
                var tr = scene.createTransform({
                    duration : duration * 1 / 6,
                    angle : 10,
                    autoreverse : true,
        
                });

                if (info && info.after) {
                    s.transform(tr);
                }
                if (iVar)
                    clearTimeout(iVar);
                iVar = setTimeout(intervalActs, iDuration);
            };
			
            tr.addEventListener('complete', after);

            s.transform(tr);
        };

        intervalActs();

        iVar = setTimeout(intervalActs, iDuration);
        //iVar = setInterval(intervalActs, iDuration);

    }


    this.status = false;

    this.start = function(duration, info) {
        //info:
        //bezier -> true/false
        //afterTransform -> +duration change
        //Ti.API.info('Fly animation start!')
        if (!this.status) {
            this.status = true;
            makeTransform(duration, info);
            if(info.wingsAnimation) wingTransform();
        }

        return this;
    }
    this.stop = function() {
        if (this.status) {
            this.status = false;
            clearTimeout(iVar);
            //clearInterval(iVar);
        }

        return this;
    }
    
    this.wingAnimationOnTouch = function(e) {
    	
    	var leftWing = scene.spriteByName("butterfly_krulo_lev");
    	leftWing.clearTransforms();
    	leftWing.scaleFromCenter(1,1,leftWing.width,0);
    	var tr1 = scene.createTransform({
    		duration:10,
    		autoreverse: true,
    		repeat: 4,
    		scale_centerX: leftWing.width,
    		scale_centerY: 0,
    		scaleX: 0.8,
    		scaleY: 1, 
    	});    	
    	leftWing.transform(tr1);	
    	
    	var rightWing = scene.spriteByName("butterfly_krulo_prav");
    	rightWing.clearTransforms();
    	rightWing.scaleFromCenter(0.7,1,0,0);
    	var tr2 = scene.createTransform({
    		duration:10,
    		autoreverse: true,
    		repeat: 4,
    		scale_centerX: 0,
    		scale_centerY: 0,
    		scaleX: 1,
    		scaleY: 1, 
    	});
    	rightWing.transform(tr2);	
    	
    	tr2.addEventListener("complete", function() {
    		wingTransform();
    	});
    	
    }
    
    
    
    
    function wingTransform() {
    	var leftWing = scene.spriteByName("butterfly_krulo_lev");
    	leftWing.scaleFromCenter(1,1,leftWing.width,0);
    	var tr1 = scene.createTransform({
    		duration:200,
    		autoreverse: true,
    		repeat: -1,
    		scale_centerX: leftWing.width,
    		scale_centerY: 0,
    		scaleX: 0.7,
    		scaleY: 1, 
    	});
    	leftWing.transform(tr1);	
    	
    	var rightWing = scene.spriteByName("butterfly_krulo_prav");
    	rightWing.clearTransforms();
    	rightWing.scaleFromCenter(0.7,1,0,0);
    	var tr2 = scene.createTransform({
    		duration:200,
    		autoreverse: true,
    		repeat: -1,
    		scale_centerX: 0,
    		scale_centerY: 0,
    		scaleX: 1.0,
    		scaleY: 1, 
    	});
    	rightWing.transform(tr2);	
    };
    
    
}

module.exports = RandomMoveHelper;
