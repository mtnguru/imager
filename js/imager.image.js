  
/**
 * @file
 * JavaScript library to popup full image viewer/editor from images on pages
 * 
 */

/**
 * Wrap file in JQuery();
 * 
 * @param $
 */
(function ($) {

  Drupal.imager.imageC = function imageC(settings) {   
    var image = {
      'src':        settings.src || '',
      'srcThumb':   settings.srcThumb || '',
      '$container': settings.$container || undefined,
      '$thumb':     settings.$thumb || undefined,
      'iw':         0,
      'ih':         0
    };
    return image;
  };

})(jQuery);
