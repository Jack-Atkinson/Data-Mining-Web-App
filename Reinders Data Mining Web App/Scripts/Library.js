$.fn.getSelector = function () {
    //http://www.timvasil.com/blog14/post/2014/02/24/Build-a-unique-selector-for-any-DOM-element-using-jQuery.aspx with minor changes

    var el = this[0];
    if (!el || !el.tagName) {
        return '';
    }

    // If we have an ID, we're done; that uniquely identifies this element
    var el$ = $(el);
    var id = el$.attr('id');
    if (id) {
        return '#' + id;
    }

    var classNames = el$.attr('class');
    var classSelector;
    if (classNames) {
        classSelector = '.' + $.trim(classNames).replace(/\s+/gi, '.');
    }

    var selector;
    var parent$ = el$.parent();
    var siblings$ = parent$.children();
    var needParent = false;
    if (classSelector && siblings$.filter(classSelector).length == 1) {
        // Classes are unique among siblings; use that
        selector = classSelector;
    } else if (siblings$.filter(el.tagName).length == 1) {
        // Tag name is unique among siblings; use that
        selector = el.tagName;
    } else {
        // Default to saying "nth child"
        selector = ':nth(' + $(this).index() + ')';
        needParent = true;
    }

    // Bypass ancestors that don't matter
    if (!needParent) {
        for (ancestor$ = parent$.parent() ;
             ancestor$.length == 1 && ancestor$.find(selector).length == 1;
             parent$ = ancestor$, ancestor$ = ancestor$.parent());
        if (ancestor$.length == 0) {
            return selector;
        }
    }
    var selectorType;
    if (el$.parent()[0] == parent$[0])
        selectorType = ' > '
    else
        selectorType = ' '
    return parent$.getSelector() + selectorType + selector;
}

