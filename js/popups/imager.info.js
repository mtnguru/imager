/**
 * @file
 * Create the file_entity Information dialog
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
  Drupal.imager.Popups.infoC = function infoC (spec) {
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
    var hue = 0;
    var saturation = 0;
    var lightness = 0;
    var popup;
    var editField;
    var editFieldType;

    var dspec = $.extend({
                     name: 'Info',
                     autoOpen: false,
                     title: 'File Information',
                     zIndex: 1015,
                     width: 'auto',
                     height: 'auto',
                     dialogClass: 'imager-dialog',
                     cssId: 'imager-info',
                     resizable: true,
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
      popup.dialogUpdate();
      localStorage.imagerShowInfo = "TRUE";
    }

    popup.dialogOnClose = function dialogOnClose() {
      localStorage.imagerShowInfo = "FALSE";
    };

    /**
     * Initialize checkboxes from localStorage
     */
    popup.dialogInit = function dialogInit() {
    };

    popup.dialogUpdate = function dialogUpdate() {
      Popups.$imagerBusy.show();
      Drupal.imager.ajaxProcess(this,
                  Drupal.imager.settings.actions.displayEntity.url,
                  { action: 'display-entity',
                    uri: Viewer.getCurrentImage()['src']
                  },function(response) {
        var status = response['status'];
        var txt = "";
        popup.spec.$elem.removeClass('error').show();
        if (response['data']) {
          $('#imager-info-content').html(response['data']);
          $('.imager-info-edit').click(function (evt) {
            editField = this.id.replace('imager-','');
            var clientX = evt.clientX;
            var clientY = evt.clientY;
            // Display edit popup - render current field from default edit form  
            Popups.$imagerBusy.show();
            displayMessage('Contacting Server ... loading form field');
            Drupal.imager.ajaxProcess(this,
                        Drupal.imager.settings.actions.editFormFieldLoad.url,  
                        { action: 'edit-form-field-load',
                          uri: Viewer.getCurrentImage()['src'],
                          field: editField
                        },function(response) {
              Viewer.setViewMode(1);
              var status = response['status'];
              var txt = "";
              if (response['data']) {
                $('#imager-edit-content').html(response['data']['rendered']);
                editFieldType = response['data']['type'];
                if (Drupal.imager.settings.attachBehaviors) {
                  Drupal.imager.settings.attachBehaviors('#imager-edit-content div');
                }
              }
              
              $imagerEdit.css('left',clientX - $imagerEdit.outerWidth() - 10).css('top',clientY);
              $imagerEdit.show();
            });
          });
        }
      });
    };

    /**
     * Dialog buttons are defined last to ensure methods are defined.
     */
    return popup;
  };
})(jQuery);