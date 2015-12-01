var iframeControl = (function () {
    var _url = "";
    
    var init = function (url) {
        url = url || "http://www.reinders.com";
        changeSrcDoc(url); //just a default for now
        bindLoad(defaultload);
    };

    var defaultload = function () {
        $('#target-frame').contents().find('a').click(function (e) { //detect if link clicked is image!!
            //e.preventDefault();
            e.stopImmediatePropagation();
            var uri = $(this).attr("href");
            if (uri.charAt(0) == '#' || uri == "")
                return;
            if (uri.charAt(0) == '/')
                uri = $('#target-frame').contents().find('base').attr('href') + uri;

            if (validate.isImage(uri))
                return;

            $('#website').val(uri);
            changeSrcDoc(uri);
            return false;
        });
    };

    var bindLoad = function (loadfunc) {
        $('#target-frame').unbind();
        $('#target-frame').load(loadfunc);
        changeSrcDoc(_url);
    };

    var changeSrcDoc = function (url) { //assumes url has already been validated
        $('#loadinggif').show();
        $('#website').css('border', '1px solid orange');
        getSource(url, function (srcDoc) {
            if (srcDoc == "error") {
                $('#loadinggif').hide();
                $('#website').css('border', '1px solid red');
                return;
            }
            _url = url;
            $("#target-frame").attr("srcdoc", srcDoc);
            $('#website').css('border', '1px solid green');
            $('#loadinggif').hide();
        });
    };

    var getSource = function (url, callback) {
        $.ajax({
            url: '/Home/GetTargetFrame',
            method: 'GET',
            dataType: 'json',
            data: { url: url },
            error: function(xhr, status, error) {
                var err = eval("(" + xhr.responseText + ")");
                alert(err.Message);
                callback("error");
            },
            success: function (srcDoc) {
                callback(srcDoc);
            }
        });

    };

    return {
        init: init,
        changeSrcDoc: changeSrcDoc,
        bindLoad: bindLoad,
        defaultload: defaultload,
        url: _url,
    };

})();


var validate = (function () {
    var url = function (link, callback) {
        var linkRegexFilter = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
        var linkRegex = new RegExp(linkRegexFilter, 'i');
        if (link.length < 2083 && linkRegex.test(link))
        {
            $.ajax({
                url: '/Home/UrlValidation',
                method: 'GET',
                dataType: 'json',
                data: { url: link },
                error: function (xhr, status, error) {
                    var err = eval("(" + xhr.responseText + ")");
                    alert(err.Message);
                    callback(false);
                },
                success: function (isUrl) {
                    callback(Boolean(isUrl), link);
                }
            });
        }
    };

    var isImage = function (link) {
        var imageExts = ["tif", "tiff", "gif", "jpeg", "jpg", "jif", "jfif",
                         "jp2", "jpx", "j2k", "j2c", "fpx", "pcd", "png", "pdf"];
        var re = /(?:\.([^./]+))?$/;

        var linkExt = re.exec(link)[1];

        for (var i = 0; i < imageExts.length; i++) {
            if (linkExt == imageExts[i]) {
                return true;
            }
        }

        return false;
    };

    return {
        url: url,
        isImage: isImage,
    }
})();

var filterControl = (function () {
    var filters = new Array(30); //30 filters maximum, but that seems overkill
    var filteridx = -1; //this needs to be accurate no matter what! Also needs to be -1 becuase linkhook increments it after every click. First click will set it to 0 which is correct

    var init = function () {
        for (var i = 0; i < filters.length; i++)
            filters[i] = 0; //put array into a know state

        $('.qtyplus').click(function (e) { //these need to only increment as much as the array's length
            e.preventDefault();
            fieldName = $(this).attr('field');
            var currentVal = parseInt($('input[name=' + fieldName + ']').val());
            if (!isNaN(currentVal)) {
                $(filters[filteridx][currentVal]).removeClass('selectedElement');
                $('input[name=' + fieldName + ']').val(currentVal + 1);
                $(filters[filteridx][currentVal + 1]).addClass('selectedElement');
            } else {
                $('input[name=' + fieldName + ']').val(0); //what if we are on level 4 and I enter in an invalid number, what happens...
            }
            $.ajax({
                url: '/Home/Test',
                method: 'GET',
                dataType: 'json',
                error: function (xhr, status, error) {
                    var err = eval("(" + xhr.responseText + ")");
                    alert(err.Message);
                    callback(false);
                },
                success: function (data) {
                    $('#startmarker').val(data);
                }
            });
        });
        // This button will decrement the value till 0
        $(".qtyminus").click(function (e) {
            e.preventDefault();
            fieldName = $(this).attr('field');
            var currentVal = parseInt($('input[name=' + fieldName + ']').val());
            if (!isNaN(currentVal) && currentVal > 0) {
                $(filters[filteridx][currentVal]).removeClass('selectedElement');
                $('input[name=' + fieldName + ']').val(currentVal - 1);
                $(filters[filteridx][currentVal - 1]).addClass('selectedElement');
            } else {
                $('input[name=' + fieldName + ']').val(0);
            }
        });
        hide();
    };

    var show = function () {
        $('#filtercontrols').show();
        var linkHook = function () {
            $("#target-frame").contents().find("body").click(function (e) {
                e.stopImmediatePropagation();
                if (!e.ctrlKey)
                    return false;
                //$(e.target).css('outline', '1px solid red');
                $(e.target).addClass('selectedElement');
                $('input[name=sensitivity]').val(0);
                var elementTree = [];
                elementTree.push(e.target);
                $(elementTree).parents().each(function () {
                    elementTree.push(this);
                });
                filteridx++;
                filters[filteridx] = elementTree;
                return false;
            });
        };
        iframeControl.bindLoad(linkHook);
    };

    var hide = function () {
        $('#filtercontrols').hide();
        iframeControl.bindLoad(iframeControl.defaultload);
    };

    return {
        init: init,
        show: show,
        hide: hide,
    }
})();

