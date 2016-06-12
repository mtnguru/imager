/**
 * @file
 * Declare Imager module base class - Drupal.imager.popups.baseC.
 *
 * The dialog base class is the basis for all popups in the Imager module.
 *
 * When a dialog is opened for the first time an AJAX call is made which loads
 * the render array for the dialog and renders it.  The resulting HTML is then
 * inserted into the content area of the dialog.
 *
 * The easy way to open a dialog is to call dialogToggle.  The base class
 * loads the dialog if necessary, it then opens the dialog and calls
 * dialogOnOpen().  This results in the following logic:
 *
 * First column is the implementing class - either baseC or impC.
 * Substitute impC with the name of a real class implementing a baseC dialog.
 *
 * baseC  dialogToggle()
 * baseC    if dialogHave()
 * baseC      if dialogIsOpen()
 * baseC        dialogClose()
 * impC           dialogOnClose()
 *            else
 * baseC        dialogOpen()
 * impC           dialogOnOpen()
 * impC             dialogUpdate()
 *          else
 * baseC       dialogLoad()
 * baseC          dialogCreate()
 * impC              dialogOnCreate()
 * baseC                dialogOpen()
 * impC                    dialogOnOpen()
 * impC                       dialogUpdate()
 */

/*
 * Note: Variables ending with capital C or M designate Classes and Modules.
 * They can be found in their own files using the following convention:
 *   i.e. Drupal.imager.coreM is in file imager/js/imager.core.js
 *        Drupal.imager.popups.baseC is in file imager/js/popups/imager.base.js.
 */

/**
 * Wrap file in JQuery();.
 *
 * @param $
 */
(function ($) {
  'use strict';

  /**
   * Initialize a dialog.
   *
   * Convenience function to initialize a dialog and set up buttons
   * to open and close it.
   *
   * @param {string} name
   *   Name of the dialog.
   * @param {string} buttonId [optional]
   *   CSS ID of the button which opens and closes this dialog.
   * @param {Object} processFunc [optional]
   *   Function to execute when button is clicked.
   *   If not specified it defaults to dialogToggle().
   *
   * @return {baseC} popup
   */
  Drupal.imager.popups.initDialog = function initDialog(name, buttonId, processFunc) {
    var Popups = Drupal.imager.popups;
    var popup;
    if (buttonId) {
      var $button = $(buttonId);
      if ($button) {
        // Execute dialogs constructor.
        popup = Popups[name + 'C']({$selectButton: $button});
        if (processFunc) {
          $button.click(processFunc);
        }
        else {
          $button.click(popup.dialogToggle);
        }
      }
    }
    else {
      // Execute dialogs constructor.
      popup = Popups[name + 'C']({$selectButton: null});
    }
    Popups[name] = popup;
    return popup;
  };

  Drupal.imager.popups.baseC = function baseC(spec) {
    var popup = {};
    popup.settings = {};
    spec = spec || {};

    var $selectButton = spec.$selectButton || null;
    // The button that was clicked to popup this dialog.
    popup.spec = spec || {};
    popup.spec.name = popup.spec.name || 'unknown';
    popup.spec.dialogClass = popup.spec.dialogClass || '';
    popup.spec.$elem = popup.spec.$elem || null;

    // Return if popup is loaded.
    popup.dialogHave = function dialogHave() {
      return (popup.spec.$elem) ? true : false;
    };

    // Load the dialog using AJAX.
    popup.dialogLoad = function dialogLoad() {
      Drupal.imager.core.ajaxProcess(popup,
        Drupal.imager.settings.actions.renderDialog.url,
        {
          action: 'render-dialog',
          dialogName: popup.spec.name
        },
        popup.dialogCreate);
    };

    // Load the popup using AJAX.
    popup.dialogCreate = function dialogCreate(response, $callingElement) {
      Drupal.imager.$wrapper.append(response['data']);
      popup.spec.$elem = $('#' + popup.spec.cssId);
      if (popup.spec.cssIdFinal) {
        popup.spec.$elem.removeClass(popup.spec.cssId).addClass(popup.spec.cssIdFinal);
      }
      var $elem = popup.spec.$elem;
      $elem.dialog(popup.spec);
      // Create the popup.
      popup.dialogOnCreate();
    };

    popup.dialogIsOpen = function dialogIsOpen() {
      return (popup.spec.$elem && popup.spec.$elem.dialog('isOpen')) ? true : false;
    };

    // Close the dialog if it's open.
    popup.dialogClose = function dialogClose() {
      if (popup.spec.$elem) {
        if ($selectButton) {
          $selectButton.removeClass('checked');
        }
        if (popup.spec.$elem.dialog('isOpen')) {
          popup.spec.$elem.dialog('close');
        }
        popup.dialogOnClose();
        popup.settings = {};
      }
    };
    // Open the popup if it exists, otherwise create it.
    popup.dialogOpen = function dialogOpen(settings) {
      $.extend(popup.settings, settings);
      if (popup.spec.$elem) {
        if ($selectButton) {
          $selectButton.addClass('checked');
        }
        if (!popup.spec.$elem.dialog('isOpen')) {
          popup.spec.$elem.dialog('open');
          popup.dialogOnOpen();
        }
      }
      else {
        popup.dialogLoad();
      }
    };
    // Toggle the dialog if it exists, otherwise create it.
    popup.dialogToggle = function dialogToggle(settings) {
      $.extend(popup.settings, settings);
      if (popup.dialogHave()) {
        if (popup.dialogIsOpen()) {
          popup.dialogClose();
        }
        else {
          popup.dialogOpen(settings);
        }
      }
      else {
        popup.dialogLoad();
      }
    };

    popup.setSelectButton = function setSelectButton($elem) {
      popup.spec.$selectButton = $elem;
      if (popup.dialogHave()) {
        popup.spec.$elem.dialog({
          position: {
            my: 'left',
            at: 'right',
            of: $elem
          }
        });
      }

    };

    popup.dialogUpdate = function dialogUpdate() {
    };
    popup.dialogOnCreate = function dialogOnCreate() {
    };
    popup.dialogOnOpen = function dialogOnOpen() {
    };
    popup.dialogOnClose = function dialogOnClose() {
    };

    return popup;
  };
})(jQuery);
