var Config = require("config");
var _ = require('lib/Underscore');

//window refesh flags
var oldLang, oldText, oldListen;//, oldSyllable;
var iphoneFlag = (Ti.Platform.osname === "iphone");

function SettingsMenu(game, win, langButtons) {

    var self = this;
    
    function Checkbox(params, callback) {

        var self = Ti.UI.createImageView(params);

        var checked = params.value;

        function updateImage() {
            self.image = "/images/navigation/checkbox_" + (checked ? "on" : "off") + ".png";
        }

        self.getValue = function() { return checked };
        self.setValue = function(value) {
            checked = value;
            updateImage();
        };

        self.addEventListener("click", function(e) {
            checked = !checked;
            updateImage();
            callback && callback(e);
        });

        updateImage();

        return self;
    }
    
    var view = Ti.UI.createView({
        backgroundImage : "/images/navigation/settings_background_80.png",
        //backgroundColor: "black",
        opacity : 0,
        visible : false,
        zIndex : 100
    });
    win.add(view);

    var close = Ti.UI.createButton({
        left : (iphoneFlag) ? 355 : 615,//iphoneFlag ? 370 : 642,// * sx,
        top : (iphoneFlag) ? 15 : 230,//iphoneFlag ? 0 : 154,// * sy,
        width : (iphoneFlag) ? 35 : 47,//iphoneFlag ? 40 : (94 * sx / 2),
        height : (iphoneFlag) ?  35 : 48,//iphoneFlag ? 40 : (96 * sy / 2),
        backgroundImage : "/images/navigation/close.png"
    });

    var holder = Ti.UI.createView({
        backgroundImage: "/images/navigation/background_settings_small.png",
        top : (iphoneFlag) ? 25 : 249,
        left : (iphoneFlag) ? 105 : 377,
        width : 270,
        height : 270,
        bubbleParent: false
    });
    view.add(holder);
    view.add(close);
    
    //self.readSwitch = null;
    fillSettings(self, holder);

    self.show = function() {
        oldLang = Config.getCurrentLanguage();
        oldText = Ti.App.Properties.getBool("show_text", false);
        oldListen = Ti.App.Properties.getString("read_mode", "read");
        
        if (self.readSwitch) {
            self.readSwitch.setValue(
                Ti.App.Properties.getBool( "show_text", (Ti.Platform.osname == "ipad") )
            );
        } else {
            // Ti.API.info("SettingsMenu | show | readSwitch undefined");
        }
        if (self.listenSwitch) {
            self.listenSwitch.setValue(Ti.App.Properties.getString("read_mode", "read") == "listen");
        } else {
            // Ti.API.info("SettingsMenu | show | listenSwitch undefined");
        }

        view.show();
        view.animate({
            opacity : 1,
            duration : 300
        });

        // Ti.API.info("SettingsMenu | self.show");
    };
    
    self.hide = function() {
        view.animate({
            opacity : 0,
            duration : 300
        }, function() {
            var refresh = false;
            
            if (oldLang != Config.getCurrentLanguage()) {
                refresh = true;
            }
            
            view.hide();

            if (refresh) {
                Ti.App.fireEvent("goToPage", {
                    index : win.topScene().page_index
                });
            }

            // Ti.API.info("SettingsMenu | self.hide | [ " + oldLang + "," + oldListen + "," + oldText + " ]");
        });
    };

    close.addEventListener("click", self.hide);

    function fillSettings() {
        var newLng = Config.getCurrentLanguage();
        
        //===============================<SoundSliders>===============================
        var musicLabel = Titanium.UI.createLabel({
            top: 22,//iphoneFlag ? 20 : 30,
            left: 22,
            text: L("settings_music_volume_" + newLng),
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            font: {
                fontSize: 18//(iphoneFlag < 1) ? 12 : 18,
            }
        });

        var musicSlider = Titanium.UI.createSlider({
            top: 47,//(iphoneFlag) ? 30 : 47,// * sy
            left: 22,// * iphoneFlag,
            min: 0,
            max: 1,
            width: 186,// * iphoneFlag,// * sx
            value: Ti.App.Properties.getDouble("music_volume", 0.2),
        });
        
        var musicIcon = Titanium.UI.createImageView({
            image: "/images/navigation/sound_icon2.png",
            top: 47,// * iphoneFlag,// * sy
            right: 22,// * iphoneFlag,// * sx
            width: 30,// * iphoneFlag,// * sx
            height: 30,// * iphoneFlag// * sy
        });
        
        musicSlider.addEventListener('change', function(e) {
            win.changeVolumeOfBackMusic(e.value);
        });
        
        holder.add(musicLabel);
        holder.add(musicSlider);
        holder.add(musicIcon);

        var voiceLabel = Titanium.UI.createLabel({
            top: 82,//82 * iphoneFlag,//iphoneFlag ? 20 : 30,
            left: 22,// * iphoneFlag,
            text: L("settings_voice_volume_" + newLng),
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            font: {
                fontSize: 18,//(iphoneFlag < 1) ? 12 : 18,
            }
        });
        
        var voiceSlider = Titanium.UI.createSlider({
            top: 107,//(iphoneFlag < 1) ? 75 : 107,// * sy
            left: 22,// * iphoneFlag,
            min: 0,
            max: 1,
            width: 186,// * iphoneFlag,// * sx
            value: 1,
        });
        
        var voiceIcon = Titanium.UI.createImageView({
            image: "/images/navigation/voice_icon.png",
            top: 107,//107 * iphoneFlag,// * sy
            right: 22,// * iphoneFlag,// * sx
            width: 30,// * iphoneFlag,// * sx
            height: 30,// * iphoneFlag// * sy
        });
        
        voiceSlider.addEventListener('change', function(e) {
            Ti.App.Properties.setDouble("read_volume", e.value);
            try { win.topScene().setReadSoundVolume(e.value); }
            catch(e) {}
        });
        
        holder.add(voiceLabel);
        holder.add(voiceSlider);
        holder.add(voiceIcon);

        var effectsLabel = Titanium.UI.createLabel({
            top: 142,// * iphoneFlag,//iphoneFlag ? 20 : 30,
            left: 22,// * iphoneFlag,
            text: L("settings_effects_volume_" + newLng),
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            font: {
                fontSize: 18//(iphoneFlag < 1) ? 12 : 18,
            }
        });
        
        var effectsSlider = Titanium.UI.createSlider({
            top: 167,//(iphoneFlag < 1) ? 120 : 167,// * sy
            left: 22,// * iphoneFlag,
            min: 0,
            max: 1,
            width: 186,// * iphoneFlag,// * sx
            value: 0.5,
        });
        
        var effectsIcon = Titanium.UI.createImageView({
            image: "/images/navigation/effects_icon.png",
            top: 167,// * iphoneFlag,// * sy
            right: 22,// * iphoneFlag,// * sx
            width: 30,// * iphoneFlag,// * sx
            height: 30,// * iphoneFlag// * sy
        });
        
        effectsSlider.addEventListener('change', function(e) {
            Ti.App.Properties.setDouble("effects_sound", e.value);
        });
        
        holder.add(effectsLabel);
        holder.add(effectsSlider);
        holder.add(effectsIcon);
        //==============================</SoundSliders>===============================
        
        //===============================<Switches>===============================

        self.readSwitch = new Checkbox({
            width: 30,// * iphoneFlag,
            height: 30,// * iphoneFlag,
            left: 7,
            value: Ti.App.Properties.getBool("show_text", Ti.Platform.osname == "ipad")
        }, function(e) {
            game.navigation.click_text();
        });
        
        var readLabel = Titanium.UI.createLabel({
            width: 55,// * iphoneFlag,
            text: L("settings_text_" + newLng),
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            font: {
                fontSize: 18//(iphoneFlag < 1) ? 12 : 18,
            }
        });
        
        self.listenSwitch = new Checkbox({
            width: 30,// * iphoneFlag,
            height: 30,// * iphoneFlag,
            left: 10,
            value: Ti.App.Properties.getString("read_mode", "read") === "listen"
        }, function() {
            // game.navigation.click_play();
            if (self.listenSwitch.getValue()) {
                win.topScene().clickRead();
            } else {
                win.topScene().clickPause();
            }
        });
        
        var listenLabel = Titanium.UI.createLabel({
            width: 83,// * iphoneFlag,
            left: 7,
            text: L("settings_read_" + newLng),
            textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
            font: {
                fontSize: 18//(iphoneFlag < 1) ? 12 : 18,
            }
        });
                        
        var modeView = Ti.UI.createView({
            layout: "horizontal",
            width: 226,// * iphoneFlag,
            height: 30,// * iphoneFlag,
            bottom : 22,// * iphoneFlag,
            left: 22// * iphoneFlag
        });
        
        modeView.add(readLabel);
        modeView.add(self.readSwitch);
        modeView.add(listenLabel);
        modeView.add(self.listenSwitch);
        
        holder.add(modeView);

        //===============================</Switches>===============================

    }
    
    return self;
}

module.exports = SettingsMenu;