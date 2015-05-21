/**
 * @file
 * Create and manage the dialog to save files to database, download, email.
 */

/**
 * Note: Variables ending with capital C or M designate Classes and Modules.
 * They can be found in their own files using the following convention:
 *   i.e. Drupal.imager.coreM is in file imager/js/imager.core.inc
 *        Drupal.imager.popups.baseC is in file imager/js/popups/imager.base.inc
 * Variables starting with $ are only used for jQuery 'wrapped sets' of objects.
 */

/**
 * Wrap file in JQuery();
 *
 * @param $
 */
(function ($) {
  "use strict";
  /**
   * Declare Filesave Dialog class
   *
   * @param {object} spec
   *   Specifications for opening dialog, can also have ad-hoc properties
   *   not used by jQuery dialog but needed for other purposes.
   *
   * @returns {popup}
   */
  Drupal.imager.popups.filesaveC = function filesaveC(spec) {
    var Popups = Drupal.imager.popups;
    var Core = Drupal.imager.core;
    var Viewer = Drupal.imager.viewer;

    var dspec = $.extend({
      name: 'Filesave',
      autoOpen: false,
      title: 'Save edited image to database',
      zIndex: 1015,
      width: 'auto',
      dialogClass: 'imager-dialog imager-noclose',
      cssId: 'imager-filesave',
//                 cssIdFinal:  'imager-filesave-database',
      height: 'auto',
      resizable: false,
      position: {
        my: 'left',
        at: 'right',
        of: $('#file-database')
      }
    }, spec);
    // Initialize the popup.
    var popup = Drupal.imager.popups.baseC(dspec);

    var database = function database(overwrite) {
//    displayMessage('Extracting Image...');
      Popups.$busy.show();
      var img = getImage($('input[name="resolution"]:checked').val(), false);
//    displayMessage('Saving Image...');
      Core.ajaxProcess(this,
        Drupal.imager.settings.actions.saveFile.url,
        {
          overwrite: overwrite,
          action: 'save-file',
          saveMode: popup.settings.saveMode,
          uri: Viewer.getImage().src,
          imgBase64: img
        }, function (response) {
          if (response['file_new']) {
            Viewer.getImage().$container.after(response['file_new']);
            // @TODO The two unwrap are hardcoded to remove two extra divs.  
            // Can this be done in PHP when it is rendered.
            // Maybe a Views tpl.php file.
            var $row = Viewer.getImage().$container.next().find(Drupal.imager.settings.cssContainer);
            $row.unwrap().unwrap();
          }
          if (response['file_old']) {
            Viewer.getImage().$container.html(response['file_old']);
            // @TODO - The following code is ugly, 
            // Views wraps a couple extra divs around the output.
            // The following code removes those divs so just 
            // .views-row remains and everything below it remains.
//          var $row =Viewer.getImage().$container.next().find(Drupal.imager.settings.cssContainer);
//          $row.unwrap().unwrap();
            var $child = Viewer.getImage().$container.children()[0];
            var $row = Viewer.getImage().$container.find(Drupal.imager.settings.cssContainer);
//          var $row =$child.find(Drupal.imager.settings.cssContainer);
//          var $row = Viewer.getImage().$container.find(Drupal.imager.settings.cssContainer).child();
            while (Viewer.getImage().$container[0] !== $row.parent()[0]) {
              $row.unwrap();
            }
            $row.unwrap();
          }
          Drupal.attachBehaviors($row);
        }
      );
      Popups.$busy.hide();
      popup.dialogClose();
    };

    var download = function download() {
//    displayMessage('Extracting Image...');
      Popups.$busy.show();
      var dataurl = getImage($('input[name="resolution"]:checked').val(), false);
//    displayMessage('Saving Image...');
//    $('#file-download-link').attr({ 'href': dataurl,
//                                          'download': $('#imager-filesave-filename').val()
//                                       });

//    window.open(dataurl,'Download');
//    window.location.assign(dataurl);

//    var uriContent = "data:application/octet-stream," + encodeURIComponent(dataurl);
//    window.open(uriContent, 'Download image smiley image');
      window.open(dataurl, 'Download image smiley image');

      Popups.$busy.hide();
      popup.dialogClose();

      /*    var img = document.createElement('img');
       img.src = dataurl;

       var a = document.createElement('a');
       a.setAttribute("download", "YourFileName.jpeg");
       a.setAttribute("href", dataurl);
       //    a.appendChild(img);
       a.click();

       //    var w = window.open(img);
       //    w.document.title = 'Export Image';
       //    w.document.body.innerHTML = 'Left-click on the image to save it.';
       //    w.document.body.appendChild(a); */
    }

    var email = function email() {
//    displayMessage('Extracting Image...');
      Popups.$busy.show();
      var img = getImage($('input[name="resolution"]:checked').val(), false);
//    displayMessage('Saving Image...');
      Popups.$busy.hide();
      popup.dialogClose();
      Core.ajaxProcess(this,
        Drupal.imager.settings.actions.emailFile.url,
        {
          action: 'email',
          saveMode: popup.settings.saveMode,
          uri: Viewer.getImage().src,
          imgBase64: img
        }, function (response) {
          var address = '';
          var path = response['data']['attachPath'];
          var body = response['data']['body'];
          var subject = response['data']['subject'];
          var mailto_link = 'mailto:' + address +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + body +
            '&attachment=' + path;

          window.location.href = mailto_link;
        }
      );
    };

    var clipboard = function email() {
//    displayMessage('Extracting Image...');
      Popups.$busy.show();
      var img = getImage($('input[name="resolution"]:checked').val(), false);
//    displayMessage('Saving Image...');
      Core.ajaxProcess(this,
        Drupal.imager.settings.actions.clipboard.url,
        {
          overwrite: overwrite,
          action: 'clipboard',
          saveMode: popup.settings.saveMode,
          uri: Viewer.getImage().src,
          imgBase64: img
        }
      );
      Popups.$busy.hide();
      popup.dialogClose();
    };

    popup.dialogOnCreate = function dialogOnCreate() {
      popup.dialogOpen();
    };

    popup.dialogOnClose = function dialogOnClose() {
      Viewer.setEditMode('view');
      switch (popup.settings.saveMode) {
        case 'database':
          $('#file-database').removeClass('checked');
          break;
        case 'email':
          $('#file-email').removeClass('checked');
          break;
        case 'download':
          $('#file-download').removeClass('checked');
          break;
        case 'clipboard':
          $('#file-clipboard').removeClass('checked');
          break;
      }
    };

    popup.dialogUpdate = function dialogUpdate() {
    };

    popup.dialogOnOpen = function dialogOnOpen() {
      var status = Viewer.getStatus();
      Viewer.setEditMode(popup.settings.saveMode);
      var src = Viewer.getImage().src;
      var filename = src.substring(src.lastIndexOf('/') + 1);
      $('#imager-filesave #imager-filesave-filename').show().val(filename);
      $('#imager-filesave #imager-filesave-messages').hide();
      initTable();
      switch (popup.settings.saveMode) {
        case 'database':
          popup.spec.$elem.dialog({
            'title': 'Save image to Database',
            'buttons': {
              'New Image': function () {
                database(false)
              },
              'Overwrite': function () {
                database(true)
              },
              'Cancel': popup.dialogClose
            }
          });
          break;
        case 'email':
          popup.spec.$elem.dialog({
            'title': 'Send image to Email',
            'buttons': {
              'Send in Email': email,
              'Cancel': popup.dialogClose
            }
          });
          break;
        case 'download':
          popup.spec.$elem.dialog({
            'title': 'Download Image',
            'buttons': {
              'Download Image': download,
              'Cancel': popup.dialogClose
            }
          });
          break;
        case 'clipboard':
          popup.spec.$elem.dialog({
            'title': 'Send image to Clipboard',
            'buttons': {
              'Clipboard': clipboard,
              'Cancel': popup.dialogClose
            }
          });
          break;
      }
    };

    var getImage = function getImage(stream) {
      var mimeType = "";
      var pt_canvas_ul = Viewer.pt_canvas_ul;
      var pt_canvas_lr = Viewer.pt_canvas_lr;
      var status = Viewer.getStatus();
      var image = Viewer.getImage();
      var img = Viewer.getImg();

      if (img.src.match(/\.png$/i)) {
        mimeType = "image/png";
      }
      else {
        if (img.src.match(/\.jpe*g$/i)) {
          mimeType = "image/jpeg";
        }
      }
      var imageResMode = $('input[name="resolution"]:checked').val();
      switch (imageResMode) {
        case 'screen':
          img = Viewer.$canvas[0].toDataURL(mimeType);
          break;
        case 'image-cropped':
          Viewer.ctx2.setTransform(1, 0, 0, 1, 0, 0);
          var ncw;
          var nch;
          var pt = Core.pointC('tmp');
          if (status.rotation === 0 || status.rotation === 180) {
            ncw = Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x),
              nch = Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y),
              Viewer.$canvas2.attr({
                width: ncw,      // Set canvas to same size as image
                height: nch
              });
            if (status.rotation === 0) {
//            Viewer.ctx2.rotate(Core.angleInRadians(status.rotation));
              pt.setPt(0, 0);
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x,
                -pt.getTxPt().y);

            }
            else { // status.rotation === 180
              Viewer.ctx2.translate(ncw, nch);
              Viewer.ctx2.rotate(Core.angleInRadians(status.rotation));
              pt.setPt(status.cw, status.ch);
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x,
                -pt.getTxPt().y);
            }
          }
          else {
            ncw = Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y),
              nch = Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x),
              Viewer.$canvas2.attr({
                width: ncw,      // Set canvas to same size as image
                height: nch
              });
            if (status.rotation === 90) {
              Viewer.ctx2.translate(ncw, 0);
              Viewer.ctx2.rotate(Core.angleInRadians(status.rotation));
              pt.setPt(status.cw, 0);   // Find Upper left corner of canvas in original image
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x,   // parseInt(pt1.x),
                -pt.getTxPt().y);  // parseInt(pt2.y),
            }
            else {
              Viewer.ctx2.translate(0, nch);
              Viewer.ctx2.rotate(Core.angleInRadians(status.rotation));
              pt.setPt(0, status.ch);   // Find Upper left corner of canvas in original image
              Viewer.ctx2.drawImage(img, -pt.getTxPt().x,
                -pt.getTxPt().y);
            }
          }
          img = Viewer.$canvas2[0].toDataURL(mimeType);
          break;
        case 'image-full':
          var tcw;
          var tch;
          Viewer.ctx2.setTransform(1, 0, 0, 1, 0, 0);
          if (status.rotation === 0 || status.rotation === 180) {
            tcw = Viewer.image().iw;
            Viewer.$canvas2.attr({
              width: tcw,      // Set canvas to same size as image
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
              width: tcw,      // Set canvas to same size as image
              height: tch
            });
            if (status.rotation === 90) {
              Viewer.ctx2.translate(Viewer.image().ih, 0);
            }
            else {
              Viewer.ctx2.translate(0, Viewer.image().iw);
            }
          }
          Viewer.ctx2.rotate(Core.angleInRadians(status.rotation));
          Viewer.ctx2.drawImage(img, 0, 0);                 // Copy full image into canvas
          img = Viewer.$canvas2[0].toDataURL(mimeType);
          break;
      }
      if (stream) {
        img.replace(mimeType, "image/octet-stream");
      }
      return img;
    };

    var initTable = function initTable() {
      var status = Viewer.getStatus();
      var image = Viewer.getImage();
      $('#canvas-resolution').html(status.cw + 'x' + status.ch);
      $('#image-display-resolution').html(
        parseInt(Viewer.pt_canvas_lr.getTxPt().x - Viewer.pt_canvas_ul.getTxPt().x) + 'x' +
        parseInt(Viewer.pt_canvas_lr.getTxPt().y - Viewer.pt_canvas_ul.getTxPt().y));
      $('#image-full-resolution').html(image.iw + 'x' + image.ih);
      $('#scale').html(parseInt(status.cscale * 100) / 100);
    };

    var deleteFile = function deleteFile() {
      displayMessage('Deleting Image...');
      Core.ajaxProcess(this,
        Drupal.imager.settings.actions.deleteFile.url,
        {
          action: 'delete-file',
          uri: Viewer.getImage().src,
        }
      );
    };

    return popup;
  };

})(jQuery);