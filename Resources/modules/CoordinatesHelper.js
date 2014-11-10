//version 1.1.2

function CoordinatesHelper(scene) {
    var self = this;
    self.scene = scene;
    self.sprites = [];
    self.actions = [];
    self.table = null;
    self.marker = null;
    self.window = null;
    self.resultWindow = null;
    self.sectionActions = [];
    self.sectionSprites = [];
    self.coords = null;
    self.code = null;
    self.first = false;

    /* in dynamic mode easy to create joints
     * 
     * after dblClick - immediately shows full window (not hide)
     * after selecting every 2nd sprite - fires codeWindow with jointAction
     */
    var DYNAMIC_MODE = false;

    //CLOSE REACTION
    Ti.App.addEventListener('closeHelper', function() {
        if (!self.window) {
            return;
        }

        var t3 = Titanium.UI.create2DMatrix();
        t3 = t3.scale(0);

        if (self.resultWindow) {
            self.resultWindow.close({
                transform : t3,
                duration : 300
            });
        }

        self.window.close({
            transform : t3,
            duration : 300
        });
    });

    //MAIN
    function _onDblClick(e) {
        if (self.window) {
            self.window.close();
            self.window = null;

            if (self.resultWindow) {
                self.resultWindow.close();
                self.resultWindow = null;
            }
        }

        var coords = self.coords = {
            x : e.x,
            y : e.y
        };

        self.marker = _createMarker();
        self.window = _openHelperWindow();

        var spriteListAtPoint = scene.spritesAtXY(coords);
        /*console.log("Sprites at dblclick: ", spriteListAtPoint.map(function(e) {
            return e.loadableData && e.loadableData.name;
        }));*/
        var dataForTable = _makeTableData(spriteListAtPoint);

        //clear rows from prev changes
        self.refreshTableData();

        /*  ADD ACTIONS
         *
         * _addAction('Координата точки', function() {...})
         *
         */
        _addAction('Координата (global) спрайта', _getPositionAction);
        _addAction('Координата (local) спрайта', _getLocalPositionAction);
        _addAction('FrameAnimationHelper', _getFrameHelperAction);
        _addAction('Создать joint', _makeJointAction);

        //END ACTIONS

        self.table = _makeTable();

        self.window.holder.add(self.table);
        self.window.holder.add(_makeHint());
        self.window.add(self.marker);
    };

    self.scene.game.addEventListener('dblclick', _onDblClick);

    self.refreshTableData = function() {
        if (!self.sectionSprites.rows) {
            return;
        }

        self.first = false;

        for (var i = 0; i < self.sectionSprites.rows.length; i++) {
            delete self.sectionSprites.rows[i].data.first;
            delete self.sectionSprites.rows[i].data.second;
        };
    }

    self.destroy = function() {
        self.scene.game.removeEventListener('dblclick', _onDblClick);

        if (self.window) {
            var t3 = Titanium.UI.create2DMatrix();
            t3 = t3.scale(0);

            self.window.close({
                transform : t3,
                duration : 300
            });
        }

        if (self.resultWindow) {
            self.resultWindow.close({
                transform : t3,
                duration : 300
            });
        }

        self.table = null;
        self.window = null;
        self.scene = null;
    }
    //PRIVATE FUNCTIONS

    //marker
    function _createMarker() {
        var marker = Ti.UI.createView({
            left : 0,
            top : 100,
            width : 30,
            height : 15,
            backgroundColor : 'red',
            opacity : 0.7
        });

        var anim = Ti.UI.createAnimation({
            duration : 1000,
        });

        var toggle = true;
        marker.addEventListener('singletap', function(e) {
            if (!self.window) {
                //Ti.API.info('Error on marker - no window');
                return;
            }
            anim.right = -300;
            if (toggle) {
                anim.right = 10;
            }

            toggle = !toggle;
            self.window.animate(anim);
        });
        return marker;
    }

    //_openHelperWindow

    //CHANGE TO 0 for always show! (-300)
    var right = (DYNAMIC_MODE) ? 0 : -300;

    function _openHelperWindow() {
        var w = Titanium.UI.createWindow({
            height : Ti.UI.FILL,
            width : 330,
            right : right,
            top : 10,
            bottom : 10,
        });

        var holder = Ti.UI.createView({
            height : Ti.UI.FILL,
            left : 30,
            layout : 'vertical',
            backgroundColor : '#336699',
            opacity : 0.92,
            borderWidth : 2,
            borderColor : '#999',
            borderRadius : 10
        });

        w.holder = holder;

        //BTNS VIEW
        var topBar = Ti.UI.createView({
            height : 44,
            top : 10,
            bottom : 10
        });
        //CLOSE BTN
        var closeBtn = Titanium.UI.createButton({
            title : 'Close',
            left : 10,
            height : 44,
            width : 86,
        });
        closeBtn.addEventListener('click', function() {
            var t3 = Titanium.UI.create2DMatrix();
            t3 = t3.scale(0);

            if (self.resultWindow) {
                self.resultWindow.close({
                    transform : t3,
                    duration : 300
                });
            }

            w.close({
                transform : t3,
                duration : 300
            });
        });
        topBar.add(closeBtn);
        //CODE BTN
        var codeBtn = Titanium.UI.createButton({
            title : 'Show code',
            left : 106,
            height : 44,
            width : 86,
        });
        codeBtn.addEventListener('click', function() {
            _fireCode();
        });
        topBar.add(codeBtn);
        //COORDS BTN
        var coordsBtn = Titanium.UI.createButton({
            title : 'COORDS',
            left : 204,
            height : 44,
            width : 86,
        });
        coordsBtn.addEventListener('click', function() {
            _fireCode(true);
        });
        topBar.add(coordsBtn);

        holder.add(topBar);
        w.add(holder);

        w.open();

        return w;
    }

    //_openCodeWindow
    function _openCodeWindow() {
        var t = Titanium.UI.create2DMatrix();
        t = t.scale(0);

        var w = Titanium.UI.createWindow({
            backgroundColor : '#336699',
            borderWidth : 2,
            borderColor : '#999',
            height : Ti.UI.FILL,
            width : 300,
            bottom : 10,
            borderRadius : 10,
            opacity : 0.92,
            transform : t,
            layout : 'vertical'
        });

        var t1 = Titanium.UI.create2DMatrix();
        t1 = t1.scale(1.1);
        var a = Titanium.UI.createAnimation();
        a.transform = t1;
        a.duration = 200;

        a.addEventListener('complete', function() {
            var t2 = Titanium.UI.create2DMatrix();
            t2 = t2.scale(1.0);
            w.animate({
                transform : t2,
                duration : 200
            });

        });

        //BTNS VIEW
        var topBar = Ti.UI.createView({
            //layout : 'horizontal',
            height : 44,
            top : 10,
            bottom : 10
        });
        //CLOSE BTN
        var closeBtn = Titanium.UI.createButton({
            title : 'Close',
            height : 44,
            left : 30,
            width : 105,
        });
        closeBtn.addEventListener('click', function() {
            var t3 = Titanium.UI.create2DMatrix();
            t3 = t3.scale(0);
            w.close({
                transform : t3,
                duration : 300
            });
        });
        topBar.add(closeBtn);
        //COPY BTN
        var copyBtn = Titanium.UI.createButton({
            title : 'Copy',
            height : 44,
            right : 30,
            width : 105,
        });
        copyBtn.addEventListener('click', function() {
            if (self.code) {
                //Ti.API.info(self.code);
            }
        });
        topBar.add(copyBtn);

        w.add(topBar);

        w.open(a);

        return w;
    }

    //_makeHint
    _makeHint = function() {
        var lbl = Ti.UI.createLabel({
            text : 'In Joint: 1-bodyA (green), 2-bodyB (gray)',
            left : 6,
            right : 6,
            top : 6,
            bottom : 6,
            color : 'white'
        });
        var view = Ti.UI.createView({
            width : Ti.UI.FILL,
            backgroundColor : 'gray',
            top : 6,
            bottom : 6,
            opacity : 0.7
        });
        view.add(lbl);

        return view;
    }
    //_makeTable
    function _makeTable() {
        var table = Ti.UI.createTableView({
            data : [self.sectionSprites, self.sectionActions],
            style : Titanium.UI.iPhone.TableViewStyle.GROUPED,
            height : '80%'
        });

        var counter = 0;
        table.addEventListener('click', function(e) {
            if (e.row) {
                e.row.hasCheck = !e.row.hasCheck;

                if (e.section != table.sections[0]) {
                    return;
                }

                //Ti.API.info('check', first, e.row.data.first, e.row.data.second)
                if (!self.first && !e.row.data.second) {
                    e.row.data.first = self.first = true;
                    e.row.backgroundColor = 'green';
                    counter++;
                } else {
                    if (e.row.data.first) {
                        e.row.data.first = self.first = false;
                        e.row.backgroundColor = null;
                        counter--;
                        return;
                    }

                    if (e.row.data.second && e.row.data.second == true) {
                        e.row.data.second = false;
                        e.row.backgroundColor = null;
                        counter--;
                    } else {
                        e.row.data.second = true;
                        e.row.backgroundColor = 'gray';
                        counter++;
                    }
                }

                if (DYNAMIC_MODE && counter % 2 == 0) {
                    _fireCode();
                }
            }
        });

        return table;
    }

    //_makeTableData
    function _makeTableData(data) {
        self.sectionSprites = Ti.UI.createTableViewSection({
            headerTitle : 'Select sprites'
        });
        self.sectionActions = Ti.UI.createTableViewSection({
            headerTitle : 'Select action'
        });

        for (var i = 0; i < data.length; i++) {
            if (data[i] && data[i].loadedData) {
                var row = Ti.UI.createTableViewRow({
                    title : data[i].loadedData.name,
                    data : data[i]
                });
                self.sectionSprites.add(row);
            }
        };
    }

    //_addAction
    function _addAction(name, func) {
        self.sectionActions.add(Ti.UI.createTableViewRow({
            title : name,
            act : func
        }));
    }

    //_updateSelection
    function _updateSelection() {
        if (!self.sectionSprites.rows || !self.sectionActions.rows) {
            //Ti.API.info('ERROR : !self.sectionSprites.rows || !self.sectionActions.rows l:344');
            return;
        }

        self.sprites = [];
        self.actions = [];

        for (var i = 0; i < self.sectionSprites.rows.length; i++) {
            if (self.sectionSprites.rows[i].hasCheck) {
                //Ti.API.info(self.sectionSprites.rows[i].title)
                self.sprites.push(self.sectionSprites.rows[i].data);
            }
        };
        for (var i = 0; i < self.sectionActions.rows.length; i++) {
            if (self.sectionActions.rows[i].hasCheck) {
                self.actions.push(self.sectionActions.rows[i]);
            }
        };

        //DEFAULT JOINT or Global Coordinating of sprite
        if (self.actions.length == 0) {
            if (DYNAMIC_MODE) {
                self.actions.push(self.sectionActions.rows[2]);
            } else {
                self.actions.push(self.sectionActions.rows[0]);
            }
        }

        if (self.actions.length <= 0 || self.actions.length > 1) {
            alert('Choose single action');
            return true;
        }

        if (self.sprites.length <= 0) {
            alert('Choose sprite(s)');
            return true;
        }

        return false;
    }

    //function _fireCode
    function _fireCode(showCoords) {
        var code = [];

        if (!showCoords) {
            var isErrors = _updateSelection();
            if (isErrors)
                return;

            //for (var i = 0; i < self.actions.length; i++) {
            var result = self.actions[0].act();
            if (!result) {
                //inner error check
                return;
            }
            code.push(result);
            //};

        } else {
            code.push(_getPointPositionAction());
        }

        if (self.resultWindow) {
            self.resultWindow.close();
            self.resultWindow = null;
        }

        var codeWindow = _openCodeWindow();
        self.resultWindow = codeWindow;

        var codeArea = Ti.UI.createTextArea({
            borderWidth : 2,
            borderColor : '#bbb',
            borderRadius : 5,
            color : '#888',
            font : {
                fontSize : 20,
                fontWeight : 'bold'
            },
            textAlign : 'left',
            value : code.join(),
            top : 0,
            width : 300,
            height : Ti.UI.FILL
        });
        self.code = code.join();
        //Ti.API.info('RESULT:')
        //Ti.API.info(self.code);

        codeWindow.add(codeArea);

        //clipboard
        Ti.UI.Clipboard.clearText();
        Ti.UI.Clipboard.setText(self.code);
    }

    //ACTIONS
    function _getPositionAction() {
        var coords = [];
        for (var i = 0; i < self.sprites.length; i++) {
            coords.push(JSON.stringify({
                name : self.sprites[i].loadedData.name,
                x : self.sprites[i].x,
                y : self.sprites[i].y
            }, null, 4));
        };

        return coords;
    }
    function _getLocalPositionAction() {
        var coords = [];
        for (var i = 0; i < self.sprites.length; i++) {
            coords.push(JSON.stringify({
                name : self.sprites[i].loadedData.name,
                x : ~~(self.coords.x - self.sprites[i].x),
                y : ~~(self.coords.y - self.sprites[i].y)
            }, null, 4));
        };

        return coords;
    }

    function _getPointPositionAction() {
        var coords = {
            x : ~~(self.coords.x),
            y : ~~(self.coords.y)
        };
        
        //Ti.API.info('COORDS', self.coords.x, ~~(self.coords.x), Math.round(self.coords.x));

        return JSON.stringify(coords, null, 4) + '\n';
    }

    function _getFrameHelperAction() {
        if (self.sprites.length != 1) {
            alert("Choose single moving sprite");
            return;
        }

        var s = self.sprites[0];

        var template = "scene.addFrameAnimation(new mJointAnim(scene, {" + "anchorX : " + ~~(self.coords.x - s.x) + "," + "anchorY : " + ~~(self.coords.y - s.y) + "," + "x : 0," + "y : -100," + "duration : 1000," + "autoreverse: true," + "repeat : 0" + "}, scene.bodyByName('" + s.loadedData.name + "'), scene.bodyByName('KINEMATIC_BODY_NAME_HERE')), true);";

        return template;
    }

    function _makeJointAction() {
        if (self.sprites.length != 2) {
            alert("Choose two sprites");
            return;
        }

        //Ti.API.info(self.sprites[0].first, self.sprites[1].first)

        if (self.sprites[0].first == true) {
            var spriteA = self.sprites[0];
            var spriteB = self.sprites[1];
        } else {
            spriteA = self.sprites[1];
            spriteB = self.sprites[0];
        }

        var template = "{bodyA: " + "'" + spriteA.loadedData.name + "'" + "," + " bodyB: " + "'" + spriteB.loadedData.name + "'" + ", " + "type: " + "'Revolute'" + ", anchorX: " + ~~(self.coords.x - spriteB.x) + ", anchorY: " + ~~(self.coords.y - spriteB.y) + ", enableLimit: true, upperAngle: 5, lowerAngle:-5},";

        return template;
    }

}

module.exports = CoordinatesHelper;
