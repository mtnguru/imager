/**
 * @file
 * JavaScript library to popup full image viewer/editor from images on pages.
 */

/**
 * Wrap file in JQuery();.
 *
 * @param $
 */
(function ($) {
  "use strict";

  Drupal.imager.imageC = function imageC(settings) {
    return {
      'src': settings.src || '',
      'srcThumb': settings.srcThumb || '',
      '$container': settings.$container || undefined,
      '$thumb': settings.$thumb || undefined,
      'iw': settings.iw || 0,
      'ih': settings.ih || 0
    };
  };

})(jQuery);
