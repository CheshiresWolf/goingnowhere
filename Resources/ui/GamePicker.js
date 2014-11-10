/*

This module is used to handle game selection.
To init, create an instance of GamePicker class. Once created,
it keeps alive until user quit to game mode selection.
ApplicationWindow uses this and game.navigation.{get|set}InGame
to skip loading different page right after purchase.
If an instance already exists, it will be returned instead of new one.

This module listens for next events:
"gameComplete" - will mark current game as solved. Currently in order to
keep track of what game is current it is neccessary to 
launch game from the menu or via events "nextGame" / "previousGame".
"nextGame"     - will start next game in set, also works across sets.
"previousGame" - will start previous game in set.

This module also has to set up lock over a button in games that are followed by locked games.



{Boolean} OPENED
{Boolean} EXISTS
{GamePicker} existing



Persistent storage:
AppPurchased // external
purchasedSets + data
*/

var _              = require("/lib/Underscore");
var Config         = require("config");
var Utils          = require("ui/JScene/Utils");
var InAppPurchases = require("lib/InAppPurchases");
var game2d         = require("com.ti.game2d");
// var NetworkLoader  = require("modules/CachingNetworkLoader");

var scaleX = Config.UI_SCALE_X;
var scaleY = Config.UI_SCALE_Y;

var WIDTH  = 1024;
var HEIGHT =  768;

var android = !!Ti.Android;






// ===== Tools =====

    var log = Utils.createLogger("GamePicker");



    // Will be set ASAP
    var playSound = function() {};
    


    /**
     * Shortcut for Ti.UI.create* with some enhancements, such as auto scale
     */
    function createUI(data, options) {

        var data = _.clone(data);
        options = options || {};

        // image -> prefix + image + .png
        // -----------------------

        if (!options.keepURLs) {
            [ "image", "backgroundImage", "defaultImage" ].forEach(function(name) {
                if (name in data) data[name] = toRelativePath(data[name]);
            });
        }



        // type -> Ti.UI.create[type] // default = "view"
        // ----------------------------------------------

        var constuctor;
        var type = options.type || "view";
        constructor = Ti.UI[ "create" + type[0].toUpperCase() + type.substr(1) ];



        // width, height, left, top, center.xy, ... *= scale
        // -------------------------------------------------

        function scale(names, value) {
            names.forEach(function(e) {
                var obj, name;
                var prop = e.split(".");
                if (prop.length > 1) {
                    obj = data[prop[0]];
                    if (!_.isObject(obj)) return;
                    name = prop[1];
                } else {
                    obj = data;
                    name = e;
                }
                if (obj && _.isNumber(obj[name])) {
                    obj[name] *= value;
                }
            });
        }

        scale([
            "left", "width", "right",
            "center.x", "rect.x",
            "rect.width", "size.width"
        ], scaleX);

        scale([
            "top", "height", "bottom",
            "center.y", "rect.y",
            "rect.height", "size.height"
        ], scaleY);

        scale([ "borderWidth", "borderRadius" ], Math.min(scaleX, scaleY));



        // z -> zINdex; + baseZ
        // --------------------

        if ("z" in data) {
            data.zIndex = data.z;
            delete data.z;
        }
        data.zIndex = (data.zIndex || 0) + baseZ;



        // size: "fullScreen" -> Config.UI_WIDTH / HEIGHT
        // ----------------------------------------------

        if (data.size === "fullScreen") {
            data.width  = Config.UI_WIDTH;
            data.height = Config.UI_HEIGHT;
            delete data.size;
        }



        return constructor(data);

    }



    function toRelativePath(path) {
        return uiResFolder + path + ".png";
    }



    /**
     * This function allows to work around issue where simply
     * changing opacity on android doesn't prevent from clicks
     */
    function fade(element, alpha, time) {

        if (!element) return;
        if (time === undefined) time = 250;

        if (alpha) {
            element.show();
            element.animate({ opacity: alpha, duration: time });
        } else {
            element.animate(
                { opacity: alpha, duration: time },
                function() { element.hide(); }
            );
        }

    }

// =================



