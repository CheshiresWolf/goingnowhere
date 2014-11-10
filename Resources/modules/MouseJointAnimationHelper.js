var quicktigame2d = require('com.ti.game2d');

function MouseJointAnimationHelper(scene, info, childBody, parentBody, afterTransformFunc) {
    var self = this;

    self.scene = scene;
    self.info = info;
    self.childBody = childBody;
    self.parentBody = parentBody;

    //Retina fix
    info.x = info.x * scene.scaleX;
    info.y = info.y * scene.scaleY;
    info.anchorX = info.anchorX * scene.scaleX;
    info.anchorY = info.anchorY * scene.scaleY;
    self.isLive = false;

    self.start = function() {
        //Ti.API.info('start')
        self.isLive = true;

        self.transform = self.scene.createTransform(self.info);
        self.scene.after(self.transform, function() {
            self.stop();
            if (afterTransformFunc) {
                afterTransformFunc();
            }
        });
        self.targetSprite = quicktigame2d.createSprite({
            x : 0,
            y : 0,
            width : 10,
            height : 10,
            angle : 0,
            image : "images/clear.png"
        });
        self.scene.add(self.targetSprite);

        self.targetSprite.transform(self.transform);

        self.startX = self.childBody.view.x + self.info.anchorX;
        self.startY = self.childBody.view.y + self.info.anchorY;

        self.startParentX = self.parentBody.view.x;
        self.startParentY = self.parentBody.view.y;

        //Ti.API.info(self.startX, self.startY)
        self.joint = self.scene.game.world.createMouseJoint(self.scene.game.world.groundBody, self.childBody, {
            targetX : self.startX,
            targetY : self.startY,
            //frequencyHz: 30,
            //dampingRatio: 5,
            maxForce : 1000000,
            collideConnected : true
        });
    };
    self.update = function() {
        var dX = self.parentBody.view.x - self.startParentX;
        var dY = self.parentBody.view.y - self.startParentY;

        var x = self.targetSprite.x;
        var y = self.targetSprite.y;
        //Ti.API.info(x, y)
        self.joint.SetTarget({
            posX : self.startX + x + dX,
            posY : self.startY + y + dY
        });
        //Ti.API.info(self.startX + x, self.startY + y)
    };
    self.stop = function() {
        self.isLive = false;
        self.readyToDestroy = true;
    };
    self.destroy = function() {
        self.scene.game.world.destroyJoint(self.joint);
        self.joint = null;
        self.scene.remove(self.targetSprite);
        self.targetSprite = null;
    }
}

module.exports = MouseJointAnimationHelper;
