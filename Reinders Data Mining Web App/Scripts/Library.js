$.fn.getSelector = function (subSig$) {
    var el = this[0];
    if (!el.tagName) {
        return '';
    }

    var el$ = $(el);
    var id = el$.attr('id');
    var elemsig$ = $('<elemsig />');
    if (subSig$)
        elemsig$.append(subSig$);

    elemsig$.attr('tag', el.tagName);

    var selector = el.tagName;

    if (id) {
        elemsig$.attr('id', id);
        selector +=  '#' + id;
    }

    var classNames = el$.attr('class'); //problem http://fxl.com/product/lights-incandescent/cm click on text in features, must be a parsing error
    var classSelector;
    if (classNames) {
        classSelector = '.' + $.trim(classNames).replace(/\s+/g, '.');
        elemsig$.attr('class', classSelector); //may want this to be in normal format "class1 class2" instead of selector format ".class1.class2"
        selector += classSelector;
    }

    var parent$ = el$.parent();
    var siblings$ = parent$.children(el.tagName);
    var isRelative = false;

    if (classSelector && siblings$.filter(selector).length == 1) {
        // Classes are unique among siblings; use that
        //selector = classSelector;
        //we are done, return?
    } else if (siblings$.filter(el.tagName).length == 1) {
        // Tag name is unique among siblings; use that
        //selector = el.tagName;
        //elemsig$.attr()
        //we are done, return?
    } else {
        // Default to saying "nth child"
        //selector = ':nth(' + $(this).index() + ')';
        elemsig$.attr('child', siblings$.index(el));
        isRelative = true;
        //we are done
    }

    elemsig$.attr('relative', isRelative);

    // Bypass ancestors that don't matter
    if (!isRelative) {
        for (ancestor$ = parent$.parent() ;
             ancestor$.length == 1 && ancestor$.find(selector).length == 1;
             parent$ = ancestor$, ancestor$ = ancestor$.parent());
        if (ancestor$.length == 0) {
            return elemsig$;
        }
    }

    return parent$.getSelector(elemsig$);
}

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
        getSource(url, function (srcDoc) {
            if (srcDoc == "invalid") {
                $('#website').css('border', '1px solid red');
                Loading.End();
                alert("The server did not return valid HTML");
                return;
            }
            $('#website').css('border', '1px solid green');
            _url = url;
            $(_iframe).attr("srcdoc", srcDoc);

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
            error: function (xhr, status, error) {
                var err = eval("(" + xhr.responseText + ")");
                alert(err.Message);
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

    var init = function (iframe) {

        hide();

        _iframe = iframe;

        $(_iframe).load(function () { //hook the iframe contents, put a hook in here that whenever new source is gathered, load the page through the filters to highlight elements that would be selected
            $(_iframe).contents().find("body").click(function (e) {
                if ($('#switch-on').prop('checked') && !_inUse)
                    filter(e);
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
        });


        $('#switch-on, #switch-off').change(function () { //ugly
            Loading.Start();
            if ($('#switch-on').prop('checked')) {
                $('.switch').css('background', 'green');
                show();
            } else {
                $('.switch').css('background', '#808080');
                hide();
            }
            Loading.End();
        });

        $('#disablejs').change(function () {
            if ($('#disablejs').prop('checked'))
                $(_iframe).attr('sandbox', 'allow=forms allow-pointer-lock allow-popups allow-same-origin allow-top-navigation');
            else
                $(_iframe).removeAttr('sandbox');
        });

        /*$('.qtyplus').click(function (e) { //super ugly
            var currentVal = parseInt($('#sensitivity').val());
            if (!isNaN(currentVal) && (currentVal + 1) < _filters[_filteridx].length) {
                if (!doesOverlap(_filters[_filteridx][currentVal + 1], _filters[_filteridx][currentVal])) { //only need to check this while incrementing I think...debug it
                    $(_filters[_filteridx][currentVal]).removeClass('selectedElement');
                    $('#sensitivity').val(currentVal + 1);
                    $(_filters[_filteridx][currentVal + 1]).addClass('selectedElement');
                }
            } else {
                $(_filters[_filteridx][currentVal]).removeClass('selectedElement');
                $('#sensitivity').val(0);
                $(_filters[_filteridx][0]).addClass('selectedElement');
            }
            return false;
        });

        $(".qtyminus").click(function (e) { //we probably can put these in a function that changes depending on params, ie: add/subtract
            var currentVal = parseInt($('#sensitivity').val());
            if (!isNaN(currentVal) && currentVal > 0) {
                $(_filters[_filteridx][currentVal]).removeClass('selectedElement');
                $('#sensitivity').val(currentVal - 1);
                $(_filters[_filteridx][currentVal - 1]).addClass('selectedElement');
            } else {
                $(_filters[_filteridx][currentVal]).removeClass('selectedElement');
                $('#sensitivity').val(0);
                $(_filters[_filteridx][0]).addClass('selectedElement');
            }
            return false;
        });*/

        $('#definedonpage').change(function () {
            if ($('#signature').val().length > 0)
                if ($('#definedonpage').prop('checked'))
                    $('#column').prop('readonly', true);
                else
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
            deleteFilter(e)
        });
    };

    var filter = function (e) {
        if (e.ctrlKey &&
            !doesOverlap(e.target)) {

            _inUse = true;
            $(e.target).trigger("mouseout"); //get rid of our outline, double check this actually works...
            $('#level').val(0);
            //generate element hierarchy 
            getHierarchy(e.target);

            //Scan elements in hierarchy to see if a parent has already been selected
            var _filteridx = 0;
            for (var i = 0; i < _elementTree.length; i++) {
                if ($(_elementTree[i]).hasClass('selectedElement')) {
                    $('#signature').val($(_elementTree[i]).data('signature'));
                    grabFilter();
                    return;
                }
            }

            var selector$ = $(e.target).getSelector();
            $(e.target).data('signature', selector$[0].outerHTML);
            $('#signature').val($(e.target).data('signature'));
            $(e.target).addClass('selectedElement');

            //also, when we switch filter off/go to a different page, let the backend C# send the saved filter to jquery so it can autoamtically highlight filters on a different page if they match
            //if user doesnt save filter on screen when filters are turned off, it is never sent to the server to save.

        }

        if (e.altKey) { //first check if it's even a child of a selectedElement

            var selector$ = $.parseHTML($('#signature').val());


            $(e.target).addClass('deletedElement');

        }
        return;
    };

    var browse = function (e, element) {
        $('#website').css('border', '1px solid orange');
        var url = $(element).attr("href");
        if (url.charAt(0) == '#' || url == "") //change this to get the full url instead
            return;

        if (url.charAt(0) == '/')
            url = $(_iframe).contents().find('base').attr('href') + url;

        if (Validate.Url(url)) {
            $('#website').val(url); //this isnt always correct, some bugs occur if websites use different ways of navigation
            IframeControl.ChangeSrcDoc(url);
        }
        return;
    };

    var saveFilter = function (e) {
        //_filters[_filteridx] = _elementTree;
        //_filteridx++;
        $.ajax({
            url: '/Home/AddFilter',
            method: 'GET',
            dataType: 'json',
            data: {
                signature: $('#signature').val(),
                prefix: $('#prefix').val(),
                strip: $('#strip').val(),
                column: $('#column').val()
            },
            success: function (srcDoc) {
                callback(srcDoc);
            },
            error: function (xhr, status, error) {
                var err = eval("(" + xhr.responseText + ")");
                alert(err.Message);
                callback("invalid");
            }
        });
        cleanUp();
    };

    var grabFilter = function () { //this sends the value in #signature to the server and then gets back prefix/strip/column if it exists

    }

    var deleteFilter = function (e) {
        for (var i = 0; i < _elementTree.length; i++) {
            if ($(_elementTree[i]).hasClass('selectedElement'))
                $(_elementTree[i]).removeClass('selectedElement');
        }
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
        _inUse = false;
    }

    var getHierarchy = function (target) {
        _elementTree = [];
        _elementTree.push(target);
        $(_elementTree).parents().each(function () {
            _elementTree.push(this);
        });
    }

    var doesOverlap = function (element, ignore) {
        var ignore = ignore || 0;
        var children = $(element).find('*').toArray();
        for (var i = 0; i < children.length; i++) {
            if (children[i] != ignore &&
                $(children[i]).hasClass('selectedElement')) {
                alert('Cannot overlap filters!'); //maybe that could be useful...will have to ask the crew
                return true;
            }
        }
        return false;
    };

    var elemSigToSelector = function (elemsig) {

    }

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

    }
})();

