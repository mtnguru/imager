/**
 * @file
 * Declare Imager module Status dialog - Drupal.imager.popups.statusC.
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

  if (localStorage.getItem('imagerDebugStatus') === null) {
    localStorage.setItem('imagerDebugStatus', false);
  }

  /**
   * Declare Status dialog class.
   *
   * @param {object} spec
   *   Specifications for opening dialog, can also have ad-hoc properties
   *   not used by jQuery dialog but needed for other purposes.
   *
   * @return {dialog}
   */
  Drupal.imager.popups.statusC = function statusC(spec) {
    var Popups = Drupal.imager.popups;
    var Viewer = Drupal.imager.viewer;
    var popup;

    var dspec = $.extend({
      name: 'Status',
      autoOpen: false,
      title: 'Imager Status',
      zIndex: 1015,
      width: 'auto',
      dialogClass: 'imager-dialog',
      cssId: 'imager-status',
      height: 'auto',
      resize: 'auto',
      resizable: true,
      open: function () {
        var closeBtn = $('.ui-dialog-titlebar-close');
        closeBtn.append('<span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span><span class="ui-button-text">close</span>');
      },
      position: {
        my: "right bottom",
        at: "right bottom",
        of: spec.$selectButton
      }
    }, spec);
    // Initialize the popup.
    popup = Popups.baseC(dspec);

    popup.dialogOnCreate = function dialogOnCreate() {
      popup.dialogOpen();
    };

    popup.dialogOnOpen = function dialogOnOpen() {
      localStorage.imagerDebugStatus = 'true';
      Viewer.updateStatus();
      Popups.brightness.updateStatus();
      Popups.color.updateStatus();
    };

    popup.dialogOnClose = function dialogOnClose() {
      localStorage.imagerDebugStatus = 'false';
    };

    popup.dialogInit = function dialogInit() {
      // Query all other dialogs for their status.
    };

    popup.dialogUpdate = function dialogUpdate(status) {
      if (popup.dialogIsOpen()) {
        var key;
        for (key in status) {
          // @TODO Pareview wants an if here, it should check for properties.
          $('#imager-status-' + key).html(status[key]);
        }
      }
    };

    return popup;
  };
})(jQuery);