// ===== Globals =====

    var defaultSetsFolder = "/images/games/";
    var uiResFolder       = "/images/gamePicker/";
    var baseZ = 55;

    
    var DIFFICULTIES = [ "easy", "medium", "hard" ];


    // Allows to open GamePicker on the place it was closed
    var lastState = {
        difficulty: 0,
        setIdByMode: {}
    };



    // ===== Solved games =====
    
        /**
         * Object to keep track of what games was solved.
         * For game types without difficulty, used one is "easy".
         * Structure overview:
         * solvedGames
         *     <setId>
         *         <pageNumber>     // starting from 0
         *             <difficulty> // "easy" | "medium" | "hard"
         */
        var solvedGames = {};


        function fetchSolvedGames() {
            Ti.App.Properties.getObject("GamePicker_SolvedGames", {});
        }


        function saveSolvedGames() {
            Ti.App.Properties.setObject("GamePicker_SolvedGames", solvedGames);
        }


        // `number` starts from 0, so does `difficulty`
        function isSolved(setId, number, difficulty) {
            if (difficulty === undefined) difficulty = 0;
            var result = false;
            try {
                result = Boolean(
                    solvedGames[setId][number][ DIFFICULTIES[difficulty] ]
                );
            } catch(e) {}
            return result;
        }


        // `number` starts from 0, so does `difficulty`
        function setSolved(setId, number, difficulty) {
            if (difficulty === undefined) difficulty = 0;
            if (!(setId in solvedGames)) solvedGames[setId] = {};
            var s = solvedGames[setId];
            if (!(number in s)) s[number] = {};
            s[number][ DIFFICULTIES[difficulty] ] = true;
            saveSolvedGames();
        }

    // ========================



    /**
     * Ugly workaround to put a lock over button "next game"
     * in game that is followed by locked one.
     */
    function injectLockToNextGameButton() {

        var window = GamePicker.existing._parent;

        var scene = window.topScene();

        var button;

        try {
            button = scene.spriteByName(scene.data.gameData.buttons.next);
        } catch(e) {}

        if (!button) return;

        var game = picker._game;

        button.touchEnabled = false;
        var buttonNextLock = game2d.createSprite({
            width: 170 * game.scaleX,
            height: 90 * game.scaleY,
            image: uiResFolder + "injectLockOverlay.png",
            loadedData: {
                name: "lockOverButtonNext",
                touchable: true
            }
        });
        scene.add(buttonNextLock);
        button.addChildNode(buttonNextLock);

        var oldCallback = scene.onClick_lockOverButtonNext;
        scene.onClick_lockOverButtonNext = function() {
            var gamePicker = GamePicker.existing;
            purchaseTale(gamePicker._parent, function() {
                gamePicker._reloadUI();
                oldCallback && oldCallback();
            });

        };

    }



    function purchaseTale(window, callback) {

        playSound("menu");
        window.confirmParent(function() {
            Ti.App.fireEvent("trackBuyDialog");
            InAppPurchases.requestFullVersion(function(prod) {
                if (!prod && (Config.TEST_VERSION || Titanium.Platform.model === "Simulator")) {
                    if (typeof callback === "function") callback();
                } else {
                    SK.purchaseFullVersion(callback);
                }
            });
        });

    }
    
// ===================



GamePicker.OPENED = false;
GamePicker.EXISTS = false;

GamePicker.existing = null;



GamePicker.currentGame = {
    type:        undefined,
    setId:       undefined,
    numberInSet: undefined,
    difficulty:  undefined
};



