/**
 * @file
 * Create the file_entity File Entity Editdialog
 */

/**
 * Note: Variables ending with capital C or M designate Classes and Modules.
 * They can be found in their own files using the following convention:
 *   i.e. Drupal.imager.coreM is in file imager/js/imager.core.inc
 *        Drupal.imager.popups.baseC is in file imager/js/popups/imager.base.inc
 * Variables starting with $ are only used for jQuery 'wrapped sets' of objects.
 */


/**
 * Wrap file in JQuery();
 *
 * @param $
 */
(function ($) {
  "use strict";
  /**
   *
   * @param {object} spec
   *   Specifications for opening dialog, can also have ad-hoc properties
   *   not used by jQuery dialog but needed for other purposes.
   *
   * @returns {dialog}
   */
  Drupal.imager.popups.editC = function editC(spec) {
    var Popups = Drupal.imager.popups;
    var Viewer = Drupal.imager.viewer;
    var popup;

    var dspec = $.extend({
      name: 'Edit',
      autoOpen: false,
      title: 'File-Entity Editor',
      zIndex: 1015,
      width: 'auto',
      height: 'auto',
      dialogClass: 'imager-edit-dialog imager-dialog imager-noclose',
      cssId: 'imager-edit',
      resizable: true,
      position: {
        my: "left",
        at: "right+25",
        of: spec.$selectButton
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
    };

    popup.dialogOnClose = function dialogOnClose() {
    };

    popup.dialogSelect = function dialogSelect(settings) {
      if (popup.dialogIsOpen()) {
        if (settings.editField === popup.settings.editField) {
          popup.dialogClose();
        }
        else {
          popup.dialogClose();
          popup.dialogOpen(settings);
        }
      }
      else {
        popup.dialogOpen(settings);
      }
    };

    popup.dialogUpdate = function dialogUpdate() {
      Popups.$busy.show();
      // Display edit popup - render current field from default edit form  
//    displayMessage('Contacting Server ... loading form field');
      popup.spec.$elem.dialog({
        'position': {
          my: "left",
          at: "right",
          of: popup.settings.$selectButton
        }
      });
      Drupal.imager.core.ajaxProcess(this,
        Drupal.imager.settings.actions.editFormFieldLoad.url,
        {
          action: 'edit-form-field-load',
          uri: Viewer.getImage().src,
          field: popup.settings.editField
        }, function (response) {
          Viewer.setEditMode('view');
          var status = response['status'];
          popup.settings.editFieldType = response['data']['type'];
          var txt = "";
          if (response['data']) {
            $('#imager-edit-content').html(response['data']['rendered']);
            popup.settings.editFieldType = response['data']['type'];
            if (Drupal.imager.settings.attachBehaviors) {
              Drupal.imager.settings.attachBehaviors('#imager-edit-content div');
            }
          }
          Popups.$busy.hide();
        });
    };

    popup.save = function save() {
      var out = '';
      var value = '';
      var format = '';
      switch (popup.settings.editFieldType) {
        case 'radios':
          var $elems = $('#imager-edit-content input');
          $elems.each(function (index, elem) {
            if (elem.checked) {
              value = elem.value;
              out += "#imager-edit-apply -- field=" + popup.settings.editField + "   value=" + value + "<br>";
            }
          });
          break;
        case 'textfield':
          var $elems = $('#imager-edit-content input');
          value = $elems[0].value;
          break;
        case 'textarea':
          // Find which editor is in use                                                   
          var $elems = $('#imager-edit-content select');
          var editor = $elems[0].value;
          format = editor;
          if (editor === "panopoly_wysiwyg_text") {
            var id = Drupal.wysiwyg.activeId;
            value = tinyMCE.get(id).getContent();
          }
          else {
            if (editor === 'full_html') {
              var $elems = $('#imager-edit-content textarea.form-textarea');
              $elems.each(function (index, elem) {
                value = $(elem).val();   // Last one wins - this is what we want
              });
            }
            else {
              if (editor === 'plain_text') {
                var $elems = $('#imager-edit-content textarea.form-textarea');
                $elems.each(function (index, elem) {
                  value = $(elem).val();   // Last one wins - this is what we want
                });
              }
            }
          }
          break;
        case 'date_combo':
          var $elems = $('#imager-edit-content input');
          var date;
          var time;
          $elems.each(function (index, elem) {
            var id = $(elem).attr('id');
            if (id.indexOf('datepicker') > -1) {
              date = $(elem).val();
            }
            if (id.indexOf('timepicker') > -1 || id.indexOf('timeEntry') > -1) {
              time = $(elem).val();
            }
          });
          value = date + ' ' + time;
//         alert('datetime  ' + date + '  ' + time);                                        
          break;
        case 'hierarchical_select':
          var $elems = $('#imager-edit-content select');
          $elems.each(function (index, elem) {
            value = $(elem).val();   // Last one wins - this is what we want               
          });
          break;
        case 'checkbox_tree':
          var $elems = $('#imager-edit-content input:checked');
          $elems.each(function (index, elem) {
            value = $(elem).val();   // Last one wins - this is what we want               
          });
          break;
        default:
          alert('Unknown editFieldType ' + popup.settings.editFieldType);
          break;
      }
      Drupal.imager.popups.$busy.show();
//    displayMessage('Saving ...');
      Drupal.imager.core.ajaxProcess(this,
        Drupal.imager.settings.actions.saveFileEntityField.url,
        {
          action: 'save-file-entity-field',
          fieldName: popup.settings.editField,
          fieldType: popup.settings.editFieldType,
          value: value,
          format: format,
          uri: Viewer.getImage().src
        }, function (response) {
          var status = response['status'];
          Popups.info.dialogUpdate();
        }
      );
      popup.dialogClose();
    };

    popup.spec['buttons'] = {
      Save: popup.save,
      Cancel: popup.dialogClose
    };
    /**
     * Dialog buttons are defined last to ensure methods are defined.
     */
    return popup;
  };
})(jQuery);
