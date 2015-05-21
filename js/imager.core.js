/**
 * @file
 */

/**
 * Wrap file in JQuery();
 *
 * @param $
 */
(function ($) {

  "use strict";

// Create the Drupal.imager namespace and subspaces.
  Drupal.imager = {
    'popups': {},
    'viewer': {}
  };

  var Popups = Drupal.imager.popups;

  Drupal.imager.coreM = function () {

    var messageTimeout;

    var displayMessage = function displayMessage(msg) {
//    $imagerMessages.show();
      $('#imager-messages-content').html(msg);
      if (localStorage['imagerDebugMessages'] === "FALSE") {
        messageTimeout = setTimeout(function () {
//        $imagerMessages.hide();
        }, 5000);
      }
    };

    /**
     * Process AJAX requests.
     *
     * @todo Drupal probably has an API for this.
     *
     * @param {Object} $callingElement
     * @param {path} url
     * @param {Object} postData
     * @param {function} processFunc
     */
    var ajaxProcess = function ajaxProcess($callingElement, url, postData, processFunc) {
      postData['filePath'] = Drupal.imager.settings.filePath;
      $.ajax({
        type: "POST",
        url: url,
        data: postData,
        success: function (response_json) {
          clearTimeout(messageTimeout);
//        Popups.$busy.hide();
          var response = JSON.parse(response_json);
          var display = false;
          var out;
          out = "<h2>" + response['action'] + ':' + response['status'] + "</h2>";
          if (response['info']) {
            out += "<div class='info'>" + response['info'] + "</div>";
            display = true;
          }
          if (response['status'] === 'catch' ||
            (response['debug'] && localStorage['imagerDebugMessages'] === "TRUE")) {
            out += "<div class='debug'>" + response['debug'] + "</div>";
            display = true;
          }

          if (display) {
            Popups.messages.dialogOpen();
            $('#imager-messages-content').html(out);
          }
          if (processFunc) {
            processFunc.call($callingElement, response);
          }   // Execute users function
          if (localStorage['imagerDebugMessages'] === "FALSE") {
            setTimeout(function () {
              Popups.messages.dialogClose();
            }, 3000);
          }
        },
        error: function (evt) {
//        Popups.$busy.hide();
          clearTimeout(messageTimeout);
          Popups.messages.dialogOpen();
          $('#imager-messages-content').html('<p class="error">Error: ' + evt.status + ': ' + evt.statusText +
          '<br>Action: ' + postData.action + '</p>');
          if (processFunc) {
            processFunc(response, evt);
          }   // Execute users error function
          if (localStorage['imagerDebugMessages'] === "FALSE") {
            setTimeout(function () {
              Popups.messages.dialogClose();
            }, 10000);
          }
        }
      });
    }; // ajaxProcess()

    var pointC = function pointC(spec) {
      var namex = spec.name + '-x';
      var namey = spec.name + '-y';
      var point = {
        'v': {'x': 0, 'y': 0},
        't': {'x': 0, 'y': 0}
      };
      var doTransform = spec.transform || false;
      if (doTransform) {
        var namext = namex + '-tx';
        var nameyt = namey + '-tx';
      }

      point.setPt = function setPt(x, y, ctx) {
        point.v.x = x;
        point.v.y = y;
        var vals = {};
        vals[namex] = parseInt(x);
        vals[namey] = parseInt(y);
        if (doTransform) {
          point.t = ctx.transformedPoint(x, y);
          vals[namext] = parseInt(point.t.x);
          vals[nameyt] = parseInt(point.t.y);
        }
        Popups.status.dialogUpdate(vals);
      };

      point.getPt = function getPt() {
        return point.v;
      };
      point.getTxPt = function getTxPt() {
        return point.t;
      };

      return point;
    };


    /**
     * Given the path to a thumbnail determine the path of the full image
     *
     * If '/styles/' is part of the path then simply remove /styles/
     * and the next two path components.
     * Otherwise look for the parent element to be a link to the full image.
     *
     * @param {type} tsrc
     *
     * @returns string
     *   Full file path of original image.
     */
    var getFullPath = function getFullPath(tsrc) {
      var src;
      // If the image has "/styles/" in it's path
      // then extract the large image path by modifying the thumbnail path
      // Kludgy but it works - any better ideas.
      if (tsrc.indexOf('/styles/')) {
        var sindex = tsrc.indexOf('styles');
        var index = sindex;
        var slashes = 0;
        while (slashes < 3) {
          index++;
          if (tsrc.charAt(index) === '/') {
            slashes++;
          }
        }
        var tindex = tsrc.indexOf('?itok');
        if (tindex) {
          src = tsrc.substr(0, sindex) + tsrc.substr(index + 1, tindex - index - 1);
        }
        else {
          src = tsrc.substr(0, sindex) + tsrc.substr(index + 1);
        }
//    @deprecated
//    } else if ($(thumbnail).parent().attr('href')) {
//      src = $(thumbnail).parent().attr('href');
      }
      return src;
    };

    /**
     * Given an angle degrees, calculate it in radians.
     *
     * @param deg
     * @returns {number}
     *   Angle in radians
     */
    var angleInRadians = function angleInRadians(deg) {
      return deg * Math.PI / 180;
    };

    return {
      'ajaxProcess': ajaxProcess,
      'angleInRadians': angleInRadians,
      'displayMessage': displayMessage,
      'getFullPath': getFullPath,
      'pointC': pointC
    };
  };
})(jQuery);