var UI = (function () {

    var _iframe;
    var _highlighter;
    var _blocking = false;

    var init = function () {
        _iframe = '#targetframe';
        _highlighter = '#elementhighlighter';

        navigation.Init();
        iframeControl.Init();
        filterControl.Init();

        navigation.GoTo("http://www.reinders.com");

    };

    var navigation = (function () {
        var _bstack = [];
        var _fstack = [];
        var _currentUrl = "";
        var _targetframe = {};


        var init = function () {

            _targetframe = document.getElementById('targetframe');

            $('#urlinput').keyup(function (e) {
                if (e.which == 13)
                    navigation.GoTo($('#urlinput').val());
            });

            $('#refresh').click(function () {
                navigation.GoTo($('#urlinput').val()); //adds page to bstack, maybe fix?
            });

            $('#backwards').click(function () {
                jumpToFrom(_bstack, _fstack);
            });

            $('#forwards').click(function () {
                jumpToFrom(_fstack, _bstack);
            });

            $('#backwards').prop('disabled', true);
            $('#forwards').prop('disabled', true);

            $(_iframe).load(function () {
                filterControl.UpdateCanvasDim($(this).contents().width(), $(this).contents().height());
                filterControl.UpdateCanvas();
            })

        };

        var goto = function (url) {
            if (_blocking)
                return;
            loading();
            if (!isValid(url)) {
                error()
                return false;
            }
            $('#urlinput').val(url);
            $.ajax({
                url: '/Home/Goto',
                method: 'GET',
                dataType: 'json',
                data: { url: url },
                success: function (pagesource) {
                    updateBStack();
                    _currentUrl = $('#urlinput').val();
                    updateFrame(pagesource);
                    success();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                    error();
                }
            });
        };

        var click = function (element) {
            if (_blocking)
                return;
            loading();
            var target = $(element).getSelector();
            $.ajax({
                url: '/Home/Click',
                method: 'GET',
                dataType: 'json',
                data: {
                    url: $('#urlinput').val(),
                    target: target,
                },
                success: function (result) {
                    updateBStack();
                    _currentUrl = result.Url;
                    $('#urlinput').val(_currentUrl)
                    updateFrame(result.Src);
                    success();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                    error();
                }
            });
        };

        var updateFrame = function (src) {
            var srcblob = new Blob([src], { type: "text/html" });
            _targetframe.contentWindow.location.replace(window.URL.createObjectURL(srcblob));
        };

        var updateBStack = function () {
            if (_currentUrl != "" &&
                _targetframe.contentWindow.location.href != "about:blank") {
                _bstack.unshift({ url: _currentUrl, blob: _targetframe.contentWindow.location.href });
                $('#backwards').prop('disabled', false);
            }
            if (_fstack.length > 0) {
                if (_currentUrl != _fstack[0].url) {
                    _fstack = [];
                    $('#forwards').prop('disabled', true);
                }
            }
        };

        var jumpToFrom = function (stackT, stackF) {
            if (stackT.length > 0) {
                stackF.unshift({ url: _currentUrl, blob: _targetframe.contentWindow.location.href });
                _targetframe.contentWindow.location.replace(stackT[0].blob);
                $('#urlinput').val(stackT[0].url);
                _currentUrl = stackT[0].url;
                stackT.shift();
                if (!_bstack.length)
                    $('#backwards').prop('disabled', true);
                else
                    $('#backwards').prop('disabled', false);
                if (!_fstack.length)
                    $('#forwards').prop('disabled', true);
                else
                    $('#forwards').prop('disabled', false);
            }
        };

        var isValid = function (url) {
            var linkRegexFilter = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
            var linkRegex = new RegExp(linkRegexFilter, 'i');
            if (url.length < 2083 && linkRegex.test(url))
                return true;
            else
                return false;
        };

        var error = function () {
            $('#urlwrapper').removeClass('has-warning');
            $('#urlwrapper').removeClass('has-success');
            $('#urlwrapper').addClass('has-error')
            $('#success').hide();
            $('#failure').show();
            $('#elementselector').removeAttr('style');
            $('#elementselector').hide();
            _blocking = false;
        };

        var success = function () {
            $('#urlwrapper').removeClass('has-warning');
            $('#urlwrapper').removeClass('has-error')
            $('#urlwrapper').addClass('has-success');
            $('#failure').hide();
            $('#success').show();
            $('#elementselector').removeAttr('style');
            $('#elementselector').hide();
            _blocking = false;
        };

        var loading = function () {
            $('#elementselector').removeAttr('style');
            $('#elementselector').css({ //to stop user from making additional requests to the server during blocking
                'position': 'absolute',
                'left': 0,
                'top': 0,
                'width': $(_iframe).width(),
                'height': $(_iframe).height(),
                '-ms-filter': '"progid:DXImageTransform.Microsoft.Alpha(Opacity=50)"',
                'filter': 'alpha(opacity=50)',
                '-moz-opacity': '0.5',
                '-khtml-opacity': '0.5',
                'opacity': '0.5',
                'pointer-events': 'auto',
                'background-color': '#FFFFFF'
            });
            $('#elementselector').show();
            $('#urlwrapper').removeClass('has-success');
            $('#urlwrapper').removeClass('has-error')
            $('#urlwrapper').addClass('has-warning');
            $('#failure').hide();
            $('#success').hide();
            _blocking = true;
        };

        return {
            Init: init,
            GoTo: goto,
            Click: click,
        };

    })();

    var iframeControl = (function () {

        var _lastTarget = {};

        var init = function () {

            $(_iframe).load(function () {
                $('div.canvas-container').css('margin-top', '');

                $(this).contents().find('body').click( function (e) {
                    var url = e.target;
                    if (e.ctrlKey) {
                        filterControl.Grab(e.target);
                    } else {
                        if (confirm("Do you want to record this click?"))
                            filterControl.RecordClick(e.target);
                        navigation.Click(e.target);
                    }

                    return false;
                });

                $($(this).contents()).scroll(function (e) {
                    $('div.canvas-container').css('margin-top', -$(this).scrollTop());
                    filterControl.UpdateSelector(_lastTarget);
                })

                $(this).contents().find("body").children().mouseover(function (e) {
                    filterControl.UpdateSelector(e.target);
                    _lastTarget = e.target;
                    return false;
                });
            });

        }

        return {
            Init: init,
        }

    })();

    var filterControl = (function () {

        var _canvas;
        var _elementTree = [];
        var _tempOverlay;

        var init = function () {
            //var canvas = new fabric.Canvas('elementhighlighter');
            _canvas = new fabric.Canvas('elementhighlighter');

            $('#selectorlevel').val(0);

            /*_canvas.on('object:added', function (object) {
                object.target.setCoords()
                _canvas.forEachObject(function (obj) {
                    if (obj == object.target) return;
                    //obj.setOpacity(object.target.intersectsWithObject(obj) ? 0.1 : 0.2);
                    if (object.target.intersectsWithObject(obj)) {
                        object.target.setOpacity(obj.getOpacity() / 2);
                        debug

                    }
                });
            });*/

            $('#minusone').click(function () {
                updateGrabArea(false);
            });

            $('#plusone').click(function () {
                updateGrabArea(true);
            });

            $('#action').change(function () {
                changeAction($('#action').val());
            });

            $('#delete').click(function () {

                resetFilter(); //gotta remove filter overlay from canvas too
            });

            $('#record').click(function () {
                _tempOverlay = null;
                recordEvent();
                resetFilter();
            });
        };


        var updateSelector = function (target) {
            var width = $(target).outerWidth() < $(_iframe).width() ? $(target).outerWidth() : $(_iframe).width();
            var height = $(target).outerHeight() < $(_iframe).height() ? $(target).outerHeight() : $(_iframe).height() - 20; //shadow is 20px
            var position = $(target).offset();
            position.left -= $(_iframe).contents().scrollLeft();
            position.top -= $(_iframe).contents().scrollTop();
            $('#elementselector').css({
                'position': 'absolute',
                'left': position.left,
                'top': position.top,
                'width': width,
                'height': height,
                'box-shadow': '0 0 10px #000',
                'pointer-events': 'none'
            });
            $('#elementselector').show();
            return;
        };

        var updateGrabArea = function (up) {
            if (!$($(_iframe).contents().find($('#selector').val())).length)
                return;
            var element = $('#selector').val();
            if (up) {
                var obj = getItemInCanvas(element);
                var currentVal = parseInt($('#selectorlevel').val());
                if ((currentVal + 1) < _elementTree.length) {
                    $('#selectorlevel').val(currentVal + 1);
                
                    var currentVal = parseInt($('#selectorlevel').val());
                    obj.set({
                        'height': $(_elementTree[currentVal]).outerHeight(),
                        'width': $(_elementTree[currentVal]).outerWidth(),
                        'top': $(_elementTree[currentVal]).offset().top,
                        'left': $(_elementTree[currentVal]).offset().left,
                    });
                    $('#selector').val($(_elementTree[currentVal]).getSelector());
                    _canvas.renderAll();
                }
            } else {
                var obj = getItemInCanvas(element);
                var currentVal = parseInt($('#selectorlevel').val());
                if (currentVal > 0) {
                    $('#selectorlevel').val(currentVal - 1);
                
                    var currentVal = parseInt($('#selectorlevel').val());
                    obj.set({
                        'height': $(_elementTree[currentVal]).outerHeight(),
                        'width': $(_elementTree[currentVal]).outerWidth(),
                        'top': $(_elementTree[currentVal]).offset().top,
                        'left': $(_elementTree[currentVal]).offset().left,
                    });
                    $('#selector').val($(_elementTree[currentVal]).getSelector());
                    _canvas.renderAll();
                }
                return obj;
            }

        };

        var grab = function (target) {

            resetFilter();
            if (_tempOverlay)
                _tempOverlay.remove();
            $('#selector').val($(target).getSelector());
            var rect = new fabric.Rect({
                left: $(target).offset().left,
                top: $(target).offset().top,
                fill: new fabric.Color('rgb(10, 20, 30)'),
                width: $(target).outerWidth(),
                height: $(target).outerHeight(),
                stroke: '#FFF',
                strokewidth: 3,
                opacity: 0.5
            });
            _tempOverlay = rect;

            getHierarchy(target);

            /*_canvas.forEachObject(function (obj) {
                //obj.setOpacity(object.target.intersectsWithObject(obj) ? 0.1 : 0.2);
                if (rect.intersectsWithObject(obj)) {
                    object.target.setOpacity(obj.getOpacity() / 2);
                    debug

                }
            });*/


            // "add" rectangle onto canvas
            _canvas.add(rect);
            /*var ctx = _canvas.getContext('2d');
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'red';
            ctx.fillRect($(target).offset().left, $(target).offset().top, $(target).outerWidth(), $(target).outerHeight());*/
        };
        
        var resetFilter = function () {
            $('#selector').val('');
            $('#action').val(0);
            $('#column').val('');
            $('#required').prop('checked', false);
        };

        var changeAction = function (action) {
            var obj = getItemInCanvas($('#selector').val());
            if (!obj)
                return;
            switch (action) {
                case "0":
                    obj.set('fill', new fabric.Color('rgb(10, 20, 30)'));
                    break;
                case "1":
                    obj.set('fill', 'red');
                    $('#column').val($('#selector').val());
                    break;
                case "2":
                    break;
                default:
                    break;
            }
            _canvas.renderAll();
        };

        var recordEvent = function () {
            var selector = $('#selector').val();
            var actionval = $('#action').val();
            var actiontxt = $('#action option:selected').text();
            var column = $('#column').val();
            var required = $('#required').prop('checked');
            var filterItem = '<div class="filteritem"><div class="' + (required ? 'glyphicon glyphicon-star' : 'glyphiconempty') + '"></div><div>' + actiontxt + '</div><div>' + column + '</div></div>';
            $('#filtercontainer').append(filterItem);

        };

        var recordClick = function (element) {
            $('#selector').val($(element).getSelector());
            $('#action').val(2);
            $('#column').val($(element).text())
            $('#required').prop('checked', true);
            recordEvent();
            resetFilter();
        };

        var getItemInCanvas = function (element) {
            var canvasObjs = []
            _canvas.forEachObject(function (obj) {
                //obj.setOpacity(object.target.intersectsWithObject(obj) ? 0.1 : 0.2);
                canvasObjs.push(obj);
            });
            for(var i = 0; i < canvasObjs.length; i++) {
                if (canvasObjs[i].width == $(_iframe).contents().find(element).outerWidth() &&
                    canvasObjs[i].height == $(_iframe).contents().find(element).outerHeight() &&
                    canvasObjs[i].left == $(_iframe).contents().find(element).offset().left) {
                    return canvasObjs[i];
                }
            }
            return null;
        };

        var updateFilterList = function () {
            $.ajax({
                url: '/Home/GetFilters',
                method: 'GET',
                dataType: 'json',
                data: { Domain: url },
                success: function (srcDoc) {
                    callback(srcDoc);
                },
                error: function (error) {
                    alert(error);
                    callback("invalid");
                }
            })
        };

        var updateCanvasDim = function (width, height) {
            _canvas.setWidth(width);
            _canvas.setHeight(height);
        };

        var updateCanvas = function () {
            _canvas.clear();
            //poll server for stuff to draw on canvas
        };

        var getHierarchy = function (target) {
            _elementTree = [];
            $('#selectorlevel').val(0);
            _elementTree.push(target);
            $(_elementTree[0]).parents().each(function () {
                _elementTree.push(this);
            });
        };

        return {
            Init: init,
            UpdateSelector: updateSelector,
            Grab: grab,
            UpdateCanvasDim: updateCanvasDim,
            UpdateCanvas: updateCanvas,
            RecordClick: recordClick,
        }
    })();

    return {
        Init: init
    }



})();

