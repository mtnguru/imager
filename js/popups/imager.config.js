
/**
 * @file
 */

/**
 * Wrap file in JQuery();
 * 
 * @param $
 */
(function ($) {
  
/**
 * Declare Configuration Dialog class - configC - inherits from dialogBaseC 
 * 
 * @param {object} spec
 *   Specifications for opening dialog, can also have ad-hoc properties
 *   not used by jQuery dialog but needed for other purposes.
 * 
 * @returns {dialog}
 */
  Drupal.imager.Popups.configC = function (spec) {  
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
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
//                 resize: 'auto',
                   position:  { my: "left",
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
     * Initialize checkboxes from localStorage
     */
    popup.dialogInit = function dialogInit() {
      if (localStorage.imagerBoundsEnable === "TRUE") {
        $('#imager-bounds-enable').attr('checked','checked');
      }
      if (localStorage.imagerDebugStatus === "TRUE") {
        $('#imager-debug-status').attr('checked','checked');
      }
      if (localStorage.imagerDebugMessages === "TRUE") {
        $('#imager-debug-messages').attr('checked','checked');
      }
    };

    /**
     * Save information from the configuration dialog to localStorage
     */
    popup.dialogSave = function dialogSave() {
      if ($('#imager-debug-status').attr('checked')) {
        localStorage.imagerDebugStatus = "TRUE";
        Popups.status.dialogOpen();
      } else {
        localStorage.imagerDebugStatus = "FALSE";
        Popups.status.dialogClose();
      }
      if ($('#imager-debug-messages').attr('checked')) {
        localStorage.imagerDebugMessages = "TRUE";
        Popups.messages.dialogOpen();
      } else {
        localStorage.imagerDebugMessages = "FALSE";
        Popups.messages.dialogClose();
      }
      if ($('#imager-bounds-enable').attr('checked')) {
        localStorage.imagerBoundsEnable = "TRUE";
      } else {
        localStorage.imagerBoundsEnable = "FALSE";
      }
      popup.dialogClose();
    };

    /**
     * Dialog buttons are defined last to ensure methods are defined.
     */
    popup.spec['buttons'] = { Save: popup.dialogSave,
                             Cancel: popup.dialogClose
                           };
    return popup;
  };
})(jQuery);
