
/**
 * @file
 */

/**
 * Wrap file in JQuery();
 * 
 * @param $
 */
(function ($) {
  
  Drupal.imager = {};
  Drupal.imager.Popups = {};
  Drupal.imager.Viewer = {};
/**
 * Base class from which all other dialog classes inherit from.
 *  
 * @param {type} spec
 * 
 * @returns {imager_L29.imager.dialogBaseC.dialog}
 */
  Drupal.imager.Popups.baseC = function baseC (spec) {
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
    var popup = {};

    var $selectButton = spec.$selectButton;  // The button that was clicked to popup this dialog
    popup.spec = spec || {};
    popup.spec.name = popup.spec.name || 'unknown';
    popup.spec.dialogClass = popup.spec.dialogClass || '';
    popup.spec.$elem || undefined;

    // return if popup is loaded
    popup.dialogHave = function dialogHave() {
      return (popup.spec.$elem) ? true : false;
    }

    // load the dialog using AJAX
    popup.dialogLoad = function dialogLoad() {
      Drupal.imager.ajaxProcess(popup,
                  Drupal.imager.settings.actions.renderDialog.url,
                  { action: 'render-dialog',
                    dialogName: popup.spec.name
                  },
                  popup.dialogInsert);
    };

    // load the popup using AJAX
    popup.dialogInsert = function dialogInsert(response) {
      var status = response['status'];
      Drupal.imager.$wrapper.append(response['data']);
      popup.spec.$elem = $('#' + popup.spec.cssId);
      if (popup.spec.cssIdFinal) {
        popup.spec.$elem.removeClass(popup.spec.cssId).addClass(popup.spec.cssIdFinal);
      }
      var $elem = popup.spec.$elem;
      $elem.dialog(popup.spec);    // Create the popup
      popup.dialogOnCreate();
    };


    // Check to see if popup is epedialogConfie
    popup.dialogIsOpen = function dialogIsOpen() {
      return (popup.spec.$elem && popup.spec.$elem.dialog('isOpen')) ? true : false;
    }

    // Close the dialog if it's open
    popup.dialogClose = function dialogClose(notify) {
      if (popup.spec.$elem) {
        if ($selectButton) {
          $selectButton.removeClass('checked');
        }
        if (popup.spec.$elem.dialog('isOpen')) {
          popup.spec.$elem.dialog('close');
          if ((notify) ? notify : true) {
            popup.dialogOnClose();
          }
        }
      }
    };
    // Open the popup if it exists, otherwise create it.
    popup.dialogOpen = function dialogOpen(notify) {
      if (popup.spec.$elem) {
        if ($selectButton) {
          $selectButton.addClass('checked');
        }
        if (!popup.spec.$elem.dialog('isOpen')) {
          popup.spec.$elem.dialog('open');
          if ((notify) ? notify : true) {
            popup.dialogOnOpen();
          }
        }
      }
      else {
        popup.dialogLoad();  
      }
    };
    // Toggle the dialog if it exists, otherwise create it.
    popup.dialogToggle = function dialogToggle(settings) {
      popup.settings = settings || {};
      if (popup.dialogHave()) {
        if (popup.dialogIsOpen()) {
          popup.dialogClose();
        }
        else {
          popup.dialogOpen();
        }
      }
      else { 
        popup.dialogLoad();
      }
    };

    popup.dialogUpdate   = function dialogUpdate() {};
    popup.dialogOnCreate = function dialogOnCreate() {};
    popup.dialogOnOpen   = function dialogOnOpen() {};
    popup.dialogOnClose  = function dialogOnClose() {};

    return popup;
  };
})(jQuery);
