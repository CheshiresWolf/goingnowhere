var mark = null; 

module.exports = {
    show : function(scene) {
        if (Ti.App.Properties.getBool("mark_view_" + scene.pageMode, false)) {
            return;
        }
        var win = scene.game.window;
        Ti.App.Properties.setBool("mark_view_" + scene.pageMode, true);
        if (mark != null) {
            this.hide();
        }
        mark = Ti.UI.createView({backgroundImage: "/images/tutor/" + scene.pageMode + ".png", zIndex: 99, window: win});
        mark.addEventListener("click", this.hide);
        win.add(mark);
    },
    hide : function(game) {
        if (mark != null) {
            mark.window.remove(mark);
            mark.window = null;
            mark = null;
        }
    }
};
