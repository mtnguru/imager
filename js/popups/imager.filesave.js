 /**
 * @file
 * Create and manage the dialog to save files to database, download, email.
 */

/**
 * Wrap file in JQuery();
 * 
 * @param $
 */
(function ($) {
/**
 * Declare Filesave Dialog class
 * 
 * @param {object} spec
 *   Specifications for opening dialog, can also have ad-hoc properties
 *   not used by jQuery dialog but needed for other purposes.
 * 
 * @returns {popup}
 */
  Drupal.imager.Popups.filesaveC = function filesaveC(spec) {
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
    var popup = Popups.baseC(spec);

    popup.dialogOnCreate = function dialogOnCreate() {
      popup.dialogOpen();
    };

    popup.dialogOnClose = function dialogOnClose() {
    };

    popup.dialogInit = function dialogInit() {
    };

    popup.dialogReset = function dialogReset() {
    };

    popup.dialogApply = function dialogApply() {
    };

    popup.dialogUpdate = function dialogUpdate() {
    };

    popup.getImage = function getImage(stream) {
      var img;
      var pt;
      var mimeType = "";
      if (currentImage['src'].match(/\.png$/i)) {
        mimeType = "image/png";
      } else if (currentImage['src'].match(/\.jpe*g$/i)){
        mimeType = "image/jpeg";
      }
      var imageResMode = $('input[name="resolution"]:checked').val();
      switch (imageResMode) {
        case 'screen':
          img = Viewer.$canvas[0].toDataURL(mimeType);
          break;
        case 'image-cropped':
          ctx2.setTransform(1,0,0,1,0,0);
          var ncw;
          var nch;
          if (rotation === 0 || rotation === 180) {
            ncw = Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x),
            nch = Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y),
            Viewer.$canvas2.attr({width:  ncw,      // Set canvas to same size as image
                                 height: nch});
            if (rotation === 0)  {
//            ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(0,0);
              ctx2.drawImage(cimg, -pt.x,
                                   -pt.y);

            } else { // rotation === 180
              ctx2.translate(ncw,nch);
              ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(cw,ch);
              ctx2.drawImage(cimg, -pt.x,
                                   -pt.y);
            }
          } else {
            ncw = Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y),
            nch = Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x),
            Viewer.$canvas2.attr({width:  ncw,      // Set canvas to same size as image
                                 height: nch});
            if (rotation === 90) {
              ctx2.translate(ncw,0);
              ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(cw,0);   // Find Upper left corner of canvas in original image
              ctx2.drawImage(cimg, -pt.x,   // parseInt(pt1.x),
                                   -pt.y);  // parseInt(pt2.y),
            } else {
              ctx2.translate(0,nch);
              ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(0,ch);   // Find Upper left corner of canvas in original image
              ctx2.drawImage(cimg, -pt.x,
                                   -pt.y);
            }
          }
          img = Viewer.$canvas2[0].toDataURL(mimeType);
          break;
        case 'image-full':
          var tcw;
          var tch;
          ctx2.setTransform(1,0,0,1,0,0);
          if (rotation === 0 || rotation === 180) {
            tcw = iw;
            tch = ih;
            Viewer.$canvas2.attr({width:  tcw,      // Set canvas to same size as image
                                 height: tch});
            if (rotation === 180)  {
              ctx2.translate(iw,ih);
            }
          } else {
            tcw = ih;
            tch = iw;
            Viewer.$canvas2.attr({width:  tcw,      // Set canvas to same size as image
                                 height: tch});
            if (rotation === 90) {
              ctx2.translate(ih,0);
            } else {
              ctx2.translate(0,iw);
            }
          }
          ctx2.rotate(angleInRadians(rotation));
          ctx2.drawImage(cimg,0,0);                 // Copy full image into canvas
          img = Viewer.$canvas2[0].toDataURL(mimeType);
          break;
      }
      if (stream) {
        img.replace(mimeType, "image/octet-stream");
      }
      return img;
    };

    popup.initTable = function initTable() {
      $('#canvas-resolution').html(cw + 'x' + ch);
      $('#image-display-resolution').html(
           parseInt(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x) + 'x' + 
           parseInt(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y));
      $('#image-full-resolution').html(iw + 'x' + ih);
      $('#scale').html(parseInt(cscale * 100) / 100);
    };

    return popup;
  };

    
  Drupal.imager.Popups.filesave_databaseC = function filesaveC(spec) {
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
    var popup;

    var dspec = $.extend({
                   name: 'Filesave',
                   autoOpen: false,
                   title: 'Save edited image to database',
                   zIndex: 1015,
                   width: 'auto',
                   dialogClass: 'imager-dialog imager-noclose',
                   cssId: 'imager-filesave',
                   cssIdFinal:  'imager-filesave-database',
                   height: 'auto',
                   resizable: false,
                   position:  { my: 'left',
                                at: 'right',
                                of: spec.$selectButton
                              }
                 }, spec);
      // Initialize the popup.
    popup = Drupal.imager.Popups.filesaveC(dspec);

    popup.dialogOnOpen = function dialogOnOpen() {
//    Viewer.setViewMode(1);
      $('#imager-filesave-database #imager-filesave-filename').show().val('shit');
      $('#imager-filesave-database #imager-filesave-messages').hide();

      popup.initTable();
    };

    popup.newImage = function newImage() {
    }

    popup.overwrite = function overwrite() {
    }

    popup.spec['buttons'] = { 'New Image': popup.newImage,
                              'Overwrite': popup.overwrite,
                              'Cancel':    popup.dialogClose
                            };

    return popup;
  };

})(jQuery);


