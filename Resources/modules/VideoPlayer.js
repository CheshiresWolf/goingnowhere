var _ = require("lib/Underscore");

function VideoPlayer(containerParams, videoParams, autoplay, onStart) {

	var self = this;

	this.container = Ti.UI.createView(containerParams);

	this.video = Ti.Media.createVideoPlayer(_.defaults({
		width:  "100%",
		height: "100%"
	}, videoParams));
	var indicator = Ti.UI.createActivityIndicator();

	this.container.add(this.video);
	this.container.add(indicator);

	if (autoplay) {
		indicator.show();
		this.video.addEventListener("loadstate", function(e) {
			// console.debug("Got state " + e.loadState, JSON.stringify(e));
			// if (e.loadState === Ti.Media.VIDEO_LOAD_STATE_PLAYTHROUGH_OK) {
			if (e.loadState === 3) { // XXX
				start();
			}
		});
	}

	[ "play", "pause", "stop", "release", "hide", "show" ].forEach(function(n) {
		self[n] = self.video[n];
	});

	function start() {
		if (typeof onStart === "function") onStart();
		indicator.hide();
		self.video.start();
	}

}

module.exports = {
	create: function(containerParams, videoParams, autoplay, onStart) {
		return new VideoPlayer(containerParams, videoParams, autoplay, onStart);
	}
}