
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
 * 
 * @param {object} spec
 *   Specifications for opening dialog, can also have ad-hoc properties
 *   not used by jQuery dialog but needed for other purposes.
 * 
 * @returns {dialog}
 */
  Drupal.imager.Popups.messagesC = function messagesC (spec) {
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
    var popup;

    var dspec = $.extend({
                   name: 'Messages',
                   autoOpen: false,
                   title: 'System messages',
                   zIndex: 1015,
                   width: 'auto',
                   dialogClass: 'imager-dialog',
                   cssId: 'imager-messages',
                   height: 'auto',
                   resizable: false,
                   position:  { my: "left",
                                at: "right",
                                of: spec.$selectButton
                              }
                 }, spec);
      // Initialize the popup.
    popup = Popups.baseC(dspec);

    popup.dialogOnCreate = function dialogOnCreate() {
      popup.dialogOpen();
    }

    popup.dialogOnOpen = function dialogOnOpen() {
      localStorage.imagerDebugMessages = 'TRUE';
      popup.dialogInit();
    }

    popup.dialogOnClose = function dialogOnClose() {
      localStorage.imagerDebugMessages = 'FALSE';
    };

    popup.dialogInit = function dialogInit() {
    };

    return popup;
  };
})(jQuery);
