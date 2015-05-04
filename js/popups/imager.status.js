
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
  Drupal.imager.Popups.statusC = function statusC (spec) {
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
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
                   position:  { my: "right bottom",
                                at: "right bottom",
                                of: spec.$selectButton
                              }
                 }, spec);
      // Initialize the popup.
    popup = Popups.baseC(dspec);

    popup.dialogOnCreate = function dialogOnCreate() {
      popup.dialogOpen();
    }

    popup.dialogOnOpen = function dialogOnOpen() {
      localStorage.imagerDebugStatus = 'TRUE';
      Viewer.updateStatus();
      Popups.brightness.updateStatus();
      Popups.color.updateStatus();
    }

    popup.dialogOnClose = function dialogOnClose() {
      localStorage.imagerDebugStatus = 'FALSE';
    };

    popup.dialogInit = function dialogInit() {
//    Query all other dialogs for their status
    };

    popup.dialogUpdate = function dialogUpdate(status) {
      if (popup.dialogIsOpen()) {
        var key;
        for (key in status) {
          $('#imager-status-' + key).html(status[key]);
        };
      };
    };

    return popup;
  };
})(jQuery);
