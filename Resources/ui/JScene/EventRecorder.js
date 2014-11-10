var game2d = require('com.ti.game2d');
var _ = require('/lib/Underscore');
var isAndroid = !!Ti.Android;
var Config = require('config');


module.exports = {

    init: function(scene) {
        scene.recording = false;
        scene.lastRecord = [];
        scene.startRecordEvents = function(e) {
            Config.Globals.startRecording = true;
            Ti.App.fireEvent("restartPage");
        };
        scene.stopRecordEvents = function(e) {
            //save last record
            Config.Globals.lastRecord = JSON.parse(JSON.stringify(scene.lastRecord));
            //TODO add save to file 
            Config.Globals.startReplay = true;
            scene.lastRecord = null;
            Ti.App.fireEvent("restartPage");
        };
        
        scene.stopReplay = function() {
            scene.removeEventListener("enterframe", scene.frameEventPlayer);
            Ti.App.fireEvent("restartPage");

        };
        scene.pauseRecording = function() {
            scene.pauseStart = scene.game.uptime()  * 1000000;
            scene.recordingPaused = true;
            //scene.audioRecorder.pause();
        };
        scene.resumeRecording = function() {
            scene.pauseDelta = scene.game.uptime()  * 1000000 - scene.pauseStart;
            scene.recordingPaused = false;
            //scene.audioRecorder.resume();
        };
              
        scene.frameEventPlayer = function(e) {
            var currTime = e.uptime * 1000000;
            var rec = scene.lastRecord[0];
            if (rec){
                scene.game.navigation.updateProgressBar(rec.uptime);
            }
            
            if (rec && rec.uptime) {
                while (rec.uptime < currTime - scene.startPlayTime) {
                    rec.isReplay = true;
                    scene.game.fireEvent(rec.type, rec);
                    scene.lastRecord.shift();
                    rec = scene.lastRecord[0];
                    if (!rec) break;
                }
            }
            //Ti.API.info('REPLAYING ' +scene.lastRecord.length);
            if (scene.lastRecord.length == 0 ) {
                scene.removeEventListener("enterframe", scene.frameEventPlayer);
                scene.pageMode = scene.tl ? "normal" : "no_text";
                scene.game.navigation.replayFinished();
                //Ti.API.info('STOP REPLAY');
                scene.game.navigation.hideProgressBar();
                
            }
        };
        
        scene.startAudioRecording = function() {
            if (Ti.Media.audioPlaying) {
                scene.MUTE = true;
                scene.setTimeout(scene.startAudioRecording, 100);
                //Ti.API.info('WAIT FROM MUTE');
            } else {
                scene.MUTE = false;
                //Ti.API.info('CHANGE SESSION MODE');
                //Titanium.Media.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_PLAY_AND_RECORD;
                //if (Config.OS_FAMILY === "ios") Ti.Media.startMicrophoneMonitor();
                //scene.audioRecorder = Ti.Media.createAudioRecorder({
                //	compression: Ti.Media.AUDIO_FORMAT_AAC, 
                //    format: Ti.Media.AUDIO_FILEFORMAT_MP4A
                //});
                //Ti.API.info('START RECORDING');
                //scene.audioRecorder.start();
                
                //scene.audioRecorder = audioRecorder;
                //scene.audioRecorder.init();
                //scene.audioRecorder.start();
                
            }
        };
        
        scene.addEventListener('startAnimationFinished', function(){
            if (Config.Globals.startRecording) {
                scene.pauseStart = 0;
                scene.pauseDelta = 0; 
                scene.pageMode = "record";
                scene.game.navigation.hideMenu();
                
                scene.startAudioRecording();
                scene.recording = true;
                Config.Globals.startRecording = false;
                scene.lastRecord = [];
                scene.startRecTime = scene.game.uptime()  * 1000000;
                Config.Globals.startRecTime = scene.startRecTime;
                
                Ti.API.debug("EventRecorder | startAnimationFinished | if (Config.Globals.startRecording)");
            } else {
                if (Config.Globals.startReplay) {
                    Titanium.Media.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_AMBIENT;
                    scene.pageMode = "replay";
                    Config.Globals.startReplay = false;
                    scene.game.navigation.hideMenu();
                    if (Config.Globals.lastRecordSound != null) {
                        scene.audioPlayer = Ti.Media.createSound({url: Config.Globals.lastRecordSound, volume: 1});
                        scene.audioPlayer.play();
                    }
                    scene.startPlayTime = scene.game.uptime() * 1000000;
                    scene.lastRecord = Config.Globals.lastRecord || [];
                    scene.startRecTime = Config.Globals.startRecTime;
                    /////////////
                    if (scene.lastRecord.length!=0){
                        var len=scene.lastRecord.length-1; 
                        scene.game.navigation.showProgressBar(scene.lastRecord[0].uptime, scene.lastRecord[len].uptime);
                    }
                    /////////////  
                    
                    scene.startRecTime = Config.Globals.startRecTime;    
                    scene.addEventListener("enterframe", scene.frameEventPlayer);
                }
            }
        });
        scene.recordOneEvent = function(e) {
            if (scene.recordingPaused) return false;
            e = JSON.parse(JSON.stringify(e));
            e.uptime = scene.game.uptime() * 1000000 - scene.startRecTime - scene.pauseDelta;
            Ti.API.debug("EventRecorder | scene.recordOneEvent | e = ", e);
            if (e.points) {
            	for (var i=0; i < e.points.length; i++) {
	                delete e.points[i].globalPoint;
	            }
            }
            delete e.source;
            delete e.bubbles;
            delete e.cancelBubble;
            delete e.globalPoint;
            delete e.x;
            delete e.y;
            scene.lastRecord.push(e);
            return true;
        };

        return scene;

    }

};
