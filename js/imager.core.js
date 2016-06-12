/**
 * @file
 * Creates namespaces and provide utility routines needed by Imager module.
 */

(function ($) {
  'use strict';

  // Create the Drupal.imager namespace and subspaces.
  Drupal.imager = {
    popups: {},
    viewer: {}
  };

  Drupal.imager.coreM = function () {
    var Popups = Drupal.imager.popups;
    var Viewer = Drupal.imager.viewer;
    var messageTimeout;

    var displayMessage = function displayMessage(msg) {
      // $imagerMessages.show();
      $('#imager-messages-content').html(msg);
      if (localStorage['imagerDebugMessages'] === 'false') {
        messageTimeout = setTimeout(function () {
          // $imagerMessages.hide();
        }, 5000);
      }
    };

    var getImage = function getImage(resolution, stream) {
      var mimeType = '';
      var pt_canvas_ul = Viewer.pt_canvas_ul;
      var pt_canvas_lr = Viewer.pt_canvas_lr;
      var status = Viewer.getStatus();
      var img = Viewer.getImg();
      var dataurl;

      mimeType = 'image/png';
      if (img.src.match(/\.png$/i)) {
        mimeType = 'image/png';
      }
      else if (img.src.match(/\.jpe*g$/i)) {
        mimeType = 'image/jpeg';
      }

      switch (resolution) {
        case 'screen':
          dataurl = Viewer.$canvas[0].toDataURL(mimeType);
          break;

        case 'image-cropped':
          Viewer.ctx2.setTransform(1, 0, 0, 1, 0, 0);
          var ncw;
          var nch;
          var pt = pointC('tmp');
          if (status.rotation === 0 || status.rotation === 180) {
            ncw = Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x);
            nch = Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y);
            Viewer.$canvas2.attr({
              width: ncw,
              // Set canvas to same size as image.
              height: nch
            });
            if (status.rotation === 0) {
              pt.setPt(0, 0, Viewer.ctx);
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x,
                -pt.getTxPt().y);
            }
            else {
              Viewer.ctx2.translate(ncw, nch);
              Viewer.ctx2.rotate(angleInRadians(status.rotation));
              pt.setPt(status.cw, status.ch, Viewer.ctx);
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x, -pt.getTxPt().y);
            }
          }
          else {
            ncw = Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y);
            nch = Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x);
            Viewer.$canvas2.attr({
              width: ncw,
              height: nch
            });
            if (status.rotation === 90) {
              Viewer.ctx2.translate(ncw, 0);
              Viewer.ctx2.rotate(angleInRadians(status.rotation));
              pt.setPt(status.cw, 0, Viewer.ctx);
              // Find Upper left corner of canvas in original image.
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x, -pt.getTxPt().y);
            }
            else {
              Viewer.ctx2.translate(0, nch);
              Viewer.ctx2.rotate(angleInRadians(status.rotation));
              pt.setPt(0, status.ch, Viewer.ctx);
              // Find Upper left corner of canvas in original image.
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x, -pt.getTxPt().y);
            }
          }
          dataurl = Viewer.$canvas2[0].toDataURL(mimeType);
          break;

        case 'image-full':
          var tcw;
          var tch;
          Viewer.ctx2.setTransform(1, 0, 0, 1, 0, 0);
          if (status.rotation === 0 || status.rotation === 180) {
            tcw = Viewer.image().iw;
            Viewer.$canvas2.attr({
              width: tcw,
              // Set canvas to same size as image.
              height: tch
            });
            if (status.rotation === 180) {
              Viewer.ctx2.translate(Viewer.image().iw, Viewer.image().ih);
            }
          }
          else {
            tcw = Viewer.image().ih;
            tch = Viewer.image().iw;
            Viewer.$canvas2.attr({
              width: tcw,
              // Set canvas to same size as image.
              height: tch
            });
            if (status.rotation === 90) {
              Viewer.ctx2.translate(Viewer.image().ih, 0);
            }
            else {
              Viewer.ctx2.translate(0, Viewer.image().iw);
            }
          }
          Viewer.ctx2.rotate(angleInRadians(status.rotation));
          Viewer.ctx2.drawImage(img, 0, 0);
          // Copy full image into canvas.
          dataurl = Viewer.$canvas2[0].toDataURL(mimeType);
          break;
      }
      if (stream) {
        dataurl = dataurl.replace(mimeType, 'image/octet-stream');
      }
      return dataurl;
    };

    /**
     * Process AJAX requests.
     *
     * @param {Object} $callingElement
     *   Element from which this ajax call was initiated.
     * @param {path} url
     *   URL of the AJAX handler - registered with hook_menu().
     * @param {Object} postData
     *   Data needed by the php ajax function.
     * @param {function} processFunc
     *   Function to call after receiving data.
     *
     * @TODO Drupal probably has an API for this.
     */
    var ajaxProcess = function ajaxProcess($callingElement, url, postData, processFunc) {
      postData['filePath'] = Drupal.imager.settings.filePath;
      $.ajax({
        type: 'POST',
        url: url,
        data: postData,
        success: function (response_json) {
          clearTimeout(messageTimeout);
          // Popups.$busy.hide();
          var response = JSON.parse(response_json);
          var display = false;
          var out;
          var i;
          out = '<h2>' + response['action'] + ':' + response['status'] + '</h2>';
          if (response['info']) {
            out += '<div class="info">' + response['info'] + '</div>';
            display = true;
          }
          if (response['status'] === 'catch' ||
              (response['debug'] && localStorage['imagerDebugMessages'] === 'true')) {
            for (i = 0; i < response['debug'].length; i++) {
              out += '<div class="debug">' + response['debug'][i] + '</div>';
            }
            display = true;
          }

          if (display) {
            Popups.messages.dialogOpen();
            $('#imager-messages-content').html(out);
          }
          if (processFunc) {
            processFunc.call($callingElement, response);
          }
          if (localStorage['imagerDebugMessages'] === 'false') {
            setTimeout(function () {
              Popups.messages.dialogClose();
            }, 3000);
          }
          Popups.$busy.hide();
        },
        error: function (evt) {
          Popups.$busy.hide();
          clearTimeout(messageTimeout);
          Popups.messages.dialogOpen();
          $('#imager-messages-content').html('<p class="error">Error: ' + evt.status + ': ' + evt.statusText +
          '<br>Action: ' + postData.action + '</p>');
          if (processFunc) {
            processFunc('error', evt);
          }   // Execute users error function
          if (localStorage['imagerDebugMessages'] === 'false') {
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
        v: {x: 0, y: 0},
        t: {x: 0, y: 0}
      };
      var doTransform = spec.transform || true;
      var namext;
      var nameyt;
      if (doTransform) {
        namext = namex + '-tx';
        nameyt = namey + '-tx';
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
     * Given the path to a thumbnail determine the path of the full image.
     *
     * If '/styles/' is part of the path then simply remove /styles/
     * and the next two path components.
     * Otherwise look for the parent element to be a link to the full image.
     *
     * @param {type} tsrc
     *   Source path of source image.
     *
     * @return string
     *   Full file path of original image.
     */
    var getFullPath = function getFullPath(tsrc) {
      var src;
      // If the image has '/styles/' in it's path
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
      }
      return src;
    };

    /**
     * Given an angle degrees, calculate it in radians.
     *
     * @param {number} deg
     *   Angle in degrees
     *
     * @return {number}
     *   Angle in radians
     */
    var angleInRadians = function angleInRadians(deg) {
      return deg * Math.PI / 180;
    };

    return {
      ajaxProcess: ajaxProcess,
      getImage: getImage,
      angleInRadians: angleInRadians,
      displayMessage: displayMessage,
      getFullPath: getFullPath,
      pointC: pointC
    };
  };
})(jQuery);
