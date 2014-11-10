var Config = require("config");

function SoundManager() {
    var self = this;

    var music = null;
    var playList = (Config.MUSIC_PLAYLIST) ? Config.MUSIC_PLAYLIST : [];
    var index = -1, oldIndex = -1;

    var stop_playing_music = !Ti.App.Properties.getBool("music", true);

    self.play = function(songIndex, volume) {
        Ti.API.debug("SoundManager | play | soungIndex : " + songIndex + ", volume : " + volume);

        if (songIndex != index) {
            index = (songIndex != undefined) ? songIndex : oldIndex;
            var v = (volume != undefined) ? volume : Ti.App.Properties.getDouble("music_volume", 1);

            if (!stop_playing_music) {
                initSound(index, v);
            } else {
                oldIndex = index; 
            }
        } else {
            Ti.API.debug("SoundManager | play | songIndex == index");
        }
    }

    self.stop = function() {
        if (music != null) {
            music.stop();
            music.release();
            music = null;

            oldIndex = index;
        }
    };

    self.mute = function() {
        stop_playing_music = true;
        self.stop();
    };

    self.unmute = function() {
        stop_playing_music = false;
        self.play();
    };

    self.changeVolume = function(volume) {
        if (volume > 1) volume = 1;
        if (volume < 0) volume = 0;

        Ti.App.Properties.setDouble("music_volume", volume);
        music.volume = volume;
    };

    self.nowPlayingIndex = function() {
        return index;
    };

    self.nowPlayingUrl = function() {
        if (index == -1) {
            Ti.API.debug("SoundManager | nowPlayingUrl | Nothing is playing at this moment.");
            return;
        }

        return playList[index];
    };

    function initSound(i, volume) {
        self.stop();

        music = Ti.Media.createSound({
            looping : true,
            volume  : volume,
            url : playList[i]
        });
        music.play();
    }

    return self;
}

module.exports = new SoundManager();