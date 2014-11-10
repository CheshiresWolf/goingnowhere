var Config = require("config");
var quicktigame2d = require("com.ti.game2d");
var OurBooks = require("modules/OurBooks");

var isAndroid = !!Ti.Android;

function AdDash(game, scene) {

    var self = this;
    self.opened = false;

    var window = game.window;

    getTales();

    //================================<init>================================

    var box = quicktigame2d.createSprite({
        image : "images/common/ad_dash/ad_box.png",
        y : 0,
        x : 10 * game.scaleX,
        width  : 748 * game.scaleX,
        height : 743 * game.scaleY,
        z : 4
    });

    var center_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/center_text.png",
        y : 279 * game.scaleY,
        x : 37  * game.scaleX,
        width  : 692 * game.scaleX,
        height : 25  * game.scaleY,
        z : 5
    });
    scene.add(center_text);
    box.addChildNode(center_text);

    var pigs_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/pigs_text.png",
        y : 47 * game.scaleY,
        x : 54 * game.scaleX,
        width  : 90 * game.scaleX,
        height : 32 * game.scaleY,
        z : 5
    });
    scene.add(pigs_text);
    box.addChildNode(pigs_text);

    var ugly_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/ugly_text.png",
        y : 45  * game.scaleY,
        x : 224 * game.scaleX,
        width  : 128 * game.scaleX,
        height : 17  * game.scaleY,
        z : 5
    });
    scene.add(ugly_text);
    box.addChildNode(ugly_text);

    var kolo_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/kolo_text.png",
        y : 47  * game.scaleY,
        x : 446 * game.scaleX,
        width  : 73 * game.scaleX,
        height : 15 * game.scaleY,
        z : 5
    });
    scene.add(kolo_text);
    box.addChildNode(kolo_text);

    var thumb_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/thumb_text.png",
        y : 45  * game.scaleY,
        x : 618 * game.scaleX,
        width  : 113 * game.scaleX,
        height : 17  * game.scaleY,
        z : 5
    });
    scene.add(thumb_text);
    box.addChildNode(thumb_text);

    var turn_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/turn_text.png",
        y : 503 * game.scaleY,
        x : 75  * game.scaleX,
        width  : 50 * game.scaleX,
        height : 15 * game.scaleY,
        z : 5
    });
    scene.add(turn_text);
    box.addChildNode(turn_text);

    var wolf_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/wolf_text.png",
        y : 503 * game.scaleY,
        x : 222 * game.scaleX,
        width  : 122 * game.scaleX,
        height : 33  * game.scaleY,
        z : 5
    });
    scene.add(wolf_text);
    box.addChildNode(wolf_text);

    var bremen_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/bremen_text.png",
        y : 502 * game.scaleY,
        x : 426 * game.scaleX,
        width  : 102 * game.scaleX,
        height : 33  * game.scaleY,
        z : 5
    });
    scene.add(bremen_text);
    box.addChildNode(bremen_text);

    var sleep_text = quicktigame2d.createSprite({
        image : "images/common/ad_dash/sleep_text.png",
        y : 500 * game.scaleY,
        x : 622 * game.scaleX,
        width  : 93 * game.scaleX,
        height : 34 * game.scaleY,
        z : 5
    });
    scene.add(sleep_text);
    box.addChildNode(sleep_text);

    var bremen_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/bremen_ico.png",
        y : 322 * game.scaleY,
        x : 395 * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true
    });
    bremen_ico.addEventListener("singletap", function() {
        openLink(link.bremen);
    });
    scene.add(bremen_ico);
    box.addChildNode(bremen_ico);

    var turn_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/turn_ico.png",
        y : 322 * game.scaleY,
        x : 18  * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true
    });
    turn_ico.addEventListener("singletap", function() {
        openLink(link.turn);
    });
    scene.add(turn_ico);
    box.addChildNode(turn_ico);

    var wolf_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/wolf_ico.png",
        y : 322 * game.scaleY,
        x : 206 * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true
    });
    wolf_ico.addEventListener("singletap", function() {
        openLink(link.wolf);
    });
    scene.add(wolf_ico);
    box.addChildNode(wolf_ico);

    var sleep_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/sleep_ico.png",
        y : 322 * game.scaleY,
        x : 590 * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true
    });
    sleep_ico.addEventListener("singletap", function() {
        openLink(link.sleep);
    });
    scene.add(sleep_ico);
    box.addChildNode(sleep_ico);

    var kolo_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/kolo_ico.png",
        y : 107 * game.scaleY,
        x : 399 * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true
    });
    kolo_ico.addEventListener("singletap", function() {
        openLink(link.kolo);
    });
    scene.add(kolo_ico);
    box.addChildNode(kolo_ico);

    var ugly_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/ugly_ico.png",
        y : 107 * game.scaleY,
        x : 208 * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true
    });
    ugly_ico.addEventListener("singletap", function() {
        openLink(link.ugly);
    });
    scene.add(ugly_ico);
    box.addChildNode(ugly_ico);

    var thumb_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/thumb_ico.png",
        y : 107 * game.scaleY,
        x : 589 * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true
    });
    thumb_ico.addEventListener("singletap", function() {
        openLink(link.thumb);
    });
    scene.add(thumb_ico);
    box.addChildNode(thumb_ico);

    var pigs_ico = quicktigame2d.createSprite({
        image : "images/common/ad_dash/pig_ico.png",
        y : 107 * game.scaleY,
        x : 16  * game.scaleX,
        width  : 156 * game.scaleX,
        height : 150 * game.scaleY,
        z : 5,
        touchEnabled : true,
        name : "pigs_ico"
    });
    scene.add(pigs_ico);
    pigs_ico.addEventListener("singletap", function() {
        openLink(link.pigs);
    });
    box.addChildNode(pigs_ico);

    self.ip_ico = quicktigame2d.createSprite({
        image : "images/clear.png",
        y : 630 * game.scaleY,
        x : 640 * game.scaleX,
        width  : 85  * game.scaleX,
        height : 100 * game.scaleY,
        z : 5,
        touchEnabled : true,
        name : "ip_ico"
    });
    self.ip_ico.addEventListener("singletap", function() {
        if (self.opened) {
            self.close();
        } else {
            self.open();
        }
    });
    scene.add(self.ip_ico);
    box.addChildNode(self.ip_ico);


    scene.add(box);

    //===============================</init>================================

    self.close = function(forse) {
        self.opened = false;

        scene.eTransform(box, {
            y : -640 * game.scaleY,
            duration : (forse) ? 1 : 200
        });
    };

    var firstTimeFlag = true;
    self.open = function() {
        self.opened = true;

        scene.eTransform(box, {
            y : 0,
            duration : 200
        }, function() {
            if (firstTimeFlag) {
                circlesAnimation();
                firstTimeFlag = false;
            }
        });
    };

    self.clean = function() {
        window.removeEventListener('swipe', swipeListener);

        if (topInterval != null) clearInterval(topInterval);
    };

    window.addEventListener('swipe', swipeListener);

    function swipeListener(e) {
        if (e.direction == "up") {
            self.close();
        }
        if (e.direction == "down") {
            self.open();
        }
    }

    function openLink(url) {
        Ti.API.debug("AdDash | openLink | url : " + url);
        Ti.App.fireEvent("trackMoreTales", {
            link : url
        });
        Titanium.Platform.openURL(url);
    }

    function getTales() {
        link = formLinks(OurBooks.getLocalList());

        OurBooks.getPublishedBooks("en", function(sucess, data) {
            if (sucess) {
                link = formLinks(data);
            } else {
                Ti.API.debug("AdDash | getTales | error : " + data.error);
            }
        });

        function formLinks(tales) {
            var links = {
                pigs   : "",
                ugly   : "",
                bremen : "",
                wolf   : "",
                kolo   : "",
                turn   : "",
                thumb  : "",
                sleep  : ""
            };

            //Ti.API.debug("AdDash | getTales | data : " + JSON.stringify(tales));

            for (var key in tales) {
                if (tales[key].id) {
                    if ( (tales[key].id).indexOf("wolfandsevenyoungkids") != -1 ) {
                        links.wolf = (isAndroid) ? tales[key].googleplay_url : tales[key].appstore_url;
                        continue;
                    }
                    if ( (tales[key].id).indexOf("bremen") != -1 ) {
                        links.bremen = (isAndroid) ? tales[key].googleplay_url : tales[key].appstore_url;
                        continue;
                    }
                    if ( (tales[key].id).indexOf("kolobok") != -1 ) {
                        links.kolo = (isAndroid) ? tales[key].googleplay_url : tales[key].appstore_url;
                        continue;
                    }
                    if ( (tales[key].id).indexOf("threelittlepigs") != -1 ) {
                        links.pigs = (isAndroid) ? tales[key].googleplay_url : tales[key].appstore_url;
                        continue;
                    }
                    if ( (tales[key].id).indexOf("repka") != -1 ) {
                        links.turn = (isAndroid) ? tales[key].googleplay_url : tales[key].appstore_url;
                        continue;
                    }
                    if ( (tales[key].id).indexOf("uglyduck") != -1 ) {
                        links.ugly = (isAndroid) ? tales[key].googleplay_url : tales[key].appstore_url;
                        continue;
                    }
                    if ( (tales[key].id).indexOf("thumbelina") != -1 ) {
                        links.thumb = (isAndroid) ? tales[key].googleplay_url : tales[key].appstore_url;
                        continue;
                    }
                } else {
                    Ti.API.debug("AdDash | getTales | error - !id : " + JSON.stringify(tales[key]));
                }
            }

            links.sleep = "http://tales.ipublisher.com.ua/beauty/";

            return links;           
        }
    }

    var topInterval = null;
    function circlesAnimation() {
        var intervalTime = 2000;
        var animationTime = 200;

        var topArray = [
            [ pigs_ico,   pigs_text,   pigs_text.y   ],
            [ ugly_ico,   ugly_text,   ugly_text.y   ],
            [ kolo_ico,   kolo_text,   kolo_text.y   ],
            [ thumb_ico,  thumb_text,  thumb_text.y  ],
            [ turn_ico,   turn_text,   turn_text.y   ],
            [ wolf_ico,   wolf_text,   wolf_text.y   ],
            [ bremen_ico, bremen_text, bremen_text.y ],
            [ sleep_ico,  sleep_text,  sleep_text.y  ]
        ];
        var lastTopIndex = -1;

        topInterval = setInterval(function() {
            if (lastTopIndex != -1) {
                var oldSprite = topArray[lastTopIndex][0];
                scene.eTransform(oldSprite, {
                    scaleX : 1,
                    scaleY : 1,
                    scale_centerX : oldSprite.width / 2, 
                    scale_centerY : (lastTopIndex > 3) ? 0 : oldSprite.height,
                    duration : animationTime
                });

                var oldText = topArray[lastTopIndex][1];
                scene.eTransform(oldText, {
                    y : topArray[lastTopIndex][2],
                    duration : animationTime
                });
            }

            lastTopIndex = newIndex(lastTopIndex);
            var newSprite = topArray[lastTopIndex][0];
            scene.eTransform(newSprite, {
                scaleX : 1.3,
                scaleY : 1.3,
                scale_centerX : newSprite.width / 2, 
                scale_centerY : (lastTopIndex > 3) ? 0 : newSprite.height,
                duration : animationTime
            });

            var newText = topArray[lastTopIndex][1];
            var textOffset = ( (lastTopIndex > 3) ? 20 : -20 ) * game.scaleY;
            scene.eTransform(newText, {
                y : topArray[lastTopIndex][2] + textOffset,
                duration : animationTime
            });

        }, intervalTime);

        function newIndex(oldI) {
            var newI = Math.floor(Math.random() * topArray.length);

            if (newI == oldI) {
                return newIndex(oldI);
            } else {
                return newI;
            }
        }
    }

    self.close(true);

    return self;

}

module.exports = AdDash;