/*
    var saveFile = function saveFile(overwrite) {
      displayMessage('Extracting Image...');
      Popups.$imagerBusy.show();
      var img = getImage($('input[name="resolution"]:checked').val(),false);
      displayMessage('Saving Image...');
      switch (fileSaveMode) {
        case 'database':
          Drupal.imager.ajaxProcess(this,
            Drupal.imager.settings.actions.saveFile.url,
            { overwrite: overwrite,
              action: 'save-file',
              saveMode: fileSaveMode,
              uri: currentImage['src'],
              imgBase64: img 
            }, function (response) {
              if (response['file_new']) {
                currentImage['container'].after(response['file_new']);
                // @TODO The two unwrap are hardcoded to remove two extra divs.  
                // Can this be done in PHP when it is rendered.
                // Maybe a Views tpl.php file.
                var $row = currentImage['container'].next().find(Drupal.imager.settings.cssContainer);
                $row.unwrap().unwrap();
              }
              if (response['file_old']) {
                currentImage['container'].html(response['file_old']);
                // @TODO - The following code is ugly, 
                // Views wraps a couple extra divs around the output.
                // The following code removes those divs so just 
                // .views-row remains and everything below it remains.
                var $row = currentImage['container'].find(Drupal.imager.settings.cssContainer).child();
                while (currentImage['container'][0] !== $row.parent()[0]) {
                  $row.unwrap();
                }
              }
              Drupal.attachBehaviors($row);
            }
          );
          break;
        case 'email':
          Drupal.imager.ajaxProcess(this,
            Drupal.imager.settings.actions.emailFile.url,
            { action: 'email',
              saveMode: fileSaveMode,
              uri: currentImage['src'],
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
          break;
        case 'clipboard':
          Drupal.imager.ajaxProcess(this,
            Drupal.imager.settings.actions.clipboard.url,
            { overwrite: overwrite,
              action: 'clipboard',
              saveMode: fileSaveMode,
              uri: currentImage['src'],
              imgBase64: img 
            }
          );
          break;
        case 'download':
          $('#imager-filesave-download')
            .attr({ 'href': img,
                    'download': $('#imager-filesave-filename').val()
                 });
          break;
      }
      Popups.$imagerBusy.hide();
      $imagerFilesave.hide();



    var deleteFile = function deleteFile() {
      displayMessage('Deleting Image...');
      Drupal.imager.ajaxProcess(this,
        Drupal.imager.settings.actions.deleteFile.url,
        { action: 'delete-file',
          uri: currentImage['src']
        }
      );
    }
      switch (settings.saveMode) {
        case 'email':
          popup.spec.$elem.dialog({
             'buttons': { 'Send Email': popup.dialogApply,
                          'Cancel': popup.dialogClose
                         }
          });
          break;
        case 'clipboard':
          popup.spec.$elem.dialog({
             'buttons': { 'Send to Clipboard': popup.dialogApply,
                          'Cancel': popup.dialogClose
                         }
          });
          break;
        case 'download':
          popup.spec.$elem.dialog({
             'buttons': { 'Download': popup.dialogApply,
                          'Cancel': popup.dialogClose
                         }
          });
          break;
      }
    };
    */