$(document).ready(function() {
    iframeControl.init();
    filterControl.init();

    $('#website').on('input propertychange paste', function () {
        var input = $('#website').val();
        if (!validate.isImage(input))
            validate.url(input, function (isValid, link) {
                if (isValid) {
                    iframeControl.changeSrcDoc(link);
                }
            });
        else
            alert("Cant navigate to images");
    });

    $('#enablefilters').change(function () {
        if ($('#enablefilters').prop('checked'))
            filterControl.show();
        else
            filterControl.hide();
    });

    /*$('#website').focusout(function () {
        getIframeSrcDoc();
    });

    function getIframeSrcDoc(iframeLink) {
        iframeLink = iframeLink || $('#website').val();
        if (iframeLink.charAt(0) == '#') {
            return;
        }
        $.ajax({
            url: '/Home/GetTargetFrame',
            method: 'GET',
            dataType: 'json',
            data: {url: iframeLink },
            success: function (srcDoc) {
                $("#target-frame").attr("srcdoc", srcDoc);
                $("#target-frame").load(function () {
                    $('#target-frame').contents().find('a').one("click", function (e) {
                        e.stopPropagation();
                        var uri = $(this).attr("href");
                        if (uri.charAt(0) == '/')
                            uri = document.location.origin + uri;
                        getIframeSrcDoc(uri);
                    });

                    /*$("#target-frame").contents().find("body").click(function (e) {
                        $(e.target).addClass("selectedElement");
                    });*/
                    /*$("#target-frame").contents().find("body").mouseover(function (e) {
                        $(e.target).css('outline', '5px solid grey');
                    });
                    $("#target-frame").contents().find("body").mouseout(function (e) {
                        $(e.target).css('outline', '0');
                    });*/
                /*});
            }
        });
    }*/
        /*$.get("/Home/GetTargetFrame",
            { url: encodeURIComponent($('#website').val()) },
            function (srcDoc) {
                $("#target-frame").attr("srcdoc", srcDoc);
                $("#target-frame").load(function () {
                    $("#target-frame").contents().find("body").click(function (e) {
                        $(e.target).css('outline', '5px solid red');
                    });
                    $("#target-frame").contents().find("body").mouseover(function (e) {
                        $(e.target).css('outline', '5px solid grey');
                    });
                    $("#target-frame").contents().find("body").mouseout(function (e) {
                        $(e.target).css('outline', '0');
                    });
                });
            }
        );*/



});

function changeTab(pageId) { //redo this ugly mess
    var tabCtrl = document.getElementById('tabControl');
    var pageToActivate = document.getElementById(pageId);
    for (var i = 0; i < tabCtrl.childNodes.length; i++) {
        var node = tabCtrl.childNodes[i];
        if (node.nodeType == 1) {
            if (node == pageToActivate) {
                switch ($(node).attr('id')) {
                    case 'functionTab':
                        $('#functionTabLink').removeClass('unselectedTab');
                        $('#controlTabLink').addClass('unselectedTab');
                        $('#functionTab').show();
                        $('#controlTab').hide();
                        break;
                    case 'controlTab':
                        $('#controlTabLink').removeClass('unselectedTab');
                        $('#functionTabLink').addClass('unselectedTab');
                        $('#controlTab').show();
                        $('#functionTab').hide();
                        break;
                }
            }
        }
    }
}