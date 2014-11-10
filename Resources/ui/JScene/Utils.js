var isAndroid = !!Ti.Android;



function putTimeStamp() {
    var d = new Date();
    return [ "Hours", "Minutes", "Seconds", "Milliseconds" ].map(
        function(e, i) {
            e = d["get" + e]();
            if (i < 3)   return e < 10 ? "0" + e : e;
            if (e <  10) return "00" + e;
            if (e < 100) return "0"  + e;
            return e;
        }
    ).join(":");
}



/**
 * Works similar to JSON.stringify except for the output is more accurate.
 * Doesn't work with circular structures.
 * @param {Object} obj Object to stringify
 * @param {Boolean} [multiline=false] If false will return single line
 * @param {String} [prefix] Used for identation, you'd probably want to leave it blank
 * @return {String} Stringified object
 * Todo: different arrays stringify
 */
function prettyStringify(obj, multiline, prefix) {

    try {
        JSON.stringify(obj);
    } catch(e) {
        return "Can't stringify " + obj;
    }
    if (obj !== Object(obj)) return Object.prototype.toString.call(obj);

    result = "{";
    var keys = Object.keys(obj);
    if (keys.length > 0) {
        prefix = prefix || "";
        result += multiline ? "\n" : " ";
        Object.keys(obj).forEach(function(key, i, arr) {
            if (multiline) result += prefix + "\t";
            if (key.indexOf(":") !== -1) {
                result += "\"" + key + "\"";
            } else {
                result += key;
            }
            result += ": ";
            if (obj[key] === Object(obj[key])) {
                result += prettyStringify(obj[key], multiline, prefix + "\t");
            } else {
                result += JSON.stringify(obj[key]);
            }
            if (i < arr.length - 1) result += multiline ? ",\n" : ", ";
        });
        result += multiline ? "\n" + prefix + "}" : " }";
    } else {
        result += "}";
    }
    return result;
}



module.exports = {

    /**
     * Fix url by getting rid of ".."
     */
    normalize: function(str) {

        var a = str.split("/");

        var res = [];
        for (var i = 0; i < a.length; i++) {
            if (a[i] == "..") {
                res.pop();
            } else {
                res.push(a[i]);
            }
        }

        var scheme = "";
        var url;

        if (res[0].length > 0 && res[0].indexOf(":") === res[0].length - 1 && !res[1]) {
            scheme = res[0] + "//";
            url = res.slice(2);
        } else {
            url = res;
        }

        url = url.join("/").replace(/\/{2,}/g, "/");

        return scheme + url;

    },



    px2dip: function (ThePixels) {
        return isAndroid ? (ThePixels / (Titanium.Platform.displayCaps.dpi / 160)) : ThePixels;
    },



    readJSON: function(filepath) {

        function log(msg) {
            if (Ti.App.deployType === "production") return;
            console.error("Utils.readJSON: " + msg);
        }

        var file = Ti.Filesystem.getFile(filepath);
        if (!file.exists()) {
            log("JSON file doesn't exists: " + filepath);
            return null;
        }

        var content = file.read().text;

        /*function validatePseudoJSON(str) {
            // warning: will screw up keys/values like "{asd:", "asd,)", "][" etc
            return str
                .replace( /\{\s*([^\s"]+)\s*:/g,      "{\"$1\":" ) // enquote all prop names
                .replace( /,\s*([\}\)\]$])/g,         "$1"       ) // remove all spare commas
                .replace( /([\}\)\]])\s*([\{\[\(])/g, "$1,$2"    ) // add commas between }{ )( ][
        }*/

        try { return JSON.parse(content); } catch(e) {}
        log("JSON isn't valid, attempting to evaluate it...");
        
        try { return eval("(" + content + ")"); } catch(e) {}
        // log("Couldn't evaluate, attemtping to validate it...");

        // try { return JSON.parse(validatePseudoJSON(content)); } catch(e) {}
        log("Couldn't parse " + filepath);

        return null;

    },

    prettyStringify: prettyStringify,

    /**
     * Creates a logger function. It's silent for production version.
     * May optinally have timestamp and prefix.
     * @param {String} [prefix]
     * @param {Boolean} [timestamp] If true, log message will include timestamp
     * @param {Boolean} [disabled] If true, will not do anything.
     * @return {Function} Logger function ready to use
     */
    createLogger: function(prefix, timestamp, disabled) {

        if (disabled || Ti.App.deployType === "production") return function() {};
        
        return function(/* arguments */) {

            var p = "";
            if (timestamp) p += putTimeStamp() + " ";
            if (prefix)    p += prefix + ": ";

            console.log(p + Array.prototype.join.call(arguments, ", "));
            
        };

    }

};