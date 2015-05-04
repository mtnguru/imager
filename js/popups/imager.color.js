
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
  Drupal.imager.Popups.colorC = function colorC (spec) {
    var Popups = Drupal.imager.Popups;
    var Viewer = Drupal.imager.Viewer;
    var hue = 0;
    var saturation = 0;
    var lightness = 0;
    var popup;

    var dspec = $.extend({
                   name: 'Color',
                   autoOpen: false,
                   title: 'Hue/Saturation/Lightness',
                   zIndex: 1015,
                   width: 'auto',
                   dialogClass: 'imager-dialog imager-noclose',
                   cssId: 'imager-color',
                   height: 'auto',
                   resizable: false,
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
      Viewer.setInitialImage();
      Viewer.setEditMode('color');
      popup.dialogInit();
    }

    popup.dialogOnClose = function dialogOnClose() {
      Viewer.setEditMode('none');
    };

    /**
     * Initialize checkboxes from localStorage
     */
    popup.dialogInit = function dialogInit() {
      // brightness/contrast and HSL slider change events 
      hue = 0;
      saturation = 0;
      lightness = 0;
      $('#slider-hue').change(function()        { popup.adjustColor(Viewer.$canvas2,Viewer.$canvas);});
      $('#slider-saturation').change(function() { popup.adjustColor(Viewer.$canvas2,Viewer.$canvas);});
      $('#slider-lightness').change(function()  { popup.adjustColor(Viewer.$canvas2,Viewer.$canvas);});
      $('#slider-hue').val(0);
      $('#slider-saturation').val(0);
      $('#slider-lightness').val(0);
    };

    popup.adjustColor = function adjustColor($cvssrc,$cvsdst) {
      hue        = parseInt($('#slider-hue').val() * 100)/100;
      saturation = parseInt($('#slider-saturation').val() * 100)/9000;
      lightness = parseInt($('#slider-lightness').val() * 100)/10000;
      popup.updateStatus();

      var w = $cvssrc.attr('width');
      var h = $cvssrc.attr('height');

      var ctxsrc = $cvssrc[0].getContext('2d');
      var ctxdst = $cvsdst[0].getContext('2d');

      var dataDesc = ctxsrc.getImageData(0,0,w,h); // left, top, width, height
      var data = dataDesc.data;

      // this seems to give the same result as Photoshop
      if (saturation < 0) {
        var satMul = 1+saturation;
      } else {
        var satMul = 1+saturation*2;
      }

      hue = (hue%360) / 360;
      var hue6 = hue * 6;

      var rgbDiv = 1 / 255;

      var light255 = lightness * 255;
      var lightp1 = 1 + lightness;
      var lightm1 = 1 - lightness;

      var p = w * h;
      var pix = p*4, pix1 = pix + 1, pix2 = pix + 2, pix3 = pix + 3;

      while (p--) {

        var r = data[pix-=4];
        var g = data[pix1=pix+1];
        var b = data[pix2=pix+2];

        if (hue !== 0 || saturation !== 0) {
          // ok, here comes rgb to hsl + adjust + hsl to rgb, all in one jumbled mess. 
          // It's not so pretty, but it's been optimized to get somewhat decent performance.
          // The transforms were originally adapted from the ones found in Graphics Gems, but have been heavily modified.
          var vs = r;
          if (g > vs) vs = g;
          if (b > vs) vs = b;
          var ms = r;
          if (g < ms) ms = g;
          if (b < ms) ms = b;
          var vm = (vs-ms);
          var l = (ms+vs)/510;
          if (l > 0) {
            if (vm > 0) {
              if (l <= 0.5) {
                var s = vm / (vs+ms) * satMul;
                if (s > 1) s = 1;
                var v = (l * (1+s));
              } else {
                var s = vm / (510-vs-ms) * satMul;
                if (s > 1) s = 1;
                var v = (l+s - l*s);
              }
              if (r === vs) {
                if (g === ms)
                  var h = 5 + ((vs-b)/vm) + hue6;
                else
                  var h = 1 - ((vs-g)/vm) + hue6;
              } else if (g === vs) {
                if (b === ms)
                  var h = 1 + ((vs-r)/vm) + hue6;
                else
                  var h = 3 - ((vs-b)/vm) + hue6;
              } else {
                if (r === ms)
                  var h = 3 + ((vs-g)/vm) + hue6;
                else
                  var h = 5 - ((vs-r)/vm) + hue6;
              }
              if (h < 0) h+=6;
              if (h >= 6) h-=6;
              var m = (l+l-v);
              var sextant = h>>0;
              if (sextant === 0) {
                r = v*255; g = (m+((v-m)*(h-sextant)))*255; b = m*255;
              } else if (sextant === 1) {
                r = (v-((v-m)*(h-sextant)))*255; g = v*255; b = m*255;
              } else if (sextant === 2) {
                r = m*255; g = v*255; b = (m+((v-m)*(h-sextant)))*255;
              } else if (sextant === 3) {
                r = m*255; g = (v-((v-m)*(h-sextant)))*255; b = v*255;
              } else if (sextant === 4) {
                r = (m+((v-m)*(h-sextant)))*255; g = m*255; b = v*255;
              } else if (sextant === 5) {
                r = v*255; g = m*255; b = (v-((v-m)*(h-sextant)))*255;
              }
            }
          }
        }

        if (lightness < 0) {
          r *= lightp1;
          g *= lightp1;
          b *= lightp1;
        } else if (lightness > 0) {
          r = r * lightm1 + light255;
          g = g * lightm1 + light255;
          b = b * lightm1 + light255;
        }

        if (r < 0) 
          data[pix] = 0;
        else if (r > 255)
          data[pix] = 255;
        else
          data[pix] = r;

        if (g < 0) 
          data[pix1] = 0;
        else if (g > 255)
          data[pix1] = 255;
        else
          data[pix1] = g;

        if (b < 0) 
          data[pix2] = 0;
        else if (b > 255)
          data[pix2] = 255;
        else
          data[pix2] = b;

      }
      ctxdst.putImageData(dataDesc,0,0);  // left, top
    };

    popup.dialogReset = function dialogReset() {
      hue = 0;
      saturation = 0;
      lightness = 0;
      popup.updateStatus();
      if (popup.dialogIsOpen()) {
        $('#slider-hue').val(0);
        $('#slider-saturation').val(0);
        $('#slider-lightness').val(0);
        popup.adjustColor(Viewer.$canvas2, Viewer.$canvas);
      }
    }


    popup.dialogApply = function dialogApply() {
      Popups.$imagerBusy.show();
      popup.adjustColor(Viewer.$canvas,Viewer.$canvas);
      Viewer.copyCanvasToImg();
      Viewer.redraw();
      Drupal.imager.setEditMode('none');
      Popups.$imagerBusy.hide();
    };

    popup.dialogUpdate = function dialogUpdate() {
    };

    popup.updateStatus = function updateStatus() {
      Popups.status.dialogUpdate({
        'hue':        parseInt(hue*100)/100,
        'saturation': parseInt(saturation*100)/100,
        'lightness':  parseInt(lightness*100)/100
      });
    };

    /**
     * Dialog buttons are defined last to ensure methods are defined.
     */
    popup.spec['buttons'] = { Apply: popup.dialogApply,
                              Reset: popup.dialogReset,
                              Cancel: popup.dialogClose
                            };
    return popup;
  };
})(jQuery);