function GamePicker(game, window, gameType, hasMultipleDifficulties) {

    if (GamePicker.EXISTS) {
        GamePicker.existing._reloadUI();
        return GamePicker.existing;
    }


    // ===== Workarounds =====
        
        Ti.App.fireEvent("switchToGameMusic", { game: true });
        playSound = window.topScene().playSound;

    // =======================



    GamePicker.EXISTS = true;
    GamePicker.existing = this;



    var self = this;

    self._game                    = game;
    self._parent                  = window;
    self._gameType                = gameType;
    self._hasMultipleDifficulties = hasMultipleDifficulties;



    /**
     * An object to keep all ui elements
     * that references needs to be kept.
     */
    self._ui = {
        parent: null,
        animatedWrapper: null, // for animating bunch of elements
        buttons: {
            nextSet: null,
            prevSet: null
        },
        scrollableView: null
    };



    self._currentPage       = 0;
    self._currentDifficulty = 0;



    self._difficultyButtons = [];
    self._sets = {
        all:       [],
        visible:   [],
        free:      [],
        purchased: [],
        available: []
    };

    init();



    // Functions
    // ---------



    function init() {

        fetchSolvedGames();
        loadSets();
        initUI();

        loadPreviousState();

        updateUI();
        animate();

    }



    function loadPreviousState() {

        if (hasMultipleDifficulties) selectDifficulty(lastState.difficulty);

        var setId = lastState.setIdByMode[self._gameType];
        if (setId !== undefined) scrollToSet(setId);

    }



    function initUI() {

        var ui = self._ui;

        // UI structure:
        // parent
        //     buttonBack
        //     animatedWrapper
        //         {Button}[3] || title
        //         scrollableView
        //             {GameSet}[]
        //         buttonNext
        //         buttonPrev

        ui.parent = createUI({
            backgroundImage: "background",
            size: "fullScreen"
        });


        var buttonBack = createUI({
            backgroundImage: "buttonBack",
            left: 25,
            top:  25,
            width:  115,
            height: 58,
            z: 10
        }, { type: "button" });
        buttonBack.addEventListener("click", function() {
            self.destroy();
            game.navigation.showGamesMenu();
        });
        ui.parent.add(buttonBack);
        buttonBack = null;



        ui.animatedWrapper = createUI({
            top: -HEIGHT,
            size: "fullScreen",
            backgroundImage: hasMultipleDifficulties ? "containerWhite" : "containerBlack"
        });
        ui.parent.add(ui.animatedWrapper);



        if (hasMultipleDifficulties) {

            // ===== Difficulty buttons =====

                var difficultyButtonsWrapper = createUI({
                    layout: "horizontal",
                    horizontalWrap: false,
                    left: 341.5,
                    top: 10,
                    width: 341,
                    height: 113
                });
                ui.animatedWrapper.add(difficultyButtonsWrapper);



                [ "Easy", "Medium", "Hard" ].forEach(function(img, i) {

                    var button = new Button("shelf/difficultyButtons/button" + img);
                    button.onClick     = function() { selectDifficulty(i); };
                    button.onClickLock = function() { purchaseTale(self._parent, self._reloadUI); };

                    self._difficultyButtons[i] = button;

                    difficultyButtonsWrapper.add(button.generateUI());

                });

                difficultyButtonsWrapper = null;

            // ==============================

        } else {

            // Title

            ui.animatedWrapper.add(createUI({
                image: "shelf/titles/" + gameType + "_" + Config.getCurrentLanguage(),
                center: { x: WIDTH / 2 },
                bottom: 640 + 5,
                width: 463,
                z: 10
            }, { type: "imageView" }));

        }



        // ===== Sets =====

            // Its position & size is better to be an integer for currentPage to work properly
            ui.scrollableView = Ti.UI.createScrollableView({
                views: self._sets.visible.map(function(e) { return e.generateUI() }),
                left: Math.floor( 82 * Config.UI_SCALE_X),
                top:  Math.floor(140 * Config.UI_SCALE_Y),
                width:  Math.ceil(860 * Config.UI_SCALE_X),
                height: Math.ceil(628 * Config.UI_SCALE_Y),
                cacheSize: 1,
                z: 5,
                disableBounce:  android ? undefined : true,
                overScrollMode: android ? Ti.UI.Android.OVER_SCROLL_NEVER : undefined
            });

            ui.scrollableView.addEventListener("scrollend", function(e) {
                self._currentPage = e.currentPage;
                lastState.setIdByMode[self._gameType] = self._sets.visible[e.currentPage].id;
                updateUI();
            });

            ui.animatedWrapper.add(ui.scrollableView);

            uiSetWrappers = null;

        // ================



        // ===== Buttons Next set / Prev set =====

            var btnTop = 391;
            var btnWidth  = 43;
            var btnHeight = 109;

            // ===== Previous =====
            
                var btn = createUI({
                    backgroundImage: "prevSet",
                    left:  33,
                    top:  btnTop,
                    width:  btnWidth,
                    height: btnHeight,
                    z: 20
                });

                btn.hide();

                btn.addEventListener("click", function() {
                    scrollToSet(self._currentPage - 1);
                });

                ui.animatedWrapper.add(btn);

                ui.buttons.prevSet = btn;

            // ====================

            // ===== Next =====
            
                btn = createUI({
                    backgroundImage: "nextSet",
                    left: 948,
                    top:  btnTop,
                    width:  btnWidth,
                    height: btnHeight,
                    z: 20
                });

                btn.hide();

                btn.addEventListener("click", function() {
                    scrollToSet(self._currentPage + 1);
                });

                ui.animatedWrapper.add(btn);

                ui.buttons.nextSet = btn;

            // ================

            btn = null;

        // =======================================

        self._parent.add(ui.parent);

    }



    /**
     * `value` is rather string-id or number-page
     * {String} value Id of a set.
     * {Number} value Number of page, out of visible count.
     */
    function scrollToSet(value) {
        if (typeof value === "string") {
            var page = self._pageById(value);
            if (self._currentPage !== page) scrollToSet(page);
        } else {
            var number = value;
            var newPage = Math.max(0, Math.min(self._sets.visible.length - 1, number));
            if (newPage !== self._currentPage) self._ui.scrollableView.scrollToView(newPage);
        }
    }



    function selectDifficulty(difficulty) {

        lastState.difficulty = difficulty;

        self._currentDifficulty = difficulty;

        var btns = self._difficultyButtons;
        for (var i = 0; i < btns.length; i++) {
            btns[i].scale( i === difficulty ? 1.2 : 1);
        }

        updateThumbnails();

    }



    // ===== Sets =====

        // Sets that are coming with the tale itself
        function getFreeSets() {

            var fs = Ti.Filesystem;

            var path = fs.resourcesDirectory + defaultSetsFolder + gameType;

            var folder = fs.getFile(path);

            if (!folder.exists()) return [];

            return folder.getDirectoryListing().filter(function(name) {
                var fullpath = path + "/" + name;
                return fs.getFile(fullpath).isDirectory() &&
                    fs.getFile(fullpath + "/gameSet.json").exists();
            }).map(function(name) {

                var gameSet = new GameSet(
                    Utils.readJSON(path + "/" + name + "/gameSet.json"),
                    GameSet.TYPE_FREE
                );

                gameSet.onPickGame = function(index, set) {
                    GamePicker.loadGame(self._gameType, self._currentDifficulty, set, index);
                };

                gameSet.onPickLock = function(index, set) {
                    purchaseTale(self._parent, function() {
                        self._reloadUI();
                        GamePicker.loadGame(self._gameType, self._currentDifficulty, set, index);
                    });
                };

                return gameSet;

            });

        }



        // Sets that user has purchased, excluding ones that are coming with the tale
        function getPurchasedSets() { return []; }



        // Sets available to buy, excluding already purchased
        function getAvailableSets() { return []; }



        function loadSets() {

            var s = self._sets;

            s.free      = getFreeSets();
            s.purchased = getPurchasedSets();
            s.available = getAvailableSets();
            s.all       = [].concat( s.free, s.purchased, s.available );
            s.visible   = InAppPurchases.isFullVersion() ? s.all : s.free;

        }


        // Todo: everything gonna screw up once purchased & available sets appear
        function updateSets() {

            var s = self._sets;

            var currentSetId = s.visible[self._currentPage].id;

            // s.free      = getFreeSets();
            s.purchased = getPurchasedSets();
            s.available = getAvailableSets();
            s.all       = [].concat( s.free, s.purchased, s.available );

            var newSets = InAppPurchases.isFullVersion() ? s.all : s.free;

            // Create UI for sets that were not previously visible

            var uiChanged = false;

            newSets.forEach(function(newSet, i) {

                var setAlreadyExists = s.visible.some(function(vs) {
                    return vs.id === newSet.id;
                });

                if (!setAlreadyExists) {

                    uiChanged = true;

                    var ui = newSet.generateUI();
                    views = views.slice(0, i).concat(ui, views.slice(i));

                }

            });

            s.visible = newSets;

            if (uiChanged) {
                self._ui.scrollableView.views = views;
                scrollToSet(currentSetId);
            }

        }

    // ================
    


    // ===== Update UI =====
    
        function updateUI() {
            updateScrollButtonsVisibility();
            updateDifficultyButtons();
            updateThumbnails();
        }



        function updateScrollButtonsVisibility() {

            var visibleSets = self._sets.visible;
            var pageNumber  = self._currentPage;

            if (visibleSets.length > 1) {

                var btns = self._ui.buttons;

                fade(btns.prevSet, pageNumber <= 0 ? 0 : 1);
                fade(btns.nextSet, pageNumber >= visibleSets.length - 1 ? 0 : 1);

            } else {

                fade(self._ui.buttons.prevSet, 0);
                fade(self._ui.buttons.nextSet, 0);

            }

        }



        function updateDifficultyButtons() {

            var buttons = self._difficultyButtons;
            if (buttons.length === 0) return;

            buttons[0].setLocked(false);

            var isDemo = (
                !InAppPurchases.isFullVersion() &&
                self._sets.visible[self._currentPage].type === GameSet.TYPE_FREE
            );

            // For demo force difficulty "easy", just in case
            if (isDemo) selectDifficulty(0);

            buttons[1].setLocked(isDemo);
            buttons[2].setLocked(isDemo);

        }



        function updateThumbnails() {
            self._sets.visible.forEach(function(set) {
                set.updateThumbnails(self._currentDifficulty);
            });
        }

    // =====================



    // Fall-in animation
    function animate() {
        self._ui.animatedWrapper.animate({ top: 0, duration: 400 });
    }



    this._reloadUI = function() {
        log("reload ui");
        updateSets();
        log("update sets succeed");
        updateUI();
        log("reload ui succeed");
    };

}



