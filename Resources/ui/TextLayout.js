/*

    Things possible to describe in jscene.textLayout or Config.COMMON_STORY_TEXT_SETTINGS,
    looked up in order
        jscene.lng.mode,
        jscene.lng,
        jscene,
        Config.COMMON_STORY_TEXT_SETTINGS.lng.mode,
        Config.COMMON_STORY_TEXT_SETTINGS.lng,
        Config.COMMON_STORY_TEXT_SETTINGS 

    // Draw user defined rectangle
    debugDraw: <Boolean>,

    // Print real text size
    debugOutput: <Boolean>,

    // Local url of image or xml for frame
    background: <url>,

    font: <string>,
    fontSize: <int>,
    lineHeight: <int>

    useInitial: <Boolean>,
    initialFont: <string> = font,
    initialFontSize: <int> = fontSize,
    initialTopDiff: <int> = initialFontSize / 4,

    dynamicSize:   <Boolean>,
    dynamicWidth:  <Boolean>,
    dynamicHeight: <Boolean>,

    padding: <int>,
    paddingLeft:   <int>,
    paddingRight:  <int>,
    paddingTop:    <int>,
    paddingBottom: <int>,

    // Points out what user defined rectangle specifies:
    // "content" says the rect is for text, so wrapper
    // will be magnified with paddings
    // "wrapper" says the rect is for wrapper, so text
    // will be adjusted by paddings
    sizing: "content" | "wrapper",

    // "auto" decides based on how user-def rect was specified
    align: "center" | "auto",
    verticalAlign:   "top"  | "center" | "bottom" | "auto",
    horizontalAlign: "left" | "center" | "right"  | "auto",

    // Combinate this to define rectangle
    x|left:   <int>,
    centerX:  <int>,
    right:    <int>,
    y|top:    <int>,
    centerY:  <int>,
    bottom:   <int>,
    width|w:  <int>,
    height|h: <int>,

    // Offset from top right corner of the wrapper
    closeButtonDx: <int>,
    closeButtonDy: <int>,

    text: <string>,
    words: [ [ <int>, <int> ], ... ],
    sound: <url>

    // todo:
    // fix: word can be separated when starting with
    // quotation mark or dash
    // remap width & dynamicWidth to width & maxWidth
    // AutoParse (will raise apostroph problem)
    // adjustTop/Left/Right/Bottom
    // slogi -> syllable
    // relative padding size
    // width + align: auto + no x = wrong align to left
    // left + right + width should align at center

*/



var game2d         = require("com.ti.game2d");
var TextWrapper    = require("/ui/sprites/TextWrapper");
var _              = require("lib/Underscore");
var Config         = require("config");
var SmartRectangle = require("/modules/SmartRectangle");
var Utils          = require("/ui/JScene/Utils");


// ===== Tools =====

    var android = !!Ti.Android;
    function applyProperties(obj, props) {
        if (android) {
            for (var key in props) obj[key] = props[key];
        } else {
            obj.applyProperties(props);
        }
    }



    function splitArray(array, condition) {
        var result = [];
        var buffer = [];
        for (var i = 0; i < array.length; i++) {
            if (condition(array[i], i, array)) {
                result.push(buffer);
                buffer = [];
            }
            buffer.push(array[i]);
        }
        result.push(buffer);
        return result;
    }

// =================



