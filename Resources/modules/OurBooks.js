var localList = [
   {
    "id": "ua.com.ipublisher.tales.wolfandsevenyoungkids.ru.free",
    "name": "Волк и семеро козлят",
    "published": true,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_wolf_and_kids.png",
    "appstore_url": "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=789751345&mt=8",
    "googleplay_url": "https://play.google.com/store/apps/details?id=ua.com.ipublisher.tales.wolfandsevenyoungkids.ru&ah=gWSIDd4gFPw1Fd8iTnoYM3KSf7w"
  },
  {
    "id": "ua.com.ipublisher.tales.bremen",
    "name": "Бременские музыканты",
    "published": true,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_bremenskie_myzukantu.png",
    "appstore_url": "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=719390920&mt=8",
    "googleplay_url": "https://play.google.com/store/apps/details?id=ua.com.ipublisher.tales.bremen.ru&ah=gWSIDd4gFPw1Fd8iTnoYM3KSf7w"
  },
  {
    "id": "ua.com.ipublisher.tales.kolobok",
    "name": "Колобок",
    "published": true,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_kolobok.png",
    "appstore_url": "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=582958145&mt=8",
    "googleplay_url": "https://play.google.com/store/apps/details?id=ua.com.ipublisher.kolobok.ru&ah=gWSIDd4gFPw1Fd8iTnoYM3KSf7w"
  },
  {
    "id": "ua.com.ipublisher.tales.threelittlepigs",
    "name": "Три поросенка",
    "published": true,
    "published_en": true,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_tri_porosenka.png",
    "appstore_url": "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=623858130&mt=8",
    "googleplay_url": "https://play.google.com/store/apps/details?id=ua.com.ipublisher.tales.threelittlepigs.ru&ah=gWSIDd4gFPw1Fd8iTnoYM3KSf7w"
  },
  {
    "id": "ua.com.ipublisher.tales.repka",
    "name": "Репка",
    "published": true,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_repka.png",
    "appstore_url": "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=663379250&mt=8",
    "googleplay_url": "https://play.google.com/store/apps/details?id=ua.com.ipublisher.tales.repka.kids&ah=gWSIDd4gFPw1Fd8iTnoYM3KSf7w"
  },
  {
    "id": "ua.com.ipublisher.tales.uglyduck",
    "name": "Гадкий утенок",
    "published": true,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_ugly_duck.png",
    "appstore_url": "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=642881719&mt=8",
    "googleplay_url": "https://play.google.com/store/apps/details?id=ua.com.ipublisher.tales.uglyduck.ru&ah=gWSIDd4gFPw1Fd8iTnoYM3KSf7w"
  },
  {
    "id": "ua.com.ipublisher.tales.thumbelina.ru",
    "name": "Дюймовочка",
    "published": true,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_duymovo4ka.png",
    "appstore_url": "http://phobos.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=806813955?mt=8",
    "googleplay_url": "https://play.google.com/store/apps/details?id=ua.com.ipublisher.tales.thumbelina.ru&ah=gWSIDd4gFPw1Fd8iTnoYM3KSf7w"
  },
  {
    "id": "ua.com.ipublisher.tales.rukavichka",
    "name": "Рукавичка",
    "published": false,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_rukavi4ka.png",
    "appstore_url": "http://tales.ipublisher.com.ua/rukavichka/"
  }, 
  {
    "id": "ua.com.ipublisher.tales.sleep",
    "name": "Спящая красавица",
    "published": false,
    "image_url": "http://tales.ipublisher.com.ua/api/images/book_spias4aja_krasavica.png",
    "appstore_url": "http://tales.ipublisher.com.ua/beauty/"
  }
];

module.exports = {
    base : "http://tales.ipublisher.com.ua/api.php",
    getLocalList : function() {
        return localList;
    },
    getURL : function(url, fn_end, fn_progress) {
        var func = this.getURL;
        var file_obj = {};
        var retries = 0;
        if(Titanium.Network.online) {
            var c = Titanium.Network.createHTTPClient({

                timeout :3000
            });

            c.onload = function() {

                if(c.status == 200) {
                    file_obj.content = this.responseText.toString();
                    fn_end(file_obj);
                } else {
                    file_obj.error = 'file not found';
                    file_obj.error_code = c.status;
                    fn_end(file_obj);
                }
            };
            c.onerror = function(e) {
                file_obj.error = 1;
                file_obj.error_code = 503;
                fn_end(file_obj);
            };
            c.open('GET', url);
            c.send();
        } else {
            file_obj.error = 'no internet';
            fn_end(file_obj);
        }
    },
    getPublishedBooks : function(language, fn_end, fn_progress) {
        var loadedDateStr = Ti.App.Properties.getString("loadedListDate", "0");
        if (isNaN(loadedDateStr)) {
            loadedDateStr = 0;
        }
        var loadedList = Ti.App.Properties.getList("loadedList", []);
        if (loadedList.length > 0 && loadedDateStr) {
            //delta in days
            var delta = (new Date().getTime() - parseInt(loadedDateStr)) / 1000 / 60 / 60 / 24;

            if (delta < 2) {
                fn_end(true, loadedList);
                return;
            } 
        }
        if (!fn_progress) fn_progress = function() {};

        var url = this.base + "?method=GetPublishedBooks&language=" + language;
        var getURL = this.getURL;
        var responseCallback;
        var retries = 0;
        responseCallback = function(result) {
            if(result.error) {
                fn_end(false, result);
            } else {
                try {
                    var data = eval("(" + result.content + ")");
                } catch (e) {
                    fn_end(false, {
                        error : 'invalid data'
                    });
                    return;
                }
                if(data == null || !data) {
                    fn_end(false, {
                        error : 'invalid data'
                    });
                } else {
                    if  (!data.result){
                        data.result = [];
                    }
                    
                    
                    Ti.App.Properties.setString("loadedListDate", new Date().getTime());
                    Ti.App.Properties.setList("loadedList", data);
                    
                    fn_end(true, data);
                }
            }
        };
        getURL(url, responseCallback, fn_progress);
        
    },
    

}