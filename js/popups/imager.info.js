/**
 * @file
 * Create the file_entity Information dialog.
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
  'use strict';

  if (localStorage.getItem('imagerShowInfo') === null) {
    localStorage.setItem('imagerShowInfo', false);
  }

  /**
   * Define the Information dialog class.
   *
   * @param {object} spec
   *   Specifications for opening dialog, can also have ad-hoc properties
   *   not used by jQuery dialog but needed for other purposes.
   *
   * @return {dialog}
   *  Return the information dialog.
   */
  Drupal.imager.popups.infoC = function infoC(spec) {
    var Popups = Drupal.imager.popups;
    var Viewer = Drupal.imager.viewer;
    var popup;
    var editField;

    var dspec = $.extend({
      name: 'Info',
      autoOpen: false,
      title: 'File Information',
      zIndex: 1015,
      width: 'auto',
      height: 'auto',
      dialogClass: 'imager-dialog imager-info-dialog',
      cssId: 'imager-info',
      resizable: true,
      position: {
        my: 'left',
        at: 'right',
        of: spec.$selectButton
      },
      open: function () {
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

    popup.dialogOnCreate = function dialogOnCreate() {
      popup.dialogOpen();
    };

    popup.dialogOnOpen = function dialogOnOpen() {
      popup.dialogUpdate();
      localStorage.imagerShowInfo = 'true';
    };

    popup.dialogOnClose = function dialogOnClose() {
      localStorage.imagerShowInfo = 'false';
    };

    /**
     * Initialize checkboxes from localStorage
     */
    popup.dialogInit = function dialogInit() {
    };

    popup.dialogUpdate = function dialogUpdate() {
      Popups.$busy.show();
      Drupal.imager.core.ajaxProcess(this,
        Drupal.imager.settings.actions.displayEntity.url,
        {
          action: 'display-entity',
          uri: Viewer.getImage().src
        }, function (response) {
          Popups.$busy.hide();
          popup.spec.$elem.removeClass('error').show();
          if (response['data']) {
            $('#imager-info-content').html(response['data']);
            $('.imager-info-edit').click(function (evt) {
              editField = this.id.replace('imager-', '');
              Popups.edit.dialogSelect({
                editField: editField,
                $selectButton: $(this)
              });
            });
          }
        });
    };

    return popup;
  };
})(jQuery);
