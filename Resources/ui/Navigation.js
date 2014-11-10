var _              = require("lib/Underscore");
var Config         = require("config");
var InAppPurchases = require("lib/InAppPurchases");
var ChooseGame     = require("modules/ChooseGame");
var ContentMenu    = require("ui/ContentMenu");
// var GameSet        = require("modules/GameSet");
var GamePicker     = require("ui/GamePicker");
var SettingsMenu   = require("modules/SettingsMenu");
// var CM             = require("ui/CoachMarks");

var isAndroid = !!Ti.Android;

var flipSound = Ti.Media.createSound({
    url: "/sounds/page_flip.mp3"
});

var clickSound = Ti.Media.createSound({
    url: "/sounds/menu.mp3"
});

// XXX move this to SettingsMenu
var langButtons = [];
if (Config.LANGUAGES.length > 1) {
    langButtons = Config.LANGUAGES.map(function(e) { return "button_" + e; });
}

function Navigation(game, win) {

    var self = this;

    var rx = game.isRetina() ? 0.5 : 1;
    var sx = game.scaleX * rx;
    var sy = game.scaleY * rx;

    self.baseTop  = 96 * sy;
    self.baseLeft = 96 * sx;
    self.stepX = 96 * sx;
    self.stepY = 96 * sy;

    var topMargin = 6 * sy;
    
    var buttons = {};
    
    self.ALL_BUTTONS = [
        "info",
        "record",
        "star",
        "record2",
        "stop",
        "content",
        "more_tales",
        "play",
        "text",
        "pause",
        "pause_record",
        "stop_record",
        "play_again",
        "back",
        "delete_record",
        "start_record",
        "games",
        { "game_restart": "play_again" },
        { "game_content": "content" },
        //{ "game_back": "back" },
        "settings",
        "menu",
        { "debug_unpurchase": "heart" }
    ];

    var taleButtons = Config.HAS_GAMES ? ["menu", "games"] : ["menu"];
    if (Config.TEST_PURCHASES && Ti.App.deployType !== "production") {
        taleButtons.push("debug_unpurchase");
    }

    self.modes = {
        no_text : {
            center : taleButtons,
            horizontal : [],
            vertical : "content,info,star,more_tales,settings".split(/,/),
        },
        normal : {
            center : taleButtons,
            horizontal : (isAndroid) ? ["play", "text"] : ["play", "text", "record2"],//("play,text" + (!isAndroid) ? ",record" : "").split(/,/),
            vertical : "content,info,star,more_tales,settings".split(/,/),
        },
        record : {
            center : "back,pause_record,stop_record".split(/,/),
            horizontal : [],
            vertical : []
        },
        replay : {
            center : "back,play_again,delete_record".split(/,/),
            horizontal : [],
            vertical : []
        },
        game: {
            center: [], //["back", "game_restart"],
            horizontal: [],
            vertical: []
        }
    };



    function init() {

        _.each(self.ALL_BUTTONS, function(b) {

            var buttonName;
            var image;
            if (typeof b === "string") {
                buttonName = image = b;
            } else {
                buttonName = Object.keys(b)[0];
                image = b[buttonName];
            }

            var btn = Ti.UI.createButton({
                left : 0,
                top : topMargin,
                width : 94 * sx,
                height : 96 * sy,
                backgroundImage : "/images/navigation/" + image + ".png",
                code : buttonName,
                opacity : 0,
                zIndex: 50,
                //visible : false
            });
            //Ti.API.info(buttonName, image)
            btn.addEventListener("click", self.click);
            win.add(btn);
            buttons[buttonName] = btn;
        });

        var show_text = Ti.App.Properties.getBool("show_text", Config.DEVICE_TYPE === "tablet");
        if (!show_text) {
            buttons.text.backgroundImage = "/images/navigation/no_text.png";
        }

        var play = (Ti.App.Properties.getString("read_mode", "listen") == "listen");
        if (play) {
            buttons.play.backgroundImage = "/images/navigation/pause.png";
        }

        self.content = new ContentMenu(game, win);
        
        self.settings = new SettingsMenu(game, win, langButtons);

    }


    // ===== Buttons =====

        self.showButtonsVertical = function(list, top) {
            
        };

        self.showButtonsHorizontal = function(list) {
            
        };

        self.hideButtons = function(list) {
            _.each(list, function(b) {
                buttons[b].animate({
                    top : topMargin,
                    left : 0,
                    opacity : 0,
                    duration : 200,
                }, function() {
                	if (isAndroid) buttons[b].hide();
                });
            });
        };

        self.hideAllButtons = function(mode) {
            if (typeof self.lineCheckerInterval != "undefined") {
                clearInterval(self.lineCheckerInterval);
                delete self.lineCheckerInterval;
            }
            self.currentLeft = 0;
            self.hideButtons(self.ALL_BUTTONS.map(function(e) {
                return typeof e === "string" ? e : Object.keys(e)[0];
            }));
            self.currentLeft = self.showButtonsHorizontal(mode.center);
            game.updatePlayButtons();  
            var scene = win.topScene();
            var mode = scene.pageMode;
            if (mode === "record" || mode === "replay") scene.hideArrows();
        };

    // ===================



    // ===== Menu =====

        self.toggleMenu = function() {
			Ti.API.debug("Navigation | self.toggleMenu | self.menuShown = " + self.menuShown);
            if (!self.menuShown) {
                //CM.show(win.topScene());
                self.showMenu();
            } else {
                self.hideMenu();
            }
        };

        self.showMenu = function() {
			Ti.API.debug("Navigation | self.showMenu");
			
            var scene = win.topScene();
            var mode = self.modes[scene.pageMode];
            self.showButtonsVertical(mode.vertical);
            self.currentLeft = self.showButtonsHorizontal(mode.horizontal);
            self.menuShown = true;

            refreshHideMenuTimeout();

        };

        self.hideMenu = function() {
            var scene = win.topScene();
            var mode = self.modes[scene.pageMode];
            self.hideAllButtons(mode);
            self.menuShown = false;
            if (scene.pageMode == "record") {
                if (!isAndroid) self.prepareRecordingControls();
                //CM.show(scene);
            } else {
                if (self.recordHolder) {
                    win.remove(self.recordHolder);
                    self.recordHolder = null;
                }
                if (self.recordInd) {
                    win.remove(self.recordInd);
                    self.recordInd = null;
                }
            }
            if (scene.pageMode == "replay") {
                self.prepareReplayControls();
                //CM.show(scene);
            }

            clearTimeout(hideMenuTimeout);

        };

        var hideMenuTimeout = null;
        function refreshHideMenuTimeout() {
            if (hideMenuTimeout != null) {
                clearTimeout(hideMenuTimeout);
            }
            hideMenuTimeout = win.topScene().setTimeout(function(e) {
                // Ti.API.info('Navigation | refreshHideMenuTimeout');
                self.hideMenu();
            }, 10000);
        }

    // ================



    game.updatePlayButtons = function(e) {

        if (!e) return;

        if (e.play !== undefined) {
            if (e.play) {
                buttons.play.backgroundImage = "/images/navigation/pause.png";
                !e.onlyVisual && Ti.App.Properties.setString("read_mode", "listen");
                playFlag = "listen";
            } else {
                buttons.play.backgroundImage = "/images/navigation/play.png";
                !e.onlyVisual && Ti.App.Properties.setString("read_mode", "read");
                playFlag = "read";
            }
        }

        if (e.text !== undefined) {
            if (e.text) {
                buttons.text.backgroundImage = "/images/navigation/text.png";
            } else {
                buttons.text.backgroundImage = "/images/navigation/no_text.png";
            }
            Ti.App.Properties.setBool("show_text", e.text);
            win.topScene().showHideText();
        }
    };



    // ===== Sounds switcher =====

        var defaultVolume = 0.5;
        var oldVolumes = {
            music:   Ti.App.Properties.getDouble("music_volume",   defaultVolume),
            effects: Ti.App.Properties.getDouble("effects_volume", defaultVolume),
            reading: Ti.App.Properties.getDouble("read_volume",    defaultVolume)
        };
        self.switchAllSounds = function(enable) {

            var scene = win.topScene();

            var map = [
                [ "music",   "music_volume"  ],
                [ "effects", "effects_sound" ],
                [ "reading", "read_volume"   ]
            ];

            if (enable) {
                map.forEach(function(e) {
                    Ti.App.Properties.setDouble(e[1], oldVolumes[e[0]]);
                });
                scene.setReadSoundVolume(oldVolumes.reading);
                win.changeVolumeOfBackMusic(oldVolumes.music);
            } else {
                map.forEach(function(e) {
                    oldVolumes[e[0]] = Ti.App.Properties.getDouble(e[1], defaultVolume);
                    Ti.App.Properties.setDouble(e[1], 0);
                });
                scene.setReadSoundVolume(0);
                win.changeVolumeOfBackMusic(0);
            }

        };

    // ===========================



    // ===== Recording stuff =====

        self.prepareRecordingControls = function() {

            var lw = 100*sx;

            var lholder = Ti.UI.createView({
                top: 55*sy,
                height : 13*sy,
                borderWidth : 1,
                borderColor : "gray",
                borderRadius : 4,
                //opacity : 0.5,
                backgroundColor: "#ececec",
                width : lw,
                right: 11*sx
            });

            var lavg = Ti.UI.createView({
                backgroundColor : 'green',
                width : 0,
                left : 0,
                height : 11*sy,
            });

            var lpeak = Ti.UI.createView({
                backgroundColor : 'red',
                height : 11*sy,
                left : 0,
                width : 0
            });

            lholder.add(lavg);
            lholder.add(lpeak);
            win.add(lholder);

            self.recordHolder = lholder;

            self.levelChanged = function(e) {
                if (!self.recordHolder) return;
                lw = 100*sx;
                var peak = Ti.Media.peakMicrophonePower;
                var avg = Ti.Media.averageMicrophonePower;
                // Ti.API.info('PEEK ' + peak + "  " + avg, e);
                var w = lw;
                if (peak <= 1) {
                    lavg.width = Math.round(w*avg);
                    lpeak.left = Math.round(w*avg);
                    lpeak.width = 0;
                } else {
                    //lavg.width = 100;
                    //lpeak.left = 100;
                    lavg.width = Math.round(w*avg);
                    lpeak.left = Math.round(w*avg);
                    lpeak.width = Math.round((lw*(peak-1))/10);
                }
            };
            
            self.lineCheckerInterval = setInterval(self.levelChanged, 100);

            self.recordInd = Ti.UI.createView({
                backgroundImage: "/images/navigation/rec2.png",
                top:   getDeviceBasedHeight(24),
                right: getDeviceBasedWidth(24),
                width:  getDeviceBasedWidth(73),
                height: getDeviceBasedHeight(20)
            });
            win.add(self.recordInd);

            self.recordInd.animate({
                opacity: 0.3,
                autoreverse: true,
                repeat: 99999,
                duration: 400
            });

        };
        
        self.prepareReplayControls = function() {

        };
        
        function getDeviceBasedWidth(oldW) {
            return (Ti.Platform.osname === "iphone") ? (oldW / 2.1333) : oldW;
        };
            
        function getDeviceBasedHeight(oldH) {
            return (Ti.Platform.osname === "iphone") ? (oldH / 2.4) : oldH;
        }

        self.replayFinished = function() {
            self.hideProgressBar();
        };

    // ===========================
    


    // ===== Progress bar =====
	    
        var progressBar = null;

        self.showProgressBar = function(start, end) {

            if (Ti.Platform.osname === "iphone") return;

            if (!progressBar) {
            	var progressWidth = 400;
                var progressFontSize = 32;
            	if (Ti.Platform.osname === "iphone") { 
            		progressWidth = 160;
            		progressFontSize = 22;
            	}
                progressBar = Titanium.UI.createProgressBar({
                    top: 10,
                    width: progressWidth,
                    height: "auto",
                    min: start,
                    max: end,
                    value: start,
                    color: "#fff",
                    tintColor: "#ff00",
                    font: {
                        fontSize: progressFontSize,
                        fontWeight: "bold",
                        fontFamily: "Gabriola"
                    },
                    style: Titanium.UI.iPhone.ProgressBarStyle.PLAIN
                });
                win.add(progressBar);
                switchLang(progressBar);
                progressBar.show();
                return;
            }

            switchLang(progressBar);
            progressBar.min = start;
            progressBar.max = end;
            progressBar.value = start;
            progressBar.show();
            
            function switchLang(progressBar) {
                var lng = Config.getCurrentLanguage();
                progressBar.message = L(lng + "_recording_time");
            }
            
        };
        
        self.updateProgressBar = function(val) {
            if (progressBar) progressBar.value = val;
        };
        
        self.hideProgressBar = function() {
            progressBar && progressBar.hide();
        };

    // ========================



    // ===== Games =====

        var gameChooser = null;
            			
        self.showGamesMenu = function() {

            Ti.App.fireEvent("stopBackMusic");

            if (gameChooser === null) {
                
                gameChooser = new ChooseGame(game, win, [
                    // function() { gameChooser.hide(); new GameSet(game, win, "solvePuzzle", true); },
                    // function() { gameChooser.hide(); new GameSet(game, win, "removeSpare");       },
                    // function() { gameChooser.hide(); new GameSet(game, win, "buildCharacter");    }
                    function() { gameChooser.hide(); new GamePicker(game, win, "solvePuzzle", true); },
                    function() { gameChooser.hide(); new GamePicker(game, win, "removeSpare");       },
                    function() { gameChooser.hide(); new GamePicker(game, win, "buildCharacter");    }
                ]);
            }
            
            gameChooser.show();
            
        };

        // XXX get rid of this
        var inGame = false;
        
        self.getInGame = function(){
        	return inGame;
        };
        
        self.setInGame = function(value) {
        	inGame = value;
        };

    // =================



    self.click = function(e) {
        clickSound.play();
        Ti.API.debug("Navigation | self.click | e = ", JSON.stringify(e));
        //CM.hide();
        if (typeof self["click_" + e.source.code] === "function") {
            self["click_" + e.source.code]();
        }
        refreshHideMenuTimeout();
    };



    self.click_menu = self.toggleMenu;

    // self.click_game_back = function() {
    //     flipSound.play();
    //     new GameSet(game, win);
    // }

    self.click_debug_unpurchase = InAppPurchases.debugUnpurchase;

    self.click_back = function() {
        flipSound.play();
        // if (GameSet.prototype.EXISTS) {
        //     GameSet.prototype.show();
        if (GamePicker.EXISTS) {
            GamePicker.existing.show();
        } else {
            Ti.App.fireEvent("restartPage");
        }

        self.switchAllSounds(true);
        self.hideProgressBar();
    };

    self.click_games = self.showGamesMenu;

	self.click_game_content = function() {
        // GameSet.prototype.show();
		GamePicker.existing.show();
	};

    self.click_content = function() {
    	Ti.API.debug("Navigation | self.click_content");
        self.content.fill();
        self.content.show();
    };

    self.click_info = function() {
        Ti.App.fireEvent('showAbout');
    };

    self.click_music = function() {
        var music = Ti.App.Properties.getBool("music", true);
        music = !music;
        Ti.App.Properties.setBool("music", music);
        if (!music) {
            buttons.music.backgroundImage = "/images/navigation/no_music.png";
        } else {
            buttons.music.backgroundImage = "/images/navigation/music.png";
        }
        //Ti.App.fireEvent("playBackMusic");
    };

    var showFlag;
    self.click_text = function() {
        showFlag = !Ti.App.Properties.getBool("show_text", Config.DEVICE_TYPE === "tablet");
        game.updatePlayButtons({ text: showFlag });
    };

    self.click_star = function() {
        game.window.confirmParent(function() {
            var RateMe = require('lib/RateMe');
            var iOSURL = RateMe.iOSURLFromAppId(Config.APP_ID);
            var googURL = RateMe.googURLFromAppId(Config.APP_DOMAIN);
            RateMe.showDialog(iOSURL, googURL, 1);
            RateMe = null;
        });
    };

    var playFlag = Ti.App.Properties.setString("read_mode", "read");
    self.click_play = function() {
        if (playFlag == "listen") {
            win.topScene().clickPause();
            playFlag = "read";
        } else {
            win.topScene().clickRead();
            playFlag = "listen";
        }
    };
    
    self.click_more_tales = function() {
        //Ti.App.fireEvent("goToPage", {
        //    index : 0
        //});

        game.window.confirmParent(function() {
            var url = Config.DEVELOPER_PAGE;
            Ti.App.fireEvent("trackMoreTales");
            Titanium.Platform.openURL(url);
        });
    };

    self.click_record2 = function() {
        
    };

    self.click_play_again = function() {
        Config.Globals.startReplay = true;
        flipSound.play();
        Ti.App.fireEvent("restartPage");
    };

    self.click_pause_record = function() {
        var scene = win.topScene();
        if (buttons.pause_record.backgroundImage === "/images/navigation/pause_record.png") {
            buttons.pause_record.backgroundImage = "/images/navigation/start_record.png";
            scene.pauseRecording();
            self.recordInd && self.recordInd.animate({ opacity: 0, duration: 0 });
        } else {
            buttons.pause_record.backgroundImage = "/images/navigation/pause_record.png";
            scene.resumeRecording();
            self.recordInd && self.recordInd.animate(
                { opacity: 1, duration: 1 },
                function() {
                    self.recordInd && self.recordInd.animate({
                        opacity: 0.3,
                        autoreverse: true,
                        repeat: 99999,
                        duration: 400
                    });
                }
            );
        }
    };

    self.click_stop_record = function() {
        
    };

    self.click_play_again = function() {
        Config.Globals.activeRecord.play();
    };
    
    self.click_delete_record = function() {
        var lng = Config.getCurrentLanguage();
        var alertDialog = Titanium.UI.createAlertDialog({
            title:   L(lng + "_delete_action"),
            message: L(lng + "_delete_prompt"),
            buttonNames: [L(lng + "_delete"), L(lng + "_cancel")],
            cancel: 1
        });
        alertDialog.addEventListener("click", function(evt) {
            if (evt.index === 0) {
                Config.Globals.activeRecord.delete();
                self.hideProgressBar();
                self.switchAllSounds(true);
                Ti.App.fireEvent("restartPage");
            }
        });
        alertDialog.show();
    };
    
    self.click_settings = function() {
        self.settings.show();
    };

    self.click_game_restart = function() {
        Ti.App.fireEvent("restartGame");
    };

    init();

    return self;

}



module.exports = Navigation;