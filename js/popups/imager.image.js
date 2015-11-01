/**
 * @file
 * Create the image dialog - popup image for printing, emailing, etc.
 */

/*
 * Note: Variables ending with capital C or M designate Classes and Modules.
 * They can be found in their own files using the following convention:
 *   i.e. Drupal.imager.coreM is in file imager/js/imager.core.inc
 *        Drupal.imager.popups.baseC is in file imager/js/popups/imager.base.inc
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
   * Define the Information dialog class.
   *
   * @param {object} spec
   *   Specifications for opening dialog, can also have ad-hoc properties
   *   not used by jQuery dialog but needed for other purposes.
   *
   * @returns {dialog}
   */
  Drupal.imager.popups.imageC = function imageC(spec) {
    var Popups = Drupal.imager.popups;
    var Viewer = Drupal.imager.viewer;
    var $img;
    var popup;

    var dspec = $.extend({
      name: 'Image',
      autoOpen: false,
      title: 'Display image for printing, emailing, etc',
      zIndex: 1015,
      width: 'auto',
      height: 'auto',
      dialogClass: 'imager-dialog',
      cssId: 'imager-image',
      resizable: true,
      position: {
        my: "left top",
        at: "left top"
      },
      open: function(){
        var closeBtn = $('.ui-dialog-titlebar-close');
        closeBtn.append('<span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span><span class="ui-button-text">close</span>');
      },
      create: function () {
        $(this).closest('div.ui-dialog')
          .find('.ui-dialog-titlebar-close')
          .click(function (e) {
            popup.dialogClose();
            e.preventDefault();
          });
      }
    }, spec);
    // Initialize the popup.
    popup = Popups.baseC(dspec);

    var handleRightClick = function handleRightClick () {
      var dataurl = Drupal.imager.core.getImage('image-cropped', false);
      $img[0].src = dataurl;
      alert('right click');
    };

    popup.dialogOnCreate = function dialogOnCreate() {
      $img = $('#imager-image-img');
      $img.on("contextmenu", handleRightClick);
      popup.dialogOpen();
    };

    popup.dialogOnOpen = function dialogOnOpen() {
      popup.dialogUpdate();
    };

    popup.dialogOnClose = function dialogOnClose() {
    };

    /**
     * Initialize checkboxes from localStorage
     */
    popup.dialogInit = function dialogInit() {
    };

    popup.dialogUpdate = function dialogUpdate() {
      Popups.$busy.show();
      var attr = popup.settings.attr;
      $img.attr(popup.settings.attr);
    //convertCanvas to image and display
      Popups.$busy.hide();
    };

    return popup;
  };
})(jQuery);
