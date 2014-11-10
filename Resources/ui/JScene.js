var dataCache = {};
function getJsonData(fname) {
    //Ti.API.info(fname.replace(/\/\//g, "/"));
    var file = Ti.Filesystem.getFile(fname);
    var content = file.read().text;
    file = null;
    return eval("("+ content + ")");
}
module.exports = {
    
    getJSON: function(fname) {
        return getJsonData(fname);
        if (dataCache[fname]) {
            //Ti.API.info('HIT CACHE ' + fname);
        } else {
            dataCache[fname] = getJsonData(fname);
        } 
        return dataCache[fname];
    }
}