/**
 * Returns number of page (out of visible sets) with set with specified id.
 * If fails to find one, returns -1.
 */
GamePicker.prototype._pageById = function(id) {
    var result = -1;
    var visibleSets = this._sets.visible;
    for (var i = 0; i < visibleSets.length; i++) {
        if (visibleSets[i].id === id) {
            result = i;
            break;
        }
    }
    return result;
}



GamePicker.prototype.destroy = function() {

    this.hide();

    var ui = this._ui;

    this._parent.remove(ui.parent);

    this._game                    = null;
    this._parent                  = null;
    this._gameType                = undefined;
    this._hasMultipleDifficulties = undefined;

    ui.parent          = null;
    ui.animatedWrapper = null;
    ui.buttons.nextSet = null;
    ui.buttons.prevSet = null;
    ui.scrollableView  = null;

    this._difficultyButtons = [];

    var sets = this._sets;
    sets.all       = [];
    sets.free      = [];
    sets.purchased = [];
    sets.available = [];
    sets.visible   = [];

    GamePicker.EXISTS = false;
    GamePicker.existing = null;

};



GamePicker.prototype.show = function() {

    this._ui.parent.show();

    GamePicker.OPENED = true;

};



GamePicker.prototype.hide = function() {

    this._ui.parent.hide();

    GamePicker.OPENED = false;

};