var Validate = (function () {
    var url = function (link) {
        var linkRegexFilter =
            '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
        var linkRegex = new RegExp(linkRegexFilter, 'i');
        if (link.length < 2083 && linkRegex.test(link))
            return true;
    };

    var arraysAreEqual = function (arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (var i = 0, len = arr1.length; i < len; i++)
            if ($(arr1[i]).nodeName !== $(arr2[i]).nodeName)
                return false;
        return true;
    };

    return {
        Url: url,
        ArraysAreEqual: arraysAreEqual,
    }
})();

var Loading = (function () {
    var start = function () {
        $('#loadinggif').show();
    };

    var end = function () {
        $('#loadinggif').hide();
    };
    return {
        Start: start,
        End: end,
    }
})();

var IframeControl = (function () { //maybe no need to have a filter switch, just see if ctrl was down or not and go on from there
    var _iframe;
    var _url;

    var init = function (iframe, url) {
        _iframe = iframe || alert("")
        url = url || "https://www.reinders.com"; //just a default for now
        changeSrcDoc(url);
    };

    var changeSrcDoc = function (url) {
        Loading.Start();
        if (!Validate.Url(url)) {
            $('#website').css('border', '1px solid red');
            Loading.End();
            return;
        }

        getSource(url, function (srcDoc) { //cleanup fucntion in filtercontrol needs to be called after website changes
            if (srcDoc == "invalid") {
                $('#website').css('border', '1px solid red');
                Loading.End();
                alert("The server did not return valid HTML");
                return;
            }
            var blob = new Blob([srcDoc], { type: 'text/html' });
            $(_iframe).attr("src", URL.createObjectURL(blob));
            _url = url;
            FilterControl.UpdateFilterList(); //dont make this fetch the base tag
            $('#website').css('border', '1px solid green');
            Loading.End();
            return;
        });
        return;
    };

    var getSource = function (url, callback) {
        $.ajax({
            url: '/Home/GetTargetSource',
            method: 'GET',
            dataType: 'json',
            data: { url: url },
            success: function (srcDoc) {
                callback(srcDoc);
            },
            error: function (error) {
                alert(error);
                callback("invalid");
            }
        });

    };

    var refresh = function () {
        changeSrcDoc(_url);
    }

    return {
        Init: init,
        ChangeSrcDoc: changeSrcDoc,
        Refresh: refresh,
    };

})();

