/*
 * imager.js - JQuery library to hover over thumbnails and popup full size image viewer.  
 *   - Users can edit image and store them
 *       Rotate, Crop, Zoom, Pan, Brightness/Contrast, Hue/Saturation/Lightness
 *       Next Image, Previous Image, Full Screen, Download, Save Image
 */

(function ($) {
  Drupal.behaviors.imager = {
    attach: function (context,settings) {
      var $thumbnails   = $(Drupal.settings.imager.cssSelector);
      if ($thumbnails.length == 0) return; // No thumbnails found, exit 

      var modulePath  = Drupal.settings.imager.modulePath;   // Path to the imager module

      var $imagerWrapper;    // Wrapper around all imager html divs
      var $imagerOverlay;    // Div containing the popup image and buttons
      var $imagerCanvas;     // canvas with current displayed image
      var $imagerCanvas2;    // canvas with original full image - never shown
      var $imagerInfo;       // popup for displaying text information
      var $imagerEdit;       // popup for displaying text information
      var $imagerBrightness; // brightness slider popup
      var $imagerColor;      // hsl color slider popup
      var $imagerStatus;     // Status or debug popup
      var $imagerMessages;   // Debug response debug popup
      var $imagerFilesave;   // Debug response debug popup
      var ias;            // imgAreaSelect instance
      var ctx;            // canvas context
      var ctx2;           // canvas context of original unshown image

      var cimg = document.createElement('IMG');
      var imgs = [];      // file paths and titles of all matched images on page
      var nimgs = 0;      // number of images
      var imagerSrc = '';    // src path for current image
      var imagerTitle = '';  // Image title from attr data-title
      var viewMode = 0;     // 0 - #mode-view, 1 - #mode-edit, 2 - #mode-crop
      var editMode = 0;     // 0 - none, 1 - brightness/contrast, 2 - color (hsl)
      var elapsed = 0;      // # elapsed msec since last mouse up
      var fullScreen = 0;

      var mw;  // Maximum canvas width
      var mh;  // Maximum canvas height

      var cw;  // Canvas width
      var ch;  // Canvas height

      var iw;  // Actual Image width
      var ih;  // Actual Image height

      var vw;  // Image viewport width
      var vh;  // Image viewport height

      var rotation;  // 0, 90, 180, 270 
      var scaleFactor = 1.04;
      var cscale;
      var dragging = false;
      var distance;
      var lastup = new Date();  // time of last mouseup event
      var brightness = 0;
      var contrast = 1;
      var hue = 0;
      var lightness = 0;
      var saturation = 0;

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

      init();
      trackTransforms(ctx);  // Create transform history
      enablePanZoom();

      function init() {
        // append #page the #imager-overlay and #imager-messages-response div's
        $('#page').append(' \
           <div id="imager-wrapper"> \
             <div id="imager-results"></div> \
             <div id="imager-overlay" class="hide"> \
               <div id="button-wrapper"> \
                 <div id="image-buttons" class="buttons"> \
                   <div>Image</div> \
                   <img title="View image to the left" alt="" id="image-left"  src="' + modulePath + '/icons/left_arrow.png"> \
                   <img title="View image to the right" alt="" id="image-right" src="' + modulePath + '/icons/right_arrow.png"> \
                   <img title="Exit image popup" alt="" id="image-exit" src="' + modulePath + '/icons/exit.png"> \
                 </div> \
                 <div id="mode-buttons" class="buttons"> \
                   <div>Mode</div> \
                   <img title="View Image" alt="" id="mode-view"   class="checked" src="' + modulePath + '/icons/eye.png"> \
                   <img title="Edit Image - locked" alt="" id="mode-lock"   src="' + modulePath + '/icons/lock.png"> \
                 </div> \
                 <div id="view-buttons" class="buttons"> \
                   <div>View</div> \
                   <img title="View description of this image" alt="" id="view-info" src="' + modulePath + '/icons/information.png"> \
                   <img title="View full screen" alt="" id="view-fullscreen"   src="' + modulePath + '/icons/fullscreen.png"> \
                   <img title="Zoom In"  alt="" id="view-zoom-in"    src="' + modulePath + '/icons/zoomin.png"> \
                   <img title="Zoom Out" alt="" id="view-zoom-out"  src="' + modulePath + '/icons/zoomout.png"> \
                 </div> \
                 <div id="edit-buttons" class="buttons"> \
                   <div>Edit</div> \
                   <img title="Start crop - select area" alt="" id="mode-crop" src="' + modulePath + '/icons/frame.png"> \
                   <img title="Crop selected area" alt="" id="edit-crop" src="' + modulePath + '/icons/scissors.png"> \
                   <img title="Brightness/Contrast" alt="" id="edit-brightness" src="' + modulePath + '/icons/contrast.png"> \
                   <img title="Adjust Color" alt="" id="edit-color" src="' + modulePath + '/icons/color_wheel.png"> \
                   <img title="Rotate image 90 degrees counter-clockwise" alt="" id="edit-left"   src="' + modulePath + '/icons/rotate-left.png"> \
                   <img title="Rotate image 90 degrees clockwise" alt="" id="edit-right"  src="' + modulePath + '/icons/rotate-right.png"> \
                   <img title="Reset Image"  alt="" id="view-reset" src="' + modulePath + '/icons/reset.png"> \
                 </div> \
                 <div id="file-buttons" class="buttons"> \
                   <div>File</div> \
                   <img title="Email image" alt="" id="file-email" class="disabled" src="' + modulePath + '/icons/mail.png"> \
                   <img title="Send image to clipboard" alt="" id="file-clipboard" class="disabled" src="' + modulePath + '/icons/clipboard.png"> \
                   <img title="Download original image to your computer" alt="" id="file-download" src="' + modulePath + '/icons/download.png"> \
                   <img title="Save edited image" alt="" id="file-save" src="' + modulePath + '/icons/floppy.png"> \
                   <img title="Delete image" alt="" id="file-delete" src="' + modulePath + '/icons/delete.png"> \
                 </div> \
                 <div id="debug-buttons" class="buttons"> \
                   <div>Debug</div> \
                   <img title="Toggle status output" alt="" id="debug-status" src="' + modulePath + '/icons/bug.png">\
                   <img title="Toggle debug messages" alt="" id="debug-messages" src="' + modulePath + '/icons/bug2.png"> \
                 </div> \
               </div> \
               <div id="imager-canvas-wrapper"> \
                 <canvas id="imager-canvas"></canvas> \
               </div>  \
             </div>  \
             <div id="imager-brightness" class="hide"> \
               <table class="imager-sliders"> \
                 <tr> \
                   <td>Brightness</td> \
                   <td><input id="slider-brightness" class="slider" type="range" min="-100" max="100" step="1" /></td> \
                 </tr> \
                 <tr> \
                   <td>Contrast</td> \
                   <td><input id="slider-contrast"   class="slider" type="range" min="-100" max="100" step="1" /></td> \
                 </tr> \
               </table> \
               <button id="brightness-apply">Apply</button> \
               <button id="brightness-reset">Reset</button> \
               <button id="brightness-cancel">Cancel</button> \
             </div> \
             <div id="imager-color" class="hide"> \
               <table class="imager-sliders"> \
                 <tr> \
                   <td>Hue</td> \
                   <td><input id="slider-hue"        class="slider" type="range" min="-180" max="180" step="1" /></td> \
                 </tr> \
                 <tr> \
                   <td>Saturation</td> \
                   <td><input id="slider-saturation" class="slider" type="range" min="-100" max="100" step="1" /></td> \
                 </tr> \
                 <tr> \
                   <td>Lightness</td> \
                   <td><input id="slider-lightness" class="slider" type="range" min="-100" max="100" step="1" /></td> \
                 </tr> \
               </table> \
               <button id="color-apply">Apply</button> \
               <button id="color-reset">Reset</button> \
               <button id="color-cancel">Cancel</button> \
             </div> \
             <div id="imager-filesave" class="hide"> \
               <div class="title">Save file: <span id="save-file-name">bogus</span></div> \
               <table id="resolution"> \
                 <tr><td><input type="radio" name="resolution" value="screen"></td> \
                     <td>Screen</td> \
                     <td id="canvas-resolution"></td> \
                     <td id="scale" rowspan="2"></td></tr> \
                 <tr><td><input type="radio" name="resolution" value="image-cropped" disabled> \
                     </td><td>Displayed Image</td> \
                     <td id="image-display-resolution"></td></tr> \
                 <tr><td><input type="radio" name="resolution" value="image-full" checked="checked"></td> \
                     <td>Full Image</td> \
                     <td id="image-full-resolution"> \
                     </td><td></td></tr> \
               </table> \
               <button id="file-save-new">New File</button> \
               <button id="file-save-overwrite">Overwrite</button> \
               <button id="file-save-cancel">Cancel</button> \
             </div> \
             <div id="imager-status" class="hide"></div> \
             <div id="imager-info" class="hide"> \
               <div id="imager-info-content"></div> \
               <div id="imager-info-buttons">  \
                 <img title="Exit popup" alt="" id="imager-info-exit" src="' + modulePath + '/icons/exit.png"> \
               </div> \
             </div> \
             <div id="imager-edit" class="hide"> \
               <div id="imager-edit-content"></div> \
               <div id="imager-edit-buttons">  \
                 <img title="Apply and exit" alt="" id="imager-edit-apply" src="' + modulePath + '/icons/checkmark.png"> \
                 <img title="Exit popup" alt="" id="imager-edit-exit" src="' + modulePath + '/icons/exit.png"> \
               </div> \
             </div> \
             <div id="imager-messages" class="hide"></div> \
             <canvas id="imager-canvas-org"></canvas> \
             <img alt="" id="imager-busy" src="' + modulePath + '/icons/busy.gif"> \
           </div>');
        
    // Additional buttons for above, saved here
    //   <img title="Zoom to fit" alt="" id="zoom-fit" class="disabled" src="icons/zoom.png"><br> \
    //   <img title="Zoom 1:1" alt="" id="zoom-1"      src="icons/zoom1.png"><br> \
    //   <img title="Scale" alt="" id="edit-scale"  src="icons/scale.png"><br> \

        $imagerWrapper    = $('#imager-wrapper');
        $imagerOverlay    = $('#imager-overlay');
        $imagerCanvas     = $('#imager-canvas');
        $imagerCanvas2    = $('#imager-canvas-org');
        $imagerInfo       = $('#imager-info');
        $imagerEdit       = $('#imager-edit');
        $imagerBrightness = $('#imager-brightness');
        $imagerColor      = $('#imager-color');
        $imagerStatus     = $('#imager-status');
        $imagerMessages   = $('#imager-messages');
        $imagerFilesave   = $('#imager-filesave');
        ctx  = $imagerCanvas[0].getContext('2d');
        ctx2 = $imagerCanvas2[0].getContext('2d');           
        ias = $('#imager-canvas').imgAreaSelect({
          instance: true,
          disable: true,
          handles: true,
          autoHide: false,
          hide: true,
          show: true,
        });
        if (localStorage.imgShowInfo     === "TRUE") {
          $('#view-info').addClass('checked');
          $imagerInfo.removeClass('hide');
        }
        if (localStorage.imgShowStatus   === "TRUE") {
          $('#debug-status').addClass('checked');
          $imagerStatus.removeClass('hide');
        }
        if (localStorage.imgShowDebug === "TRUE") {
          $('#debug-messages').addClass('checked');
          $imagerMessages.removeClass('hide');
        }
        $('#imager-busy').hide();
      };

      var updateStatus = function() {
        ptCUlT = ctx.transformedPoint(0,0);
        ptCLrT = ctx.transformedPoint(cw,ch);
        if (localStorage.imgShowStatus === "FALSE") return;
        $imagerStatus.html(
          '<div>Image file: ' + decodeURIComponent(imagerSrc.split('/').reverse()[0]) + '</div>' +
          '<span>' +
            '<table>' +
              '<tr><th>Name</th><th>Value</th></tr>' +
              '<tr><td>View Mode</td><td>'   + viewMode + '</td></tr>' +
              '<tr><td>Edit Mode</td><td>'   + editMode + '</td></tr>' +
              '<tr><td>Full Screen</td><td>' + fullScreen + '</td></tr>' +
              '<tr><td>Distance</td><td>'    + parseInt(distance) + '</td></tr>' +
              '<tr><td>Elapsed</td><td>'     + elapsed/1000 + '</td></tr>' +
              '<tr><td>Zoom</td><td>'        + parseInt(cscale*100)/100 + '</td></tr>' +
              '<tr><td>Rotation</td><td>'    + rotation + '</td></tr>' +
              '<tr><td>Brightness</td><td>'  + brightness + '</td></tr>' +
              '<tr><td>Contrast</td><td>'    + contrast + '</td></tr>' +
              '<tr><td>Hue</td><td>'         + parseInt(hue*100)/100 + '</td></tr>' +
              '<tr><td>Saturation</td><td>'  + parseInt(saturation*100)/100 + '</td></tr>' +
              '<tr><td>Lightness</td><td>'   + parseInt(lightness*100)/100 + '</td></tr>' +
            '</table>' +
          '</span>' +
          '<span>' +
            '<table>' +
              '<tr><th>Name</th><th>Width</th><th>Height</th></tr>' +
              '<tr><td>Maximum Canvas</td><td>'   + parseInt(mw) + '</td><td>' + parseInt(mh) + '</td></tr>' +
              '<tr><td>Actual Canvas</td><td>'    + parseInt(cw) + '</td><td>' + parseInt(ch) + '</td></tr>' +
              '<tr><td>Displayed Image</td><td>'  + parseInt(ptCLrT.x-ptCUlT.x) + '</td><td>' + parseInt(ptCLrT.y-ptCUlT.y) + '</td></tr>' +
              '<tr><td>Full Image</td><td>'+ iw + '</td><td>' + ih + '</td></tr>' +
            '</table>' +
          '</span>' +
          '<span>' +
            '<table>' +
              '<tr><th>Name</th><th>X</th><th>Y</th></tr>' +
              '<tr><td>Mouse Now</td><td>'     + parseInt(ptNowC.x) + '</td><td>'  + parseInt(ptNowC.y) + '</td></tr>' +
              '<tr><td>Mouse Now Tx</td><td>'  + parseInt(ptNowT.x) + '</td><td>'  + parseInt(ptNowT.y) + '</td></tr>' +
              '<tr><td>Mouse Down</td><td>'    + parseInt(ptDownC.x) + '</td><td>' + parseInt(ptDownC.y) + '</td></tr>' +
              '<tr><td>Mouse Down Tx</td><td>' + parseInt(ptDownT.x) + '</td><td>' + parseInt(ptDownT.y) + '</td></tr>' +
              '<tr><td>Upper Left Canvas Tx</td><td>'    + parseInt(ptCUlT.x)   + '</td><td>' + parseInt(ptCUlT.y)   + '</td></tr>' +
              '<tr><td>Lower Right Canvas Tx</td><td>'   + parseInt(ptCLrT.x)   + '</td><td>' + parseInt(ptCLrT.y)   + '</td></tr>' +
            '</table>' +
          '</span>'
        );
      };

      // Change the current image in #image-overlay
      /**
       * 
       * @param {type} src
       * @param {type} evt
       * @returns {undefined}
       */
      var changeImage = function(src,evt) {
        imagerSrc = src;
        cimg.src = src;   // This begins loading the image - upon completion load event is fired
        $('#imager-busy').show();
      }

      var initializeImage = function() {
        iw = cimg.width;
        ih = cimg.height;
        if (fullScreen) {
          mw = $(window).width()  - 70; // Maximum canvas width
          mh = $(window).height() - 20; // Maximum canvas height
          cw=mw;
          ch=mh;
          hscale = ch/ih;
          vscale = cw/iw;
          cscale = (hscale < vscale) ? hscale : vscale;
        } else {
          mw = $(window).width()  - 100; // Maximum canvas width
          mh = $(window).height() - 20; // Maximum canvas height
          calcCanvasDims(iw,ih);
          cscale = cw/iw;
        }
        ptDownC.x = cw/2;    // Just in case 
        ptDownC.y = ch/2;
        $imagerCanvas.attr({width:  cw,
                         height: ch});
    //  setViewMode(0);
        setEditMode(0);
        ptNowC.x=0;    
        ptNowC.y=0;
        ctx.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
        ctx.clearRect(0,0,cw,ch);        // Clear the canvas
        rotation = 0;
        scale(cscale);                          // Set initial scaling to fit
      }

      // When image is loaded - load event is fired
      cimg.addEventListener('load', function () {
        $('#imager-busy').hide();
        initializeImage();
    //  var nimg = Pixastic.process(cimg,"desaturate");
        redraw();                                        // Draw the image
        $imagerOverlay.removeClass('hide');               // Hide the image overlay 
        if (localStorage.imgShowInfo === "TRUE") getInfo();                                       //
      }, false);
     
      var redraw = function(){
        ptCUlT = ctx.transformedPoint(0,0);
        ptCLrT = ctx.transformedPoint($imagerCanvas[0].width,$imagerCanvas[0].height);
        cscale = cw / (ptCLrT.x - ptCUlT.x);
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
          $imagerCanvas.attr({width:  cw,
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
            ctx.rotate(angleInRadians(rotation));
          } else {
            ctx.translate(0,ch);
            ctx.rotate(angleInRadians(rotation));
          }
        }
        ctx.scale(cscale,cscale);
        redraw();
        $imagerOverlay.removeClass('hide');
      };

      var angleInRadians = function(deg) {
        return deg * Math.PI / 180;
      };
      
      var zoom = function(clicks){
        scale(Math.pow(scaleFactor,clicks));
        redraw();
      };

      var scale = function(factor) {
        ptNowT = ctx.transformedPoint(ptNowC.x,ptNowC.y);
        ctx.translate(ptNowT.x,ptNowT.y);
        ctx.scale(factor,factor);
        ctx.translate(-ptNowT.x,-ptNowT.y);
      };

    /*
     * adjustBrightness($cvssrc,$cvsdst)
     */
      var adjustBrightness = function($cvssrc,$cvsdst) {
        brightness = parseInt($('#slider-brightness').val());
        contrast   = parseInt($('#slider-contrast').val())/100;

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
        $('#slider-brightness').val(brightness);
        $('#slider-contrast').val(contrast);
        adjustBrightness($imagerCanvas2,$imagerCanvas);
        updateStatus();
      }

      var applyBrightness = function() {
        $('#imager-busy').show();
        $imagerCanvas2.attr({width:  iw,       // Set canvas to same size as image
                         height: ih});
        ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
        ctx2.drawImage(cimg,0,0);         // Copy full image into canvas

        adjustBrightness($imagerCanvas2,$imagerCanvas2);
        cimg.src = $imagerCanvas2[0].toDataURL(); 
        redraw();
        setEditMode(0);
        $('#imager-busy').hide();
      }

      var adjustColor = function($cvssrc,$cvsdst) {
        hue        = parseInt($('#slider-hue').val() * 100)/100;
        saturation = parseInt($('#slider-saturation').val() * 100)/9000;
        lightness = parseInt($('#slider-lightness').val() * 100)/10000;

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
        $('#imager-busy').show();
        $imagerCanvas2.attr({width:  iw,     // Set image to be full size
                            height: ih});
        ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
        ctx2.drawImage(cimg,0,0);         // Copy full image into canvas

        adjustColor($imagerCanvas2,$imagerCanvas2);
        cimg.src = $imagerCanvas2[0].toDataURL(); 
        redraw();
        setEditMode(0);
        $('#imager-busy').hide();
      }

    /*
     * crop()
     */
      function crop() {
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
      }
      // check if panning or zooming is causing image to to leave a margin at edges
      // Work in progress, currently does nothing
      var outOfBounds = function(evt) {
        ptCUlT = ctx.transformedPoint(0,0);
        ptCLrT = ctx.transformedPoint(cw,ch);
        if (ptCUlT.x < 0) {
        }
        if (ptCUlT.y < 0) {
        }
        if (ptCLrT.x < 0) {
        }
        if (ptCLrT.y < 0) {
        }
        return undefined;
      };

/**
 * 
 * @returns {undefined}
 */
      function getInfo() {
//      var out = [];
//      out.push({name: 'filename', value: imagerSrc});
        
        processAjax({ action: 'display-entity',
                      uri: imagerSrc,
                      viewMode: Drupal.settings.imager.viewMode,
                    },function(response) {
          var status = response['status'];
          var txt = "";
//        txt  = "<div class='title'>" + imagerTitle + "</div>";
//        txt += "<div class='filename'>" + imagerSrc + "</div>";
          $imagerInfo.removeClass('error').removeClass('hide');
          if (response['data']) {
            $('#imager-info-content').html(response['data']);
            $('.imager-info-edit').click(function (evt) {
              var $field = this.id.replace('imager-','');
              processAjax({ action: 'edit-form-field-load',
                            uri: imagerSrc,
                            field: $field,
                          },function(response) {
                var status = response['status'];
                var txt = "";
      //        txt  = "<div class='title'>" + imagerTitle + "</div>";
      //        txt += "<div class='filename'>" + imagerSrc + "</div>";
                $imagerEdit.removeClass('hide');
                if (response['data']) {
                  $('#imager-edit-content').html(response['data']);
                }
              });
            });
          }
        });
      }

      /**
       * 
       * @param {type} evt
       * @returns {undefined}
       */
      function mouseDown (evt){
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        ptDownC.x = evt.offsetX || (evt.pageX - $imagerCanvas[0].offsetLeft);
        if (evt.offsetY) {              // This is kludgy, pageY work intermittently, I think it's
                                               // because the div has position: fixed and is out of sequence
          ptDownC.y = evt.offsetY || (evt.pageY - $imagerCanvas[0].offsetTop);
        } else {
          ptDownC.y = evt.layerY + $imagerCanvas[0].offsetTop;  // This works for me, I'm not sure the calc is correct
        }
        ptDownT = ctx.transformedPoint(ptDownC.x,ptDownC.y);
        dragging = true;
        distance = 0;
        updateStatus();
      };

/**
 * 
 * @param {type} evt
 * @returns {undefined}
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
    //    ctx.save();
          ctx.translate(ptNowT.x-ptDownT.x,ptNowT.y-ptDownT.y);
    //    var npt;   // recommended x and y motions that won't go out of bounds
    //    if (npt = outOfBounds(evt)) {
    //      ctx.restore();
    //      ctx.translate(npt.x-ptDownT.x,npt.y-ptDownT.y);
    //    }
          redraw();
        }
        updateStatus();
      }

/**
 * 
 * @param {type} evt
 * @returns {undefined}
 */
      function mouseUp(evt){
        dragging = false;
        var now = new Date();      // get current time
        elapsed = now - lastup;
        lastup = now;
        if (distance < 6) {              // if we are not panning then we are clicking
          if (evt.ctrlKey) {
            zoom(evt.shiftKey ? -1 : 1 );  // click could zoom here to zoom, 
          } else {
            if (elapsed < 250) {  // if double click than hide #imagerOverlay
              if (fullScreen) {
                screenfull.exit();
                setFullScreen(false);
              } else {
                $imagerOverlay.addClass('hide');
                $imagerInfo.addClass('hide');
                $imagerEdit.addClass('hide');
                setViewMode(0);
                setEditMode(0);
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
        var delta = evt.wheelDelta ? evt.wheelDelta/10 : evt.detail ? -evt.detail : 0;
        if (delta) zoom(delta);
        return evt.preventDefault() && false;
      };

      $imagerCanvas[0].addEventListener('click',function(evt){
    //  evt.stopPropagation();
    //  return false;
      });


/**
 * 
 * @returns {undefined}
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
 * 
 * @returns {undefined}
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
 * 
 * @param {type} newMode
 * @returns {undefined}
 */
      function setViewMode(newMode) {
        if (fullScreen && newMode == 0) newMode = 1;
        switch (newMode) {
          case 0:   // #mode-view
            if (viewMode == 2) enablePanZoom();      
            $('#mode-view').addClass('checked');
            $('#mode-lock').removeClass('checked');
            $('#mode-crop').removeClass('checked');
            break;
          case 1:   // #mode-lock
            if (viewMode == 2) enablePanZoom();      
            $('#mode-view').removeClass('checked');
            $('#mode-lock').addClass('checked');
            $('#mode-crop').removeClass('checked');
            break;
          case 2:   // #mode-crop
            if (viewMode < 2) enableCrop();
            $('#mode-view').removeClass('checked');
            $('#mode-lock').addClass('checked');
            $('#mode-crop').addClass('checked');
            break;
        };
        viewMode = newMode;
      };

/**
 * 
 * @returns {undefined}
 */
      function setInitialImage() {
        $imagerCanvas2.attr({width:  cw,     // Set image to be full size
                            height: ch});
        ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
        ctx2.drawImage($imagerCanvas[0],0,0);
      }

/**
 * 
 * @param {type} newMode
 * @returns {undefined}
 */
      function setEditMode(newMode) {
        editMode = newMode;
        switch (editMode) {
          case 0:   // no editing
            $('#edit-brightness').removeClass('checked');
            $imagerBrightness.addClass('hide');
            $('#edit-color').removeClass('checked');
            $imagerColor.addClass('hide');
            break;
          case 1:   // #edit-brightness
            setInitialImage();
            setViewMode(1);
            $('#slider-brightness').val(0);
            $('#slider-contrast').val(0);
            $('#edit-brightness').addClass('checked');
            $imagerBrightness.removeClass('hide');
            $('#edit-color').removeClass('checked');
            $imagerColor.addClass('hide');
            break;
          case 2:   // #edit-color
            $('#slider-hue').val(0);
            $('#slider-saturation').val(0);
            $('#slider-lightness').val(0);
            setInitialImage();
            setViewMode(1);
            $('#edit-brightness').removeClass('checked');
            $imagerBrightness.addClass('hide');
            $('#edit-color').addClass('checked');
            $imagerColor.removeClass('hide');
            break;
        }
      }

/**
 * 
 * @param {type} newMode
 * @returns {undefined}
 */
      function setFullScreen(newMode) {
        if (newMode) {
          fullScreen = true;
          $imagerWrapper.addClass('fullscreen');
          $('#view-fullscreen').addClass('checked');
        } else {
          $imagerWrapper.removeClass('fullscreen');
          fullScreen = false;
          $('#view-fullscreen').removeClass('checked');
        }
        setTimeout(function() {
          setViewMode(1);
          initializeImage();
          redraw();
        },250);
      }

/**
 * 
 * @param {type} src
 * @param {type} offset
 * @returns {Drupal.behaviors.imager.attach.imagerSrc|String|src}
 */
      function findImage(src,offset) {
        for(i=0; i < nimgs; i++) {
          if (src == imgs[i]['src']) {
            if (offset == 1) {
              if (++i == nimgs) i = 0;
            } else {
              if (--i == -1) i = nimgs-1;
            }
            imagerSrc   = imgs[i]['src'];
            imagerTitle = imgs[i]['title'];
            return imagerSrc;
          }
        }
        return undefined;
      };

    // div#imager-overlay event handlers
      // click on #imager-overlay - hide it, set mode back to view=0
      $imagerOverlay.click(function () {
        if (viewMode > 0) return;
        $(this).addClass('hide');
        $imagerInfo.addClass('hide');
        $imagerEdit.addClass('hide');
        setViewMode(0);
        setEditMode(0);
        updateStatus();
      });

      // mouse enters the #imager-overlay div - do nothing
    //$imagerOverlay.mouseenter(function() {
    //  console.debug('#imager-overlay mouseenter');
    //})

      // mouse leaves the #imager-overlay div - hide it
      $imagerOverlay.mouseleave(function(evt) {
        if (viewMode > 0) return false; 
        var el = evt.relatedTarget ? evt.relatedTarget : evt.toElement;
        var el1 = $(el).closest('#imager-info');        // if they went to the info overlay don't leave
        if (el === $imagerInfo[0] || el1.length) return;

        setViewMode(0);
        setEditMode(0);
        $imagerOverlay.addClass('hide');
        $imagerInfo.addClass('hide');
        $imagerEdit.addClass('hide');
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
        changeImage(findImage(imagerSrc,-1));   
      });
      // click on #image-right - bring up next image to the right
      $('#image-right').click(function() {
        setViewMode(1);
        setEditMode(0);
        changeImage(findImage(imagerSrc,1));
      });
      // click on #image-exit - Exit the large popup
      $('#image-exit').click(function() {
        if (fullScreen) {
          screenfull.exit();
          setFullScreen(false);
        } else {
          $imagerOverlay.addClass('hide');
          $imagerInfo.addClass('hide');
          $imagerEdit.addClass('hide');
          setViewMode(0);
          setEditMode(0);
        }
      });
      // click on #image-ques - ajax call to bring in image description
      $imagerStatus.click(function(evt) {
        $imagerStatus.addClass('hide');
        $('#debug-status').removeClass('checked');
        localStorage['imgShowStatus'] = "FALSE";
      });
      $imagerMessages.click(function(evt) {
        $imagerMessages.addClass('hide');
        $('#debug-messages').removeClass('checked');
        localStorage['imgShowDebug'] = "FALSE";
      });
      $('#imager-info-exit').click(function(evt) {
        $imagerInfo.addClass('hide');
        $imagerEdit.addClass('hide');
        $('#view-info').removeClass('checked');
        localStorage['imgShowInfo'] = "FALSE";
      });
      $('#imager-edit-exit').click(function(evt) {
        $imagerEdit.addClass('hide');
      });
//    $('#imager-info-edit').click(function(evt) {
        // not sure what to do yet, I think I want separate edit button or possibly fieldsets, that sounds like the ticket
        // in which this function is not necessary, each field will have their own input fields
//    });
//    $imagerInfo.click(function(evt) {
//      $imagerInfo.addClass('hide');
//      $('#view-info').removeClass('checked');
//      localStorage['imgShowInfo'] = "FALSE";
//    });
      $('#imager-message a').click(function(evt) {
        evt.stopPropagation();
      });

    // div#mode-buttons event handlers
      // click on #mode-view - set mode back to view=0
      $('#mode-view').click(function() {
        setViewMode(0);
        updateStatus();
      });

      // click on #mode-lock - set mode to edit=1
      $('#mode-lock').click(function() {
        setViewMode(1);
        updateStatus();
      });

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
      $('#view-fullscreen').click(function() {
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
        if (localStorage.imgShowInfo === "FALSE") {
          localStorage.imgShowInfo = "TRUE";
          $(this).addClass('checked');
          getInfo();
        } else {
          localStorage.imgShowInfo = "FALSE";
          $(this).removeClass('checked');
          $imagerInfo.addClass('hide');
          $imagerEdit.addClass('hide');
        }
      });

    // div#edit-buttons click event handlers
      // Edit Brightness/Contrast
      $('#edit-brightness').click(function()   { setEditMode((editMode == 1) ? 0 : 1); redraw(); updateStatus();});
      $('#brightness-apply').click(function()  { applyBrightness();                    updateStatus();});
      $('#brightness-cancel').click(function() { setEditMode(0); redraw();             updateStatus();});
      $('#brightness-reset').click(function()  { resetBrightness();                    updateStatis();}); 
      // Edit Color
      $('#edit-color').click(function()        { setEditMode((editMode == 2) ? 0 : 2); redraw(); updateStatus();});
      $('#color-apply').click(function()       { applyColor();                         updateStatus();});
      $('#color-cancel').click(function()      { setEditMode(0); redraw();             updateStatus();});
      $('#color-reset').click(function()       { resetColor();                         updateStatis();}); 
      // Rotate
      $('#edit-left').click(function()         { rotate(-90); });
      $('#edit-right').click(function()        { rotate(90); });
      // Crop
      $('#edit-crop').click(crop);
      $('#view-reset').click(function(evt)     { changeImage(imagerSrc,evt); });

      // brightness/contrast and HSL slider change events 
      $('#slider-contrast').change(function()   { adjustBrightness($imagerCanvas2,$imagerCanvas); updateStatus();});
      $('#slider-brightness').change(function() { adjustBrightness($imagerCanvas2,$imagerCanvas); updateStatus();});
      $('#slider-hue').change(function()        { adjustColor($imagerCanvas2,$imagerCanvas);      updateStatus();});
      $('#slider-saturation').change(function() { adjustColor($imagerCanvas2,$imagerCanvas);      updateStatus();});
      $('#slider-lightness').change(function()  { adjustColor($imagerCanvas2,$imagerCanvas);      updateStatus();});

    // div#file-buttons click event handlers
      $('#file-save').click(function () {
        setViewMode(1);
        $('#save-file-name').text(decodeURIComponent(imagerSrc.split('/').reverse()[0]));
        $('#canvas-resolution').html(cw + 'x' + ch);
        $('#image-display-resolution').html(parseInt(ptCLrT.x - ptCUlT.x) + 'x' + parseInt(ptCLrT.y - ptCUlT.y));
        $('#image-full-resolution').html(iw + 'x' + ih);
        $('#scale').html(parseInt(cscale * 100) / 100);
        $imagerFilesave.removeClass('hide');
      });
      $('#file-save-new').click(function () {
        saveFile(false);
        $imagerFilesave.addClass('hide');
      });
      $('#file-save-overwrite').click(function () {
        saveFile(true);
        $imagerFilesave.addClass('hide');
      });
      $('#file-save-cancel').click(function () {
        $imagerFilesave.addClass('hide');
        redraw();
      });
      $('#file-delete').click(function () {
        deleteFile();
        $imagerFilesave.addClass('hide');
        $imagerInfo.addClass('hide');
        $imagerEdit.addClass('hide');
        $imagerOverlay.addClass('hide');
        $imagerStatus.addClass('hide');
      });

/**
 * 
 * @param {type} overwrite
 * @returns {undefined}
 */
      function saveFile(overwrite) {
        var img;
        var saveMode;
        $('#imager-busy').show();
        ctx2.setTransform(1,0,0,1,0,0);
        switch (saveMode = $('input[name="resolution"]:checked').val()) {
          case 'canvas':
            img = $imagerCanvas[0].toDataURL();
            break;
          case 'image-cropped':
          case 'image-full':
            if (rotation == 0 || rotation == 180) {
              $imagerCanvas2.attr({width:  iw,      // Set canvas to same size as image
                                height: ih});
              if (rotation == 180)  {
                ctx2.translate(ih,iw);
              }
            } else {
              $imagerCanvas2.attr({width:  ih,      // Set canvas to same size as image
                                height: iw});
              if (rotation == 90) {
                ctx2.translate(ih,0);
              } else {
                ctx2.translate(0,iw);
              }
            }
            ctx2.rotate(angleInRadians(rotation));
            ctx2.drawImage(cimg,0,0);         // Copy full image into canvas
    
            img = $imagerCanvas2[0].toDataURL();
            break;
        }
        $imagerMessages.removeClass('hide').removeClass('error').html('Saving Image...');
        processAjax({ overwrite: overwrite,
                      action: 'save-file',
                      saveMode: saveMode,
                      uri: imagerSrc,
                      imgBase64: img 
                    });
      };
      function deleteFile() {
        $imagerMessages.removeClass('hide').removeClass('error').html('Deleting Image...');
        processAjax({ action: 'delete-file',
                      uri: imagerSrc,
                    });
      }


      $imagerMessages.click(function (evt) {
        $(this).addClass('hide');
      });
      $('#file-download').click(function() {
        window.open(imagerSrc);
      });

    //div#debug-buttons event handlers
      // toggle debug
      $('#debug-status').click(function(evt) {
        if (localStorage.imgShowStatus === "FALSE") {
          localStorage.imgShowStatus = "TRUE";
          $(this).addClass('checked');
          $imagerStatus.removeClass('hide');
        } else {
          localStorage.imgShowStatus = "FALSE";
          $(this).removeClass('checked');
          $imagerStatus.addClass('hide');
        }
        $imagerMessages.append('<p>imgShowStatus: ' + localStorage.imgShowStatus + '</p>');
        updateStatus();
      });
      $('#debug-messages').click(function(evt) {
        localStorage.imgShowDebug = (localStorage.imgShowDebug === "TRUE") ? "FALSE" : "TRUE";
        if (localStorage.imgShowDebug === "TRUE") {
          $(this).addClass('checked');
          $imagerMessages.removeClass('hide');
          $imagerMessages.empty();
        } else {
          $(this).removeClass('checked');
          $imagerMessages.addClass('hide');
        }
      });
      
      
    // Thumbnails $('a > img') event handlers
      // for each thumbnail on the page 
      $thumbnails.each(function(index,value) {

        // Add image to imgs array
        imgs[nimgs] = {};
        imgs[nimgs]['src']   = $(this).parent().attr('href');
        imgs[nimgs]['title'] = $(this).attr('data-title');
        nimgs++;

        // Unbind any current event handlers on thumbnails
        $(this).parent().unbind('click');

        // User clicks in thumbnail image
        $(this).click(function(evt) {
          if (viewMode == 1) {   // if the overlay is locked, select this image
            imagerSrc = $(this).parent().attr('href');
            imagerTitle = $(this).attr('data-title');
            changeImage(imagerSrc,evt);
          } else {               // if the overlay is not locked, then lock it?
            setViewMode(1);
            updateStatus();
          }
          evt.stopPropagation();
          return false;
        });

        // mouse enters thumbnail image
        // un-hide div#imager-overlay and display new image
        var timer;
        $(this).hoverIntent({
          over: function(evt) {
            if (viewMode > 0) return false;

// Get the FID and add to canvas attributes 'data-fid'
//          var $elem = $(this).closest('.imager');
//          var classList = $elem.attr('class').split(/\s+/);
//          $.each( classList, function(index, item){
//            var ind = item.indexOf('fid-');
//            if (item.indexOf('fid-') > -1) {
//              $imagerCanvas.attr('data-fid',(item.split(/\-/))[1]); // the parent element MUST be a link to the image to load
//            }
//          });

            imagerSrc = $(this).parent().attr('href'); // the parent element MUST be a link to the image to load
            imagerTitle = $(this).attr('data-title');
            setViewMode(0);
            changeImage(imagerSrc,evt);
          },
          out: function(evt) {
            if (viewMode > 0) return false;
    //          clearTimeout(timer);
            var el = evt.relatedTarget ? evt.relatedTarget : evt.toElement;
            var el1 = $(el).closest('#imager-overlay');
            var el2 = $(el).closest('#imager-info');
            if (el === $imagerOverlay[0] || el1.length || el2.length) {
    //        console.debug("image mouseleave image has focus");
            } else {
              $imagerOverlay.addClass('hide');
              $imagerInfo.addClass('hide');
              $imagerEdit.addClass('hide');
              setViewMode(0);
              setEditMode(0);
              updateStatus();
    //        console.debug("image mouseleave image doesn't have focus ");
            }
          },
          sensitivity: 2,
          interval: 50
        });   // thumbnail.hoverIntent
      });   // thumbnails.each()

/**
 * 
 * @param {type} ctx
 * @returns {undefined}
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
 * 
 * @param {type} postData
 * @param {type} processFunc
 * @returns {undefined}
 */
      function processAjax(postData,processFunc) {
        postData['modulePath'] = Drupal.settings.imager.modulePath;
        postData['baseUrl']    = Drupal.settings.imager.baseUrl;
        postData['basePath']   = Drupal.settings.imager.basePath;
        postData['siteName']   = Drupal.settings.imager.siteName;
        postData['drupalRoot'] = Drupal.settings.imager.drupalRoot;
        postData['uid']        = Drupal.settings.imager.uid;
        $imagerMessages.removeClass('hide').empty();
//      if (localStorage['imgShowDebug'] === "TRUE") {
//        $imagerMessages.append("<h2>Process action: " + postData.action + "</h2>" +
//          "<div>" + JSON.stringify(postData).substr(1,256) + "</div>\n");
//      }
        $.ajax({
          type: "POST",
          url: modulePath + "/services.php",  // Relative paths were intermittent in Firefox
                                              // I added the Drupal.settings to make path absolute
          data: postData, 
          success: function (response_json) {
            $('#imager-busy').hide();
            var response = JSON.parse(response_json);
            var display = false;
            var out = [];
            out = "<h2>" + response['action'] + ':' + response['status'] + "</h2>";
            if (response['info']) {
              out += "<div class='info'>"  + response['info'] + "</div>";
              display = true;
            }
            if (status === 'catch' || 
                (response['debug'] && localStorage['imgShowDebug'] === "TRUE"))  {
              out += "<div class='debug'>" + response['debug'] + "</div>";
              display = true;
            }

            if (display) {
              $imagerMessages.removeClass('hide').removeClass('error').html(out);
            }
            if (processFunc) processFunc(response);   // Execute users function
            if (localStorage['imgShowDebug'] === "FALSE") {
              setTimeout(function() {
                $imagerMessages.addClass('hide');
              },5000);
            }
          },
          error: function(evt) {
            $('#imager-busy').hide();
            $imagerMessages.removeClass('hide')
                        .addClass('error')
                        .html('<p>Error: ' + evt.status + ': ' + evt.statusText + 
                              '<br>Action: ' + postData.action + '</p>');
            if (processFunc) processFunc(response,evt);   // Execute users error function
            if (localStorage['imgShowDebug'] === "FALSE") {
              setTimeout(function() {
                $imagerMessages.removeClass('error').addClass('hide');
              },10000);
            }
          }
        });
      };
    }    // attach:
  };   // Drupal.behaviors.imager
})(jQuery);