function TextLayout(scene) {

    var $ = this;



    // var mode = Ti.App.Properties.getString("read_mode") === "slogi" ? "readSlog" : "read";
    var mode = Ti.App.Properties.getBool("slogi_mode", false) ? "readSlog" : "read";
    var lng  = Config.getCurrentLanguage();

    // Search for params, from language and
    // mode specific up to global default
    function getParam(names, defaultValue) {

        if (typeof names === "string") names = [ names ];

        var tl       = scene.textLayout;
        var defaults = Config.COMMON_STORY_TEXT_SETTINGS || {};

        var placesToCheck = [
            tl[lng][mode],
            tl[lng],
            tl,
            (defaults[lng] || {})[mode],
            defaults[lng],
            defaults
        ];

        var result;
        if (!placesToCheck.every(function(e) {
            for (var i = 0; i < names.length; i++) {
                if ( (result = (e || {})[names[i]]) !== undefined ) {
                    return false;
                }
            }
            return true;
        })) {
            return result;
        } else {
            return defaultValue;
        }

    }



    var scaleX = scene.scaleX;
    var scaleY = scene.scaleY;



    var font        = getParam("font");
    var initialFont = getParam(["initialFont", "font"]);

    var fontSize        = Math.ceil(scaleY * getParam("fontSize"));
    var initialFontSize = Math.ceil(scaleY * getParam([ "initialFontSize", "fontSize" ]));
    var initialTopDiff  = Math.ceil(scaleY * getParam("initialTopDiff", initialFontSize / 4 / scaleY));

    var sprites = [];
    var words   = [];

    var useInitial;

    var debugSprite;

    var userDefinedRect;



    function init() {

        // ===== Get user defined rect =====

            userDefinedRect = new SmartRectangle({

                x:       getParam("x"),
                left:    getParam("left"),
                centerX: getParam("centerX"),
                right:   getParam("right"),
                width:   getParam("width"),
                w:       getParam("w"),
                contextWidth: 1024,

                y:        getParam("y"),
                top:      getParam("top"),
                centerY:  getParam("centerY"),
                bottom:   getParam("bottom"),
                height:   getParam("height"),
                h:        getParam("h"),
                contextHeight: 768

            }, scaleX, scaleY);

        // =================================

        // ===== Text wrapper =====

            var obj = {
                left: 0,
                top:  0,
                width:  1,
                height: 1,
                paddingLeft:   0,
                paddingRight:  0,
                paddingTop:    0,
                paddingBottom: 0,
                closeButtonDx: getParam("closeButtonDx") * scaleX || 0,
                closeButtonDy: getParam("closeButtonDy") * scaleY || 0,
                z: 97,
                hidden: true
            };

            var background = getParam("background");

            if (background) {
                obj.filename = Utils.normalize(scene.basepath + "/" + background);
            }

            $.wrapper = new TextWrapper(
                scene.game.hudScene(), game2d, obj, function() {
                    if ($.wrapper.view.alpha > 0) {
                        scene.game.navigation.click_text();
                        scene.playSound("menu");
                    }
                },
                scaleX, scaleY
            );

            scene.game.hudScene().add($.wrapper.view);
            
        // ========================



        getParam("debugDraw") && scene.game.hudScene().add(
            debugSprite = game2d.createSprite({
                image: "images/clearb.png",
                alpha: 0.33,
                x: userDefinedRect.x,
                y: userDefinedRect.y,
                width : userDefinedRect.width,
                height: userDefinedRect.height
            })
        );

    }



    this.drawText = function() {

        var self = this;

        var text = getParam("text");
        scene.wordIntervals = getParam("words");
        scene.readSoundFile = getParam("sound");

        useInitial = getParam("useInitial");

        sprites = [];
        words   = [];

        var generalSettings = {
            x: -1000,
            y: -1000,
            z: 99,
            alpha: 0
        };

        var initialSettings = _.extend({
            // height: initialFontSize * 1.5 * scaleY,
            fontFamily:      initialFont,
            fontSize:        initialFontSize,
            defaultFontSize: initialFontSize // for shuffle words game
        }, generalSettings);

        var regularSettings = _.extend({
            // height: 24 * scaleY,
            fontFamily:      font,
            fontSize:        fontSize,
            defaultFontSize: fontSize // for shuffle words game
        }, generalSettings);



        function addFiller(settings, str, newline) {

            if (!str && !newline) return;
            if (str && str.indexOf("\n") !== -1) {
                str.split("\n").forEach(function(e, i) {
                    addFiller(settings, e, i !== 0);
                });
            } else {

                function addFillerElement(str, isSpace, newline) {
                    if (!str && !newline) return;
                    sprites.push(
                        game2d.createTextSprite(
                            _.extend({
                                text: str,
                                is_word: false,
                                new_line: !!newline,
                                is_space: isSpace
                            }, settings)
                        )
                    );
                }

                var rgx = /\s+/g;
                var other = str.split(rgx);
                var spaces = str.match(rgx);
                addFillerElement(other[0], true, newline);
                if (spaces) {
                    for (var i = 0; i < spaces.length; i++) {
                        addFillerElement(spaces[i], true, false);
                        addFillerElement(other[i + 1], false, false);
                    }
                }
            }
        }

        function addWord(settings, str, index, isInitial) {
            var wordSprite = game2d.createTextSprite(
                _.extend({
                    text: str,
                    is_word: true,
                    isInitial: !!isInitial,
                    wordIndex: index
                }, settings)
            );
            wordSprite.addEventListener("singletap", scene.onClickWord);
            // !isInitial && words.push(wordSprite);
            sprites.push(wordSprite);
            return wordSprite;
        }


        var wordRegex = /\[.*?\]/g;
        var parsedWords = text.match(wordRegex).map(function(e) {
            // remove brackets
            return e.substr(1, e.length - 2);
        });
        var parsedFillers = text.split(wordRegex);



        var i = 0;
        var wordIndex = 0;
        var initialIsWord = !!parsedFillers[i + 1];

        if (useInitial) {
            addFiller(initialSettings, parsedFillers[i]);
            if (initialIsWord) {
                words.push(addWord(initialSettings, parsedWords[i], wordIndex, true));
                addFiller(initialSettings, parsedFillers[i + 1]);
                wordIndex++;
            } else {
                addWord(initialSettings, parsedWords[i], wordIndex, true);
            }
            i++;
        } else {
            addFiller(regularSettings, parsedFillers[i]);
        }

        for (; i < parsedWords.length; i++) {
            words.push(addWord(regularSettings, parsedWords[i], wordIndex++));
            addFiller(regularSettings, parsedFillers[i + 1]);
        }

        if (useInitial && !initialIsWord) {
            sprites[1].addTransformChildWithRelativePosition(sprites[0]);
        }

        scene.game.hudScene().addBatch(sprites);

        return words;

    };
    


    this.reflowWords = function() {

        if ($.reflowed) return;

        var text = getParam("text");

        var holder = $.wrapper.view;



        var lineHeight = Math.ceil(getParam("lineHeight", 1.3) * fontSize);

        var sizing = getParam("sizing", "content");
        var paddingLeft   = getParam(["paddingLeft",   "padding"], 0) * scaleX;
        var paddingRight  = getParam(["paddingRight",  "padding"], 0) * scaleX;
        var paddingTop    = getParam(["paddingTop",    "padding"], 0) * scaleY;
        var paddingBottom = getParam(["paddingBottom", "padding"], 0) * scaleY;

        var limitX = userDefinedRect.width;
        var limitY = userDefinedRect.height;
        if (sizing === "wrapper") {
            limitX -= paddingLeft + paddingRight;
            limitY -= paddingTop  + paddingBottom;
        }

        var x = 0;
        var y = 0;

        var maxX = 0;
        var maxY = 0;

        var coords = [];

        var lines = splitArray(sprites, function(sprite) {
            return !!sprite.new_line;
        });

        for (var i = 0; i < lines.length; i++) {

            var blocks = splitArray(lines[i], function(sprite) {
                return !!sprite.is_word;
            });

            for (var j = 0; j < blocks.length; j++) {

                var block = blocks[j];

                var blockWidth = block.reduce(function(sum, e, i, a) {
                    if (i === a.length - 1 && e.is_space) {
                        return sum;
                    } else {
                        return sum + Math.ceil(e.width);
                    }
                }, 0);

                if (Math.ceil(x + blockWidth) > limitX) {
                    y += lineHeight;
                    x = 0;
                } else {
                    maxX = Math.max(maxX, Math.ceil(x + blockWidth));
                }

                for (var k = 0; k < block.length; k++) {

                    var sprite = block[k];

                    var width = Math.ceil(sprite.width);

                    if (sprite.text.length > 0 && width === 0) {
                        return false;
                    }

                    var resultX = Math.ceil(x);
                    var resultY;
                    if (useInitial && sprite.isInitial) {
                        resultY = Math.ceil(y - initialTopDiff);
                    } else {
                        resultY = Math.ceil(y);
                    }

                    coords.push({
                        x: resultX,
                        y: resultY
                    });

                    if (sprite.text != "") x += width;

                    // doesn't work properly on real retina device
                    // maxY = Math.max(maxY, resultY + Math.ceil(sprite.height));
                    maxY = Math.max(maxY, resultY + Math.ceil(fontSize));
                    
                }

            }

            y += lineHeight;
            x = 0;

        }



        var startX = userDefinedRect.x;
        var startY = userDefinedRect.y;
        if (sizing === "wrapper") {
            startX += paddingLeft;
            startY += paddingTop;
        }


        function getAlignOffset(name, start, end, diff) {

            var align = getParam([name, "align"], "auto");
            if (align === "auto") {
                var s = getParam(start) !== undefined;
                var e = getParam(end)   !== undefined;
                if (s ^ e) {
                    if (s) align = start; else
                    if (e) align = end;
                } else {
                    align = "center";
                }
            }

            var alignOffset;
            switch (align) {
                case start: alignOffset = 0;    break;
                case end:   alignOffset = diff; break;
                default:    alignOffset = diff / 2;
            }

            return alignOffset;

        }

        var alignOffsetLeft = getAlignOffset("horizontalAlign", "left", "right",  limitX - maxX);
        var alignOffsetTop  = getAlignOffset("verticalAlign",   "top",  "bottom", limitY - maxY);

        for (var i = 0; i < sprites.length; i++) {

            applyProperties(sprites[i], {
                x: Math.ceil(coords[i].x + startX + alignOffsetLeft),
                y: Math.ceil(coords[i].y + startY + alignOffsetTop),
                baseX: Math.ceil(coords[i].x + startX + alignOffsetLeft),
                baseY: Math.ceil(coords[i].y + startY + alignOffsetTop),
            });

        }



        var wrapperX, wrapperY;
        var wrapperWidth, wrapperHeight;

        var dynamicWrapperWidth  = getParam([ "dynamicWidth",  "dynamicSize" ], true);
        var dynamicWrapperHeight = getParam([ "dynamicHeight", "dynamicSize" ], true);

        if (dynamicWrapperWidth) {
            wrapperX = startX + alignOffsetLeft;
            wrapperWidth  = maxX;
        } else {
            wrapperX = userDefinedRect.x;
            wrapperWidth = userDefinedRect.width;
        }

        if (sizing === "content" || dynamicWrapperWidth) {
            wrapperX -= paddingLeft;
            wrapperWidth += paddingLeft + paddingRight;
        }



        if (dynamicWrapperHeight) {
            wrapperY = startY + alignOffsetTop;
            wrapperHeight = maxY;
        } else {
            wrapperY = userDefinedRect.y;
            wrapperHeight = userDefinedRect.height;
        }

        if (sizing === "content" || dynamicWrapperHeight) {
            wrapperY -= paddingTop;
            wrapperHeight += paddingTop + paddingBottom;
        }

        $.wrapper.resize({
            x: wrapperX / scene.scaleX,
            y: wrapperY / scene.scaleY,
            width:  wrapperWidth  / scene.scaleX,
            height: wrapperHeight / scene.scaleY,
            paddingLeft:   0,
            paddingRight:  0,
            paddingTop:    0,
            paddingBottom: 0 
        });

        getParam("debugOutput") && console.info(
            "Scale-independent text size after reflow:", {
                x: (startX + alignOffsetLeft) / scaleX,
                y: (startY + alignOffsetTop)  / scaleY,
                width:  (maxX - startX) / scaleX,
                height: (maxY - startY) / scaleY
            }
        );

        $.reflowed = true;
        
        return true;

    };
    


    this.unloadSprites = function() {

        $.wrapper.unload();
        getParam("debugDraw") && scene.game.hudScene().remove(debugSprite);
        scene.game.hudScene().removeBatch(sprites);

    };



    this.getSprites = function() {
        return sprites;
    };



    init();

    return this;

}

module.exports = TextLayout;