GamePicker.hide = function() { GamePicker.existing.hide(); };
GamePicker.show = function() { GamePicker.existing.show(); };



GamePicker.markCurrentGameSolved = function() {
    var cg = GamePicker.currentGame;
    setSolved(cg.setId, cg.numberInSet, cg.difficulty);
    setById(cg.setId).thumbnails[cg.numberInSet].setSolved(true);
};



function setById(id) {

    var s = GamePicker.existing._sets.all;
    for (var i = 0; i < s.length; i++) {
        if (s[i].id === id) return s[i];
    }

}



GamePicker.loadGame = function(type, difficulty, set, index) {

    var gamePicker = GamePicker.existing;

    switch(set.type) {

        case GameSet.TYPE_FREE:

            var url = set.baseFolder +
                "/" + (index + 1) +
                "/" + 
                DIFFICULTIES[difficulty] + "/";

            log("loading game " + url);

            gamePicker.hide();

            Ti.App.fireEvent("goToGame", {
                url: url,
                fullPath: null
            });

            gamePicker._game.navigation.setInGame(true);

            GamePicker.currentGame.type        = type;
            GamePicker.currentGame.setId       = set.id;
            GamePicker.currentGame.numberInSet = index;
            GamePicker.currentGame.difficulty  = difficulty;

            break;

        default:

            

    }

    // If next game locked, inject lock

    var nextGame = getNeighbourGame(1);
    if (
        nextGame &&
        nextGame.set.thumbnails[ nextGame.numberInSet ].locked
    ) {
        injectLockToNextGameButton();
    }

};



/**
 * {Number} direction Is rather 1 (for next game) or -1 (for previous).
 * @return {Object}  result
 * @return {String}  result.type
 * @return {Number}  result.difficulty
 * @return {GameSet} result.set
 * @return {Number}  result.numberInSet
 */
