var iframeLoad = (function () {
    
    var init = function (url) {
        url = url || "http://www.google.com";
        changeSrcDoc(url); //just a default for now
    };

    var changeSrcDoc = function (url) { //assumes url has already been validated
        getSource(url, function (srcDoc) {
            if (srcDoc == "error")
                return;
            $("#target-frame").unbind('load');
            $("#target-frame").attr("srcdoc", srcDoc);
            $("#target-frame").load(function () {
                $('#target-frame').contents().find('a').click( function (event) {
                    var uri = $(this).attr("href");
                    if (uri.charAt(0) == '#') {
                        return;
                    }
                    if (uri.charAt(0) == '/')
                        uri = $('#target-frame').contents().find('base').attr('href') + uri;
                    $('#website').val(uri);
                    changeSrcDoc(uri);
                });
            });

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
                    callback(Boolean(isUrl));
                }
            });
        }
    };

    return {
        url: url,
    }
})();

$(document).ready(function() {
    iframeLoad.init();

    $('#website').on('input propertychange paste', function () {
        validate.url($('#website').val(), function (isValid) {
            if (isValid) {
                var test = $('#website').val()
                iframeLoad.changeSrcDoc($('#website').val());
            }
        });
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
                    $('#target-frame').contents().find('a').one("click", function (event) {
                        event.stopPropagation();
                        var uri = $(this).attr("href");
                        if (uri.charAt(0) == '/')
                            uri = document.location.origin + uri;
                        getIframeSrcDoc(uri);
                    });

                    /*$("#target-frame").contents().find("body").click(function (event) {
                        $(event.target).addClass("selectedElement");
                    });*/
                    /*$("#target-frame").contents().find("body").mouseover(function (event) {
                        $(event.target).css('outline', '5px solid grey');
                    });
                    $("#target-frame").contents().find("body").mouseout(function (event) {
                        $(event.target).css('outline', '0');
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
                    $("#target-frame").contents().find("body").click(function (event) {
                        $(event.target).css('outline', '5px solid red');
                    });
                    $("#target-frame").contents().find("body").mouseover(function (event) {
                        $(event.target).css('outline', '5px solid grey');
                    });
                    $("#target-frame").contents().find("body").mouseout(function (event) {
                        $(event.target).css('outline', '0');
                    });
                });
            }
        );*/



});

function changeTab(pageId) {
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
                        node.style.display = 'block';
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