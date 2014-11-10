var _              = require("lib/Underscore");
var Config         = require("config");
//var NetworkLoader  = require("modules/CachingNetworkLoader");
//var SK             = require("lib/InAppPurchases");
//var InAppPurchases = require("lib/InAppPurchases");
var game2d         = require("com.ti.game2d");



function getPath(type, setId, levelId, level) {
    var result = "images/games";
    if (type    !== undefined) result += "/" + type;
    if (setId   !== undefined) result += "/" + setId;
    if (levelId !== undefined) result += "/" + levelId;
    if (level   !== undefined) result += "/" + level;
    return result;
}



GameSet.prototype.OPENED = false;
GameSet.prototype.EXISTS = false;
GameSet.prototype.show = function() {
	singleGameSet.show();
};

var lastSettings = null;
var singleGameSet = null;



function GameSet(game, win, gameType, hasMultipleDifficulties, createHidden, skipAnimation, forceFullApp) {

    var self = this;



	if (singleGameSet) {
		singleGameSet.destroy();
	}

	if (gameType === undefined) {
		lastSettings;
		if (lastSettings) {
			gameType                = lastSettings.gameType;
			hasMultipleDifficulties = lastSettings.hasMultipleDifficulties;
			createHidden            = lastSettings.createHidden;
			skipAnimation           = lastSettings.skipAnimation;
			forceFullApp            = lastSettings.forceFullApp;
		}
	} else {
		lastSettings = {
			gameType:                gameType,
			hasMultipleDifficulties: hasMultipleDifficulties,
			createHidden:            createHidden,
			skipAnimation:           skipAnimation,
			forceFullApp:            forceFullApp
		};
	}

    var rx = game.isRetina() ? 0.5 : 1;
    var sx = game.scaleX * rx;
    var sy = game.scaleY * rx;
    var margin = 22;
    var topMargin = 20; //* sy; //95
    self.stepX = (Ti.Platform.osname === "iphone") ? 96 : 96 * sx;

    var levels = ["easy", "medium", "hard"];
    var currentLevel = levels[0];
    var currentPage = 0;
    var currentCard = null;
    var buttons = {};

    self.BUTTONS = "gameBack,levelButton1,levelButton2,levelButton3".split(/,/);
    var flipSound = Ti.Media.createSound({
        url: "/sounds/page_flip.mp3"
    });

    var scrollableView = null;
    var blackBack = null;
    var newBack = null; //use for fall content animation
    var sets = []; //storage all sets loade from cloude/cache + default
    var cards = {};
    var countDefaultPages = 0;
    var played;
    var listButtonsLock = {};
    var CLASS = null;
    var fullApp; //=InAppPurchases.isFullVersion();

    var addEvent = false;

    function init(callback) {

    	GameSet.prototype.EXISTS = true;

    	Ti.App.fireEvent("switchToGameMusic", { game: true });

        CLASS = gameType;
        fullApp = true;//forceFullApp || InAppPurchases.isFullVersion();
        //currentLevel = (CLASS!="puzzle") ?  "NoneLevel": levels[0];
        // if (CLASS!="puzzle"){ currentLevel="NoneLevel"; self.BUTTONS="game_back".split(/,/);}
        if (!hasMultipleDifficulties) {
            currentLevel = levels[0];
            self.BUTTONS = "gameBack".split(/,/);
        }

        blackBack = Ti.UI.createView({
            backgroundImage: "/images/navigation/gamesMenu/menuBackground.png", //test.png", // "/images/clearb.png",	
            opacity: 1,
            width: Ti.UI.FILL,
            height: Ti.UI.FILL,
            zIndex: 55,
            bubbleParent: true,
        });
        if (createHidden) blackBack.hide();
        win.add(blackBack);

        ////////////////SCROLLABLE  VIEW	
        scrollableView = Ti.UI.createScrollableView({
            width: Ti.Platform.osname === "iphone" ? 500 : getDeviceBasedWidth(1024),
            // top: getDeviceBasedHeight(90),
            //views:[view1],
            cacheSize: 1,
            // contentHeight : "auto",
            // contentWidth : Ti.UI.FILL,
            showPagingControl: true,
            //clipViews: false,
            pagingControlAlpha: 0,
            zIndex: 60,
            bubbleParent: true,
            // borderColor: 'white'
        });
        //win	

        newBack = Ti.UI.createView({
            //backgroundImage: "/images/navigation/gamesMenu/menuBackground.png",  //test.png", // "/images/clearb.png",	
            top: getDeviceBasedHeight(-500),
            opacity: 1,
            width: getDeviceBasedWidth(1024), //Ti.UI.FILL,
            height: getDeviceBasedHeight(768), //Ti.UI.FILL,
            zIndex: 55,
            bubbleParent: true,
        });
        if (createHidden) newBack.hide();
        win.add(newBack);
        newBack.add(scrollableView);

        //game_back.addEventListener("click", self.click);
        //blackBack.add(game_back);

        if (!hasMultipleDifficulties) {

            var lng = Config.getCurrentLanguage();

            var rect = (gameType === "buildCharacter")
                ? { left: 280, top: 63, width: 463, height: 49 }
                : {
                    "uk": { left: 329, top: 55, width: 388, height: 50 },
                    "en": { left: 329, top: 63, width: 366, height: 50 },
                    "ru": { left: 329, top: 63, width: 366, height: 50 }
                }[ lng ];

            var gameTypeTitle = Ti.UI.createImageView({
                left: getDeviceBasedWidth(rect.left),
                top:  getDeviceBasedHeight(rect.top),
                width:  getDeviceBasedWidth(rect.width),
                height: getDeviceBasedHeight(rect.height),
                backgroundImage: "/images/navigation/gamesMenu/" + gameType + "_" + lng + ".png",
                zIndex: 65
            });
            /*gameTypeTitle.addEventListener("click", function(e){ 
		    	fullApp = true;
				self.reselectLocked(sets[currentPage].gameSetId);
			});*/
            newBack.add(gameTypeTitle);
        }

        //FALL ANIMATION for CONTENT_MENU
        animateContentMenu(skipAnimation);


        var left = 260;
        counterLevelsArr = 0;
        _.each(self.BUTTONS, function(b) {
            w = 105;
            h = 97;
            l = left;
            tm = topMargin;
            touch = false;
            holder = newBack;
            buttons[b] = Ti.UI.createButton({ //createView({
                backgroundImage: "/images/navigation/gamesMenu/" + b + ".png",
                code: b,
                opacity: 1,
                zIndex: 65,
                bubbleParent: true
            });

            if (b == "gameBack") {
                w = 115;
                h = 58;
                l = 25;
                tm = 25;
                touch = true;
                holder = blackBack;
            } else {
                var topLock = Ti.UI.createView({
                    left: getDeviceBasedWidth(l),
                    top:  getDeviceBasedHeight(tm),
                    width:  getDeviceBasedWidth(w),
                    height: getDeviceBasedHeight(h),
                    touchEnabled: true,
                    zIndex: 150,
                    level: counterLevelsArr,
                    backgroundImage: "/images/navigation/gamesMenu/lockButton2.png"
                });
                counterLevelsArr++;
                //buttons[b].add(topLock);
                listButtonsLock[b] = topLock;
                holder.add(topLock);
                topLock.addEventListener("click", function (e) {
                    win.topScene().playSound("menu");
                    self.BUY(null, e.source.level);
                    // Ti.API.info('CLICK UPPER LOCK');
                });
            }

            buttons[b].left = getDeviceBasedWidth(l);
            buttons[b].top  = getDeviceBasedHeight(tm);
            buttons[b].width  = getDeviceBasedWidth(w);
            buttons[b].height = getDeviceBasedHeight(h);
            buttons[b].touchEnabled = touch;

            left += self.stepX;
            buttons[b].addEventListener("click", self.click);
            newBack.add(buttons[b]);

        });
        buttonAnimate("levelButton1");

        //fullApp=InAppPurchases.isFullVersion();				
        //fullApp=true;

        //default 2 buttons (1 level and 2 level both lock)
        if (hasMultipleDifficulties) {
            if (fullApp) {
                unlockButtons(true, ["levelButton1", "levelButton2", "levelButton3"]);
            } else {
                //all stay 2 buttons locked, and we cannot see not default sets
            }
        } else { // buttons dont create
        }

        scrollableView.addEventListener("scrollend", function(e) {

        	var btns = ["levelButton1", "levelButton2", "levelButton3"];

        	if (e.currentPage !== currentPage) {

                currentPage = e.currentPage;
                if (hasMultipleDifficulties && fullApp) {
                    if (currentPage <= countDefaultPages - 1) {
                        unlockButtons(true, btns);
                    } else {
                        if (self.checkInBuyed(sets[currentPage].gameSetId)) {
                            unlockButtons(true, btns);
                        } else {
                            unlockButtons(false, btns);
                        }
                        if (sets[currentPage].open != 0) {
                            unlockButtons(true, ["levelButton1"]); //all stay 2 buttons locked, and we cannot see not default sets
                        }
                    }
                } else {
                    if (hasMultipleDifficulties && sets[currentPage].open != 0) {
                        unlockButtons(true, ["levelButton1"]); //all stay 2 buttons locked, and we cannot see not default sets
                    }
                    //all stay 2 buttons locked, and we cannot see not default sets
                }
                fold = scrollableView.views[currentPage].children[0];
                self.fill(fold, sets[currentPage]);

            }
        });

        ////////////////////////////
        //fullApp=InAppPurchases.isFullVersion();				



        //////Load default.json
        //	var data = self.getJsonData(Ti.Filesystem.resourcesDirectory + 'images/games/gameSets/'+CLASS+'/set_0/default.json');
        //	sets.push(data);
        ////////////////////////
        var list = Ti.App.Properties.getObject('buyedSets', {});
        dataDir = Ti.Filesystem.resourcesDirectory + getPath(CLASS);
        //dataDir=Ti.Filesystem.resourcesDirectory + 'images/games/gameSets/'+CLASS+'/';
        dir = Ti.Filesystem.getFile(dataDir);
        if (dir.exists()) {
            folderList = dir.getDirectoryListing();
            folderList.forEach(function (elem) {
                if (elem.match(/^default/)) {
                    //var data = self.getJsonData(Ti.Filesystem.resourcesDirectory + 'images/games/gameSets/'+CLASS+'/'+elem+'/default.json');
                    var data = self.getJsonData(Ti.Filesystem.resourcesDirectory + getPath(CLASS, elem) + "/gameSet.json");
                    if (data) {
                        sets.push(data);
                        countDefaultPages++;
                        if (fullApp && !list[data.gameSetId]) {
                            list[data.gameSetId] = true;
                            Ti.App.Properties.setObject('buyedSets', list);

                        }

                        self.fill(self.addNewSet(data), data);
                    }
                }
            });
        }

        //if (fullApp){ }
        //////////////////////
        if (fullApp) {
            //UNCOMENT FOR FULL VESION
            self.loadBuyedSets();
            //	self.Loader();

        } else {
            if (hasMultipleDifficulties && sets[currentPage].open != 0) {
                unlockButtons(true, ["levelButton1"]);
            }
        }

        if (!addEvent) {
            Ti.App.addEventListener("gameComplete", selectThumb);
            Ti.App.addEventListener("nextGame", nextGame);
            //	Ti.App.addEventListener("previousGame", previousGame);
            addEvent = true;
        }

        if (!createHidden) self.show();

        callback && callback();

    }


    function nextGame() {
        var currentSet = sets[currentPage];
        var nextCard = currentCard;
        nextCard++;

        var list = self.getBuyedList();
        var setId = currentSet.gameSetId;

        cardsLength = cards[currentSet.gameSetId].length;

        if (list[setId] || currentCard < currentSet.open) {
            if (nextCard <= cardsLength) {
                goToGame(currentSet, ++currentCard);
            } else {
                var page = currentPage;
                if (sets[++page]) {
                    currentCard = 0;
                    ++currentPage;
                    nextGame();
                    scrollableView.scrollToView(currentPage);
                }
            }
        }

    };


    function animateContentMenu(quick) {
        newBack.animate({
            top: getDeviceBasedHeight(0),
            opacity: 1,
            duration: quick ? 0 : 400,
        });
        win.topScene().playSound([
            "puzzle/gameSet"
        ]);
        //TROUBLE, WHEN WE HAVE SEVERAL SETS ON SCROLLABLEVIEW, ANIMATION #2, 3 START AFTER LOAD ALL SETS
        /*var downAnim = Titanium.UI.createAnimation();
		downAnim.top=getDeviceBasedHeight(0);
		downAnim.duration=400;
		newBack.animate(downAnim);
		downAnim.addEventListener('complete', function(){
			// Ti.API.info('SECOND ANIM');
        	var upAnim = Titanium.UI.createAnimation();
        	upAnim.width=getDeviceBasedWidth(1024);
 			upAnim.height=getDeviceBasedHeight(768);
			upAnim.top=getDeviceBasedHeight(-100);
			upAnim.duration=200;
			newBack.animate(upAnim);
			upAnim.addEventListener('complete', function(){
				var downAnim2 = Titanium.UI.createAnimation();
				downAnim2.top=getDeviceBasedHeight(0);
				downAnim2.width=getDeviceBasedWidth(1024);
 				downAnim2.height=getDeviceBasedHeight(768);
				downAnim2.duration=200;
				newBack.animate(downAnim2);
			});
        });*/
    }

    function previousGame() {

    };


    function goToGame(currentSet, cardId) {
        var path = null;
        if (currentPage <= countDefaultPages - 1) {
            url = getPath(CLASS, "default" + (currentPage + 1), cardId, currentLevel);
        } else {
            url =
                "/gameSets/" +
                CLASS + "/" +
                currentSet.gameSetId + "/" +
                cardId + "/" +
                currentLevel;
            path = Ti.Filesystem.applicationDataDirectory;
        }

        // self.hide();
        Ti.App.fireEvent("goToGame", {
            url: url,
            fullPath: path
        });

        currentCard = cardId;
        game.navigation.setInGame(true);
    }



    function unlockButtons(unlock, buttonsList) {
        buttonsList.forEach(function (name) {
            button = buttons[name];
            if (button) {
                listButtonsLock[name].visible = !unlock;
                //button.children[0].visible=!unlock; //.hide();
                button.touchEnabled = unlock; //true;		
            }
        });
    }


    

    function selectThumb() {

        var scene = win.topScene();
        id = sets[currentPage].gameSetId;

        // Ti.API.info('SELECT THUMB');

        /////////////

        var listBuyed = self.getBuyedList();
        if (list[id] || currentCard < sets[currentPage].open) {

            // Ti.API.info(list[id] + 
            //     " ====  currentCard = " +      currentCard +
            //     " sets[currentPage].open = " + sets[currentPage].open+
            //     " currentPage=="+currentPage
            // );

        } else {
            if (scene.data.gameData && scene.data.gameData.buttons && scene.data.gameData.buttons.next) {

                var button = scene.spriteByName(scene.data.gameData.buttons.next);

                if (button) {
                    button.touchEnabled = false;
                    var buttonNextLock = game2d.createSprite({
                        width: 170 * game.scaleX,
                        height: 90 * game.scaleY,
                        image: "images/navigation/gamesMenu/buttonNextLock.png",
                        loadedData: {
                            name: "lockOverButtonNext",
                            touchable: true
                        }
                    });
                    scene.add(buttonNextLock);
                    button.addChildNode(buttonNextLock);

                    var oldCallback = scene.onClick_lockOverButtonNext;
                    scene.onClick_lockOverButtonNext = function () {
                        win.topScene().playSound("menu");
                        self.BUY(++currentCard);
                        oldCallback && oldCallback();
                    };

                }

            }
        }

        /////////////


        //list=Ti.App.Properties.getObject('Played');	
        played = self.getPlayedList(); //Ti.App.Properties.getObject('Played', {});


        //played[id][currentLevel][currentCard]=true;
        if (!played[id]) {
            played[id] = new Object();
        }
        if (!played[id][currentLevel]) {
            played[id][currentLevel] = new Object();
        }
        played[id][currentLevel][currentCard] = true;

        Ti.App.Properties.setObject('Played', played);
        //list=Ti.App.Properties.getObject('Played');			
        self.reselectCards();
    };



    function getDeviceBasedWidth(oldW) {
        return (Ti.Platform.osname === "iphone") ? (oldW / 2.1333) : oldW;
    };

    function getDeviceBasedHeight(oldH) {
        return (Ti.Platform.osname === "iphone") ? (oldH / 2.4) : oldH;
    }

    self.hide = function () {

    	GameSet.prototype.OPENED = false;

        blackBack.hide();
        newBack.hide();
        // _.each(buttons, function(b) {
        // 	b.hide();
        // });
        // scrollableView.hide();
    };

    self.show = function () {

    	GameSet.prototype.OPENED = true;

        blackBack.show();
        newBack.show();
        // _.each(buttons, function(b) {
        // 	//buttons[b].show();
        // 	b.show();
        // });
        // scrollableView.show();
    };

    self.loadBuyedSets = function () {
        var listBuy = self.getBuyedList(); //Ti.App.Properties.getObject('buyedSets', {});
        var data = false;//NetworkLoader.getCached("cache/" + CLASS + ".json");

        ///////
        if (!data) {
            return;
        }
        var arr = JSON.parse(data);
        if (listBuy && arr != []) {
            arr.forEach(function (item) {
                if (listBuy[item.gameSetId]) {
                    sets.push(item);
                    self.addNewSet(item);
                }
            });
        }

    };



    self.getJsonData = function (fname) {
        var file = Ti.Filesystem.getFile(fname);
        var content = '';
        if (file.read()) {
            content = file.read().text;
        }
        file = null;
        if (content != '') {
            return eval("(" + content + ")");
        }
        return false;
    };

    var iEnable = true;
    self.Loader = function () {

        firstParam = {
            query: {
                classname: "gameSet_" + CLASS
            },
            cloudMap: function (e) {
                return e['gameSet_' + CLASS];
            },
            cacheWriteMap: JSON.stringify,
            cacheReadMap: JSON.parse
        };

        onOk = function (s) {
            // Ti.API.info('GameSet | CLOUDE'+JSON.stringify(s));
            if (s != []) {
                s.forEach(function (item, i) {
                    if (!setsContain(item.gameSetId)) {
                        sets.push(item);
                        self.addNewSet(item);
                    }
                });
                if (iEnable) {
                    //NetworkLoader.cache("cache/" + CLASS + ".json", JSON.stringify(sets.slice(2, sets.length)));

                }

            }
        };

        onFail = function () {
            // Ti.API.info("GameSet | couldn't load nothing (including cache)");
            //NetworkLoader.getCachedOrLoadAndCache(firstParam, "cache/" + CLASS + ".json", onOk);
        };

        if (Titanium.Network.networkType == Titanium.Network.NETWORK_NONE) {
            iEnable = false;
            //NetworkLoader.getCachedOrLoadAndCache(firstParam, "cache/" + CLASS + ".json", onOk);
        } else {
            iEnable = true;
            //NetworkLoader.get(firstParam, onOk, onFail);
        }

        function setsContain(itemId) {
            for (var i = 0; i < sets.length; i++) {
                if (sets[i].gameSetId == itemId) {
                    return true;
                }
            }
            return false;
        };
    };

    var filled = {};
    var a = [];
    self.fill = function (fold, data) {
        var count = 0;
        a = cards[data.gameSetId];

        length = a.length;
        if (filled[data.gameSetId]) {
			/*if (filled[data.gameSetId][length]){
				return;
			}*/
        } else {
            filled[data.gameSetId] = new Array(7);
        }
        list = self.getBuyedList();
        played = self.getPlayedList();

        for (var j = 0; j < length; j++) {

            if (filled[data.gameSetId][j]) {} else {
                filled[data.gameSetId][j] = false;
                a[j].addEventListener('load', function (e) {
                    count++;
                    filled[data.gameSetId][e.source.thisId - 1] = true;
                    /*if (count==a.length){
						filled[data.gameSetId][a.length]=true;
					}*/
                });
                //if (data.gameSetId!=CLASS+"DefaultSet"){
                if (data.gameSetId.match(/DefaultSet/)) {
                    a[j].backgroundImage = data.thumbs[j];

                } else {
                    //a[j].setImage(data.thumbs[j]);
                    self.cacheImg(data, j);

                }
            }

            if (list[data.gameSetId] && a[j].children[1]) { //children[1]-view show locked img
                //a[j].touchEnabled=true;
                a[j].children[1].hide();
                a[j].children[1].touchEnabled = false;
                //a[j].touchEnabled=true;
            }

            if (played[data.gameSetId] && played[data.gameSetId][currentLevel] && a[j].children[0]) {
                if (played[data.gameSetId][currentLevel][a[j].thisId]) {
                    a[j].children[0].show();
                } else {
                    a[j].children[0].hide();
                }
            } else {
                a[j].children[0].hide();
            }



        }
    };


    self.reselectLocked = function (id) {
        arr = cards[id];
        for (var j = 0; j < arr.length; j++) {
            if ( /*list[data.gameSetId] && */ arr[j].children[1]) { //children[1]-view show locked img
                arr[j].children[1].hide();
                arr[j].children[1].touchEnabled = false;
            };
        }
        unlockButtons(true, ["levelButton1", "levelButton2", "levelButton3"]);
    };



    self.reselectCards = function () {
        played = self.getPlayedList();
        data = sets[currentPage];
        arr = cards[data.gameSetId];
        for (var j = 0; j < arr.length; j++) {
            if (played[data.gameSetId] && played[data.gameSetId][currentLevel] && arr[j].children[0]) {
                if (played[data.gameSetId][currentLevel][arr[j].thisId]) {
                    arr[j].children[0].show();
                } else {
                    arr[j].children[0].hide();
                }

            } else {
                arr[j].children[0].hide();
            }

        }
        played = self.getPlayedList();
    };


    self.cacheImg = function (data, index) {
        /*NetworkLoader.getCachedOrLoadAndCache(data.thumbs[index],
            function (img) {
                //a[index].setImage(img);
                a[index].backgroundImage = img;
            }, function () {
                // console.error("loading ad2 failed");
            });*/
    };


    self.showButtons = function (list, top) {
        var left = 350;
        _.each(list, function (b) {
            buttons[b].animate({
                top: topMargin,
                left: left,
                opacity: 1,
                duration: 200,
            });
            left += self.stepX;
        });
    };

    self.click = function (e) {
        if (typeof self["click_" + e.source.code] === "function") {
            self["click_" + e.source.code]();
        }
    };




    self.setPage = function(num, card) {
    	scrollableView.scrollToView(num);
    	currentCard = card;
    };

    //self.click_my_Buy = function() {
    var downloadAtThisMoment = false;
    self.BUY = function(curCardId, choseLevel) {

        function onAfterBuy() {

        	var hideMenu = !!curCardId;

        	var saved = {
        		currentPage: currentPage,
        		difficulty: choseLevel,
        		currentCard: curCardId
        	};

        	self.destroy(function() {
        		var gs = new GameSet(game, win, gameType, hasMultipleDifficulties, hideMenu, !hideMenu, true);
        		gs.setPage(saved.currentPage, saved.currentCard);
        		gs.setDifficulty(saved.difficulty);
        		curCardId && goToGame(sets[currentPage], curCardId);
        	});

        }

        // Ti.App.fireEvent("goToPage", {index : 22});
        game.window.confirmParent(function () {
            Ti.App.fireEvent("trackBuyDialog");
            // e.sprite.color(0.5, 0.5, 0.5);
            SK.requestFullVersion(function (prod) {
                if (!prod && (Config.TEST_VERSION || Titanium.Platform.model === "Simulator")) {
                    onAfterBuy();
                } else {
                    SK.purchaseFullVersion(onAfterBuy);
                }
            });
        });

        // DLC logic
        /*var ID = sets[currentPage].gameSetId;
        var data = self.getBuyedList(); //Ti.App.Properties.getObject('buyedSets', {});
        data[ID] = true;
        Ti.App.Properties.setObject('buyedSets', data);
        downloadAtThisMoment = true;

        NetworkLoader.getZipAndUnpackTo(sets[currentPage].dataUrl, '/gameSets/' + CLASS + '/' + ID,

            function () {
                // Ti.API.info('DOWNLOAD COMPLETE and UNZIPEd');
                self.reselectLocked(ID);
                downloadAtThisMoment = false;
            },
            function () {
                // Ti.API.info('DOWNLOAD FAILD');
                downloadAtThisMoment = false;
            }

        );*/

    };


    var prevBtn;
    buttonAnimate = function (butt) {
        if (prevBtn && prevBtn != buttons[butt]) {
            scale(1, prevBtn);
        }


        scale(1.2, buttons[butt]);

        function scale(sc, btn) {
            var tr = Ti.UI.create2DMatrix();
            if (!btn) {
                return;
            }
            btn.animate({
                transform: tr.scale(sc),
                opacity: 1,
                duration: 300
            });
        };

        prevBtn = buttons[butt];
    };

    /* lvl = 0 | 1 | 2 */
    self.setDifficulty = function(lvl) {
    	var name = "levelButton" + (lvl + 1);
    	if (buttons[name] && buttons[name].touchEnabled) {
    	    soundClick();
    	    buttonAnimate(name);
    	    currentLevel = levels[lvl];
    	    self.reselectCards();
    	}
    };

    self.click_levelButton1 = function() { self.setDifficulty(0); };
    self.click_levelButton2 = function() { self.setDifficulty(1); };
    self.click_levelButton3 = function() { self.setDifficulty(2); };

    function soundClick() {
        win.topScene().playSound([
            "/puzzle/levelButton"
        ]);
    };


    self.click_gameBack = function() {
        self.destroy();
        flipSound.play();
        game.navigation.showGamesMenu();

    };

    self.destroy = function(callback) {

    	Ti.App.fireEvent("stopGameMusic");

    	GameSet.prototype.EXISTS = false;

    	self.hide();

        if (scrollableView) {
            Ti.App.removeEventListener("gameComplete", selectThumb);
            Ti.App.removeEventListener("nextGame", nextGame);

            win.remove(scrollableView);
            scrollableView = null;
            win.remove(newBack);
            win.remove(blackBack);

            sets = [];

            if (callback && typeof (callback) === "function") {
                callback();
            }

        }
    };


    self.getBuyedList = function () {
        return Ti.App.Properties.getObject('buyedSets', {});
    };

    //self.CheckInBuyed=function(setId){
    self.checkInBuyed = function (setId) {
        listOfBuyed = self.getBuyedList();
        return listOfBuyed[setId];
    };

    self.getPlayedList = function () {
        return Ti.App.Properties.getObject('Played', {});
    };


    var cardClickFlag = false;
    self.addNewSet = function (d) {
        var ID = d.gameSetId;
        if (scrollableView == null) {
            return;
        }
        var viewNew = Ti.UI.createView({
            opacity: 1,
            visible: true,
            width: getDeviceBasedWidth(1024)
        });
        scrollableView.addView(viewNew);

        var fold = self.createFold();
        viewNew.add(fold);

        /////////
        var dy = 0;
        var dx = 0;
        cards[ID] = new Array(6);

        ////////////
        var buyed = self.getBuyedList();
        var lockedFromIndex;
        if (buyed) {
            lockedFromIndex = buyed[ID] ? 9999 : d.open;
        }
        ////////////
        //count={'puzzle':[6,3], 'character':[12,4], 'spare':[12,4]}; count[CLASS][0]
        if (Ti.Platform.osname === "iphone") {
            dy = -6;
            w = 259;
            h = 178;
            top = 242;
            l = 101;
        } else {
            w = 258;
            h = 186;
            top = 236;
            l = 102;
        }
        for (var i = 1; i <= 6; i++) {

            view = Ti.UI.createImageView({ //createButton({//createImageView({
                borderWidth: 3,
                borderColor: "white",
                backgroundImage: getPath() + "defaultThumbnail.png",
                width:  getDeviceBasedWidth(w), //150
                height: getDeviceBasedHeight(h), //113
                top:  getDeviceBasedHeight(top) + dy, //200
                left: getDeviceBasedWidth(l) + dx,
                visible: true,
                thisId: i,
                zIndex: 65
            });

            dx += view.width + getDeviceBasedWidth(23);
            cards[ID][i - 1] = view;
            if (i % 3 == 0) { //count[CLASS][1]
                dx = 0;
                if (Ti.Platform.osname === "iphone") {
                    dy += view.height + getDeviceBasedHeight(23);
                } else {
                    dy += view.height + getDeviceBasedHeight(22);
                }

            }

            view.addEventListener("touchstart", function (e) {
                e.source.setBorderColor('red');
            });

            view.addEventListener("touchmove", function (e) {
                //Ti.API.info('TOUCH touchcancel'+JSON.stringify(e));
            });


            view.addEventListener("touchcancel", function (e) {
                //Ti.API.info('TOUCH CANCEL');
                e.source.setBorderColor('white');
            });

            view.addEventListener("touchend", function (e) {
                //view.addEventListener("click", function(e){
                e.source.setBorderColor('white');
                var w = e.source.width;
                var h = e.source.height;
                var t = e.source.top;
                var l = e.source.left;
                if (e.x <= w && e.x + l >= l && e.y <= h && e.y + t >= t) {

                    if (!cardClickFlag) {
                        currentCard = e.source.thisId;
                        cardClickFlag = true;
                        var currentSet = sets[currentPage];
                        win.topScene().playSound([
                            "puzzle/selectCard"
                        ]);


                        setTimeout(function () {
                            self.hide();
                            goToGame(currentSet, currentCard);
                            cardClickFlag = false;
                        }, 200);
                        //Ti.API.info('THIS ID '+e.source.thisId);
                    }
                }
            });

            fold.add(view);

            /////////SELECTED
            select = Ti.UI.createView({
                touchEnabled: false,
                //visible : 1,
                bubbleParent: true,
                zIndex: 66,
                backgroundImage: "/images/navigation/gamesMenu/played.png"

            });
            view.add(select);
            select.hide();
            /////////////////

            ///////////LOCKED////////////
            if (i > lockedFromIndex) {
                //view.touchEnabled=false;
                var lock = Ti.UI.createView({
                    touchEnabled: true,
                    bubbleParent: false,
                    zIndex: 67,
                    thisId: i,
                    backgroundImage: "/images/navigation/gamesMenu/menuLock.png" //"/images/thumbs/locked.png"
                });
                view.add(lock);

                lock.addEventListener("click", function (e) {
                    win.topScene().playSound("menu");
                    self.BUY(e.source.thisId);
                    /*if (ID!=0){
				        game.window.confirmParent(function() {
						   // e.sprite.color(0.5, 0.5, 0.5);
							SK.requestFullVersion(function(prod) {
								prod && SK.purchaseFullVersion(function(e) {
								});
							});
						});
					}else{
						Ti.App.fireEvent("goToPage", {index : 21});
						self.hide();
					}*/

                });

                // view.touchEnabled=false;
            }
            ////////////    
        }
        return fold;
    };

    var arrows = [];


    self.createFold = function () {
        img = hasMultipleDifficulties ? "/images/navigation/gamesMenu/menuFront.png" : "/images/navigation/gamesMenu/menuFront3.png";

        var fold = Ti.UI.createView({
            backgroundImage: img, //backgroundNew.png",
            visible: true,
            opacity: 1,
            zIndex: 100,
            bubbleParent: true,
        });

        scrollableView.setCacheSize(sets.length);

        if (scrollableView.views.length === 1) {} else {
            var arrowLeft = Ti.UI.createView({
                left: getDeviceBasedWidth(33),
                top:  getDeviceBasedHeight(391),
                width:  getDeviceBasedWidth(43),
                height: getDeviceBasedHeight(109),
                backgroundImage: "/images/navigation/gamesMenu/arrow_left.png",
            });
            arrowLeft.addEventListener("click", function () {
                // Ti.API.info('ArrowLeft');
                if (currentPage - 1 < 0) {
                    return;
                }
                // Ti.API.info('currentPage-1='+(currentPage-1));
                scrollableView.scrollToView(currentPage - 1);
            });
            fold.add(arrowLeft);
        }

        var arrowRight = Ti.UI.createView({
            left: getDeviceBasedWidth(948),
            top:  getDeviceBasedHeight(391),
            width:  getDeviceBasedWidth(43),
            height: getDeviceBasedHeight(109),
            backgroundImage: "/images/navigation/gamesMenu/arrow_right.png",
            opacity: 0,
        });
        arrowRight.addEventListener("click", function () {
            // Ti.API.info('ArrowRight');
            if (currentPage + 2 > scrollableView.views.length) {
                return;
            }
            scrollableView.scrollToView(currentPage + 1);
            // Ti.API.info('currentPage+1='+(currentPage+1));
        });
        fold.add(arrowRight);
        var length = arrows.length;
        if (length > 0) {
            arrows[length - 1].opacity = 1;
        }
        arrows.push(arrowRight);

        return fold;

    };

    init();

    singleGameSet = self;

    return self;

}



module.exports = GameSet;