//=========================<INIT>=========================

var packs = [];
var currentLevel;
var currentPack;

var initialLoad = false;

//=========================<UTILS>=========================

//Search level packs in default app foler
function loadLocalPacks() {
    var packDir = Titanium.Filesystem.getResourcesDirectory() + "levels";
    var dir = Titanium.Filesystem.getFile(packDir);
    var dir_files = dir.getDirectoryListing();

    for (var i = 0; i < dir_files.length; i++) {
        var file = Titanium.Filesystem.getFile(packDir + "/" + dir_files[i]);
        if (file.isDirectory()) {
            packs.push(new Pack(dir_files[i]));
        }
    }
}

/*
* Search level packs in external folder (e.g. in Downloads folder).
* This function changes based of level pack download format (e.g. ZIP)
*/
function loadExternalPacks() {

}

function parseFile(path) {
    var file = Titanium.Filesystem.getFile(path);
    return JSON.parse(file.read().text);
}

//=========================<CLASS>=========================

function Pack(name) {
    var self = this;

    var levels = null;

    self.name  = name;
    self.dir   = Titanium.Filesystem.getResourcesDirectory() + "levels/" + self.name;
    self.image = self.dir + "/pack.png";

    self.loadLevels = function(forseFlag) {
        if ( (levels == null) || forseFlag) {
            levels = [];
            readFilesFromDisk();
        }
    };

    self.unloadLevels = function() {
        levels = null;
    };

    /*
    * If forgetFlag == true level isn't saved to currentLevel,
    * used only for get information about next/prev levels.
    */
    self.levelByIndex = function(index, forgetFlag) {
        if (index >= levels.length) {
            return -1;
            //index = levels.length - 1;
        }

        if (forgetFlag == undefined) currentLevel = levels[index];
        return levels[index];
    };

    /*
    * If forgetFlag == true level isn't saved to currentLevel,
    * used only for get information about next/prev levels.
    */
    self.levelByName = function(name, forgetFlag) {
        for (var key in levels) {
            if (levels[key].getName() == name) {
                if (forgetFlag == undefined) currentLevel = levels[key];
                return currentLevel;
            }
        }

        return -1;
    };

    self.levelsAmount = function() {
        return levels.length;
    };

    self.locked = Ti.App.Properties.getString(self.name + "_locked", true);

    self.unlock = function() {
        self.locked = false;

        Ti.App.Properties.setString(self.name + "_locked", false);
    };

    function readFilesFromDisk() {
        if (levels.length > 0) {
            levels = [];
        }

        var index = 1;
        var bufPath = self.dir + "/00" + index + ".json";
        var bufLevelPath = Titanium.Filesystem.getFile(bufPath);
        var lastOpenedLevel = Ti.App.Properties.getInt(self.name + "_lastOpenedLevel", 0);

        //var bufLock = !!(lastOpenedLevel > index);
        while (bufLevelPath.exists()) {
            var locked = !!(lastOpenedLevel < (index - 1));
            var bufLevel = new Level({
                filePath : bufLevelPath.resolve(),
                dirPath  : self.dir + "/",
                packName : self.name,
                index    : index - 1,
                locked   : locked
            });
            Ti.API.debug("LevelManager | Pack | readFilesFromDisk | " + locked + " : " + lastOpenedLevel + " < " + index + " - 1");

            levels.push(bufLevel);
            index++;
            
            bufPath = self.dir + ( (index > 9) ? ( (index > 99) ? "/" : "/0" ) : "/00" ) + index + ".json";
            bufLevelPath = Titanium.Filesystem.getFile(bufPath);
        }

        Ti.API.debug("LevelManager | Pack | readFilesFromDisk | Pack(" + self.name + ") sucessfuly load " + levels.length + " levels.");
    }

    return self;
}

function Level(opts) {
    var self = this;

    var filePath = opts.filePath;
    var dirPath  = opts.dirPath;

    var template = null;

    self.getFile = function() {
        return filePath;
    };

    self.getDir = function() {
        return dirPath;
    };

    self.getTemplate = function() {
        if (template == null) {
            template = parseFile(filePath);
        }

        return template;
    };

    self.getName = function() {
        if (template == null) {
            self.getTemplate();
        }

        return template.name;
    };

    self.saveScore = function(amount) {
        Ti.API.debug("LevelManager | self.saveScore | amount : " + amount + ", score : " + score);
        if (amount > score) {
            var oldGS = Ti.App.Properties.getInt("global_score", 0);
            oldGS += (amount - score);
            Ti.App.Properties.setInt("global_score", oldGS);

            score = amount;
            Ti.App.Properties.setInt(self.getName() + "_score", score);
        }

        return true;
    };

    self.getScore = function() {
        return Ti.App.Properties.getInt(self.getName() + "_score", 0);
    }

    self.setBestTime = function(newTime) {
        var time = Ti.App.Properties.getInt(self.getName() + "_best_time", 0);

        if (time == 0) {
            time = newTime;
        } else {
            if (newTime < time) {
                time = newTime;
            }
        }

        Ti.App.Properties.setInt(self.getName() + "_best_time", time);

        return time;
    };

    self.getBestTime = function(newTime) {
        return Ti.App.Properties.getInt(self.getName() + "_best_time", 0);
    };

    self.index    = opts.index;
    self.packName = opts.packName;
    self.locked   = opts.locked;

    var score = self.getScore();

    self.unlock = function() {
        self.locked = false;

        var oldIndex = Ti.App.Properties.getInt(self.packName + "_lastOpenedLevel", 0);
        if (self.index > oldIndex) {
            Ti.App.Properties.setInt(self.packName + "_lastOpenedLevel", self.index);
        }
    };

    return self;
}

//=========================<MODULE>=========================

module.exports = {
    load : function() {
        if (!initialLoad) {
            initialLoad = true;
            loadLocalPacks();
            loadExternalPacks();
            Ti.API.debug("LevelManager | load | Loaded " + packs.length + " packs.");
        } else {
            Ti.API.debug("LevelManager | load | Paks was already loaded. If you want reread pack folders use .reload() insted.");
        }
    },
    reload : function() {
        packs = [];

        loadLocalPacks();
        loadExternalPacks();
    },
    packsAmount : function() {
        return packs.length;
    },
	packByIndex : function(index, forgetFlag) {
        if (index >= packs.length) {
            //index = packs.length - 1;
            return -1;
        }

        if (forgetFlag == undefined) currentPack = packs[index];
        return packs[index];
    },

    packByName : function(name) {
        for (var key in packs) {
            if (packs[key].name == name) {
                currentPack = packs[key];
                return currentPack;
            }
        }

        return -1;
    },
    getCurrentLevel : function() {
        return currentLevel;
    },
    getCurrentPack : function() {
        return currentPack;
    },
    getNextLevel : function(index) {
        return currentPack.levelByIndex(currentLevel.index + 1, true);
    },
    restartLevel : function() {
        Ti.App.fireEvent("goToPage", {
            index : 2,
            packName : currentPack.name,
            levelIndex : currentLevel.index
        });
    }
};