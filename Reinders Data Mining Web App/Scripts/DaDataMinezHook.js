jQuery(document).ready(function () {

    $('#website').focusout(function () {
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
                });
            }
        });
    }
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