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
    var _iframe;
    var _filters = new Array(30);
    var _filteridx = -1;

    var init = function (iframe) {
        _iframe = iframe;
        hide();

        $(_iframe).load(function () {
            $(_iframe).contents().find("body").click(function (e) {
                //e.stopImmediatePropagation(); may not be required
                if ($('#enablefilters').prop('checked'))
                    filter(e, this);
                return false;
            });

            $(_iframe).contents().find("a").click(function (e) {
                if (!$('#enablefilters').prop('checked'))
                    browse(e, this);
            });

            $(_iframe).contents().find("body").mouseover(function (e) {
                if ($('#enablefilters').prop('checked'))
                    $(e.target).css('filter', 'invert(100%)');
                    //$(e.target).css({'outline': '2px solid grey !important', 'filter': 'invert(100%)'});
            });
            $(_iframe).contents().find("body").mouseout(function (e) {
                if ($('#enablefilters').prop('checked'))
                    $(e.target).css('filter', 'invert(0%)'); //get filter working
                    //$(e.target).css({'outline': '', 'filter': 'invert(0%)'});
            });
        });

        for (var i = 0; i < _filters.length; i++)
            _filters[i] = 0; //put array into a know state

        $('.qtyplus').click(function (e) { //these need to only increment as much as the array's length
            //e.preventDefault();
            fieldName = $(this).attr('field');
            var currentVal = parseInt($('input[name=' + fieldName + ']').val());
            if (!isNaN(currentVal) && (currentVal + 1) < _filters[_filteridx].length) {
                $(_filters[_filteridx][currentVal]).removeClass('selectedElement');
                $('input[name=' + fieldName + ']').val(currentVal + 1);
                $(_filters[_filteridx][currentVal + 1]).addClass('selectedElement');
            } else {
                $(_filters[_filteridx][currentVal]).removeClass('selectedElement');
                $('input[name=' + fieldName + ']').val(0); //what if we are on level 4 and I enter in an invalid number, what happens...
                $(_filters[_filteridx][0]).addClass('selectedElement');
            }
            return false;
        });
        // This button will decrement the value till 0
        $(".qtyminus").click(function (e) {
            // e.preventDefault();
            fieldName = $(this).attr('field');
            var currentVal = parseInt($('input[name=' + fieldName + ']').val());
            if (!isNaN(currentVal) && currentVal > 0) {
                $(_filters[_filteridx][currentVal]).removeClass('selectedElement');
                $('input[name=' + fieldName + ']').val(currentVal - 1);
                $(_filters[_filteridx][currentVal - 1]).addClass('selectedElement');
            } else {
                $('input[name=' + fieldName + ']').val(0);
            }
            return false;
        });
    };

    var filter = function (e, element) {
        if (e.ctrlKey) {
            var elementTree = [];
            elementTree.push(e.target);
            $(elementTree).parents().each(function () {
                elementTree.push(element);
            });
            for (var i = 0; i < elementTree.length; i++) {
                if ($(elementTree[i]).hasClass('selectedElement')) {
                    (function (i) {
                        for (var j = 0; j < filters.length; j++)
                            if (Validate.ArraysAreEqual(filters[j], elementTree)) {
                                _filter.filteridx = j;
                                $('input[name=sensitivity]').val(i);
                                return;
                            }
                        return;
                    })(i);
                    return;
                }
            }
            $(e.target).addClass('selectedElement');
            $('input[name=sensitivity]').val(0);
            _filteridx++;
            _filters[_filteridx] = elementTree;
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

