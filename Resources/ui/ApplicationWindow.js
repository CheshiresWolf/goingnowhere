// Application Window Component Constructor
var isAndroid = !!Ti.Android;

var quicktigame2d   = require("com.ti.game2d");
var OurBook         = require("/ui/OurBook");
var InAppPurchases  = require("lib/InAppPurchases");
var Config          = require("config");

//var GoogleAnalytics = require("analytics.google").getTracker(Config.googleAnalyticsId);



function ApplicationWindow() {

    Titanium.Media.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_AMBIENT;

    // Create component instance
	var self = Ti.UI.createWindow({

		backgroundImage: "/images/scenes/canva.png",

        top  : 0,
        left : 0,

        width  : Config.UI_WIDTH,
        height : Config.UI_HEIGHT,

		fullscreen   : true,
		hideNavBar   : true,
		navBarHidden : true,
		exitOnClose  : true,

		orientationModes : [
            Ti.UI.LANDSCAPE_LEFT
        ],

	});

    var game = quicktigame2d.createGameView({});
    game.registerForMultiTouch();
    game.correctionHint = quicktigame2d.OPENGL_FASTEST;
    game.textureFilter = quicktigame2d.OPENGL_LINEAR;
    game.loadTexture("images/scenes/canva.png");
   
    game.require = function (moduleClass) {

        if (!Config.DEBUG_LOADER) return require(moduleClass);

        var wrapStart = "function RequireWrapper() { var module = {exports: {}};\n";

        var filename = Ti.Filesystem.resourcesDirectory + moduleClass + ".js";
        var f = Ti.Filesystem.getFile(filename);
        try {
            var jscode = f.read().text;
        } catch(e) {
            alert("Error reading file " + filename);
            return require("/ui/scenes/Error");
        }

        var wrapEnd = "return module.exports;\n}\n";

        var code = wrapStart + jscode + wrapEnd;
        
        try {
            eval(code);
        } catch (e) {
            var line = code.split(/\n/)[e.line - 1];
            // Ti.API.info("ERROR: " + line);
            alert(
                "Error loading " + moduleClass + " - " +
                e.name + "\n" + e.message + "\n" + 
                "Line: " + (e.line - 1) + "\n" + line
            );
            return require("/ui/scenes/Error");
        }

        return RequireWrapper();

    };
       
    game.fps = Config.FPS;   
    var dpi = Ti.Platform.displayCaps.dpi, osname = Ti.Platform.osname; 
    game.isRetina = function() {
        if (isAndroid) {
            return false;
        }

        return dpi > 163 && (osname == 'ipad' || osname == 'iphone');  
    };

    game.color(255, 255, 255);

    var pages = InAppPurchases.isFullVersion() ? Config.ALL_PAGES : Config.FREE_PAGES;
    var lastPage = Ti.App.Properties.getInt("lastPage", 0);
    if (!InAppPurchases.isFullVersion() && Config.LAST_FREE_PAGE !== undefined) {
        lastPage = Math.min(lastPage, Config.LAST_FREE_PAGE);
    }
    
    var spritesWaited = {};
    var waitingForStart = true;
    var firstScene = true;
    self.startScene = function() {
        Ti.API.debug("ApplicationWindow | self.startScene | page : " + page + "; page.name : " + page.name);
        page.onShowScene();
        game.startCurrentScene();
        self.hideLoadingAnimation();
    };
    self.addEventListener('startScene', self.startScene);
    
    self.onLoadSprite = function(e) {
        if (!spritesWaited) return;
        spritesWaited[e.name] = false;
        for(var name in spritesWaited) {
            if (spritesWaited[name]) {
                return;
            }
        }

        if (waitingForStart) {
            game.removeEventListener('onloadsprite', self.onLoadSprite);
            self.startScene();
            waitingForStart = false;
        }
    };
    
    
    var flipSound = Ti.Media.createSound({url:"/sounds/page_flip.mp3"});
    function playFlipSound() {
    	flipSound.volume = Ti.App.Properties.getDouble("effects_sound", 0.6);
    	flipSound.play();
    }

    var page = null;
    var pageTimer;
    var currentPage = null;
    var loadPage = function(e){
        if (e.index > pages.length - 1) e.index = pages.length - 1;
        if (e.mode_changed) {
            e.index = lastPage; 
        }
                
        var pageClass = pages[e.index];
        var Page = game.require('/ui/scenes/' + pageClass);
        page = new Page(game, self, e, game.scaleX, game.scaleY);
        page.name = pageClass;
        
        if (firstScene) { 
            firstScene = false;
            game.addEventListener('onloadsprite', self.onLoadSprite);
            spritesWaited = page.loadSprites();
            currentPage = page;
            game.pushScene(page.getScene());
        } else {
            self.showLoadingAnimation(1500);
            var prevPage = currentPage;
            //playFlipSound();
            waitingForStart = true;
            game.replaceScene(page.getScene());
            currentPage = page;
            
            prevPage.prepareRelease();
            prevPage.unloadSprites(game);
            
            setTimeout(function(){ //skip one frame
                game.addEventListener('onloadsprite', self.onLoadSprite);
                spritesWaited = page.loadSprites();
            }, 1000/15);
        }
        Ti.App.Properties.setInt("lastPage", e.index);
        lastPage = e.index;
    };



    var lastTalePageIndex = 0;
    var lastGameFullUrl = null;

    function loadGamePage(basePath, url, filename) {

        var isRestart = !url;

        if (!url && lastGameFullUrl) {
            basePath = "";
            url = lastGameFullUrl;
        } else {
            basePath = basePath || Ti.Filesystem.resourcesDirectory;
            // make sure that basePath ends with "/"
            if (basePath[basePath.length - 1] !== "/") basePath += "/";
            // and url starts without "/", ends with it and
            // doesn't containt multiple slashes
            url = (url + "/").replace(/^\/+/, "").replace(/\/{2,}/g, "/");
        }
        // ensure that filename starts without "/"
        filename = (filename || "index.jgame").replace(/^\/+/, "");


        function unloadPage(page) {
            page.prepareRelease();
            page.unloadSprites(game);
        }

        function loadPage(page) {
            currentPage = page;
            waitingForStart = true;
            game.replaceScene(page.getScene());
            setTimeout(function() { // skip one frame
                game.addEventListener("onloadsprite", self.onLoadSprite);
                // GameProgressBar.show(page);
                spritesWaited = page.loadSprites();
            }, 1000 / 15);
        }

        function Page(game, basePath, url, filename) {

            // console.debug("Creating game page", basePath, url);

            var LoadableScene = game.require("/ui/LoadableScene");
            var gameFolder = basePath + url;

            var gameScene = new LoadableScene(
                game, gameFolder + filename, gameFolder
            );
            // gameScene.page_index = ???

            return gameScene;

        }

        // if (page.page_index !== undefined) {
        if (page.pageMode !== "game") {
            lastTalePageIndex = page.page_index;
        }

        page = new Page(game, basePath, url, filename);

        // ???
        page.name = filename.substr(0, filename.lastIndexOf(".")) || filename;

        self.showLoadingAnimation(1500);

        unloadPage(currentPage);

        if (!isRestart) {
            lastGameFullUrl = basePath + url;
        }
        //playFlipSound();

        loadPage(page);

    };

    Ti.App.addEventListener("goToPage", function(e) {
        //GoogleAnalytics.trackScreen("Page" + e.index);
        loadPage(e);
    });
    Ti.App.addEventListener("nextPage", function() {
        if (pages[lastPage + 1]) {
            //if (!isAndroid) GoogleAnalytics.trackScreen("Page" + (lastPage + 1));
            loadPage({index : lastPage + 1});
        }
    });
    
      Ti.App.addEventListener("prevPage", function() {
        if (pages[lastPage - 1]) {
            //if (!isAndroid) GoogleAnalytics.trackScreen("Page" + (lastPage - 1));
            loadPage({index : lastPage - 1});
        }
    });
    
    Ti.App.addEventListener("restartPage", function() {
        //GoogleAnalytics.trackScreen("Page" + lastPage + " was restarted.");
        Ti.App.fireEvent("goToPage", {
            index : lastPage
        });
    });
    
    Ti.App.addEventListener("startCurrentScene", function(e){
	   game.startCurrentScene();
	});

    var fader;
    var menuOpening = false;
    var endPageScroller;
    Ti.App.addEventListener("showEndPage", function(e) {
        var OurBook = require('/ui/OurBook');
        var data = e.data;
        if (endPageScroller) {
            self.remove(endPageScroller);
            endPageScroller = null;
        }
        
        var scaleX = isAndroid ? game.scaleX : 1;
        var scaleY = isAndroid ? game.scaleX : 1;

        var flag = (Ti.Platform.osname === "iphone");
        endPageScroller = Ti.UI.createScrollView({
            "left":  flag ? 23 : 50,// * scaleX,
            "top":  flag ? 210 : 505,// * scaleY,
            "height": flag ? 100 : 241,// * scaleY,
            "right": flag ? 23 : 50,// * scaleX,
            layout: "horizontal",
            horizontalWrap: false,
            scrollType: "horizontal"
        });

        var lng = Config.getCurrentLanguage();
        for (var i=0; i < data.length; i++) {
            var book = JSON.parse(JSON.stringify(data[i]));
            if (book.id == Config.APP_DOMAIN) {
                continue;
            }
            var local = book.image_url.replace(/^http.+?\/api\/(images|images-[a-z]+)\//g, "/images/scenes/common/End/");
            if (lng != 'ru') {
                local = local.replace(/.png$/, '_'+lng+'_lang.png');
            }
            
            if (isAndroid) {
                book.appstore_url = 'market://details?id='+book.id;
            }
            
            //Ti.API.info('BOOK', book.name, book.appstore_url)
            
            var fl = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + local);
            if (fl.exists()) {
                //Ti.API.info(fl.nativePath);
                book.image_url = local;
            }
            var bookView = new OurBook(book, lng, game);
            endPageScroller.add(bookView);
        };
        self.add(endPageScroller);
        
    });
    Ti.App.addEventListener("hideEndPage", function(e) {
        if (endPageScroller) {
            self.remove(endPageScroller);
            endPageScroller = null;
        }
    });
    
    //HIDE PUZZLE
    /*Ti.App.addEventListener("hidePuzzle", function() {
        if (!puzzleView) return;
        var scene = game.topScene();
        puzzleView.isOpened = false;
        puzzleView = null;
    });*/

    self.addEventListener('open', function(e) {
        self.showLoadingAnimation(1500, 1);
    });
    game.addEventListener('onload', function(e) {
        game.scaleX = Config.UI_SCALE_X;//game.screen.width / 768;
        game.scaleY = Config.UI_SCALE_Y;//game.screen.height / 1024;
        game.start();

        var PauseScreen = require("modules/PauseScreen");
        var WinScreen   = require("modules/WinScreen");
        var FailScreen  = require("modules/FailScreen");
        var HelpScreen  = require("modules/HelpScreen");
        var ComingSoon  = require("modules/ComingSoon");
        game.uiScreen = {
            pause : new PauseScreen(game, self),
            win   : new WinScreen(game, self),
            fail  : new FailScreen(game, self),
            help  : new HelpScreen(game, self),
            comingSoon : new ComingSoon(game, self)
        };

        Ti.App.fireEvent("goToPage", {index:lastPage, first: true});
    });

    game.hide();
    self.add(game);
    game.window = self;
    
    var over = Ti.UI.createView({
        backgroundColor: "white",
        backgroundImage: "/images/scenes/canva.png",
        opacity: 0,
        visible: false,
        zIndex: 1000
    });

    var loadingImageView = Titanium.UI.createImageView({
    	images: [ 0, 1, 2, 3, 4 ].map(function(i) {
            return "/images/loadingAnimation/" + i + ".png"
        }),
    	duration: 250,
        width:  157 * Config.UI_SCALE_X,
        height: 200 * Config.UI_SCALE_Y
	});
    
    self.showLoadingAnimation = function(dur, start) {
        //Ti.API.info('SHOW LOADING ANIMATION');
        dur = dur || 800;
        over.show();
        over.animate(
            {
                opacity : 1,
                duration : 200
            },
            function() {
                if (start) {
                    game.show();
                }
            }
        );
        loadingImageView.stop();
        loadingImageView.start();
    };
    self.hideLoadingAnimation = function(dur, start) {
        //Ti.API.info('HIDE LOADING ANIMATION');
        setTimeout(function(){
            over.hide();
            over.opacity = 1;
         }, 200);
         return;
    };
    if (isAndroid) {
        self.addEventListener('open', function(e) {
            var activity = self.activity;

            if (activity) {
                activity.addEventListener('resume', function(e) {
                    game.start();
                });
                activity.addEventListener('pause', function(e) {
                    game.stop();
                });
            }


        });
        
    } else {
        Ti.App.addEventListener('resumed', function(e) {
            game.start();
        });
        Ti.App.addEventListener('pause', function(e) {
            game.stop();
        });
        Ti.App.addEventListener('paused', function(e) {
            game.stop();
        });
    }
    
    Ti.App.addEventListener('showAbout', function(e) {
        var About = require("ui/About");
        var about = new About(game);
        about.open({modal:true,  modalTransitionStyle:Ti.UI.iPhone.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL, navBarHidden:true});
    });

    Ti.App.addEventListener('showParentsInfo', function(e) {
        var ParentsInfo = require("ui/ParentsInfo");
        var about = new ParentsInfo(game);
        about.open({modal:true,  modalTransitionStyle:Ti.UI.iPhone.MODAL_TRANSITION_STYLE_FLIP_HORIZONTAL, navBarHidden:true});
    });
    
 
    Ti.App.addEventListener("fullVersionPurchased", function(e) {
		pages = InAppPurchases.isFullVersion() ? Config.ALL_PAGES : Config.FREE_PAGES;
        loadPage({ index: InAppPurchases.lastPage });
    });
   
    self.topScene = function() {
        return currentPage;
    };

    if (Config.DEBUG_LOADER) {
        var reloadButton = Ti.UI.createButton({
            top : 3,
            right : 3,
            title : " R "
        });
        self.add(reloadButton);
        reloadButton.addEventListener("click", function() {
            Ti.App.fireEvent("goToPage", {
                index : lastPage
            });
        });
    }
    
    //self.add(navigation);
    over.add(loadingImageView);
    self.add(over);


    // Parent confirmer
    // XXX find a way to make it global
    self.confirmParent = function(/* [window], onOk, onFail, onAnyway */) {

        var window, onOk, onFail, onAnyway;

        var args = Array.prototype.slice.apply(arguments);
        if (args[0] && typeof args[0] !== "function") {
            window = args[0];
            args = args.slice(1);
        } else {
            window = self;
        }
        onOk     = args[0];
        onFail   = args[1];
        onAnyway = args[2];

        //ParentConfirmer.confirm(game, window, onOk, onFail, onAnyway);

    };

    self.showDynamicAd = function(window) {
        //AdRotator.updateAndShowRandomAd(game, window || self);
    };


    return self;
}

//make constructor function the public component interface
module.exports = ApplicationWindow;
