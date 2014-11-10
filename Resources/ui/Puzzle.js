var LoadableScene = require('/ui/LoadableScene');
var Puzzles = require("modules/TheGameOfPuzzles");

function Puzzle(game) {
    // Create game scene
    var scene = new LoadableScene(game, Ti.Filesystem.resourcesDirectory + 'images/puzzle/puzzle.jscene', 'images/puzzle/', true);

    scene.closeScene = function() {
        Ti.App.fireEvent("hidePuzzle");
    };

    scene.addEventListener('startAnimationFinished', function() {
        var puzzleGame = new Puzzles(game, scene);
        puzzleGame.start()
    });
    
    var closeClicked = false;
    scene.onClick_close = function(e) {
        if(closeClicked) return;
        closeClicked = true;
        if (!scene.started) return;
        Ti.App.fireEvent("goToPage", {mode_changed : true});
        Ti.App.fireEvent("hidePuzzle");
    };

    return scene;
}

module.exports = Puzzle;
