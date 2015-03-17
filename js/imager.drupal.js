
/**
 * @file
 * JavaScript library to view and edit images from thumbnails
 */

(function ($) {
  var imager;
  Drupal.behaviors.imager = {
    attach: function (context,settings) {
      $('#imager-wrapper').once(function() {
        imager = window.imager();
        imager.init({'modulePath':  Drupal.settings.imager.modulePath,
                     'cssSelector': Drupal.settings.imager.cssSelector,
                     'basePath':    Drupal.settings.basePath,
                     'filePath':    Drupal.settings.filePath,
                     'attachBehaviors': Drupal.attachBehaviors,
                     'actions': { 
                       'displayEntity': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/display_entity',
                         'args': {
                           'viewMode': Drupal.settings.imager.viewMode,
                         },
                       },
                       'displayMap': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/display_map',
                         'args': {
                           'viewMapMode': Drupal.settings.imager.viewMapMode,
                         },
                       },
                       'editFormFieldLoad': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/edit_form_field_load',
                       },
                       'saveFileEntityField': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/save_file_entity_field',
                       },
                       'saveFile': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/save_file',
                       },
                       'viewBrowser': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/view_browser',
                       },
                       'emailFile': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/email_file',
                       },
                       'deleteFile': {
                         'url': Drupal.settings.basePath + '?q=imager/ajax/delete_file',
                       },
                     },
                    });
      });
 //   imager.attach();
    },
  };
})(jQuery);
