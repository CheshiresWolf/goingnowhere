(function() {
   
    var Window = require('ui/ApplicationWindow');
    Ti.App.rootWindow = new Window();
    Ti.App.rootWindow.open();
    
    Ti.App.Properties.setBool("music", Ti.App.Properties.getBool("music", true));
	Ti.App.Properties.setString("version_settings", Ti.App.version);
    
})();
