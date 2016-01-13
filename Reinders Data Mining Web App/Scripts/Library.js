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
                    if (result) {
                        updateBStack();
                        _currentUrl = result.Url;
                        $('#urlinput').val(_currentUrl)
                        updateFrame(result.Src);
                    } else {
                        alert("There was an error clicking that element");
                    }
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
        var _clusterGUID
        var _selectedFilter;
        var _selectors = [];

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
                deleteFilter();
                resetFilter(); //gotta remove filter overlay from canvas too
            });

            $('#record').click(function () {
                _tempOverlay = null;
                recordEvent();
                resetFilter();
            });

            $('#savefilters').click(function () {

            });

            $('#filtercontainer').on('click', '.filteritem', function () {
                selectFilter($(this).attr('id'));
            });

            $('#filtercontainer').on('mousedown', '.filteritem', function () {
                $(this).css('background-color', '#888')
            });

            $('#filtercontainer').on('mouseup', '.filteritem', function () {
                $(this).css('background-color', '');
            });

            $('#clustercontainer').on('click', '.clusteritem', function () {
                selectCluster($(this).attr('id'));
            });

            $(_iframe).load(function () {
                updateCanvasDim($(this).contents().width(), $(this).contents().height());
                updateClusterList();
            });

            $(window).resize(function () {
                updateCanvasDim($(_iframe).contents().width(), $(_iframe).contents().height());
                updateCanvas();
                resetFilter();
            })
        };


        var updateSelector = function (target) {
            var width = $(target).outerWidth();
            var height = $(target).outerHeight();
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
            var obj = getItemInCanvas(element);
            if (up) {
                var currentVal = parseInt($('#selectorlevel').val());
                if ((currentVal + 1) < _elementTree.length)
                    $('#selectorlevel').val(currentVal + 1);
            } else {
                var currentVal = parseInt($('#selectorlevel').val());
                if (currentVal > 0)
                    $('#selectorlevel').val(currentVal - 1);
            }
            var currentVal = parseInt($('#selectorlevel').val());
            obj.set({
                'height': $(_elementTree[currentVal]).outerHeight(),
                'width': $(_elementTree[currentVal]).outerWidth(),
                'top': $(_elementTree[currentVal]).offset().top,
                'left': $(_elementTree[currentVal]).offset().left,
            });
            $('#selector').val($(_elementTree[currentVal]).getSelector());
            _canvas.renderAll();
            return;
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
            _selectedFilter = null;
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
            var action = parseInt($('#action').val());
            var column = $('#column').val();
            var required = $('#required').prop('checked');
            if (!selector || !column) {
                alert('Missing required fields');
                return;
            }
            if (!_selectedFilter)
                $.ajax({
                    url: '/Home/AddFilter',
                    method: 'POST',
                    dataType: 'json',
                    data: {
                        Selector: selector,
                        Action: action,
                        Required: required,
                        GUID: _clusterGUID,
                        Strip: null,
                        Column: column
                    },
                    success: function (result) {
                        result ? updateFilterList() : alert("Could not save filter!");
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert(xhr.status);
                        alert(thrownError);
                    }
                });
            else {
                $.ajax({
                    url: '/Home/UpdateFilter',
                    method: 'POST',
                    dataType: 'json',
                    data: {
                        Id: _selectedFilter,
                        Selector: selector,
                        Action: action,
                        Required: required,
                        GUID: _clusterGUID,
                        Column: column
                    },
                    success: function (result) {
                        result ? updateFilterList() : alert("Could not save filter!");
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert(xhr.status);
                        alert(thrownError);
                    }
                });
                _selectedFilter = null;
            }


            //var filterItem = '<div class="filteritem"><div class="' + (required ? 'glyphicon glyphicon-star' : 'glyphiconempty') + '"></div><div>' + actiontxt + '</div><div>' + column + '</div></div>';
            //$('#filtercontainer').append(filterItem);

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

        var updateClusterList = function () {
            $('#clustercontainer').empty();
            var domain = $(_iframe).contents().find('base').attr('href');
            $.ajax({
                url: '/Home/GetClusters',
                method: 'GET',
                dataType: 'json',
                data: { Domain: domain },
                success: function (clusters) {
                    if (!clusters.length) {
                        alert("Server returned no website clusters, at least 1 expected! Try refreshing the page.");
                    } else {
                        for (var i = 0; i < clusters.length; i++) {
                            var name = clusters[i].Name;
                            var guid = clusters[i].GUID;
                            var clusterItem = '<div id="' + guid + '" class="clusteritem"><div class="glyphicon glyphicon-list"></div><div>' + name + '</div></div>';
                            $('#clustercontainer').append(clusterItem);
                        }
                        selectCluster(clusters[0].GUID);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                }
            });
        };

        var updateFilterList = function () {
            $('#filtercontainer').empty();
            _selectors = [];
            $.ajax({
                url: '/Home/GetFilters',
                method: 'GET',
                dataType: 'json',
                data: { GUID: _clusterGUID },
                success: function (filters) {
                    if (filters.length) {
                        for (var i = 0; i < filters.length; i++) {
                            var id = filters[i].Id;
                            var selector = filters[i].Selector;
                            _selectors.push(selector);
                            var action = filters[i].Action;
                            var actiontxt = (function () {
                                switch (action) {
                                    case 0:
                                        return 'Grab';
                                        break;
                                    case 1:
                                        return 'Ignore';
                                        break;
                                    case 2:
                                        return 'Click';
                                        break;
                                    default:
                                        return 'Unknown';
                                        break;
                                }
                            })();
                            var required = filters[i].Required;
                            var column = filters[i].Column;
                            var filterItem = '<div id="' + id + '" class="filteritem" selector="' + selector + '" action="' + action + '"><div class="' + (required ? 'glyphicon glyphicon-star' : 'glyphiconempty') + '"></div><div>' + actiontxt + '</div><div>' + column + '</div></div>';
                            $('#filtercontainer').append(filterItem);
                        }
                    }
                    updateCanvas();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                }
            });
        };

        var selectCluster = function (guid) {
            if (_clusterGUID)
                $('#' + _clusterGUID).css('background-color', '');
            _clusterGUID = guid;
            $('#title').val($('#' + _clusterGUID + ' div:nth-child(2)').text());
            updateFilterList();
            resetFilter();
            $('#' + _clusterGUID).css('background-color', '#888');
        };

        var selectFilter = function (id) {
            if (_tempOverlay)
                _tempOverlay.remove();
            _selectedFilter = parseInt(id);
            $('#selector').val($('#' + id).attr('selector'));
            $('#action').val($('#' + id).attr('action'));
            $('#column').val($('#' + id + ' div:nth-child(3)').text());
            $('#required').prop('checked', $('#' + id + ' div:nth-child(1)').hasClass('glyphicon-star'));
            getHierarchy($('#selector').val());
        };

        var deleteFilter = function () {
            if (!_selectedFilter)
                return;

            if (_tempOverlay)
                _tempOverlay.remove();

            $.ajax({
                url: '/Home/DeleteFilter',
                method: 'POST',
                dataType: 'json',
                data: {
                    Id: _selectedFilter,
                },
                success: function (result) {
                    if (!result)
                        alert("Something went wrong removing the filter");
                    updateFilterList();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.status);
                    alert(thrownError);
                }
            });
            _selectedFilter = null;
            updateCanvas();
        };

        var updateCanvasDim = function (width, height) {
            _canvas.setWidth(width);
            _canvas.setHeight(height);
        };

        var updateCanvas = function () {
            _canvas.clear();
            for(var i = 0; i < _selectors.length; i++) {
                var target = $(_iframe).contents().find(_selectors[i])
                if (!target.length)
                    continue;
                var color = $('#filtercontainer > div:nth(' + i + ')').attr('action') == "1" ? 'red' : new fabric.Color('rgb(10, 20, 30)');
                var rect = new fabric.Rect({
                    left: $(target).offset().left,
                    top: $(target).offset().top,
                    fill: color,
                    width: $(target).outerWidth(),
                    height: $(target).outerHeight(),
                    stroke: '#FFF',
                    strokewidth: 3,
                    opacity: 0.5
                });
                _canvas.add(rect);
            }
            _canvas.renderAll();
        };

        var getHierarchy = function (target) {
            _elementTree = [];
            $('#selectorlevel').val(0);
            _elementTree.push(target);
            $(_iframe).contents().find(_elementTree[0]).parents().each(function () {
                _elementTree.push(this);
            });
        };

        return {
            Init: init,
            UpdateSelector: updateSelector,
            Grab: grab,
            RecordClick: recordClick,
        }
    })();

    return {
        Init: init
    }



})();
