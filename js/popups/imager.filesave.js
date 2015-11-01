/**
 * @file
 * Declare Imager module FileSave dialog - Drupal.imager.popups.filesaveC.
 */

/*
 * Note: Variables ending with capital C or M designate Classes and Modules.
 * They can be found in their own files using the following convention:
 *   i.e. Drupal.imager.coreM is in file imager/js/imager.core.js
 *        Drupal.imager.popups.baseC is in file imager/js/popups/imager.base.js
 * Variables starting with $ are only used for jQuery 'wrapped sets' of objects.
 */

/**
 * Wrap file in JQuery();.
 *
 * @param $
 */
(function ($) {
  "use strict";

  /**
   * Declare Filesave Dialog class.
   *
   * @param {object} spec
   *   Specifications for opening dialog, can also have ad-hoc properties
   *   not used by jQuery dialog but needed for other purposes.
   *
   * @return {popup}
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
      // cssIdFinal:  'imager-filesave-database',
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
      // displayMessage('Extracting Image...');
      Popups.$busy.show();
      var img = Drupal.imager.core.getImage($('input[name="resolution"]:checked').val(), false);
      // displayMessage('Saving Image...');
      Core.ajaxProcess(
        this,
        Drupal.imager.settings.actions.saveFile.url,
        {
          overwrite: overwrite,
          action: 'save-file',
          saveMode: popup.settings.saveMode,
          uri: Viewer.getImage().src,
          imgBase64: img
        }, function (response) {
          var $row;
          if (response['file_new']) {
            Viewer.getImage().$container.after(response['file_new']);
            // @TODO The two unwrap are hardcoded to remove two extra divs.
            // Can this be done in PHP when it is rendered.
            // Maybe a Views tpl.php file.
            $row = Viewer.getImage().$container.next().find(Drupal.imager.settings.cssContainer);
            $row.unwrap().unwrap();
          }
          if (response['file_old']) {
            Viewer.getImage().$container.html(response['file_old']);

            /* @TODO - The following code is ugly,
               Views wraps a couple extra divs around the output.
               The following code removes those divs so just
               .views-row remains and everything below it remains.
                        $row =Viewer.getImage().$container.next().find(Drupal.imager.settings.cssContainer);
                        $row.unwrap().unwrap(); */

            $row = Viewer.getImage().$container.find(Drupal.imager.settings.cssContainer);
            // $row = Viewer.getImage().$container.find(Drupal.imager.settings.cssContainer).child();
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
      // displayMessage('Extracting Image...');
      Popups.$busy.show();
      var dataurl = Drupal.imager.core.getImage($('input[name="resolution"]:checked').val(), true);
      window.location.href = dataurl;
      window.location.download = "downloadit.jpg";
      // window.open(dataurl, 'Download image smiley image');
      //
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
    };

    var email = function email() {
      // displayMessage('Extracting Image...');
      Popups.$busy.show();
      var img = Drupal.imager.core.getImage($('input[name="resolution"]:checked').val(), false);
      // displayMessage('Saving Image...');
      Popups.$busy.hide();
      popup.dialogClose();
      Core.ajaxProcess(
        this,
        Drupal.imager.settings.actions.emailFile.url,
        {
          action: 'email',
          saveMode: popup.settings.saveMode,
          uri: Viewer.getImage().src,
          imgBase64: img
        }, function (response) {
          var address = '';
          var path = response['data']['attachPath'];
          var subject = response['data']['subject'];
          var mailto_link = 'mailto:' + address +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + 'simple' +
            '&attachment=' + path + '';

          alert('mailit dude:' + mailto_link);
          window.location.href = mailto_link;
        }
      );
    };

    var clipboard = function clipboard() {
      // displayMessage('Extracting Image...');
      Popups.$busy.show();
      var img = Drupal.imager.core.getImage($('input[name="resolution"]:checked').val(), false);
      // displayMessage('Saving Image...');
      Core.ajaxProcess(this,
        Drupal.imager.settings.actions.clipboard.url,
        {
          // overwrite: overwrite,
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
      Viewer.setEditMode(popup.settings.saveMode);
      var src = Viewer.getImage().src;
      var filename = decodeURIComponent(src.substring(src.lastIndexOf('/') + 1));
      $('#imager-filesave #imager-filesave-filename').show().val(filename);
      $('#imager-filesave #imager-filesave-messages').hide();
      initTable();
      switch (popup.settings.saveMode) {
        case 'database':
          popup.spec.$elem.dialog({
            title: 'Save image to Database',
            buttons: {
              'New Image': function () {
                database(false);
              },
              'Overwrite': function () {
                database(true);
              },
              Cancel: popup.dialogClose
            }
          });
          break;

        case 'email':
          popup.spec.$elem.dialog({
            title: 'Send image to Email',
            buttons: {
              'Send in Email': email,
              Cancel: popup.dialogClose
            }
          });
          break;

        case 'download':
          popup.spec.$elem.dialog({
            title: 'Download Image',
            buttons: {
              'Download Image': download,
              Cancel: popup.dialogClose
            }
          });
          break;

        case 'clipboard':
          popup.spec.$elem.dialog({
            title: 'Send image to Clipboard',
            buttons: {
              'Clipboard': clipboard,
              'Cancel': popup.dialogClose
            }
          });
          break;
      }
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
      // displayMessage('Deleting Image...');
      Core.ajaxProcess(
        this,
        Drupal.imager.settings.actions.deleteFile.url,
        {
          action: 'delete-file',
          uri: Viewer.getImage().src
        }
      );
    };

    return popup;
  };

})(jQuery);