var FilterControl = (function (window) {
    var _iframe = {};
    var _elementTree = [];
    var _inUse = false;
    var _targets = ['#signature', '#column'];
    var _selected = 0;
    var _claimedElements = [];
    var _selectedId = undefined;

    var init = function (iframe) {

        hide();

        _iframe = iframe;

        $(_iframe).load(function () { //hook the iframe contents, put a hook in here that whenever new source is gathered, load the page through the filters to highlight elements that would be selected
            $(_iframe).contents().find("body").click(function (e) {
                if ($('#switch-on').prop('checked') && !_inUse && e.ctrlKey)
                    filter(e.target);
                return false;
            });

            $(_iframe).contents().find("a").click(function (e) {
                if (!$('#switch-on').prop('checked')) {
                    browse(e, this);
                    return false;
                }
            });

            $(_iframe).contents().find("body").mouseover(function (e) {
                if ($('#switch-on').prop('checked') && !_inUse) {
                    $(e.target).css('outline', '2px solid grey', 'important');
                    return false;
                }
            });
            $(_iframe).contents().find("body").mouseout(function (e) {
                if ($('#switch-on').prop('checked')) {
                    $(e.target).css('outline', '');
                    return false;
                }
            });
            showFilters();
        });


        $('#disablejs').change(function () {
            if ($('#disablejs').prop('checked'))
                $(_iframe).attr('sandbox', 'allow-forms allow-pointer-lock allow-popups allow-same-origin'); //allowed scripts for tests
            else
                $(_iframe).attr('sandbox', 'allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts');

            //window.URL = window.URL || window.webkitURL;

            var blob = new Blob(['body { color: red; }'], { type: 'text/css' });

            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
        });

        $('#filterdisplaybody').on('click', 'tr', function (e) {
            $("#filterdisplaybody tr").css('background-color', '');
            $(this).css('background-color', '#cccccc');
            _selectedId = $(this).attr('data-id');
        });

        $('#switch-on, #switch-off').change(function () { //ugly
            if ($('#switch-on').prop('checked')) {
                $('.switch').css('background', 'green');
                show();
            } else {
                $('.switch').css('background', '#808080');
                hide();
            }
        });

        $('.qtyplus').click(function (e) { //super ugly
            var currentVal = parseInt($('#level').val());
            if (!isNaN(currentVal) && (currentVal + 1) < _elementTree.length) {
                $(_elementTree[currentVal]).removeClass('selectedElement');
                if (!doesOverlap(_elementTree[currentVal + 1])) { //only need to check this while incrementing I think...debug it
                    $('#level').val(currentVal + 1);
                    $(_targets[_selected]).val($(_elementTree[currentVal + 1]).getSelector()); //update sig
                    $(_elementTree[currentVal + 1]).addClass('selectedElement');
                } else {
                    $(_elementTree[currentVal]).addClass('selectedElement');
                }
            } else {
                $(_elementTree[currentVal]).removeClass('selectedElement');
                $('#level').val(0);
                $(_targets[_selected]).val($(_elementTree[0]).getSelector()); //update sig
                $(_elementTree[0]).addClass('selectedElement');
            }
            return false;
        });

        $(".qtyminus").click(function (e) { //we probably can put these in a function that changes depending on params, ie: add/subtract
            var currentVal = parseInt($('#level').val());
            if (!isNaN(currentVal) && currentVal > 0) {
                $(_elementTree[currentVal]).removeClass('selectedElement'); //re run selector on level change!!
                $('#level').val(currentVal - 1);
                $(_targets[_selected]).val($(_elementTree[currentVal - 1]).getSelector()); //update sig
                $(_elementTree[currentVal - 1]).addClass('selectedElement');
            } else {
                $(_elementTree[currentVal]).removeClass('selectedElement');
                $('#level').val(0);
                $(_targets[_selected]).val($(_elementTree[0]).getSelector()); //update sig
                $(_elementTree[0]).addClass('selectedElement');
            }
            return false;
        });

        $('#signature').click(function () {
            $('#column').css('border', '');
            $('#signature').css('border', '1px solid orange');
            _selected = 0;
        });
        $('#signature').trigger('click');

        $('#column').click(function () {
            if ($('#definedonpage').prop('checked')) {
                $('#signature').css('border', '');
                $('#column').css('border', '1px solid orange');
                _selected = 1;
            }
        });

        $('#definedonpage').change(function () {
            if ($('#signature').val().length > 0)
                if ($('#definedonpage').prop('checked')) {
                    $('#column').trigger('click');
                    $('#column').prop('readonly', true);
                    _inUse = false;
                } else
                    $('#column').prop('readonly', false);
            else {
                alert("You must selected a main signature before you can select a custom column");
                $('#definedonpage').prop('checked', false);
            }
        });

        $('#savefilter').click(function (e) {
            if ($('#signature').val().length > 0 &&
                $('#column').val().length > 0)
                saveFilter(e);
            else
                alert('You must select a filter and assign it a column before you can save it!');
        });

        $('#deletefilter').click(function (e) {
            deleteFilter()
        });

        $('#cancelfilter').click(function (e) {
            cleanUp();
        });

        $('#oldeditfilter').click(function (e) {
            $('#filterdisplaybody').find('tr').filter(function () {
                if ($(this).css('background-color') == 'rgb(204, 204, 204)') {
                    $('#functionTabLink').removeClass('unselectedTab');
                    $('#controlTabLink').addClass('unselectedTab');
                    $('#functionTab').show();
                    $('#controlTab').hide();
                    grabFilter($(this).attr('data-id'));
                    $('#switch-on').prop('checked', true);
                    $('#switch-on').trigger('change');
                }
            })
        });

        $('#olddeletefilter').click(function (e) {
            deleteFilter();
        })
    };

    var showFilters = function () {
        var id;
        $('#filterdisplaybody').find('tr').filter(function () {
            id = $(this).attr('data-id');
            $.ajax({
                url: '/Filters/Details',
                method: 'GET',
                dataType: 'json',
                data: { 'id': id },
                success: function (response) {
                    if (response) {
                        $(_iframe).contents().find(response.Signature).addClass('selectedElement');
                        $(_iframe).contents().find(response.Signature).attr('data-id', id);
                    }
                },
                error: function (error) {
                    alert(error);
                }
            });
        });
    }

    var filter = function (target) { //need to get the filters in the db to show up under the filters tab
        if (!doesOverlap(target)) { //gotta check if the data-id value has already been filled in, and if so dont create new data row when saving

            _inUse = true;
            $(target).trigger("mouseout"); //get rid of our outline, double check this actually works...
            //generate element hierarchy 

            getHierarchy(target);
            //Scan elements in hierarchy to see if a parent has already been selected
            var _filteridx = 0;
            for (var i = 0; i < _elementTree.length; i++) {
                if ($(_elementTree[i]).hasClass('selectedElement')) { //check this to see if it equal to columnElement and deletedelement
                    getHierarchy(_elementTree[i]); //regrab hierarchy with the selected element as index 0
                    grabFilter(parseInt($(_elementTree[0]).attr('data-id'))); //set to zero because of getHierarchy
                    _claimedElements.push(_elementTree[0]);
                    return;
                }
                if ($(_elementTree[i]).hasClass('columnElement') || $(_elementTree[i]).hasClass('deletedElement'))
                    return;
            }

            $(_targets[_selected]).val($(target).getSelector());
            $(target).addClass(currentState());
            _claimedElements.push(target);
            

            //also, when we switch filter off/go to a different page, let the backend C# send the saved filter to jquery so it can autoamtically highlight filters on a different page if they match
            //if user doesnt save filter on screen when filters are turned off, it is never sent to the server to save.

        }

        /*if (e.altKey) { //first check if it's even a child of a selectedElement

            var selector$ = $.parseHTML($('#signature').val());


            $(e.target).addClass('deletedElement');

        }*/
        return;
    };

    var browse = function (e, element) {
        $('#website').css('border', '1px solid orange');
        var url = $(element).attr("href");
        if (url.charAt(0) == '#' || url == "") {//change this to get the full url instead
            $('#website').css('border', '1px solid green');
            return;
        }

        if (url.charAt(0) == '/') //make check for urls that are like "test.php", that just means the test.php in whatever directory you are currently in
            url = $(_iframe).contents().find('base').attr('href') + url;

        if (!Validate.Url(url))
            url = $('#website').val() + '/' + url;

        if (Validate.Url(url)) {
            $('#website').val(url); //this isnt always correct, some bugs occur if websites use different ways of navigation
            IframeControl.ChangeSrcDoc(url);
            $('#website').css('border', '1px solid green');
        } else
            $('#website').css('border', '1px solid red');
        return;
    };

    var updateFilterList = function () {
        $('#filterdisplaybody').empty();
        var domain = $($('#target-frame').contents().find('#basedomain')).attr('href');
        $.ajax({
            url: '/Filters/GetFilters',
            method: 'POST',
            datatype: 'json',
            data: {
                'domain': domain
            },
            success: function (response) {
                if (!response)
                    alert("Something went wrong while retrieving the filters!");
                else {
                    var column;
                    var prefix;
                    var strip;
                    var id;
                    var row;
                    for (var i = 0; i < response.length; i++) {
                        column = response[i].Column;
                        prefix = response[i].Prefix;
                        strip = response[i].Strip;
                        id = response[i].Id;
                        row = '<tr data-id="' + id + '"><td>' + column + '</td><td>' + prefix + '</td><td>' + strip + '</td></tr>'
                        $('#filterdisplay').find('tbody:last').append(row);
                    }
                }
            },
            failure: function (error) {
                alert(error);
            }
        });
    }

    var saveFilter = function (e) { //check if level changed and if it did just delete the old filter on the server and replace it with the new one
        var signature = $('#signature').val();
        var prefix = $('#prefix').val();
        var strip = $('#strip').val();
        var column = $('#column').val();
        var isPrimary = $('#primarykey').prop('checked');
        var domain = $($('#target-frame').contents().find('#basedomain')).attr('href');
        var element = $('#target-frame').contents().find(signature);

        if ($(element).attr('data-id')) {
            var id = $(element).attr('data-id');
            _selectedId = undefined;
            $.ajax({
                url: '/Filters/Edit',
                method: 'POST',
                datatype: 'json',
                data: {
                    'id' : id,
                    'signature': signature,
                    'prefix': prefix,
                    'strip': strip,
                    'column': column,
                    'isprimary': isPrimary,
                    'domain': domain,
                },
                success: function (response) {
                    if (!response)
                        alert("Something went wrong while updating the filter!");
                },
                failure: function (error) {
                    alert(error);
                }
            });
        } else {
            $.ajax({
                url: '/Filters/Create',
                method: 'POST',
                dataType: 'json',
                data: {
                    'signature': signature,
                    'prefix': prefix,
                    'strip': strip,
                    'column': column,
                    'isprimary': isPrimary,
                    'domain': domain,
                },
                success: function (response) {
                    if (response)
                        $(element).attr('data-id', response);
                    else
                        alert("Something went wrong while saving the filter!");
                },
                error: function (error) {
                    alert(error);
                }
            });
        }
        cleanUp();
    };

    var grabFilter = function (id) { //this sends the value in #signature to the server and then gets back prefix/strip/column if it exists
        $.ajax({
            url: '/Filters/Details',
            method: 'GET',
            dataType: 'json',
            data: { 'id' : id },
            success: function (response) {
                if (response) {
                    $('#signature').val(response.Signature);
                    $('#prefix').val(response.Prefix);
                    $('#strip').val(response.Strip);
                    if ($('#target-frame').contents().find(response.Column).length > 0) {
                        $('#definedonpage').prop('checked', true);
                        $('#column').prop('readonly', true);
                    } else {
                        $('#definedonpage').prop('checked', false);
                        $('#column').prop('readonly', false);
                    }
                    $('#column').val(response.Column);
                    if (response.IsPrimary) {
                        $('#primarykey').prop('checked', true);
                    } else {
                        $('#primarykey').prop('checked', false);
                    }
                } else
                    alert("Something went wrong while retrieving the filter!");
            },
            error: function (error) {
                alert(error);
            }
        });
    }

    var deleteFilter = function () {
        var id;
        if (!_selectedId) {
            for (var i = 0; i < _claimedElements.length; i++) {
                if ($(_claimedElements[i]).hasClass('selectedElement')) {
                    id = $(_claimedElements[i]).attr('data-id');
                    $(_claimedElements[i]).attr('data-id', '');
                }
                $(_claimedElements[i]).removeClass('selectedElement columnElement deletedElement');
            }
            _claimedElements = [];
        } else {
            id = _selectedId;
            _selectedId = undefined;
        }

        $.ajax({
            url: '/Filters/Delete',
            method: 'POST',
            dataType: 'json',
            data: { 'id': id },
            success: function (response) {
                if (!response)
                    alert("Something went wrong while deleting the filter!");

                updateFilterList();
            },
            error: function (error) {
                alert(error);
            }
        });
        cleanUp();
    };

    var cleanUp = function () {
        _elementTree = [];
        $('#signature').val('');
        $('#prefix').val('');
        $('#strip').val('');
        $('#definedonpage').prop('checked', false);
        $('#column').prop('readonly', false);
        $('#column').val('');
        $('#signature').trigger('click');
        $('#primarykey').prop('checked', false);
        _inUse = false;
    }

    var currentState = function () {
        return _selected == 0 ? 'selectedElement' : 'columnElement';
    }

    var getHierarchy = function (target) {
        $('#level').val(0);
        _elementTree = [];
        _elementTree.push(target);
        $(_elementTree).parents().each(function () {
            _elementTree.push(this);
        });
    }

    var doesOverlap = function (element) {
        var children = $(element).find('*').toArray();
        for (var i = 0; i < children.length; i++) {
            if ($(children[i]).hasClass('selectedElement')) {
                //alert('Cannot overlap filters!'); //maybe that could be useful...will have to ask the crew
                return false; //true, testing with overlapping filters
            }
        }
        return false;
    };


    var show = function () {
        $('#filtercontrols').show();
        return;
    };

    var hide = function () {
        $('#filtercontrols').hide();
        return;
    };

    return {
        Init: init,
        Show: show,
        Hide: hide,
        UpdateFilterList: updateFilterList,
    }
})();

