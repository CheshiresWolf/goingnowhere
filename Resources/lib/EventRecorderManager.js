var FOLDER = Ti.Filesystem.applicationDataDirectory + "events";
var SOUND_EXT = '.m4a';
var NAME_FORMAT_SAVE = 'YYYY-MM-DD_HH-mm';
var NAME_FORMAT_READ = "D MMM YYYY, HH:mm";
var moment = require('lib/moment');
var isAndroid = !!Ti.Android;
var Config = require('config');
var _ = require('lib/Underscore');

function EventRecorderManager() {
    this.pageIndex = Ti.App.Properties.getInt("lastPage", 0);
    this.list = [];
    var base_folder = Ti.Filesystem.getFile(FOLDER);
    if (!base_folder.exists()) {
        base_folder.createDirectory();
    }
    this.folder = Ti.Filesystem.getFile(FOLDER + "/" + this.pageIndex);
    if (!this.folder.exists()) {
        this.folder.createDirectory();
    }
}

EventRecorderManager.prototype.load = function() {
    var flist = this.folder.getDirectoryListing();
    var list = [];
    var pageIndex = this.pageIndex;
    _.each(flist, function(f) {
        //Ti.API.info(f);
        var ei = new EventRecordItem();
        ei.pageIndex = pageIndex;
        if (ei.load(f, pageIndex)) {
            list.push(ei);
        }
    });
    this.list = list;
};

EventRecorderManager.prototype.showUI = function(view, onNew, onReplay, onCancel, onAnyway) {

    var iphone = Ti.Platform.osname === "iphone";
    var lng = Config.getCurrentLanguage();

    var buttons = [L(lng + "_recording_new")].concat(_.pluck(this.list, "readableName"));
    if (iphone) buttons = [L(lng + "_cancel")].concat(buttons);

    var self = this;
    var opts = {
        title: L(lng + "_recording_new_prompt"),
        options: buttons,
        cancel: iphone ? 0 : -1,
        destructive: 0
    };

    var dialog = Ti.UI.createOptionDialog(opts);
    dialog.addEventListener("click", function(e) {
        var listStart = iphone ? 2 : 1;
        if (e.index === listStart - 1) {
            onNew && onNew();
            self.startRecord();
            Ti.App.fireEvent("trackRecord", { newRecord: true });
        } else if (e.index >= listStart) {
            onReplay && onReplay();
            self.list[e.index - listStart].play();
            Ti.App.fireEvent("trackRecord", { newRecord: false });
        } else {
            onCancel && onCancel();
        }
        onAnyway && onAnyway();
    });

    dialog.show({
        view: view,
        animated: true
    });

};

EventRecorderManager.prototype.startRecord = function() {
    Config.Globals.startRecording = true;
    Ti.App.fireEvent("restartPage");
};

function EventRecordItem(events, sound) {
    this.pageIndex = Ti.App.Properties.getInt("lastPage", 0);
    this.events = [];
    this.sound = null;
    this.name = moment().format(NAME_FORMAT_SAVE);
    this.calcLength();
};

EventRecordItem.prototype.init = function(events, sound) {
    this.pageIndex = Ti.App.Properties.getInt("lastPage", 0);
    this.events = events || [];
    this.sound = sound || null;
    this.name = moment().format(NAME_FORMAT_SAVE);
    this.calcLength();
};

EventRecordItem.prototype.getName = function() {
    var m = moment(this.name, NAME_FORMAT_SAVE);
    return m.format(NAME_FORMAT_READ);
};

EventRecordItem.prototype.load = function(name, pageIndex) {
    this.name = name;
    this.readableName = this.getName();
    this.pageIndex = pageIndex;
    var file = Ti.Filesystem.getFile(FOLDER + "/" + this.pageIndex + "/" + name + "/data.events");
    if (file.exists()) {
        var blob = file.read();
        if (blob != null) {
            try {
                this.events = JSON.parse(blob.text);
                this.calcLength();
                return true;
            }catch(e){
                //Ti.API.info(e);
                //Ti.API.info('READ FAILED: ' + FOLDER + "/" + this.pageIndex + "/" + name + "/data.events")
                return false;
            }
        }
    }
    return false;
};

EventRecordItem.prototype.delete = function() {
    var folder = Ti.Filesystem.getFile(FOLDER + "/" + this.pageIndex + "/" + this.name);
    if (folder.exists()) {
        folder.deleteDirectory(true);
    }
};

EventRecordItem.prototype.save = function() {
    var folder = Ti.Filesystem.getFile(FOLDER + "/" + this.pageIndex + "/" + this.name);
    if (!folder.exists()) {
        folder.createDirectory();
    }
    //Ti.API.info(FOLDER + "/" + this.pageIndex + "/" + this.name + "/data.events");
    var file = Ti.Filesystem.getFile(FOLDER + "/" + this.pageIndex + "/" + this.name + "/data.events");
    file.write(JSON.stringify(this.events));
    file = null;
    if (this.sound != null) {
        this.sound.move(FOLDER + "/" + this.pageIndex + "/" + this.name + "/sound" + SOUND_EXT);
        this.sound = Ti.Filesystem.getFile(this.getSoundPath());
    }
};

EventRecordItem.prototype.calcLength = function() {
    this.length = "3 min";
};

EventRecordItem.prototype.getSoundPath = function() {
    return (FOLDER + "/" + this.pageIndex + "/" + this.name + "/sound" + SOUND_EXT);
};

EventRecordItem.prototype.play = function() {
    Config.Globals.lastRecordItem = this;
    Config.Globals.lastRecord = JSON.parse(JSON.stringify(this.events));
    //copy
    Config.Globals.lastRecordSound = this.sound != null ?  this.getSoundPath() : this.getSoundPath();// null;
    //copy
    Config.Globals.startReplay = true;
    Config.Globals.activeRecord = this;
    Ti.App.fireEvent("restartPage");
};

module.exports.EventRecordItem = EventRecordItem;
module.exports.EventRecorderManager = EventRecorderManager;
