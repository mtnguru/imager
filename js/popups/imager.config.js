/**
 * @file
 * Declare Imager module Configuration dialog - Drupal.imager.popups.configC.
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
   * Declare Configuration Dialog class - configC - inherits from dialogBaseC.
   *
   * @param {object} spec
   *   Specifications for opening dialog, can also have ad-hoc properties
   *   not used by jQuery dialog but needed for other purposes.
   *
   * @returns {dialog}
   */
  Drupal.imager.popups.configC = function (spec) {
    var Popups = Drupal.imager.popups;
    var Viewer = Drupal.imager.viewer;
    var popup;

    var dspec = $.extend({
      name: 'Configuration',
      autoOpen: false,
      title: 'Imager Configuration',
      zIndex: 1015,
      width: 'auto',
      dialogClass: 'imager-dialog',
      cssId: 'imager-config',
      height: 'auto',
      // resize: 'auto',
      position: {
        my: "left",
        at: "right",
        of: spec.$selectButton
      }
    }, spec);
    // Initialize the dialog.
    popup = Popups.baseC(dspec);

    popup.dialogOnCreate = function dialogOnCreate() {
      popup.dialogOpen();
    }

    popup.dialogOnOpen = function dialogOnOpen() {
      popup.dialogInit();
    }

    popup.dialogOnClose = function dialogOnClose() {
    };

    /**
     * Initialize checkboxes from localStorage.
     */
    popup.dialogInit = function dialogInit() {
      if (localStorage.imagerBoundsEnable === "true") {
        $('#imager-bounds-enable').attr('checked', 'checked');
      }
      if (localStorage.imagerDebugStatus === "true") {
        $('#imager-debug-status').attr('checked', 'checked');
      }
      if (localStorage.imagerDebugMessages === "true") {
        $('#imager-debug-messages').attr('checked', 'checked');
      }
    };

    /**
     * Save information from the configuration dialog to localStorage.
     */
    popup.dialogSave = function dialogSave() {
      if ($('#imager-debug-status').attr('checked')) {
        localStorage.imagerDebugStatus = "true";
        Popups.status.dialogOpen();
      }
      else {
        localStorage.imagerDebugStatus = "false";
        Popups.status.dialogClose();
      }

      if ($('#imager-debug-messages').attr('checked')) {
        localStorage.imagerDebugMessages = "true";
        Popups.messages.dialogOpen();
      }
      else {
        localStorage.imagerDebugMessages = "false";
        Popups.messages.dialogClose();
      }

      if ($('#imager-bounds-enable').attr('checked')) {
        localStorage.imagerBoundsEnable = "true";
      }
      else {
        localStorage.imagerBoundsEnable = "false";
      }

      var name = $("#imager-printer-select option:selected").text();
      localStorage.imagerPrinter = $("#imager-printer-select option:selected").text();

      popup.dialogClose();
    };

    // Dialog buttons are defined last to ensure methods are defined.
    popup.spec['buttons'] = {
      Save: popup.dialogSave,
      Cancel: popup.dialogClose
    };
    return popup;
  };
})(jQuery);
