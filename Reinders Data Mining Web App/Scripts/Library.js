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
        url = url || "http://www.reinders.com"; //just a default for now
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


    return {
        Init: init,
        ChangeSrcDoc: changeSrcDoc,
    };

})();

var FilterControl = (function (window) {
    var _iframe = {};
    var _filters = new Array(30);
    var _filteridx = 0;
    var _inUse = false;
    var _elementTree = []

    var init = function (iframe) {
        hide();

        _iframe = iframe;

        for (var i = 0; i < _filters.length; i++)
            _filters[i] = 0; //put array into a known state

        $(_iframe).load(function () {
            $(_iframe).contents().find("body").click(function (e) {
                if ($('#enablefilters').prop('checked') && !_inUse)
                    filter(e);
                return false;
            });

            $(_iframe).contents().find("a").click(function (e) {
                if (!$('#enablefilters').prop('checked'))
                    browse(e, this);
            });

            $(_iframe).contents().find("body").mouseover(function (e) {
                if ($('#enablefilters').prop('checked') && !_inUse)
                    $(e.target).css('outline', '2px solid grey', 'important');
            });
            $(_iframe).contents().find("body").mouseout(function (e) {
                if ($('#enablefilters').prop('checked')) //doesnt need to check if in use
                    $(e.target).css('outline', '');
            });
        });


        $('#enablefilters').change(function () {
            Loading.Start();
            if ($('#enablefilters').prop('checked'))
                show();
            else
                hide();
            Loading.End();
        });

        $('.qtyplus').click(function (e) {
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

        $(".qtyminus").click(function (e) {
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
        });

        $('#savefilter').click(function (e) {
            saveFilter(e);
        });

        $('#deletefilter').click(function (e) {
            deleteFilter(e)
        });
    };

    var filter = function (e) {
        if (e.ctrlKey &&
            !$(e.target).hasClass('selectedElement') &&
            !doesOverlap(e.target)) {
            _inUse = true;
            $(e.target).trigger("mouseout"); //get rid of our outline

            //generate element hierarchy 
            _elementTree = []; 
            _elementTree.push(e.target);
            $(_elementTree).parents().each(function () {
                _elementTree.push(this);
            });



            //Scan elements in hierarchy to see if a parent has already been selected
            var selectedElementIdx = 0;
            for (var i = 0; i < _elementTree.length; i++) {
                if ($(_elementTree[i]).hasClass('selectedElement')) {
                    selectedElementIdx = i;
                    (function (i) { //get filteridx of parent with selectedElement
                        for (var j = 0; j < _filters.length; j++)
                            if (Validate.ArraysAreEqual(_filters[j], _elementTree)) {
                                _filteridx = j;
                                return;
                            }
                        return;
                    })(selectedElementIdx);
                }
                else
                    $(e.target).addClass('selectedElement');
            }
            $('#sensitivity').val(selectedElementIdx);

            var elementClone = $(_elementTree[selectedElementIdx]).clone().removeClass('selectedElement').filter('[class=""]').removeAttr('class');
            var elementHtml = $(elementClone)[0].outerHTML; //this doesnt work, problem is that if the element doesnt have any classes after we remove selectedElement, the class attr stays
            //big no no
            $('#startmarker').val(elementHtml.substring(0, elementHtml.indexOf('>') + 1)); //get just the declaration tag
            //just realized this stuff needs to go both ways, if the user enters in a element signature it needs to highlight that element signature if it exists
            //call this method when click is used
            //call another method if user types it in
            //both should set the inUse flag.
            //need to use custom syntax, say user selects the second p (that has no attributes that make it unique) in a div (that does have unique attributes $(div).length == 1) then prefix the
            //start marker with something like "<eleminfo child="2" type="p">" so the marker would be "<eleminfo child="2" type="p"><div's unique tag>"
            //or we make it read only
            

            //also, when we switch filter off/go to a different page, let the backend C# send the saved filter to jquery so it can autoamtically highlight filters on a different page if they match
            //if user doesnt save filter on screen when filters are turned off, it is never sent to the server to save.

        }

        if (e.altKey) {
            $(e.target).addClass('deletedElement');
        }
        return;
    };

    var browse = function (e, element) {
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
        _filters[_filteridx] = _elementTree;
        _filteridx++;
    };

    var deleteFilter = function (e) {
        _elementTree = [];
    };

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