function getNeighbourGame(direction) {

    var gamePicker = GamePicker.existing;

    var cg = GamePicker.currentGame;

    var type       = cg.type;
    var difficulty = cg.difficulty;
    var index      = cg.numberInSet;
    var set        = setById(cg.setId);



    var nextGame = null;
    var nextSet  = null;

    if (
        direction ===  1 && index < set.thumbnails.length - 1 ||
        direction === -1 && index > 0
    ) {

        nextSet = set;

        nextGame = {
            type:        type,
            set:         nextSet,
            numberInSet: index + direction,
            difficulty:  difficulty
        };

    } else {

        var page = gamePicker._pageById(set.id);
        var vs = gamePicker._sets.visible;

        if (page >= 0 && (
            direction ===  1 && page < vs.length - 1 ||
            direction === -1 && page > 0
        )) {
            nextSet = vs[page + direction];
            nextGame = {
                type:        type,
                set:         nextSet,
                numberInSet: direction === 1 ? 0 : nextSet.thumbnails.length - 1,
                difficulty:  difficulty
            };
        }

    }

    return nextGame;

}



GamePicker.loadNextGame = function() {

    var nextGame = getNeighbourGame(1);

    nextGame && GamePicker.loadGame(
        nextGame.type,
        nextGame.difficulty,
        nextGame.set,
        nextGame.numberInSet
    );

};



GamePicker.loadPreviousGame = function() {

    var nextGame = getNeighbourGame(-1);

    nextGame && GamePicker.loadGame(
        nextGame.type,
        nextGame.difficulty,
        nextGame.set,
        nextGame.numberInSet
    );

};






// ===== GameSet =====

    GameSet.TYPE_FREE = 1;



    function GameSet(json, type) {

        var self = this;

        this.sourceObject = json;

        this.id = json.gameSetId;
        this.baseFolder = json.dataUrl;

        this.thumbnails = json.thumbs.map(function(img, i) {

            var t = new Thumbnail(img, self, i);
            t.onClick     = function() { self._clickGame(i); };
            t.onClickLock = function() { self._clickLock(i); };

            return t;

        });

        this.demoGames = json.open;

        this.type = type;

        this.onPickGame = null;
        this.onPickLock = null;

    }



    GameSet.prototype._clickGame = function(index) {
        if (typeof this.onPickGame === "function") this.onPickGame(index, this);
    }



    GameSet.prototype._clickLock = function(index) {
        if (typeof this.onPickLock === "function") this.onPickLock(index, this);   
    }



    GameSet.prototype.generateUI = function() {

        // ui structure:
        // wrapper
        //    container
        //        {Thumbnail}[]

        var wrapper = Ti.UI.createView({
            width:  Math.floor(860 * Config.UI_SCALE_X),
            height: Math.floor(628 * Config.UI_SCALE_Y)
        });

        var container = createUI({
            left: 15,
            top:  97,
            width:  840,
            height: 425,
            layout: "horizontal"
        });

        for (var i = 0; i < this.thumbnails.length; i++) {

            var thumb = this.thumbnails[i].generateUI({ useBackground: false });

            if (i % 3 === 2) thumb.right  = 0; // no right padding for thumbs at right
            if (i > 2)       thumb.bottom = 0; // no bottom padding for thumbs at bottom

            container.add(thumb);

        }

        wrapper.add(container);

        return wrapper;

    };



    GameSet.prototype.updateThumbnails = function(difficulty) {

        var self = this;

        var thumbs = this.thumbnails;

        function free(n) {

            if (n === undefined) n = thumbs.length;

            for (var i = 0; i < n;             i++) thumbs[i].setLocked(false);
            for (var i = n; i < thumbs.length; i++) thumbs[i].setLocked(true);

        }

        switch(this.type) {

            case GameSet.TYPE_FREE:

                free( InAppPurchases.isFullVersion() ? undefined : this.demoGames );

                break;

        }

        thumbs.forEach(function(t, i) {
            t.setSolved( isSolved(self.id, i, difficulty) );
        });

    };

// ===================



