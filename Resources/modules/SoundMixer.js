/*
Todo:
	Fade music
	stack / prioritize music
	delay
	looping

	stop everything without killing (pause/resume)




	play/pause/stop/release an effects sound at channel "effects"|"ambient"|"voice"|"ui"
	push/pop sound to "music"|"story"
	play|pause|stop|release sound at "music"|"story"



	sound extended with
		localVolume: <float> = 1.0
		delay: <int> = 0
		// looping: <Boolean> = false
		channel: "ui" | "music" | "story" | "effects" | "ambient" | "voice"
		fadingIntervalID: <int>
		delayTimeoutID: <int>

	Depencies on Config:
		getCurrentLanguage() - required for sounds with "%lng%" in url
		DEFAULT_SOUND_FORMAT || ".mp3"
		NO_MUSIC || false

*/

var _      = require("lib/Underscore");
var Config = require("Config");



var android       = Ti.Platform.osname === "android";
var basePath      = android ? "Resources/sounds/" : "/sounds/"
var defaultFormat = Config.DEFAULT_SOUND_FORMAT || ".mp3";



var getStoredVolume = Ti.App.Properties.getDouble;

var volumes = {
	ui:      getStoredVolume("volume_ui",      0.75),
	music:   getStoredVolume("volume_music",   0.33),
	story:   getStoredVolume("volume_story",   1.00),
	effects: getStoredVolume("volume_effects", 0.50),
	ambient: getStoredVolume("volume_ambient", 0.25),
	voice:   getStoredVolume("volume_voice",   0.66)
};


var muted = {
	ui:      false,
	music:   false,
	story:   false,
	effects: false,
	ambient: false,
	voice:   false
};



var sounds = {
	ui:      [],
	music:   null,
	story:   null,
	effects: [],
	ambient: [],
	voice:   []
};



// ===== Tools =====

	// 0..1
	function validateVolume(v) {
		if (isNaN(parseFloat(v)) || !isFinite(v)) v = 1;
		return Math.max(0, Math.min(1, v));
	}



	function Sound(params, channel, volume) {

		var sound = this;

		if (params.delay !== undefined) sound.delay = params.delay;
		if (channel !== undefined) sound.channel = channel;

		// Proxie's target
		params = _.omit(params, "delay");
		var object = android ? game2d.createSoundPool(params) : Ti.Media.createSound(params);

		if (!object) return;

		sound.play = function() {
			if (sound.delay === undefined && sound.delayTimeoutID === undefined) {
				object.play();
			} else {
				sound.delayTimeoutID = setTimeout(function() {
					object.play();
					sound.delayTimeoutID = -1;
				}, sound.delay);
			}
		};

		sound.stop = function(release) {
			var dID = "delayTimeoutID";
			var fID = "fadingIntervalID";
			if (sound[dID] && sound[dID] !== -1) { clearTimeout(sound[dID]);  sound[dID] = -1; }
			if (sound[fID] && sound[fID] !== -1) { clearInterval(sound[fID]); sound[fID] = -1; }
			object.stop();
			release && object.release();
		};

		// sound.getVolume = function() {
		// 	return object.volume;
		// };
		sound.setVolume = function(v) {
			// function getRealVolume(channel, sound) {
			// 	if (!(channel in volumes) || muted[channel]) return 0;
			// 	var v = 1;
			// 	if (sound && sound.localVolume !== undefined) v = sound.localVolume;
			// 	return v * volumes[channel];
			// }
			object.volume = v;
		};
		sound.updateVolume = function() {
			if (!sound.channel || !(sound.channel in volumes)) return;

		};
		sound.isPlaying = function() {
			return (sound.delayTimeoutID && sound.delayTimeoutID !== -1) || object.playing;
		};

		
		sound.volume = validateVolume(params.volume) * validateVolume(volume);
		sound.updateVolume();


	}



	// basePath + url + format
	function constructUrl(url) {

		var filename = url.substr(url.lastIndexOf("/") + 1);
		if (filename.indexOf(".") === -1) url += defaultFormat;

		return basePath + url;

	}

	function getFinishedSound(sounds) {
		var result = null;
		sounds && sounds.some(function(s) {
			if (s && s.isPlaying()) {
				result = s;
				return true;
			}
		});
		return result;
	}

	function rememberSound(sound, channel, url, additive) {
		if (additive && sounds[channel][url]) {
			sounds[channel][url].push(sound);
		} else {
			sounds[channel][url] = [ sound ];
		}
	}

	function stopSounds(channel, url) {
		var ch = sounds[channel];
		if (!ch[url]) return;
		ch[url].forEach(
			function(s, i, a) {
				// safeStopSound(s, i !== 0);
				s && s.stop(i !== 0);
				if (i !== 0) delete a[i];
			}
		);
		ch[url] = ch[url].slice(0, 1);
	}
	

	function fadeVolume(sound, volume, time, callback) {

		// XXX

		return;

		if (!sound || volume === undefined) return; // callback
		if (time === undefined) time = 1000;

		if (sound.fadingIntervalID !== -1) {
		    clearInterval(sound.fadingIntervalID);
		    sound.fadingIntervalID = -1;
		}

		var start = validateVolume(sound.volume);
		var end   = validateVolume(sound.localVolume * volume);
		var current, step;
		var frequency = 50;

		if (Math.abs(start - end) < 0.001) return; // callback

		current = start;
		step = (end - start) / (time / 1000) / frequency;

		sound.fadingIntervalID = setInterval(function() {

		    current = validateVolume(current + step);
		    if (Math.abs(current - end) < 0.001) {
		    	callback && callback();
		        clearInterval(sound.fadingIntervalID);
		        sound.fadingIntervalID = -1;
		    }
		    sound.volume = current;

		}, 1000 / frequency);

	}
	
