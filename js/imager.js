
/**
 * @file
 * JavaScript library to popup full image viewer/editor from images on pages
 * 
 * Provides image viewer:
 * - Hover over a thumbnail and a popup appears of the full image
 * - Use mouse to pan and zoom
 * - Arrow keys select the next image on underlying page
 * 
 * Image editor is built into the viewer:
 * - Rotate
 * - Crop
 * - Brightness/Contrast
 * - Hue/Saturation/Lightness
 * 
 * Edited images can be:
 * - Saved (new or overwrite) back into Drupal
 * - Downloaded to local file system
 * - Copied to the clipboard
 * - Emailed from Drupal
 */

/**
 * Wrap file in JQuery();
 * 
 * @param $
 */
(function ($) {
  /**
   * Reserve imager namespace
   * 
   * @returns {_L28.imager.Anonym$32}
   *   init()    Initialization imager
   *   attach()  Attach to thumbnails on source page
   */
  window.imager = function imager(){

//  localStorage.clear();
    var settings = {};     // Settings passed in from Drupal.settings
    var $thumbnails;       // List of thumbnails on source page
   
//  configDialog = {
//
//    'save': save
//    dialog
//  };
    // Elements
    var $imagerWrapper;    // Wrapper around all imager html divs
    var $imagerViewer;     // Dialog - Viewer/Editor
    var $imagerCanvas;     // canvas with current displayed image
    var $imagerCanvas2;    // canvas with original full image - never shown
    var $imagerInfo;       // popup for displaying text information
    var $imagerMap;        // popup for displaying map showing locations of images
    var $imagerConfirm;    // popup for confirming actions - delete image
    var $imagerConfig;     // popup for configuration dialog
    var $imagerEdit;       // popup for displaying text information
    var $imagerBrightness; // brightness slider popup
    var $imagerColor;      // hsl color slider popup
    var $imagerStatus;     // Status or debug popup
    var $imagerMessages;   // Debug response debug popup
    var $imagerFilesave;   // Debug response debug popup
    var $imagerBusy;       // Image busy gif popup
    var ias;               // imgAreaSelect instance
    var ctx;               // canvas context
    var ctx2;              // canvas context of original unshown image

    var cimg = document.createElement('IMG');
    var imgs = [];         // file paths and titles of all matched images on page
    var nimgs = 0;         // number of images
    var currImage;         // current image being viewed
    var viewMode = 0;      // 0 - #mode-view, 1 - #mode-edit, 2 - #mode-crop
    var editMode = 0;      // 0 - none, 1 - brightness/contrast, 2 - color (hsl)
    var elapsed = 0;       // # elapsed msec since last mouse up
    var fullScreen = 0;    // Are we currently in full screen mode
    var editField = '';    // Name of current field being edited
    var editFieldType = '';// Type of field currently being edited
    var fileSaveMode = ''; // Mode for saving files - drupal, local, clipboard
    var imageResMode = ''; // Save what resolution - canvas, cropped image, full image
    var confirmMode = '';  // Mode for the confirmation dialog - deleteFile
    var messageTimeout;    // Message timeout function - needed for clearTimeout

    // Dimensions
    var mw;  // Maximum canvas width
    var mh;  // Maximum canvas height

    var cw;  // Canvas width
    var ch;  // Canvas height

    var iw;  // Actual Image width
    var ih;  // Actual Image height

    var vw;  // Image viewport width
    var vh;  // Image viewport height

    // Status 
    var rotation;  // 0, 90, 180, 270 
    var initScale = 1;
    var scaleFactor = 1.02;
    var cscale;
    var dragging = false;
    var distance;
    var lastup = new Date();  // time of last mouseup event
    var brightness = 0;
    var contrast = 1;
    var hue = 0;
    var lightness = 0;
    var saturation = 0;

    // Points
    var ptDownC = {}; // Last place mouse button was released - canvas 
    var ptDownT = {}; // Last place mouse button was released - transformed
    var ptSUlC  = {}; // Crop Selection Upper Left corner  - canvas
    var ptSLrC  = {}; // Crop Selection Lower right corner - canvas
    var ptSUlT  = {}; // Crop Selection Upper Left corner  - transformed
    var ptSlrT  = {}; // Crop Selection Lower right corner - transformed
    var ptCUlT  = {}; // Upper Left corner of canvas       - transformed
    var ptCLrT  = {}; // Lower Right corner of canvas      - transformed
    var ptNowC  = {}; // Current point, varies with use    - canvas
    var ptNowT  = {}; // Current point, varies with use    - transformed

    function _init(opts) {
      settings = opts;   // Why do I make a local copy?  There must have been a reason.

      $imagerCanvas2    = $('#imager-canvas-org');
      $imagerCanvas2.hide();   // This is never displayed, it is used to save images temporarily
      ctx2 = $imagerCanvas2[0].getContext('2d');           

      $imagerWrapper    = $('#imager-wrapper');
      $imagerViewer    = $('#imager-viewer');
      $imagerViewer.hide();

      $imagerInfo       = $('#imager-info');
      $imagerInfo.hide();
      initDraggable($imagerInfo,'info_location',-300,5);
      
      $imagerMap       = $('#imager-map');
      $imagerMap.hide();
      initDraggable($imagerMap,'info_map',5,5);
      
      $imagerConfirm       = $('#imager-confirm');
      $imagerConfirm.hide();
      initDraggable($imagerConfirm,'confirm_location',5,5);
      
      $imagerEdit       = $('#imager-edit');
      $imagerEdit.hide();
      initDraggable($imagerEdit,'edit_location',0,0);

      $imagerBrightness = $('#imager-brightness');
      $imagerBrightness.hide();
      initDraggable($imagerBrightness,'brightness_location',50,-5);

      $imagerColor      = $('#imager-color');
      $imagerColor.hide();
      initDraggable($imagerColor,'color_location',50,-5);

      $imagerMessages   = $('#imager-messages');
      $imagerMessages.hide();
      initDraggable($imagerMessages,'messages_location',200,5)

      $imagerFilesave   = $('#imager-filesave');
      $imagerFilesave.hide();
      initDraggable($imagerFilesave,'filesave_location',200,400);

      $imagerBusy = $('#imager-busy');
      $imagerBusy.hide();

      $('#imager-form').empty();

      if (localStorage.quickView === "TRUE") {
        $('#mode-view').addClass('checked');
      } else {
        viewMode = 1;      // 0 - #mode-view, 1 - #mode-edit, 2 - #mode-crop
      }

      $thumbnails   = $(settings.cssContainer);
      if ($thumbnails.length == 0) return; // No thumbnails found, exit 

      $imagerCanvas     = $('#imager-canvas');
      ctx  = $imagerCanvas[0].getContext('2d');
      ias = $imagerCanvas.imgAreaSelect({
        instance: true,
        disable: true,
        handles: true,
        autoHide: false,
        hide: true,
        show: true,
      });

      initEvents();
//    initThumbEvents();

      trackTransforms(ctx);  // Create transform history
      enablePanZoom(); 
    }

/**
 * Attach behaviors to new thumbnails images
 * 
 * @todo Figure out what elements need behaviors updated on AJAX loads and add them here.
 */
    function _attach() {
      initThumbEvents();
    }

    function initDraggable($elem,name,initLeft,initTop) {
      var left;
      var top;
      var ww = window.innerWidth;
      var wh = window.innerHeight;
      var dw = ($elem.outerWidth() < 40) ? 200 : $elem.outerWidth();
      var dh = ($elem.outerHeight() < 40) ? 100 : $elem.outerHeight();
      if (localStorage[name]) {
        var pt = localStorage[name].split(",");
        left = parseInt(pt[0]);
        top  = parseInt(pt[1]);
        if (left + dw > ww) {
          left = ww - dw;
        }
        if (top + dh > wh) {
          top = wh - dh;
        }
      } else {
        left = initLeft;
        top  = initTop;
        if (initLeft < 0) {
          left = ww - dw + initLeft; 
        }
        if (initTop < 0) {
          top = wh - dh + initTop; 
        }
      }
      $elem.css({'left': left,
                 'top':  top});
      $elem.draggable({
        stop: function(evt,ui) {
          var left = $(this).css('left');
          var top = $(this).css('top');
          if (parseInt(top) < 0)  top  = "0px";
          if (parseInt(left) < 0) left = "0px";
          localStorage[name] = left + ',' + top;
        }
      });
    }

    function updateStatus() {
//      ptCUlT = ctx.transformedPoint(0,0);
//      ptCLrT = ctx.transformedPoint(cw,ch);
      if (localStorage.imagerDebugStatus === "FALSE") return;
      var filename = (currImage) ? decodeURIComponent(currImage['src'].split('/').reverse()[0]) : 'none';
      $('#imager-status-content').html(
        '<div class="imager-status-file">Image file: ' + filename + '</div>' +
        '<div class="imager-status-col">' +
          '<table>' +
            '<tr><th>Name</th><th>Value</th></tr>' +
            '<tr><td>View Mode</td><td>'   + viewMode + '</td></tr>' +
            '<tr><td>Edit Mode</td><td>'   + editMode + '</td></tr>' +
            '<tr><td>Full Screen</td><td>' + fullScreen + '</td></tr>' +
            '<tr><td>Distance</td><td>'    + parseInt(distance) + '</td></tr>' +
            '<tr><td>Elapsed</td><td>'     + elapsed/1000 + '</td></tr>' +
            '<tr><td>Zoom</td><td>'        + parseInt(cscale*10000)/10000 + '</td></tr>' +
            '<tr><td>Rotation</td><td>'    + rotation + '</td></tr>' +
            '<tr><td>Brightness</td><td>'  + brightness + '</td></tr>' +
            '<tr><td>Contrast</td><td>'    + contrast + '</td></tr>' +
            '<tr><td>Hue</td><td>'         + parseInt(hue*100)/100 + '</td></tr>' +
            '<tr><td>Saturation</td><td>'  + parseInt(saturation*100)/100 + '</td></tr>' +
            '<tr><td>Lightness</td><td>'   + parseInt(lightness*100)/100 + '</td></tr>' +
          '</table>' +
        '</div>' +
        '<div class="imager-status-col">' +
          '<table>' +
            '<tr><th>Name</th><th>Width</th><th>Height</th></tr>' +
            '<tr><td>Maximum Canvas</td><td>'   + parseInt(mw) + '</td><td>' + parseInt(mh) + '</td></tr>' +
            '<tr><td>Actual Canvas</td><td>'    + parseInt(cw) + '</td><td>' + parseInt(ch) + '</td></tr>' +
            '<tr><td>Displayed Image</td><td>'  + parseInt(ptCLrT.x-ptCUlT.x) + '</td><td>' + parseInt(ptCLrT.y-ptCUlT.y) + '</td></tr>' +
            '<tr><td>Full Image</td><td>'+ iw + '</td><td>' + ih + '</td></tr>' +
          '</table>' +
//      '</div>' +
//      '<div class="imager-status-col">' +
          '<table>' +
            '<tr><th>Name</th><th>X</th><th>Y</th></tr>' +
            '<tr><td>Mouse Now</td><td>'     + parseInt(ptNowC.x) + '</td><td>'  + parseInt(ptNowC.y) + '</td></tr>' +
            '<tr><td>Mouse Now Tx</td><td>'  + parseInt(ptNowT.x) + '</td><td>'  + parseInt(ptNowT.y) + '</td></tr>' +
            '<tr><td>Mouse Down</td><td>'    + parseInt(ptDownC.x) + '</td><td>' + parseInt(ptDownC.y) + '</td></tr>' +
            '<tr><td>Mouse Down Tx</td><td>' + parseInt(ptDownT.x) + '</td><td>' + parseInt(ptDownT.y) + '</td></tr>' +
            '<tr><td>Upper Left Canvas Tx</td><td>'    + parseInt(ptCUlT.x)   + '</td><td>' + parseInt(ptCUlT.y)   + '</td></tr>' +
            '<tr><td>Lower Right Canvas Tx</td><td>'   + parseInt(ptCLrT.x)   + '</td><td>' + parseInt(ptCLrT.y)   + '</td></tr>' +
          '</table>' +
        '</div>'
      );
    };


    // Change the current image in #image-viewer
    /**
     * 
     * @param {type} src
     * @param {type} evt
     * @returns {undefined}
     */
    var changeImage = function(thumb) {
      rotation = 0;  // 0, 90, 180, 270 
      brightness = 0;
      contrast = 1;
      hue = 0;
      lightness = 0;
      saturation = 0;

      $imagerEdit.hide();
      currImage = thumb;
      cimg.src = currImage['src'];   // This begins loading the image - upon completion load event is fired
      $imagerBusy.show();
    }

    var initializeImage = function() {
      iw = cimg.width;
      ih = cimg.height;
      if (fullScreen) {
        mw = $(window).width()  - 45; // Maximum canvas width
        mh = $(window).height() - 10; // Maximum canvas height
        cw=mw;
        ch=mh;
        hscale = ch/ih;
        vscale = cw/iw;
        cscale = (hscale < vscale) ? hscale : vscale;
      } else {
        mw = $(window).width()  - 95; // Maximum canvas width
        mh = $(window).height() - 6; // Maximum canvas height
        calcCanvasDims(iw,ih);
        cscale = cw/iw;
      }
      initScale = cscale;
      ptDownC.x = cw/2;    // Just in case 
      ptDownC.y = ch/2;
      $imagerCanvas.attr({width:  cw,
                       height: ch});
      setEditMode(0);
      ptNowC.x=0;    
      ptNowC.y=0;
      ctx.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx.clearRect(0,0,cw,ch);        // Clear the canvas
      rotation = 0;
      scale(cscale,false);                          // Set initial scaling to fit
    }

    // When image is loaded - load event is fired
    cimg.addEventListener('load', function () {
      $imagerBusy.hide();
      initializeImage();
  //  var nimg = Pixastic.process(cimg,"desaturate");
      redraw();                                        // Draw the image
      showPopups();               // Hide the image viewer 
      if (localStorage.imagerShowInfo === "TRUE") getInfo();                                       //
    }, false);
   
    var redraw = function(){
      ptCUlT = ctx.transformedPoint(0,0);
      ptCLrT = ctx.transformedPoint($imagerCanvas[0].width,$imagerCanvas[0].height);
      if ((rotation == 0) || (rotation == 180)) {
        cscale = cw / Math.abs(ptCLrT.x - ptCUlT.x);
      } else {
        cscale = cw / Math.abs(ptCLrT.y - ptCUlT.y);
      }
      ctx.clearRect(ptCUlT.x,
                    ptCUlT.y,
                    ptCLrT.x-ptCUlT.x,
                    ptCLrT.y-ptCUlT.y);

      // Alternatively:
  //       ctx.save();
  //       ctx.setTransform(1,0,0,1,0,0);
  //       ctx.clearRect(0,0,$imagerCanvas[0].width,$imagerCanvas[0].height);
  //       ctx.restore();

      ctx.drawImage(cimg,0,0);
      updateStatus();
    }

    var calcCanvasDims = function(sw,sh) {
      if ((ch = sh*mw/sw) < mh) {   // width determines max size
        cw = mw;
      } else {                      // height determines max size
        ch = mh;
        cw = sw*mh/sh;
      }
      cw = parseInt(cw);
      ch = parseInt(ch);
    }

    var rotate = function(deg) {
      mw = $(window).width()  - 200; // Maximum canvas width
      mh = $(window).height() - 20;  // Maximum canvas height
      ctx.clearHistory();
      iw = cimg.width;
      ih = cimg.height;
      if (deg == 90) {
        rotation = (rotation == 270) ? 0 : rotation += 90;
      }  else if (deg == -90) {
        rotation = (rotation == 0) ? 270 : rotation -= 90;
      }
      if (rotation == 0 || rotation == 180) {
        calcCanvasDims(iw,ih);
        $imagerCanvas.attr({width: cw,
                           height: ch});
        cscale=cw/iw;
        ptNowC.x=cw/2; 
        ptNowC.y=ch/2;
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,$imagerCanvas[0].width,$imagerCanvas[0].height);
        if (rotation == 180) {
          ctx.translate(cw,ch);
          ctx.rotate(angleInRadians(rotation));
        } else {
  //        ctx.translate(-cw,-ch);
  //        ctx.rotate(angleInRadians(rotation));
        }
      } else {
        calcCanvasDims(ih,iw);
        $imagerCanvas.attr({width:  cw,
                            height: ch});
        cscale=cw/ih;
        ptNowC.x=cw/2; 
        ptNowC.y=ch/2;
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,$imagerCanvas[0].width,$imagerCanvas[0].height);
        if (rotation == 90) {
          ctx.translate(cw,0);
        } else {
          ctx.translate(0,ch);
        }
        ctx.rotate(angleInRadians(rotation));
      }
      initScale = cscale;
      ctx.scale(cscale,cscale);
      redraw();
      showPopups();
    };

    var angleInRadians = function(deg) {
      return deg * Math.PI / 180;
    };
    
    var zoom = function(clicks){
      scale(Math.pow(scaleFactor,clicks),true);
      redraw();
    };

    var scale = function(factor,checkScale) {
      if (checkScale && factor < 1) {
        if (cscale * factor < initScale) {
          factor = initScale / cscale;
        }
      }
      ptNowT = ctx.transformedPoint(ptNowC.x,ptNowC.y);
      ctx.translate(ptNowT.x,ptNowT.y);
      ctx.scale(factor,factor);
      ctx.translate(-ptNowT.x,-ptNowT.y);
      var npt;
      if (npt = outOfBounds()) {
//      ctx.restore();
        ctx.translate(npt.x,npt.y);
      }
    };

  /*
   * adjustBrightness($cvssrc,$cvsdst)
   */
    var adjustBrightness = function($cvssrc,$cvsdst) {
      brightness = parseInt($('#slider-brightness').val());
      contrast   = parseInt($('#slider-contrast').val())/100;
      updateStatus();

      var brightMul = 1 + Math.min(150,Math.max(-150,brightness)) / 150;
      contrast = Math.max(0,contrast+1);

      var ctxsrc = $cvssrc[0].getContext('2d');
      var ctxdst = $cvsdst[0].getContext('2d');

      var w = $cvssrc.attr('width');
      var h = $cvssrc.attr('height');

      var dataDesc = ctxsrc.getImageData(0,0,w,h); // left, top, width, height
      var data = dataDesc.data;

      var p = w*h;
      var pix = p*4, pix1, pix2;

      var mul, add;
      if (contrast != 1) {
        mul = brightMul * contrast;
        add = - contrast * 128 + 128;
      } else {  // this if-then is not necessary anymore, is it?
        mul = brightMul;
        add = 0;
      }
      var r, g, b;
      while (p--) {
        if ((r = data[pix-=4] * mul + add) > 255 )
          data[pix] = 255;
        else if (r < 0)
          data[pix] = 0;
        else
          data[pix] = r;

        if ((g = data[pix1=pix+1] * mul + add) > 255 ) 
          data[pix1] = 255;
        else if (g < 0)
          data[pix1] = 0;
        else
          data[pix1] = g;

        if ((b = data[pix2=pix+2] * mul + add) > 255 ) 
          data[pix2] = 255;
        else if (b < 0)
          data[pix2] = 0;
        else
          data[pix2] = b;
      }
  //  ctx.putImageData(dataDesc,0,0,0,0,iw,ih);  // left, top
      ctxdst.putImageData(dataDesc,0,0);  // left, top
    };

    var resetBrightness = function() {
      brightness = 0;
      contrast = 0;
      updateStatus();
      $('#slider-brightness').val(brightness);
      $('#slider-contrast').val(contrast);
      adjustBrightness($imagerCanvas2,$imagerCanvas);
    }

    var applyBrightness = function() {
      $imagerBusy.show();
      $imagerCanvas2.attr({width:  iw,       // Set canvas to same size as image
                           height: ih});
      ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx2.drawImage(cimg,0,0);         // Copy full image into canvas

      adjustBrightness($imagerCanvas2,$imagerCanvas2);
      cimg.src = $imagerCanvas2[0].toDataURL(); 
      redraw();
      setEditMode(0);
      $imagerBusy.hide();
    }

    var adjustColor = function($cvssrc,$cvsdst) {
      hue        = parseInt($('#slider-hue').val() * 100)/100;
      saturation = parseInt($('#slider-saturation').val() * 100)/9000;
      lightness = parseInt($('#slider-lightness').val() * 100)/10000;
      updateStatus();

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

        if (hue != 0 || saturation != 0) {
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
              if (r == vs) {
                if (g == ms)
                  var h = 5 + ((vs-b)/vm) + hue6;
                else
                  var h = 1 - ((vs-g)/vm) + hue6;
              } else if (g == vs) {
                if (b == ms)
                  var h = 1 + ((vs-r)/vm) + hue6;
                else
                  var h = 3 - ((vs-b)/vm) + hue6;
              } else {
                if (r == ms)
                  var h = 3 + ((vs-g)/vm) + hue6;
                else
                  var h = 5 - ((vs-r)/vm) + hue6;
              }
              if (h < 0) h+=6;
              if (h >= 6) h-=6;
              var m = (l+l-v);
              var sextant = h>>0;
              if (sextant == 0) {
                r = v*255; g = (m+((v-m)*(h-sextant)))*255; b = m*255;
              } else if (sextant == 1) {
                r = (v-((v-m)*(h-sextant)))*255; g = v*255; b = m*255;
              } else if (sextant == 2) {
                r = m*255; g = v*255; b = (m+((v-m)*(h-sextant)))*255;
              } else if (sextant == 3) {
                r = m*255; g = (v-((v-m)*(h-sextant)))*255; b = v*255;
              } else if (sextant == 4) {
                r = (m+((v-m)*(h-sextant)))*255; g = m*255; b = v*255;
              } else if (sextant == 5) {
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
          data[pix] = 0
        else if (r > 255)
          data[pix] = 255
        else
          data[pix] = r;

        if (g < 0) 
          data[pix1] = 0
        else if (g > 255)
          data[pix1] = 255
        else
          data[pix1] = g;

        if (b < 0) 
          data[pix2] = 0
        else if (b > 255)
          data[pix2] = 255
        else
          data[pix2] = b;

      }
      ctxdst.putImageData(dataDesc,0,0);  // left, top
    }

    function resetColor() {
      $('#slider-hue').val(0);
      $('#slider-saturation').val(0);
      $('#slider-lightness').val(0);
      adjustColor($imagerCanvas2,$imagerCanvas);
    }

    function applyColor() {
      $imagerBusy.show();
      $imagerCanvas2.attr({width:  iw,     // Set image to be full size
                          height: ih});
      ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx2.drawImage(cimg,0,0);         // Copy full image into canvas

      adjustColor($imagerCanvas2,$imagerCanvas2);
      cimg.src = $imagerCanvas2[0].toDataURL(); 
      redraw();
      setEditMode(0);
      $imagerBusy.hide();
    }

  /*
   * crop()
   */
    function crop() {
      $imagerBusy.show();
      if (viewMode != 2) return;
      setViewMode(1);
      var selection = ias.getSelection();
      sw = selection.width;
      sh = selection.height;
      ptSUlC.x = selection.x1;
      ptSUlC.y = selection.y1;
      ptSLrC.x = selection.x2;
      ptSLrC.y = selection.y2;
      ptSUlT = ctx.transformedPoint(ptSUlC.x,ptSUlC.y);
      ptSLrT = ctx.transformedPoint(ptSLrC.x,ptSLrC.y);
      var niw = ptSLrT.x - ptSUlT.x;
      var nih = ptSLrT.y - ptSUlT.y;

      $imagerCanvas.attr({width:  niw,           // Make canvas same size as the image
                          height: nih});
      ctx.clearRect(0,0,cw,ch);
      ctx.setTransform(1,0,0,1,0,0);
      ctx.drawImage(cimg,ptSUlT.x,ptSUlT.y,niw,nih,0,0,niw,nih);  // Copy cropped area from img into canvas

      cimg.src = $imagerCanvas[0].toDataURL();  // Copy canvas image back into img
      calcCanvasDims(niw,nih);                  // Calculate maximum size of canvas
      $imagerCanvas.attr({width:  cw,            // Make canvas proper size
                          height: ch});
      ctx.scale(cw/niw,ch/nih);                 // Scale image to fit canvas
  //  ctx.drawImage(cimg,0,0);                 // Draw image, not necessary, it's already drawn
      updateStatus();
      $imagerBusy.hide();
    }

    /**
     * Check if panning or zooming is causing image to leave a margin at edges
     * If so calculate the translation necessary to move image back to the edge.
     * 
     * @returns {window.imager.outOfBounds.npt}
     */
    var outOfBounds = function() {
      var npt = {'x': 0, 
                 'y': 0};
      if (localStorage.imagerBoundsEnable === 'FALSE') return npt;
      var pw;
      var ph;
      switch (rotation) {
        case 0:
          ptCUlT = ctx.transformedPoint(0,0);
          ptCLrT = ctx.transformedPoint(cw,ch);
          pw = iw * cscale;
          ph = ih * cscale;
          break;
        case 90:
          ptCUlT = ctx.transformedPoint(cw,0);
          ptCLrT = ctx.transformedPoint(0,ch);
          pw = ih * cscale;
          ph = iw * cscale;
          break;
        case 180:
          ptCUlT = ctx.transformedPoint(cw,ch);
          ptCLrT = ctx.transformedPoint(0,0);
          pw = iw * cscale;
          ph = ih * cscale;
          break;
        case 270:
          ptCUlT = ctx.transformedPoint(0,ch);
          ptCLrT = ctx.transformedPoint(cw,0);
          pw = ih * cscale;
          ph = iw * cscale;
          break;
      }
      var msg = '<p>outOfBounds - cw: ' + cw + '  pw: ' + pw + '</p>';
      msg += '<p>outOfBounds - ch: ' + ch + '  ph: ' + ph + '</p>';
      var x1 = ptCUlT.x;
      var y1 = ptCUlT.y;
      var x2 = iw - ptCLrT.x;
      var y2 = ih - ptCLrT.y;
      // @todo - When image is smaller than the canvas the image flips back and forth.
//    if (cw < pw) {   // @todo
        if (x2 < 0) {
          msg += '<p>outOfBounds - right:' + x2 + '</p>';
          npt.x = -x2
        }
//    }
//    if (ch < ph) {
        if (y2 < 0) {
          msg += '<p>outOfBounds - bottom:' + y2 + '</p>';
          npt.y = -y2
        }
//    }
      if (x1 < 0) {
        msg += '<p>outOfBounds - left:' + ptCUlT.x + '</p>';
        npt.x = ptCUlT.x;
      }
      if (y1 < 0) {
        msg += '<p>outOfBounds - top:' + ptCUlT.y + '</p>';
        npt.y = ptCUlT.y;
      }
      if (msg) {
        $('#imager-messages-content').html(msg);
      }
      if (npt.x || npt.y) return npt;
      return undefined;
    };

/**
 * Use AJAX to retrieve a rendered file entity and display in a popup dialog.
 */
    function getInfo() {
      $imagerBusy.show();
      processAjax(settings.actions.displayEntity.url,
                  { action: 'display-entity',
                    uri: currImage['src'],
                  },function(response) {
        var status = response['status'];
        var txt = "";
        $imagerInfo.removeClass('error').show();
        if (response['data']) {
          $('#imager-info-content').html(response['data']);
          $('.imager-info-edit').click(function (evt) {
            editField = this.id.replace('imager-','');
            var clientX = evt.clientX;
            var clientY = evt.clientY;
            // Display edit popup - render current field from default edit form  
            $imagerBusy.show();
            displayMessage('Contacting Server ... loading form field');
            processAjax(settings.actions.editFormFieldLoad.url,  
                        { action: 'edit-form-field-load',
                          uri: currImage['src'],
                          field: editField,
                        },function(response) {
              setViewMode(1);
              var status = response['status'];
              var txt = "";
              if (response['data']) {
                $('#imager-edit-content').html(response['data']['rendered']);
                editFieldType = response['data']['type'];
                if (settings.attachBehaviors) {
                  settings.attachBehaviors('#imager-edit-content div');
                }
              }
              
              $imagerEdit.css('left',clientX - $imagerEdit.outerWidth() - 10).css('top',clientY);
              $imagerEdit.show();
            });
          });
        }
      });
    }

/**
* Use AJAX to get a map showing where the image was taken.
* 
* This isn't working yet.  Most likely problem is JavaScript files are not
* getting loaded through AJAX.  Not sure if this is even possible.
*/
    function getMap() {
      $imagerBusy.show();
      processAjax(settings.actions.displayMap.url,
                  { action: 'display-map',
                    uri: currImage['src'],
                  },function(response) {
        var status = response['status'];
        var txt = "";
        $imagerMap.removeClass('error').show();
        if (response['data']) {
          $('#imager-map-content').html(response['data']);
        }
      });
    }

/**
  *  
  * @param {type} evt
  */
    function mouseDown (evt){
      document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
      ptDownC.x = evt.offsetX || (evt.pageX - $imagerCanvas[0].offsetLeft);
      // @todo - pageY works intermittently
      //         Seems to be related to the div having css 'position: fixed'
      if (evt.offsetY) {
        ptDownC.y = evt.offsetY || (evt.pageY - $imagerCanvas[0].offsetTop);
      } else {
        ptDownC.y = evt.layerY + $imagerCanvas[0].offsetTop;  
      }
      ptDownT = ctx.transformedPoint(ptDownC.x,ptDownC.y);
      dragging = true;
      distance = 0;
      updateStatus();
    };

/**
* Move the image when mouse is moved.
* 
* @param {type} evt
*/
    function mouseMove(evt){
      ptNowC.x = evt.offsetX || (evt.pageX - $imagerCanvas[0].offsetLeft);
      if (evt.offsetY) {
        ptNowC.y = evt.offsetY || (evt.pageY - $imagerCanvas[0].offsetTop);
      } else {
        ptNowC.y = evt.layerY + $imagerCanvas[0].offsetTop;
      }
      ptNowT = ctx.transformedPoint(ptNowC.x,ptNowC.y);
      if (dragging){
        distance = Math.sqrt((Math.pow(ptDownC.x - ptNowC.x,2)) + (Math.pow(ptDownC.y - ptNowC.y,2)))
        ctx.save();
        ctx.translate(ptNowT.x-ptDownT.x,ptNowT.y-ptDownT.y);
        var npt;   // recommended x and y motions that won't go out of bounds
        if (npt = outOfBounds()) {
          ctx.restore();
          ctx.translate(ptNowT.x-ptDownT.x+npt.x,ptNowT.y-ptDownT.y+npt.y);
        }
        redraw();
      }
      updateStatus();
    }

/**
* User released mouse button, either execute zoom or close the viewer
*  
* @param {type} evt
*/
    function mouseUp(evt){
      dragging = false;
      var now = new Date();
      elapsed = now - lastup;
      lastup = now;
      if (distance < 20) {       // if mouse didn't move between clicks
        if (evt.ctrlKey) {
          zoom(evt.shiftKey ? -1 : 1 );
        } else {
          if (elapsed < 750) {  // if double click
            if (fullScreen) {
              screenfull.exit();
              setFullScreen(false);
            } else {
              hidePopups();
            }
          } else if (viewMode == 0) {
            setViewMode(1);
          }
        }
      }
      updateStatus();
    }

/**
* 
* @param {type} evt
* @returns {Boolean}
*/
    function mouseWheel(evt){
      var delta = evt.wheelDelta ? evt.wheelDelta/10 : -evt.detail ? evt.detail : 0;
      if (delta) zoom(-delta);
      return evt.preventDefault() && false;
    };

/**
* Enable events for panning and zooming and disable cropping events.
*/
    function enablePanZoom() {
      // canvas#image-canvas event handlers
      $imagerCanvas[0].addEventListener('mousedown',mouseDown,false);
      $imagerCanvas[0].addEventListener('mousemove',mouseMove,false);
      $imagerCanvas[0].addEventListener('mouseup',mouseUp,false);
      $imagerCanvas[0].addEventListener('DOMMouseScroll',mouseWheel,false);
      $imagerCanvas[0].addEventListener('mousewheel',mouseWheel,false);
      ias.setOptions({disable: true, hide: true});
    }

/**
* Enable events for cropping and disable events for cropping and zooming.
*/
    function enableCrop() {
      $imagerCanvas[0].removeEventListener('mousedown',mouseDown);
      $imagerCanvas[0].removeEventListener('mousemove',mouseMove);
      $imagerCanvas[0].removeEventListener('mouseup',mouseUp);
      $imagerCanvas[0].removeEventListener('DOMMouseScroll',mouseWheel);
      $imagerCanvas[0].removeEventListener('mousewheel',mouseWheel);
      ias.setOptions({enable: true, 
                      hide: false, 
                      show: true,
                      x1: 0,
                      x2: 0,
                      y1: 0,
                      y2: 0});
    }

/**
* Set the current view mode. 
* 
* @param {type} newMode
*/
    function setViewMode(newMode) {
      if (fullScreen && newMode == 0) newMode = 1;
      switch (newMode) {
        case 0:   // #mode-view
          if (viewMode == 2) enablePanZoom();      
          $('#mode-crop').removeClass('checked');
          break;
        case 1:   // #mode-lock - now mode not #mode-view
          if (viewMode == 2) enablePanZoom();      
          $('#mode-crop').removeClass('checked');
          break;
        case 2:   // #mode-crop
          if (viewMode < 2) enableCrop();
          $('#mode-crop').addClass('checked');
          break;
      };
      viewMode = newMode;
    };

/**
* Save the current image into a second offscreen canvas. 
*/
    function setInitialImage() {
      $imagerCanvas2.attr({width:  cw,     // Set image to be full size
                           height: ch});
      ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx2.drawImage($imagerCanvas[0],0,0);
    }

/**
 * Set image editing mode - none, brightness, hsl. 
 * 
 * @param {type} newMode
 */
    function setEditMode(newMode) {
      editMode = newMode;
      switch (editMode) {
        case 0:   // no editing
          $('#edit-brightness').removeClass('checked');
          $imagerBrightness.hide();
          $('#edit-color').removeClass('checked');
          $imagerColor.hide();
          break;
        case 1:   // #edit-brightness
          setInitialImage();
          setViewMode(1);
          $('#slider-brightness').val(0);
          $('#slider-contrast').val(0);
          $('#edit-brightness').addClass('checked');
          $imagerBrightness.show();
          $('#edit-color').removeClass('checked');
          $imagerColor.hide();
          break;
        case 2:   // #edit-color
          $('#slider-hue').val(0);
          $('#slider-saturation').val(0);
          $('#slider-lightness').val(0);
          setInitialImage();
          setViewMode(1);
          $('#edit-brightness').removeClass('checked');
          $imagerBrightness.hide();
          $('#edit-color').addClass('checked');
          $imagerColor.show();
          break;
      }
    }

/**
* Toggle full screen mode and draw image.
* 
* @param {type} newMode
*/
    function setFullScreen(newMode) {
      if (newMode) {
        fullScreen = true;
        $imagerWrapper.addClass('fullscreen');
        $('#mode-fullscreen').addClass('checked');
      } else {
        $imagerWrapper.removeClass('fullscreen');
        fullScreen = false;
        $('#mode-fullscreen').removeClass('checked');
      }
      setTimeout(function() {
        setViewMode(1);
        initializeImage();
        redraw();
      },250);
    }
/**
* Display any popups that are enabled. 
*/
  function showPopups() {
    $imagerViewer.show();
    if (localStorage.imagerShowInfo   === "TRUE") {
      $('#view-info').addClass('checked');
      $imagerInfo.show();
    }
    if (localStorage.imagerDebugStatus === "TRUE") {
      $('#debug-status').addClass('checked');
      configClose();
    }
    if (localStorage.imagerDebugMessages  === "TRUE") {
      $('#debug-messages').addClass('checked');
      $imagerMessages.show();
    }
    if (localStorage.imagerShowMap  === "TRUE") {
      $('#view-map').addClass('checked');
      $imagerMap.show();
    }
  }

/**
* Hide all popups and the main viewer window. 
*/
  function hidePopups() {
    $imagerViewer.hide();
    $imagerInfo.hide();
    $imagerEdit.hide();
    $imagerMap.hide();
    if ($imagerStatus) $imagerStatus.dialog("close");
    $imagerMessages.hide();
    $imagerConfirm.hide();
    setViewMode((localStorage.quickView === "TRUE") ? 0 : 1);
    setEditMode(0);
  }


  function displayMessage(msg) {
    $imagerMessages.show();
    $('#imager-messages-content').html(msg);
    if (localStorage['imagerDebugMessages'] === "FALSE") {
       messageTimeout = setTimeout(function() {
         $imagerMessages.hide();
       },5000);
    }
  }

    function findImageFromThumbSrc(tsrc) {
      for(i=0; i < nimgs; i++) {
        if (tsrc == imgs[i]['tsrc']) {
          currImage = imgs[i];
          return currImage;
        }
      }
      return undefined;
    };

/**
* Given an image, find the next or previous image.
* 
* @param {type} src
*   Source image.
* @param {type} offset
*   Number of images.
* 
* @returns {Drupal.behaviors.imager.attach.currImage['src']|String|src}
*/
    function findNextImage(current,offset) {
      for(i=0; i < nimgs; i++) {
        if (current == imgs[i]) {
          if (offset == 1) {
            if (++i == nimgs) i = 0;
          } else {
            if (--i == -1) i = nimgs-1;
          }
          currImage = imgs[i];
          return currImage;
        }
      }
      return undefined;
    };

/**
 * Set handlers for all events.
 * 
 * @todo This function is 500 lines long and needs restructuring.
 */
    function initEvents() {
      // div#imager-viewer event handlers
      // click on #imager-viewer - hide it, set mode back to view=0
      $imagerViewer.click(function () {
        if (viewMode > 0) return;
        $(this).hide();
        hidePopups();
        updateStatus();
      });

      // mouse enters the #imager-viewer div - do nothing
    //$imagerViewer.mouseenter(function() {
    //  console.debug('#imager-viewer mouseenter');
    //})

      // mouse leaves the #imager-viewer div - hide it
      $imagerViewer.mouseleave(function(evt) {
        if (viewMode > 0) return false; 
        var el = evt.relatedTarget ? evt.relatedTarget : evt.toElement;
        var el1 = $(el).closest('#imager-info');        // if they went to the info viewer don't leave
        if (el === $imagerInfo[0] || el1.length) return;

        hidePopups();
        updateStatus();
      });

      
    // div#button-wrapper event handlers
      $('#button-wrapper').click(function (evt) {
          evt.stopPropagation();
      });

    // div#image-buttons event handlers
      // click on #image-left - bring up next image to the left
      $('#image-left').click(function() {
        setViewMode(1);
        setEditMode(0);
        changeImage(findNextImage(currImage,-1));   
      });
      // click on #image-right - bring up next image to the right
      $('#image-right').click(function() {
        setViewMode(1);
        setEditMode(0);
        changeImage(findNextImage(currImage,1));
      });
      // click on #image-exit - Exit the large popup
      $('#image-exit').click(function() {
        if (fullScreen) {
          screenfull.exit();
          setFullScreen(false);
        } else {
          hidePopups();
        }
      });
      // click on #image-ques - ajax call to bring in image description
      $('#imager-status-exit').click(function(evt) {
        if ($imagerStatus) $imagerStatus.dialog('close');
        $('#debug-status').removeClass('checked');
        localStorage['imagerDebugStatus'] = "FALSE";
      });
      $('#imager-messages-exit').click(function(evt) {
        $imagerMessages.hide();
        $('#debug-messages').removeClass('checked');
        localStorage['imagerDebugMessages'] = "FALSE";
      });
      $('#imager-info-exit').click(function(evt) {
        $imagerInfo.hide();
        $imagerEdit.hide();
        //$imagerEdit.hide();
        $('#view-info').removeClass('checked');
        localStorage['imagerShowInfo'] = "FALSE";
      });
      $('#imager-edit-exit').click(function(evt)  { $imagerEdit.hide(); });
      $('#imager-edit-apply').click(function(evt) { 
        $imagerEdit.hide(); 
        var out = '';
        var value = '';
        var format = '';
        switch (editFieldType) {
          case 'radios':
            var $elems = $('#imager-edit-content input');
            $elems.each(function (index,elem) {
              if (elem.checked) {
                value = elem.value;
                out += "#imager-edit-apply -- field=" + editField + "   value=" + value + "<br>";
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
            if (editor == "panopoly_wysiwyg_text") {
              id = Drupal.wysiwyg.activeId;
              value = tinyMCE.get(id).getContent();
            } else if (editor == 'full_html') {
              var $elems = $('#imager-edit-content textarea.form-textarea');
              $elems.each(function (index,elem) {
                value = $(elem).val();   // Last one wins - this is what we want
              });
            } else if (editor == 'plain_text') {
              var $elems = $('#imager-edit-content textarea.form-textarea');
              $elems.each(function (index,elem) {
                value = $(elem).val();   // Last one wins - this is what we want
              });
            }
            break;
          case 'date_combo':
            var $elems = $('#imager-edit-content input');
            var date;
            var time;
            $elems.each(function (index,elem) {
              var id = $(elem).attr('id');
              if (id.indexOf('datepicker') > -1) {
                date = $(elem).val();
              }
              if (id.indexOf('timepicker') > -1 || id.indexOf('timeEntry') > -1) {
                time = $(elem).val();
              }
            });
            value = date + ' ' + time;
//          alert('datetime  ' + date + '  ' + time);
            break;
          case 'hierarchical_select':
            var $elems = $('#imager-edit-content select');
            $elems.each(function (index,elem) {
              value = $(elem).val();   // Last one wins - this is what we want
            });
            break;
          case 'checkbox_tree':
            var $elems = $('#imager-edit-content input:checked');
            $elems.each(function (index,elem) {
              value = $(elem).val();   // Last one wins - this is what we want
            });
            break;
          default:
            alert('Unknown editFieldType ' + editFieldType);
            break;
        }
        $imagerBusy.show();
        displayMessage('Saving ...');
        processAjax(settings.actions.saveFileEntityField.url,
                    { action: 'save-file-entity-field',
                      field: editField,
                      fieldType: editFieldType,
                      value: value,
                      format: format,
                      uri: currImage['src'],
                    }, function(response) {
                         var status = response['status'];
                         getInfo();
                    }
                   );
        // extract value from popup, update database and re-render?
        // or do I re-render a single field.
      });
      $('#imager-message a').click(function(evt)  { evt.stopPropagation(); });

    // div#mode-buttons event handlers
      // click on #mode-view - set mode back to view=0
      $('#mode-view').click(function() {
        if (localStorage.quickView === "FALSE") {
          localStorage.quickView = "TRUE";
          $(this).addClass('checked');
          setViewMode(0);
        } else {
          localStorage.quickView = "FALSE";
          $(this).removeClass('checked');
          setViewMode(1);
        }
      });

      var toggleDialog = function(dialogName) {
        var $elem = $('.' + dialogName);
        if ($elem) {
          if ($elem.dialog("isOpen") === true) {
            $elem.dialog("close");
          }
          else {
            $elem.dialog("open");
            $elem.imagerInit();
          }
          $elem.imagerOpen();
        }
        else {
          processAjax(settings.actions.renderDialog.url,
                      { action: 'render-dialog',
                        dialogName: 'Config',
                      },
                      configDialog);
        }
      }

      var closeDialog = function($elem) {
        if ($elem) {
          $elem.dialog('close');
        }
      }

      $('#mode-configure').click(function() {
        if ($imagerConfig) {
          if ($imagerConfig.dialog("isOpen") === true) {
            $imagerConfig.dialog("close");
          }
          else {
            $imagerConfig.dialog("open");
            configInit();
          }
        }
        else { // Load the config dialog
          processAjax(settings.actions.renderDialog.url,
                      { action: 'render-dialog',
                        dialogName: 'Config',
                      },
                      configDialog);
        }
      });

      function configDialog(response) {
        var status = response['status'];
        $imagerWrapper.append(response['data']);
        $imagerConfig = $('#imager-config');
        configInit();
        $imagerConfig.dialog({
          autoOpen: true,
          title: 'Imager Configuration',
          zIndex: 1015,
          width: '50%',
          dialogClass: 'imager-dialog',
          id: 'imager-config-dialog',
          height: 'auto',
//          resize: 'auto',
          buttons: {
            Save: configSave,
            Cancel: function() {
              $(this).dialog("close");
            }
          },
          position: {
            my: "center center",
            at: "center center"
          }
        });
        $imagerConfig.dialog({draggable: false}).parent().draggable();
      }

      function configInit() {
        if (localStorage.imagerBoundsEnable === "TRUE") {
          $('#imager-bounds-enable').attr('checked','checked');
        }
        if (localStorage.imagerDebugStatus === "TRUE") {
          $('#imager-debug-status').attr('checked','checked');
        }
        if (localStorage.imagerDebugMessages === "TRUE") {
          $('#imager-debug-messages').attr('checked','checked');
        }
      }

      function configClose() {
//      if ($imagerConfig) $imagerConfig.dialog('close');
      }

      function configOpen() {
        if ($imagerConfig) {
          $imagerConfig.dialog('open');
        }
        else {
          configDialog();
        }
      }

      function configSave() {
        if ($('#imager-debug-status').attr('checked')) {
          localStorage.imagerDebugStatus = "TRUE";
          if ($imagerStatus) $imagerStatus.dialog('open');
          updateStatus();
        } else {
          localStorage.imagerDebugStatus = "FALSE";
//        if ($imagerStatus) $imagerStatus.dialog('close');
        }
        if ($('#imager-debug-messages').attr('checked')) {
          localStorage.imagerDebugMessages = "TRUE";
          $imagerMessages.show();
        } else {
          localStorage.imagerDebugMessages = "FALSE";
          $imagerMessages.hide();
        }
        if ($('#imager-bounds-enable').attr('checked')) {
          localStorage.imagerBoundsEnable = "TRUE";
        } else {
          localStorage.imagerBoundsEnable = "FALSE";
        }
        $imagerConfig.dialog("close");
      }
      

      // click on #mode-crop - set mode to edit=2
      $('#mode-crop').click(function() {
        if (viewMode == 2) {
          setViewMode(1);
        } else {
          setViewMode(2);
          setEditMode(0);
        }
        updateStatus();
      });

    // div#view-buttons event handlers
      $('#view-edit').click(function() {

      });
      $('#view-browser').click(function() {
//      displayMessage('Extracting Image...');
        $imagerBusy.show();
        var img = getImage($('image-cropped').val(),false);
//      displayMessage('Saving Image...');
        processAjax(settings.actions.viewBrowser.url,
                    { action: 'view-browser',
                      uri: currImage['src'],
                      imgBase64: img 
                    }, function (response) {
                      address = '';
                      path = response['data']['uri'];
                      window.open(path,'_blank');
                    });
      });
      $('#view-zoom-fit').click(function() {
        ptNowC.x = ptDownC.x
        ptNowC.y = ptDownC.y;
        zoom(0);
      });
      $('#view-zoom-1').click(function() {
        ptNowC.x = ptDownC.x
        ptNowC.y = ptDownC.y;
        zoom(0);
      });
      $('#view-zoom-in').click(function() {
        ptNowC.x = ptDownC.x
        ptNowC.y = ptDownC.y;
        zoom(1);
      });
      $('#view-zoom-out').click(function() {
        ptNowC.x = ptDownC.x
        ptNowC.y = ptDownC.y;
        zoom(-1);
      });
      $('#mode-fullscreen').click(function() {
        if (screenfull.enabled) {
          // We can use `this` since we want the clicked element
          screenfull.toggle($imagerWrapper[0]);
          if (fullScreen) {
            setFullScreen(false);
          } else {
            setFullScreen(true);
          }
        }
      });

      document.addEventListener(screenfull.raw.fullscreenchange, function () {
        setFullScreen(screenfull.isFullscreen);
        initializeImage();
        redraw();
        setViewMode(1);
      });

      $('#view-info').click(function() {
        if (localStorage.imagerShowInfo === "FALSE") {
          localStorage.imagerShowInfo = "TRUE";
          $(this).addClass('checked');
          getInfo();
        } else {
          localStorage.imagerShowInfo = "FALSE";
          $(this).removeClass('checked');
          $imagerInfo.hide();
          $imagerEdit.hide();
          //$imagerEdit.hide();
        }
      });

      $('#view-map').click(function() {
        if (localStorage.imagerShowMap === "FALSE") {
          localStorage.imagerShowMap = "TRUE";
          $(this).addClass('checked');
          getMap();
        } else {
          localStorage.imagerShowMap = "FALSE";
          $(this).removeClass('checked');
          $imagerMap.hide();
        }
      });
      $('#imager-map-exit').click(function(evt) {
        $imagerMap.hide();
        $('#view-map').removeClass('checked');
        localStorage['imagerShowMap'] = "FALSE";
      });
    // div#edit-buttons click event handlers
      // Edit Brightness/Contrast
      $('#edit-brightness').click(function()   { setEditMode((editMode == 1) ? 0 : 1); redraw();});
      $('#brightness-apply').click(function()  { applyBrightness();});
      $('#brightness-cancel').click(function() { setEditMode(0);  redraw();});
      $('#brightness-reset').click(function()  { resetBrightness();}); 
      // Edit Color
      $('#edit-color').click(function()        { setEditMode((editMode == 2) ? 0 : 2); redraw();});
      $('#color-apply').click(function()       { applyColor();});
      $('#color-cancel').click(function()      { setEditMode(0);  redraw();});
      $('#color-reset').click(function()       { resetColor();}); 
      // Rotatthumb
      $('#edit-ccw').click(function()          { rotate(-90); });
      $('#edit-cw').click(function()           { rotate(90); });
      // Crop
      $('#edit-crop').click(crop);
      $('#view-reset').click(function(evt)     { 
         changeImage(currImage); 
      });

      // brightness/contrast and HSL slider change events 
      $('#slider-contrast').change(function()   { adjustBrightness($imagerCanvas2,$imagerCanvas);});
      $('#slider-brightness').change(function() { adjustBrightness($imagerCanvas2,$imagerCanvas);});
      $('#slider-hue').change(function()        { adjustColor($imagerCanvas2,$imagerCanvas);});
      $('#slider-saturation').change(function() { adjustColor($imagerCanvas2,$imagerCanvas);});
      $('#slider-lightness').change(function()  { adjustColor($imagerCanvas2,$imagerCanvas);});

    // div#file-buttons click event handlers
      function initFileSave(saveMode,saveTitle,filename,message) {
        fileSaveMode = saveMode;
        $('#imager-filesave-email').hide();
        $('#imager-filesave-clipboard').hide();
        $('#imager-filesave-download').hide();
        $('#imager-filesave-new').hide();
        $('#imager-filesave-overwrite').hide();
        $('#imager-filesave-filename-container').hide();
        switch (saveMode) {
          case 'database':
            $('#imager-filesave-new').show();
            $('#imager-filesave-overwrite').show();
            $('#imager-filesave-filename-container').show();
            break;
          case 'email':
            $('#imager-filesave-email').show();
            $('#imager-filesave-filename-container').show();
            break;
          case 'clipboard':
            $('#imager-filesave-clipboard').show();
            break;
          case 'download':
            $('#imager-filesave-download').show();
            $('#imager-filesave-filename-container').show();
            break;
        }
        setViewMode(1);
        $('#imager-filesave-title').text(saveTitle);
        $('#imager-filesave-filename').val(filename);
        $('#imager-filesave-messages').html("<p>" + message + "</p>");
        $('#canvas-resolution').html(cw + 'x' + ch);
        $('#image-display-resolution').html(parseInt(ptCLrT.x - ptCUlT.x) + 'x' + parseInt(ptCLrT.y - ptCUlT.y));
        $('#image-full-resolution').html(iw + 'x' + ih);
        $('#scale').html(parseInt(cscale * 100) / 100);
        $imagerFilesave.show();
      };

    // click on save to database
      $('#file-database').click(function () {
        initFileSave('database',"Save image to database",decodeURIComponent(currImage['src']).replace(/^.*\/files\//),'');
      });

    // click on download
      $('#file-download').click(function () {
        initFileSave('download',"Download image to local file system",decodeURIComponent(currImage['src'].split('/').reverse()[0]),
                     'The download feature is under development.<br>It does not work in all browsers and is intermittent.');
      });

      $('#file-email').click(function () {
        initFileSave('email',"Email image",decodeURIComponent(currImage['src'].split('/').reverse()[0]),
                     'Email Image to somewhere');
      });

      $('#file-clipboard').click(function () {
        initFileSave('clipboard','Send image to clipboard','image.png',
                     'The clipboard feature is under development.<br>It does not work in all browsers.');
      });

      $('#imager-filesave-new').click(function () {
        saveFile(false);
      });
      $('#imager-filesave-overwrite').click(function () {
        saveFile(true);
      });
      $('#imager-filesave-download').click(function () {
        saveFile(false);
      });
      $('#imager-filesave-clipboard').click(function () {
        $imagerCanvas.select();
        displayMessage('Sending the image to the clipboard is under construction');
      });
      $('#imager-filesave-email').click(function () {
        saveFile(false);
        $imagerBusy.hide();
        $imagerFilesave.hide();
      });
      $('#imager-filesave-cancel').click(function () {
        $imagerFilesave.hide();
        redraw();
      });
      $('#file-delete').click(function () {
        confirmMode = 'deleteFile';
        $('#imager-confirm-content').html('<h4>Are you sure you want to permanently delete this image?</h4>');
        $imagerConfirm.show();
      });

      $('#imager-confirm-apply').click(function () {
        switch (confirmMode) {
          case 'deleteFile': 
            deleteFile();
            hidePopups();
            break;
        }
      });
      $('#imager-confirm-exit').click(function () {
        $imagerConfirm.hide();
      });
    }   // function initEvents()


    function initThumbEvents() {
      $imgs = [];
      nimgs = 0;

      $thumbnails   = $(settings.cssContainer);
      if ($thumbnails.length == 0) return; // No thumbnails found, exit 
      
      $thumbnails.each(function(index,value) {
        // Add image to imgs array
        var $thumb = $(this).find(settings.cssImage);
        imgs[nimgs] = {};
        imgs[nimgs]['container'] = $(this);
        imgs[nimgs]['thumb'] = $thumb;
        imgs[nimgs]['tsrc'] = $thumb.attr('src');
        imgs[nimgs]['src'] = getFullPath($thumb.attr('src'))
        nimgs++;

        // Unbind any current event handlers on thumbnails
        $thumb.parent().unbind('click');

        // User clicks in thumbnail image
        $thumb.click(function(evt) {
          currImage = findImageFromThumbSrc($thumb.attr('src'));
          if (viewMode == 1) {   // if the viewer is locked, select this image
            changeImage(currImage);
          } else {               // if the viewer is not locked, then lock it?
            setViewMode(1);
            updateStatus();
          }
          evt.stopPropagation();
          return false;
        });

        // mouse enters thumbnail image
        // un-hide div#imager-viewer and display new image
        
        var version = $().jquery;
        var crap = version;
  /*      $(this).hoverIntent({   // hoverIntent requires at least jQuery 1.7
          over: function(evt) {
            if (viewMode > 0) return false;
            currImage['src'] = getFullPath(this);
            setViewMode((localStorage.quickView === "TRUE") ? 0 : 1);
            changeImage(currImage['src']);
          },
          out: function(evt) {
            if (viewMode > 0) return false;
            var el = evt.relatedTarget ? evt.relatedTarget : evt.toElement;
            var el1 = $(el).closest('#imager-viewer');
            var el2 = $(el).closest('#imager-info');
            var el3 = $(el).closest('#imager-status');
            var el4 = $(el).closest('#imager-map');
            var el5 = $(el).closest('#imager-messages');
            var el6 = $(el).closest('#imager-confirm');
            if (el === $imagerViewer[0] || 
                el1.length || 
                el2.length || 
                el3.length || 
                el4.length || 
                el5.length || 
                el6.length) {
    //        console.debug("image mouseleave image has focus");
            } else {
              hidePopups();
              updateStatus();
    //        console.debug("image mouseleave image doesn't have focus ");
            }
          },
          sensitivity: 2,
          interval: 50
        });   // thumbnail.hoverIntent */
      });  // thumbnails.each()
    }

/**
 * Given the path to a thumbnail determine the path of the full image
 * 
 * If '/styles/' is part of the path then simply remove /styles/ 
 * and the next two path components.
 * Otherwise look for the parent element to be a link to the full image.
 *
 * @param {type} thumbnail
 * 
 * @returns path to full image
 */
    function getFullPath(tsrc) {
      var src;
      // If the image has "/styles/" in it's path
      // then create the large image path by modifying the thumbnail path
      if (tsrc.indexOf('/styles/')) {
        var sindex = tsrc.indexOf('styles');
        var index = sindex;
        var slashes = 0;
        while (slashes < 3) {
           index++;
           if (tsrc.charAt(index) == '/') { 
             slashes++;
           }
        }
        var tindex = tsrc.indexOf('?itok');
        if (tindex) {
          src = tsrc.substr(0,sindex) + tsrc.substr(index + 1, tindex - index - 1);
        } else {
          src = tsrc.substr(0,sindex) + tsrc.substr(index + 1);
        }
      } else if ($(thumbnail).parent().attr('href')) {
        src = $(thumbnail).parent().attr('href');
      }
      return src;
    }

/**
 * Create a Data URI from the current image. 
 * 
 * @param {boolean} stream
 * 
 * @returns {Data URI - image is embedded}
 */
    function getImage(stream) {
      var img;
      var pt;
      var mimeType = "";
      if (currImage['src'].match(/\.png$/i)) {
        mimeType = "image/png";
      } else if (currImage['src'].match(/\.jpe*g$/i)){
        mimeType = "image/jpeg";
      }
      switch (imageResMode = $('input[name="resolution"]:checked').val()) {
        case 'screen':
          img = $imagerCanvas[0].toDataURL(mimeType);
          break;
        case 'image-cropped':
          ctx2.setTransform(1,0,0,1,0,0);
          var ncw;
          var nch;
          if (rotation == 0 || rotation == 180) {
            ncw = Math.abs(ptCLrT.x-ptCUlT.x),
            nch = Math.abs(ptCLrT.y-ptCUlT.y),
            $imagerCanvas2.attr({width:  ncw,      // Set canvas to same size as image
                                 height: nch});
            if (rotation == 0)  {
//            ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(0,0);
              ctx2.drawImage(cimg,-pt.x,
                                  -pt.y);

            } else { // rotation == 180
              ctx2.translate(ncw,nch);
              ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(cw,ch);
              ctx2.drawImage(cimg,-pt.x,
                                  -pt.y);
            }
          } else {
            ncw = Math.abs(ptCLrT.y-ptCUlT.y),
            nch = Math.abs(ptCLrT.x-ptCUlT.x),
            $imagerCanvas2.attr({width:  ncw,      // Set canvas to same size as image
                                 height: nch});
            if (rotation == 90) {
              ctx2.translate(ncw,0);
              ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(cw,0);   // Find Upper left corner of canvas in original image
              ctx2.drawImage(cimg,-pt.x,   // parseInt(pt1.x),
                                  -pt.y);  // parseInt(pt2.y),
            } else {
              ctx2.translate(0,nch);
              ctx2.rotate(angleInRadians(rotation));
              pt = ctx.transformedPoint(0,ch);   // Find Upper left corner of canvas in original image
              ctx2.drawImage(cimg,-pt.x,
                                  -pt.y);
            }
          }
          img = $imagerCanvas2[0].toDataURL(mimeType);
          break;
        case 'image-full':
          var tcw;
          var tch;
          ctx2.setTransform(1,0,0,1,0,0);
          if (rotation == 0 || rotation == 180) {
            tcw = iw;
            tch = ih
            $imagerCanvas2.attr({width:  tcw,      // Set canvas to same size as image
                                 height: tch});
            if (rotation == 180)  {
              ctx2.translate(iw,ih);
            }
          } else {
            tcw = ih;
            tch = iw
            $imagerCanvas2.attr({width:  tcw,      // Set canvas to same size as image
                                 height: tch});
            if (rotation == 90) {
              ctx2.translate(ih,0);
            } else {
              ctx2.translate(0,iw);
            }
          }
          ctx2.rotate(angleInRadians(rotation));
          ctx2.drawImage(cimg,0,0);                 // Copy full image into canvas
          img = $imagerCanvas2[0].toDataURL(mimeType);
          break;
      }
      if (stream) {
        img.replace(mimeType, "image/octet-stream");
      }
      return img;
    };

    function saveFile(overwrite) {
      displayMessage('Extracting Image...');
      $imagerBusy.show();
      var img = getImage($('input[name="resolution"]:checked').val(),false);
      displayMessage('Saving Image...');
      switch (fileSaveMode) {
        case 'database':
          processAjax(
            settings.actions.saveFile.url,
            { overwrite: overwrite,
              action: 'save-file',
              saveMode: fileSaveMode,
              uri: currImage['src'],
              imgBase64: img 
            }, function (response) {
              if (response['file_new']) {
                currImage['container'].after(response['file_new']);
                // @TODO The two unwrap are hardcoded to remove two extra divs.  
                // Can this be done in PHP when it is rendered.
                // Maybe a Views tpl.php file.
                var $row = currImage['container'].next().find(settings.cssContainer);
                $row.unwrap().unwrap();
              }
              if (response['file_old']) {
                currImage['container'].html(response['file_old']);
                // @TODO - The following code is ugly, 
                // Views wraps a couple extra divs around the output.
                // The following code removes those divs so just 
                // .views-row remains and everything below it remains.
                var $row = currImage['container'].find(settings.cssContainer).child();
                while (currImage['container'][0] != $row.parent()[0]) {
                  $row.unwrap();
                }
              }
              Drupal.attachBehaviors($row);
            }
          );
          break;
        case 'email':
          processAjax(settings.actions.emailFile.url,
            { action: 'email',
              saveMode: fileSaveMode,
              uri: currImage['src'],
              imgBase64: img 
            }, function (response) {
              address = '';
              path = response['data']['attachPath'];
              body = response['data']['body'];
              subject = response['data']['subject'];
              var mailto_link = 'mailto:' + address + 
                                '?subject=' + encodeURIComponent(subject) + 
                                '&body=' + body +
                                '&attachment=' + path;

              window.location.href = mailto_link;
            }
          );
          break;
        case 'clipboard':
          processAjax(
            settings.actions.clipboard.url,
            { overwrite: overwrite,
              action: 'clipboard',
              saveMode: fileSaveMode,
              uri: currImage['src'],
              imgBase64: img 
            }
          );
          break;
        case 'download':
          $('#imager-filesave-download')
            .attr({ 'href': img,
                    'download': $('#imager-filesave-filename').val(),
                 });
          break;
      }
      $imagerBusy.hide();
      $imagerFilesave.hide();
    };

    function deleteFile() {
      displayMessage('Deleting Image...');
      processAjax(
        settings.actions.deleteFile.url,
        { action: 'delete-file',
          uri: currImage['src'],
        }
      );
    }



/**
* Track the history of transforms done to this image.
* 
* @param {type} ctx
*/
    function trackTransforms(ctx){
      var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
      var xform = svg.createSVGMatrix();
  //  ctx.getTransform = function(){ return xform; };
      
      var savedTransforms = [];
      var save = ctx.save;
      ctx.save = function(){
        savedTransforms.push(xform.translate(0,0));
        return save.call(ctx);
      };
      var restore = ctx.restore;
      ctx.restore = function(){
        xform = savedTransforms.pop();
        return restore.call(ctx);
      };

      pt  = svg.createSVGPoint();
      ctx.transformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
      }

      var scale = ctx.scale;
      ctx.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(ctx,sx,sy);
      };
      var translate = ctx.translate;
      ctx.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(ctx,dx,dy);
      };
      var rotate = ctx.rotate;
      ctx.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(ctx,radians);
      };
  //  var transform = ctx.transform;
  //  ctx.transform = function(a,b,c,d,e,f){
  //  var m2 = svg.createSVGMatrix();
  //    m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
  //    xform = xform.multiply(m2);
  //    return transform.call(ctx,a,b,c,d,e,f);
  //  };
      var clearHistory = ctx.clearHistory;
      ctx.clearHistory = function(){
        savedTransforms = [];
      };
      var setTransform = ctx.setTransform;
      ctx.setTransform = function(a,b,c,d,e,f){
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx,a,b,c,d,e,f);
      };
    };   // trackTransforms

/**
* Process all AJAX requests.
* 
* @todo Drupal probably has an API for this.
* 
* @param {type} postData
* @param {type} processFunc
*/
    function processAjax(url,postData,processFunc) {
      postData['filePath']   = settings.filePath;
//      if (localStorage['imagerDebugMessages'] === "TRUE") {
//        $imagerMessages.append("<h2>Process action: " + postData.action + "</h2>" +
//          "<div>" + JSON.stringify(postData).substr(1,256) + "</div>\n");
//      }
      $.ajax({
        type: "POST",
        url:   url, 
        data: postData, 
        async: false,
        success: function (response_json) {
          clearTimeout(messageTimeout);
          $imagerBusy.hide();
          var response = JSON.parse(response_json);
          var display = false;
          var out = [];
          out = "<h2>" + response['action'] + ':' + response['status'] + "</h2>";
          if (response['info']) {
            out += "<div class='info'>"  + response['info'] + "</div>";
            display = true;
          }
          if (response['status'] === 'catch' || 
              (response['debug'] && localStorage['imagerDebugMessages'] === "TRUE"))  {
            out += "<div class='debug'>" + response['debug'] + "</div>";
            display = true;
          }

          if (display) {
            $imagerMessages.show();
            $('#imager-messages-content').html(out);
          }
          if (processFunc) processFunc(response);   // Execute users function
          if (localStorage['imagerDebugMessages'] === "FALSE") {
            setTimeout(function() {
              $imagerMessages.hide();
            },3000);
          }
        },
        error: function(evt) {
          $imagerBusy.hide();
          clearTimeout(messageTimeout);
          $imagerMessages.show();
          $('#imager-messages-content').html('<p class="error">Error: ' + evt.status + ': ' + evt.statusText + 
                                             '<br>Action: ' + postData.action + '</p>');
          if (processFunc) processFunc(response,evt);   // Execute users error function
          if (localStorage['imagerDebugMessages'] === "FALSE") {
            setTimeout(function() {
              $imagerMessages.hide();
            },10000);
          }
        },
      });
    }; // processAjax()

    return {
      init:   _init,
      attach: _attach,
    };
  };
})(jQuery);