// ===== Thumbnail =====

    function Thumbnail(image, set, numberInSet) {

        // private
        this._image = image;
        this._ui = {
            parent:     null,
            thumbnail:  null,
            solved:     null,
            locked:     null,
            frame:      null
        };


        this.onClick     = null;
        this.onClickLock = null;

        // read-only
        this.locked      = true;
        this.set         = set;
        this.numberInSet = numberInSet;

    }



    /**
     * {Object} [options]
     * {Boolean} [options.useBackground] 
     */
    Thumbnail.prototype.generateUI = function(options) {

        // ui structure:
        // parent
        //     thumbnail
        //     solved
        //     locked
        //     frame

        if (!options) options = {};

        var self = this;
        var ui = this._ui;

        ui.parent = createUI({
            width:  267,
            height: 200,
            right:  15,
            bottom: 15,
            z: 30,
            backgroundImage: options.useBackground ? "thumbnail/background" : undefined
        });

        ui.parent.addEventListener("touchstart",  function() { self._highlight(true); });
        ui.parent.addEventListener("touchcancel", function() { self._highlight(false); });
        ui.parent.addEventListener("touchend",    function() { self._highlight(false); });

        ui.thumbnail = createUI({
            image: this._image,
            defaultImage: uiResFolder + "thumbnail/default.png",
            left: 5,
            top:  5,
            width:  257,
            height:  190
        }, { type: "imageView", keepURLs: true });
        ui.thumbnail.addEventListener("click", function() { self.click(); });
        ui.parent.add(ui.thumbnail);

        ui.solved = createUI({
            image: "thumbnail/solved",
            width:  48,
            height: 48,
            right:  15,
            bottom: 15
        }, { type: "imageView" });
        ui.solved.hide();
        ui.parent.add(ui.solved);

        ui.locked = createUI({
            image: "thumbnail/lock",
            left: 5,
            top:  5,
            width: 257,
            height: 190
            // bubbleParent: false
        }, { type: "imageView" });
        ui.locked.hide();
        ui.locked.addEventListener("click", function() { self.clickLock(); });
        ui.parent.add(ui.locked);

        ui.frame = createUI({
            image: "thumbnail/frame",
            width:  267,
            height: 200,
            touchEnabled: false
        }, { type: "imageView" });
        ui.parent.add(ui.frame);

        return ui.parent;

    };

    Thumbnail.prototype._highlight = function(flag) {
        if (!this._ui.frame) return;
        this._ui.frame.image = toRelativePath(
            "thumbnail/" + (flag ? "frameSelected" : "frame")
        );
    };

    Thumbnail.prototype.setLocked = function(flag) {
        this.locked = Boolean(flag);
        this._ui.locked[ flag ? "show" : "hide" ]();
    };

    Thumbnail.prototype.setSolved = function(flag) {
        this._ui.solved[ flag ? "show" : "hide" ]();
    };

    Thumbnail.prototype.click = function() {
        if (typeof this.onClick === "function") this.onClick(this);
    };

    Thumbnail.prototype.clickLock = function() {
        if (typeof this.onClickLock === "function") this.onClickLock(this);
    };

// =====================



// ===== Difficulty button =====

    function Button(image) {

        this._image = image;
        this._ui = {
            button:  null,
            overlay: null,
            lock:    null
        };

        this.onClick     = null;
        this.onClickLock = null;

    }



    Button.prototype.generateUI = function() {

        // ui structure:
        // button
        //     lockOverlay
        //         lock

        var self = this;
        var ui = this._ui;

        ui.button = createUI({
            width:  107,
            height: 93,
            backgroundImage: this._image,
            top: 20,
            bottom: 20,
            left: 5,
            right: 5
        });
        ui.button.addEventListener("click", function() { self.click(); });


        ui.lockOverlay = createUI({
            bubbleParent: false,
            width:  Ti.UI.FILL,
            height: Ti.UI.FILL
        });
        ui.lockOverlay.hide();
        ui.button.add(ui.lockOverlay);


        ui.lock = createUI({
            backgroundImage: "shelf/difficultyButtons/lock",
            width: 39,
            height: 49,
            left: 35,
            top: 17
        });
        ui.lockOverlay.addEventListener("click", function() { self.clickLock(); });
        ui.lockOverlay.add(ui.lock);


        return ui.button;

    };



    Button.prototype.click = function() {
        if (typeof this.onClick === "function") this.onClick();
    };

    Button.prototype.clickLock = function() {
        if (typeof this.onClickLock === "function") this.onClickLock();
    };

    Button.prototype.setLocked = function(flag) {
        this._ui.lockOverlay[flag ? "show" : "hide"]();
    };

    Button.prototype.scale = function(value) {
        this._ui.button.animate({
            transform: Ti.UI.create2DMatrix().scale(value),
            duration: 300
        });
    };

// =============================



Ti.App.addEventListener( "gameComplete", GamePicker.markCurrentGameSolved );
Ti.App.addEventListener( "nextGame",     GamePicker.loadNextGame          );
Ti.App.addEventListener( "previousGame", GamePicker.loadPreviousGame      );



module.exports = GamePicker;