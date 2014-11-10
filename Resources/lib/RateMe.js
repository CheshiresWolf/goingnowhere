function RateMe(ios_url, goog_url, usecount) {
    var remindCountAsInt = Ti.App.Properties.getInt('RemindToRate', 0);
    var newRemindCount = remindCountAsInt + 1;
    if(remindCountAsInt === -1) {
        return false;
    } else if(remindCountAsInt < usecount) {
        Ti.App.Properties.setInt('RemindToRate', newRemindCount);
    } else if(remindCountAsInt >= usecount) {
        showDialog(ios_url, goog_url);
    }
}

function showDialog(ios_url, goog_url, no_never) {
    var lng = Ti.App.Properties.getString("language", "ru");
    var alertDialog = Titanium.UI.createAlertDialog({
        title : L(lng + '_rate_us'),
        message : L(lng + '_rate_us_message'),
        buttonNames : [ "write", "later", "never" ].slice(0, no_never ? 2 : 3).map(
            function(e) { return L(lng + "_rate_us_btn_" + e); }
        ),
        cancel : 2
    });
    alertDialog.addEventListener('click', function(evt) {
        switch (evt.index) {
            case 0:
                // "Ok" - open the appropriate rating URL, and set flag to never
                // ask again
                Ti.App.Properties.setInt('RemindToRate', -1);
                if(Ti.Android) {
                    Ti.Platform.openURL(goog_url);
                } else {
                    //Ti.API.info(ios_url);
                    Ti.Platform.openURL(ios_url);
                }
                break;
            case 1:
                // "Remind Me Later"? Ok, we'll reset the current count to zero
                Ti.App.Properties.setInt('RemindToRate', 0);
                break;
            case 2:
                // "Never" - Set the flag to -1, to never ask again
                Ti.App.Properties.setInt('RemindToRate', -1);
                break;
        }
    });
    alertDialog.show();
}

function isiOS7Plus() {
    // iOS-specific test
    if (Titanium.Platform.name == 'iPhone OS') {
        var version = Titanium.Platform.version.split(".");
        var major = parseInt(version[0], 10);

        // Can only test this support on a 3.2+ device
        if (major >= 7) {
            return true;
        }
    }
    return false;
}


function iOSURLFromAppId(appId) {
    if ( isiOS7Plus() ) {
        return "itms-apps://itunes.apple.com/app/id" + appId;
    } else {
        return 'itms-apps://ax.itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=' + appId + '&onlyLatestVersion=true&pageNumber=0&sortOrdering=1&type=Purple+Software';
    }
}

function googURLFromAppId(appId) {
    return 'market://details?id=' + appId;
}
exports.showDialog =showDialog;
exports.checkNow = RateMe;
exports.iOSURLFromAppId = iOSURLFromAppId;
exports.googURLFromAppId = googURLFromAppId;