// =================




function updateVolumes(channel) {

	if (!channel) {
		for (channel in volumes) updateVolumes(channel);
		return;
	}

	if (!(channel in volumes)) return;

	if (channel.match(/music|story/)) {

		var sound = sounds[channel];
		sound && sound.updateVolume();

	} else {
		var ch = sounds[channel];
		for (var url in ch) {
			ch[url] && ch[url].forEach(function(sound) {
				sound.updateVolume();
			});
		}

	}

}



// ===== Channels =====

	function getVolume(channel) {
		return volumes[channel];
	}

	function setVolume(channel, value, forceUpdateSounds) {
		if (!(channel in volumes) || value === undefined) return;
		volumes[channel] = value;
		Ti.App.Properties.setDouble("volume_" + channel, value);
		forceUpdateSounds && updateVolumes(channel);
	}

	function enableChannel(channel, enable, forceUpdate) {

		// if channel array

		if (channel && !(channel in volumes)) return;

		if (channel) {
			muted[channel] = enable;
		} else {
			for (var ch in muted) muted[ch] = enable;
		}

		forceUpdate && updateVolumes(channel);

	}

// ====================


/**
 * `url` may be:
 *     url       - path relative to default sounds folder.
 *                 May omit file extension, in this case will be
 *                 replaced by Config.DEFAULT_SOUND_FORMAT or .mp3
 *     object    - its url must be absolute,
 *     array     - will pick and play one randomly
 *     %lng% will be replaced with current language.
 * `channel` := "ui" | "music" | "story" | "effects" | "ambient" | "voice"
 *     Channels "music" and "story" may have only one active sound.
 *     Default channel is "effects"
 * `ignoreExisting` allows to play several instances of same sound at the same time
 */
function play(url, channel, volume, ignoreExisting) {

	if (!url) return null;

	if (!(channel in volumes)) channel = "effects";

	if (_.isArray(url)) {
		// play one random valid sound
		return _.shuffle(url).some(function(sound) {
			play(channel, sound, volume, ignoreExisting);
		});
	}


	// Proceed params
	var soundParams = _.isObject(url) ? url : { url: constructUrl(url) };
	if (!soundParams.url) return null;
	soundParams.url = soundParams.url.replace("%lng%", Config.getCurrentLanguage());
	url = soundParams.url;


	var sound;

	if (channel.match(/music|story/)) {

		return {};

		// if (channel === "music" && Config.NO_MUSIC) return {};

		// sound = sounds[channel];
		// sound && sound.stop(true); // XXX don't auto release?
		// sound = new Sound(soundParams, channel, volume);
		// if (!sound) return null;
		// sounds[channel] = sound;

	} else {

		sound = sounds[channel][url];
		var completed = getFinishedSound(sound);

		if (!sound || !completed && ignoreExisting) {
			// there is no sound available for re-use, so create new
			sound = new Sound(soundParams, channel, volume);
			if (!sound) return null;
			rememberSound(sound, channel, url, ignoreExisting);
		} else {
			// there is a free sound or bunch of them, so find it and re-use
			if (!ignoreExisting) {
				// stop all sounds and clear all but one
				stopSounds(channel, url);
				sound = sound[0];
			} else {
				sound = completed;
			}
			sound.updateVolume();
		}

	}

	sound.play();

	return sound;

}


// function pause?

function push(channel, level, url) {

}

function pop(channel, level) {

}

function remove(channel, level, url) {}


function stop(url, channel) {

}



function release(channel) {

	if (channel && !(channel in volumes)) return;

	if (!channel) {
		for (channel in sounds) release(channel);
	} else {

		if (channel.match(/music|story/)) {
			sounds[channel] && sounds[channel].stop(true);
			sounds[channel] = null;
			return;
		}
		var ch = sounds[channel];
		for (var url in ch) {
			[].concat(ch[url]).forEach(function(s, i, a) {
				s && s.stop(true);
				delete a[i];
			});
			delete ch[url];
		}
		sounds[channel] = [];

	}

}


// function replace() {}

