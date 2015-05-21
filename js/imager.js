/**
 * @file
 * Imager module initialization and thumbnail management.
 *
 * - Initializes imager JavaScript library.
 * - Builds list of thumbnails
 * - Finds next thumbnail when user clicks Arrow button in Viewer
 **/

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
  Drupal.imager.start = function imager() {

    var $thumbnails;       // List of thumbnails on source page
    var Popups = Drupal.imager.popups;
    var images = [];         // array of imageC - imager.image.js

    /**
     * Initialize Imager JavaScript library.
     *
     * @param {type} opts
     *   Paths and constants - most values initially come from php Settings
     */
    function _init(opts) {
      Drupal.imager.settings = opts;
      Drupal.imager.core = Drupal.imager.coreM();      // Utility functions
      Drupal.imager.$wrapper = $('#imager-wrapper');
      Drupal.imager.popups.$busy = $('#imager-busy').hide();

      Drupal.imager.popups.initDialog('viewer', undefined);
      Drupal.imager.popups.base = Drupal.imager.popups.baseC();
    }

    /**
     * Build list of thumbnails and attach event handlers.
     *
     *
     */
    function _attach() {
      images = [];

      $thumbnails = $(Drupal.imager.settings.cssContainer);
      if ($thumbnails.length === 0) {
        return;
      } // No thumbnails found, exit

      $thumbnails.each(function (index, value) {
        // Add image to images array
        var $thumb = $(this).find(Drupal.imager.settings.cssImage);
        images.push(Drupal.imager.imageC({
          '$container': $(this),
          '$thumb': $thumb,
          'srcThumb': $thumb.attr('src'),
          'src': Drupal.imager.core.getFullPath($thumb.attr('src'))
        }));

        // Unbind any current event handlers on thumbnails
        $thumb.parent().unbind('click');

        // User clicks in thumbnail image
        $thumb.click(function (evt) {
          var image = findImageFromThumbSrc($thumb.attr('src'));
          if (Popups.viewer.dialogIsOpen()) {
            Popups.viewer.dialogUpdate({'image': image});
          }
          else {
            Popups.viewer.dialogOpen({'image': image});
          }
          evt.stopPropagation();
          return false;
        });
      });  // thumbnails.each()
    }

    /**
     * Given an image, find the next or previous image.
     *
     * @param {imageC} current
     *   Current image to offset from
     * @param {int} offset
     *   Number of images.
     *
     * @returns {imageC}
     */
    Drupal.imager.findNextImage = function findNextImage(current, offset) {
      var i;
      for (i = 0; i < images.length; i++) {
        if (current === images[i]) {
          if (offset === 1) {
            if (++i === images.length) {
              i = 0;
            }
          }
          else {
            if (--i === -1) {
              i = images.length - 1;
            }
          }
          return images[i];
        }
      }
      return undefined;
    };


    function findImageFromThumbSrc(srcThumb) {
      var i;
      for (i = 0; i < images.length; i++) {
        if (srcThumb === images[i]['srcThumb']) {
          return images[i];
        }
      }
      return undefined;
    }

    return {
      init: _init,
      attach: _attach
    };
  };
})(jQuery);
