  
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
  /**
   * Reserve imager namespace
   * 
   * @returns {_L28.imager.Anonym$32}
   *   init()    Initialization imager
   *   attach()  Attach to thumbnails on source page
   */
  
  window.imager = function imager(){

//  localStorage.clear();
    var $thumbnails;       // List of thumbnails on source page
    var Viewer = Drupal.imager.Viewer;
    var Popups = Drupal.imager.Popups;

    // Elements
    var $imagerViewer;     // Dialog - Viewer/Editor
    var $imagerMap;        // popup for displaying map showing locations of images
    var $imagerConfirm;    // popup for confirming actions - delete image
    var $imagerEdit;       // popup for displaying text information
    var $imagerFilesave;   // Debug response debug popup
    var ias;               // imgAreaSelect instance
    var ctx;               // canvas context
    var ctx2;              // canvas context of original unshown image

    var cimg = document.createElement('IMG');
    var imgs = [];         // file paths and titles of all matched images on page
    var nimgs = 0;         // number of images
    var currentImage;         // current image being viewed
    var viewMode = 0;      // 0 - #mode-view, 1 - #mode-edit, 2 - #mode-crop
    var editMode = 0;      // 0 - none, 1 - brightness/contrast, 2 - color (hsl)
    var elapsed = 0;       // # elapsed msec since last mouse up
    var fullScreen = 0;    // Are we currently in full screen mode
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

    // Status 
    var rotation;  // 0, 90, 180, 270 
    var initScale = 1;
    var scaleFactor = 1.02;
    var cscale;
    var dragging = false;
    var distance;
    var lastup = new Date();  // time of last mouseup event

    var ptsC = function ptsC(spec) {
      var name = spec.name;
      var namex = spec.name + '-x';
      var namey = spec.name + '-y';
      var pt =  {'v': {'x': 0, 'y': 0},
                 't': {'x': 0, 'y': 0}};
      var doTransform = spec.transform || false;
      if (doTransform) {
        var namext = namex + '-tx';
        var nameyt = namey + '-tx';
      }

      pt.setPt = function setPt(x, y) {
        pt.v.x = x;
        pt.v.y = y;
        var vals = {};
        vals[namex] = parseInt(x);
        vals[namey] = parseInt(y);
        if (doTransform) {
          pt.t = ctx.transformedPoint(x, y);
          vals[namext] = parseInt(pt.t.x);
          vals[nameyt] = parseInt(pt.t.y);
        }
        Popups.status.dialogUpdate(vals);
      };

      pt.getPt = function getPt()     { return pt.v; }
      pt.getTxPt = function getTxPt() { return pt.t; }

      return pt;
    }

    var pt_down      = ptsC({'name': 'down',      'transform': true});
    var pt_now       = ptsC({'name': 'now',       'transform': true});
    var pt_crop_ul   = ptsC({'name': 'crop-ul',   'transform': true});
    var pt_crop_lr   = ptsC({'name': 'crop-lr',   'transform': true});
    var pt_canvas_ul = ptsC({'name': 'canvas-ul', 'transform': true});
    var pt_canvas_lr = ptsC({'name': 'canvas-lr', 'transform': true});

    Viewer.updateStatusModes = function updateStatusModes () {
      Popups.status.dialogUpdate({
        'view-mode': viewMode,
        'edit-mode': editMode,
        'full-screen': fullScreen,
      });
    }

    Viewer.updateStatusFilters = function updateStatusFilters () {
      Popups.status.dialogUpdate({
        'rotation': rotation,
        'zoom': parseInt((cscale * 100000) / 1000) / 100
      });
    }

    Viewer.updateStatusGeometries = function updateStatusGeometries () {
      Popups.status.dialogUpdate({
        'max-canvas-width':     parseInt(mw),
        'max-canvas-height':    parseInt(mh),
        'actual-canvas-width':  parseInt(cw),
        'actual-canvas-height': parseInt(ch),
        'disp-image-width':     parseInt(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x),
        'disp-image-height':    parseInt(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y),
        'full-image-width':     parseInt(iw),
        'full-image-height':    parseInt(ih),
      });
    }
/**
 * Set image editing mode - none, brightness, hsl. 
 * 
 * @param {type} newMode
 */
    Viewer.updateStatus = function updateStatus() {
      Viewer.updateStatusModes();
      Viewer.updateStatusFilters();
      Viewer.updateStatusGeometries();
    }

    Drupal.imager.Viewer.setEditMode = function setEditMode(newMode) {
      editMode = newMode;
      switch (editMode) {
        case 'none':   // no editing
          Popups.brightness.dialogClose();
          Popups.color.dialogClose();
          break;
        case 'toggle-brightness':
          if (editMode === 1) {
            setEditMode('none');
            break;
          }
          // else fall through and set to brightness
        case 'brightness':   // #edit-brightness
          Viewer.setViewMode(1);
          Popups.color.dialogClose();
          Popups.brightness.dialogOpen();
          break;
        case 'toggle-color':   // #edit-color
          if (editMode === 2) {
            setEditMode('none');
            break;
          }
          // else fall through and set to color
        case 'color':   // #edit-color
          Viewer.setViewMode(1);
          Popups.brightness.dialogClose();
          Popups.color.dialogOpen();
          break;
      }
      Popups.status.dialogUpdate({'edit-mode': editMode});
    };

    Viewer.getCurrentImage = function getCurrentImage() {
      return currentImage;
    }


    function _init(opts) {
      Drupal.imager.settings = opts;   // Why do I make a local copy?  There must have been a reason.

      Viewer.$canvas2    = $('#imager-canvas-org');
      Viewer.$canvas2.hide();   // This is never displayed, it is used to save images temporarily
      ctx2 = Viewer.$canvas2[0].getContext('2d');           

      Drupal.imager.$wrapper  = $('#imager-wrapper');

      $imagerViewer    = $('#imager-viewer');
      $imagerViewer.hide();

      $imagerMap       = $('#imager-map');
      $imagerMap.hide();
      initDraggable($imagerMap,'info_map',5,5);
      
      $imagerConfirm       = $('#imager-confirm');
      $imagerConfirm.hide();
      initDraggable($imagerConfirm,'confirm_location',5,5);
      
      $imagerEdit       = $('#imager-edit');
      $imagerEdit.hide();
      initDraggable($imagerEdit,'edit_location',0,0);

      Popups.$busy = $('#imager-busy');
      Popups.$busy.hide();

      $('#imager-form').empty();

      if (localStorage.quickView === "TRUE") {
        $('#mode-view').addClass('checked');
      } else {
        viewMode = 1;      // 0 - #mode-view, 1 - #mode-edit, 2 - #mode-crop
      }

      $thumbnails   = $(Drupal.imager.settings.cssContainer);
      if ($thumbnails.length === 0) return; // No thumbnails found, exit 

      Viewer.$canvas     = $('#imager-canvas');
      ctx  = Viewer.$canvas[0].getContext('2d');
      ias = Viewer.$canvas.imgAreaSelect({
        instance: true,
        disable: true,
        handles: true,
        autoHide: false,
        hide: true,
        show: true
      });

      initDialogs();
      initEvents();
      trackTransforms(ctx);  // Create transform history
      enablePanZoom(); 
      Viewer.updateStatus();
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


    /**
     * Change the current image in #image-viewer
     * 
     * @param {type} image_path
     * @returns {undefined}
     */
    var changeImage = function(image_path) {
      rotation = 0;  // 0, 90, 180, 270 
//    Popups.brightness.dialogReset();
//    Popups.color.dialogReset();

      $imagerEdit.hide();
      currentImage = image_path;
      cimg.src = currentImage['src'];   // This begins loading the image - upon completion load event is fired
      Popups.$busy.show();
    };

    // When image is loaded - load event is fired
    cimg.addEventListener('load', function () {
      Popups.$busy.hide();
      initializeImage();
  //  var nimg = Pixastic.process(cimg,"desaturate");
      Viewer.redraw();                                        // Draw the image
      showPopups();               // Hide the image viewer 
      if (localStorage.imagerShowInfo === "TRUE") Popups.info.dialogUpdate();                                       //
    }, false);
   
    var initializeImage = function() {
      iw = cimg.width;
      ih = cimg.height;
      if (fullScreen) {
        mw = $(window).width()  - 45; // Maximum canvas width
        mh = $(window).height() - 10; // Maximum canvas height
        cw=mw;
        ch=mh;
        var hscale = ch/ih;
        var vscale = cw/iw;
        cscale = (hscale < vscale) ? hscale : vscale;
      } else {
        mw = $(window).width()  - 95; // Maximum canvas width
        mh = $(window).height() - 6; // Maximum canvas height
        calcCanvasDims(iw,ih);
        cscale = cw/iw;
      }
      initScale = cscale;
      pt_down.setPt(cw/2, ch/2);
      Viewer.$canvas.attr({width:  cw,
                           height: ch});
      Viewer.setEditMode('none');
      pt_now.setPt(0,0);
      ctx.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx.clearRect(0,0,cw,ch);        // Clear the canvas
      rotation = 0;
      scale(cscale,false);                          // Set initial scaling to fit
      Viewer.updateStatus();
    };

    Viewer.copyCanvasToImg = function copyCanvasToImg () {
      cimg.src = Viewer.$canvas[0].toDataURL();
    }


    Viewer.redraw = function redraw(){
      // We possibly have done multiple transforms, instead of calculating
      // the cumulative changes in scale, we apply the current transform matrix,
      // and calculate the current scale.
      setCanvasPoints();
      if ((rotation === 0) || (rotation === 180)) { 
        cscale = cw / Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x);
      } else {
        cscale = cw / Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y);
      }
      Popups.status.dialogUpdate({'zoom': parseInt((cscale * 100000) / 1000) / 100});
      ctx.clearRect(pt_canvas_ul.getTxPt().x,
                    pt_canvas_ul.getTxPt().y,
                    pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x,
                    pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y);

      // Alternatively:
  //       ctx.save();
  //       ctx.setTransform(1,0,0,1,0,0);
  //       ctx.clearRect(0,0,Viewer.$canvas[0].width,Viewer.$canvas[0].height);
  //       ctx.restore();

      ctx.drawImage(cimg,0,0);
    };

    var calcCanvasDims = function(sw,sh) {
      ch = sh*mw/sw;
      if (ch < mh) {   // width determines max size
        cw = mw;
      } else {                      // height determines max size
        ch = mh;
        cw = sw*mh/sh;
      }
      cw = parseInt(cw);
      ch = parseInt(ch);
    };

    var rotate = function(deg) {
      mw = $(window).width()  - 200; // Maximum canvas width
      mh = $(window).height() - 20;  // Maximum canvas height
      ctx.clearHistory();
      iw = cimg.width;
      ih = cimg.height;
      if (deg === 90) {
        rotation = (rotation === 270) ? 0 : rotation += 90;
      }  else if (deg === -90) {
        rotation = (rotation === 0) ? 270 : rotation -= 90;
      }
      Popups.status.dialogUpdate({
        'rotation': rotation
      });
      if (rotation === 0 || rotation === 180) {
        calcCanvasDims(iw,ih);
        Viewer.$canvas.attr({width: cw,
                           height: ch});
        cscale=cw/iw;
        pt_now.setPt(cw/2, cw/2);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,Viewer.$canvas[0].width,Viewer.$canvas[0].height);
        if (rotation === 180) {
          ctx.translate(cw,ch);
          ctx.rotate(angleInRadians(rotation));
        } else {
  //        ctx.translate(-cw,-ch);
  //        ctx.rotate(angleInRadians(rotation));
        }
      } else {
        calcCanvasDims(ih,iw);
        Viewer.$canvas.attr({width:  cw,
                            height: ch});
        cscale=cw/ih;
        pt_now.setPt(cw/2, cw/2);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,Viewer.$canvas[0].width,Viewer.$canvas[0].height);
        if (rotation === 90) {
          ctx.translate(cw,0);
        } else {
          ctx.translate(0,ch);
        }
        ctx.rotate(angleInRadians(rotation));
      }
      initScale = cscale;
      ctx.scale(cscale,cscale);
      Viewer.redraw();
      showPopups();
    };

    var angleInRadians = function(deg) {
      return deg * Math.PI / 180;
    };
    
    var zoom = function(clicks){
      scale(Math.pow(scaleFactor,clicks),true);
      Viewer.redraw();
      setStatusPoints();
      updateStatusFilters();
      updateStatusGeometries();
    };

    var scale = function(factor,checkScale) {
      if (checkScale && factor < 1 && localStorage.imagerBoundsEnable === 'TRUE') {
        if (cscale * factor < initScale) {
          factor = initScale / cscale;
        }
      }
      ctx.translate( pt_now.getTxPt().x,  pt_now.getTxPt().y);
      ctx.scale(factor,factor);
      ctx.translate(-pt_now.getTxPt().x, -pt_now.getTxPt().y);
      var npt;
      npt = outOfBounds();
      if (npt !== undefined) {
//      ctx.restore();
        ctx.translate(npt.x,npt.y);
      }
    };

    /*
   * crop()
   */
    function crop() {
      Popups.$busy.show();
      if (viewMode !== 2) return;
      Viewer.setViewMode(1);
      var selection = ias.getSelection();
      pt_crop_ul.setPt(selection.x1, selection.y1);
      pt_crop_lr.setPt(selection.x2, selection.y2);
      var niw = pt_crop_lr.getTxPt().x - pt_crop_ul.getTxPt().x;
      var nih = pt_crop_lr.getTxPt().y - pt_crop_ul.getTxPt().y;

      Viewer.$canvas.attr({width:  niw,           // Make canvas same size as the image
                          height: nih});
      ctx.clearRect(0,0,cw,ch);
      ctx.setTransform(1,0,0,1,0,0);
      ctx.drawImage(cimg,
                    pt_crop_ul.getTxPt().x,
                    pt_crop_ul.getTxPt().y,
                    niw,nih,0,0,niw,nih);  // Copy cropped area from img into canvas

      cimg.src = Viewer.$canvas[0].toDataURL();  // Copy canvas image back into img
      calcCanvasDims(niw,nih);                  // Calculate maximum size of canvas
      Viewer.$canvas.attr({width:  cw,            // Make canvas proper size
                          height: ch});
      ctx.scale(cw/niw,ch/nih);                 // Scale image to fit canvas
  //  ctx.drawImage(cimg,0,0);                 // Draw image, not necessary, it's already drawn
      Popups.status.dialogUpdate();
      Popups.$busy.hide();
    }

    var setCanvasPoints = function setCanvasPoints() {
      switch (rotation) {
        case 0:
          pt_canvas_ul.setPt(0,0);
          pt_canvas_lr.setPt(cw,ch);
          break;
        case 90:
          pt_canvas_ul.setPt(cw,0);
          pt_canvas_lr.setPt(0,ch);
          break;
        case 180:
          pt_canvas_ul.setPt(cw,ch);
          pt_canvas_lr.setPt(0,0);
          break;
        case 270:
          pt_canvas_ul.setPt(0,ch);
          pt_canvas_lr.setPt(cw,0);
          break;
      }
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
      if (localStorage.imagerBoundsEnable === 'FALSE') return undefined;
      setCanvasPoints();
      var msg = '';

/*    var pw;
      var ph;
      switch (rotation) {
        case 0:
        case 180:
          pw = iw * cscale;
          ph = ih * cscale;
          break;
        case 90:
        case 270:
          pw = ih * cscale;
          ph = iw * cscale;
          break;
      }
      var msg = '<p>outOfBounds - cw: ' + cw + '  pw: ' + pw + '</p>';
      msg += '<p>outOfBounds - ch: ' + ch + '  ph: ' + ph + '</p>'; */

      var x1 = pt_canvas_ul.getTxPt().x;
      var y1 = pt_canvas_ul.getTxPt().y;
      var x2 = iw - pt_canvas_lr.getTxPt().x;
      var y2 = ih - pt_canvas_lr.getTxPt().y;
      // @todo - When image is smaller than the canvas the image flips back and forth.
      if (x2 < 0) {
        msg += '<p>outOfBounds - right:' + x2 + '</p>';
        npt.x = -x2;
      }
      if (y2 < 0) {
        msg += '<p>outOfBounds - bottom:' + y2 + '</p>';
        npt.y = -y2;
      }
      if (x1 < 0) {
        msg += '<p>outOfBounds - left:' + pt_canvas_ul.getTxPt().x + '</p>';
        npt.x = pt_canvas_ul.getTxPt().x;
      }
      if (y1 < 0) {
        msg += '<p>outOfBounds - top:' + pt_canvas_ul.getTxPt().y + '</p>';
        npt.y = pt_canvas_ul.getTxPt().y;
      }
      if (msg) {
        $('#imager-messages-content').html(msg);
      }
      if (npt.x || npt.y) return npt;
      return undefined;
    };

/**
* Use AJAX to get a map showing where the image was taken.
* 
* This isn't working yet.  Most likely problem is JavaScript files are not
* getting loaded through AJAX.  Not sure if this is even possible.
*/
    function getMap() {
      Popups.$busy.show();
      Drupal.imager.ajaxProcess(this,
                  Drupal.imager.settings.actions.displayMap.url,
                  { action: 'display-map',
                    uri: currentImage['src']
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
      var x = evt.offsetX || (evt.pageX - Viewer.$canvas[0].offsetLeft);
      var y;
      // @todo - pageY works intermittently
      //         Seems to be related to the div having css 'position: fixed'
      if (evt.offsetY) {
        y = evt.offsetY || (evt.pageY - Viewer.$canvas[0].offsetTop);
      } else {
        y = evt.layerY + Viewer.$canvas[0].offsetTop;  
      }
      pt_down.setPt(x, y);
      dragging = true;
      distance = 0;
      Popups.status.dialogUpdate({'distance': parseInt(distance)});
    };

/**
* Move the image when mouse is moved.
* 
* @param {type} evt
*/
    function mouseMove(evt){
      var x = evt.offsetX || (evt.pageX - Viewer.$canvas[0].offsetLeft);
      var y;
      if (evt.offsetY) {
        y = evt.offsetY || (evt.pageY - Viewer.$canvas[0].offsetTop);
      } else {
        y = evt.layerY + Viewer.$canvas[0].offsetTop;
      }
      pt_now.setPt(x,y);
      if (dragging){
        distance = Math.sqrt((Math.pow(pt_down.getPt().x - pt_now.getPt().x,2)) + 
                             (Math.pow(pt_down.getPt().y - pt_now.getPt().y,2)));
        Popups.status.dialogUpdate({'distance': parseInt(distance)});
        ctx.save();
        ctx.translate(pt_now.getTxPt().x - pt_down.getTxPt().x,
                      pt_now.getTxPt().y - pt_down.getTxPt().y);
        var npt;   // recommended x and y motions that won't go out of bounds
        npt = outOfBounds();
        if (npt !== undefined) {
          ctx.restore();
          ctx.translate(pt_now.getTxPt().x - pt_down.getTxPt().x + npt.x,
                        pt_now.getTxPt().y - pt_down.getTxPt().y + npt.y);
        }
        Viewer.redraw();
      }
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
      Popups.status.dialogUpdate({'elapsed': elapsed*1000/1000000});
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
          } else if (viewMode === 0) {
            Viewer.setViewMode(1);
          }
        }
      }
      Popups.status.dialogUpdate();
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
      Viewer.$canvas[0].addEventListener('mousedown',mouseDown,false);
      Viewer.$canvas[0].addEventListener('mousemove',mouseMove,false);
      Viewer.$canvas[0].addEventListener('mouseup',mouseUp,false);
      Viewer.$canvas[0].addEventListener('DOMMouseScroll',mouseWheel,false);
      Viewer.$canvas[0].addEventListener('mousewheel',mouseWheel,false);
      ias.setOptions({disable: true, hide: true});
    }

/**
* Enable events for cropping and disable events for cropping and zooming.
*/
    function enableCrop() {
      Viewer.$canvas[0].removeEventListener('mousedown',mouseDown);
      Viewer.$canvas[0].removeEventListener('mousemove',mouseMove);
      Viewer.$canvas[0].removeEventListener('mouseup',mouseUp);
      Viewer.$canvas[0].removeEventListener('DOMMouseScroll',mouseWheel);
      Viewer.$canvas[0].removeEventListener('mousewheel',mouseWheel);
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
    Viewer.setViewMode = function setViewMode(newMode) {
      if (fullScreen && newMode === 0) newMode = 1;
      switch (newMode) {
        case 0:   // #mode-view
          if (viewMode === 2) enablePanZoom();      
          $('#mode-crop').removeClass('checked');
          break;
        case 1:   // #mode-lock - now mode not #mode-view
          if (viewMode === 2) enablePanZoom();      
          $('#mode-crop').removeClass('checked');
          break;
        case 2:   // #mode-crop
          if (viewMode < 2) enableCrop();
          $('#mode-crop').addClass('checked');
          break;
      };
      viewMode = newMode;
      Popups.status.dialogUpdate({'view-mode': viewMode});
    };

/**
* Save the current image into a second offscreen canvas. 
*/
    Viewer.setInitialImage = function setInitialImage() {
      Viewer.$canvas2.attr({width:  iw,     // Set image to be full size
                            height: ih});
      ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx2.drawImage(Viewer.$canvas[0],0,0);
    }

/**
* Toggle full screen mode and draw image.
* 
* @param {type} newMode
*/
    function setFullScreen(newMode) {
      if (newMode) {
        fullScreen = true;
        Popups.status.dialogUpdate({'full-screen': fullScreen});
        Drupal.imager.$wrapper.addClass('fullscreen');
        $('#mode-fullscreen').addClass('checked');
      } else {
        Drupal.imager.$wrapper.removeClass('fullscreen');
        fullScreen = false;
        Popups.status.dialogUpdate({'full-screen': fullScreen});
        $('#mode-fullscreen').removeClass('checked');
      }
      setTimeout(function() {
        Viewer.setViewMode(1);
        initializeImage();
        Viewer.redraw();
      },250);
    }
/**
* Display any popups that are enabled. 
*/
  function showPopups() {
    $imagerViewer.show();
    if (localStorage.imagerShowInfo   === "TRUE") {
      $('#view-info').addClass('checked');
      Popups.info.dialogOpen();
    }
    if (localStorage.imagerDebugStatus === "TRUE") {
      $('#debug-status').addClass('checked');
      Popups.status.dialogOpen();
    }
    if (localStorage.imagerDebugMessages  === "TRUE") {
      $('#debug-messages').addClass('checked');
//    Popups.messages.dialogOpen();
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
    Popups.info.dialogClose();
    $imagerEdit.hide();
    $imagerMap.hide();
    Popups.status.dialogClose();
    Popups.messages.dialogClose();
    $imagerConfirm.hide();
    Viewer.setViewMode((localStorage.quickView === "TRUE") ? 0 : 1);
    Viewer.setEditMode('none');
  }


  function displayMessage(msg) {
    return;
    if (!Popups.messages.dialogIsOpen()) return;
    $('#imager-messages-content').append(msg);
    if (localStorage['imagerDebugMessages'] === "FALSE") {
       messageTimeout = setTimeout(function() {
         Popups.messages.dialogClose();
       },5000);
    }
  }

    function findImageFromThumbSrc(tsrc) {
      var i;
      for(i=0; i < nimgs; i++) {
        if (tsrc === imgs[i]['tsrc']) {
          currentImage = imgs[i];
          return currentImage;
        }
      }
      return undefined;
    };

/**
* Given an image, find the next or previous image.
* 
* @param {type} current
*   Current image to offset from
* @param {type} offset
*   Number of images.
* 
* @returns {Drupal.behaviors.imager.attach.currentImage['src']|String|src}
*/
    function findNextImage(current,offset) {
      var i;
      for(i=0; i < nimgs; i++) {
        if (current === imgs[i]) {
          if (offset === 1) {
            if (++i === nimgs) i = 0;
          } else {
            if (--i === -1) i = nimgs-1;
          }
          currentImage = imgs[i];
          return currentImage;
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
        Popups.status.dialogUpdate();
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
//      if (el === $imagerInfo[0] || el1.length) return;

        hidePopups();
        Popups.status.dialogUpdate();
      });

      
    // div#button-wrapper event handlers
      $('#button-wrapper').click(function (evt) {
          evt.stopPropagation();
      });

    // div#image-buttons event handlers
      // click on #image-left - bring up next image to the left
      $('#image-left').click(function() {
        Viewer.setViewMode(1);
        Viewer.setEditMode('none');
        changeImage(findNextImage(currentImage,-1));   
      });
      // click on #image-right - bring up next image to the right
      $('#image-right').click(function() {
        Viewer.setViewMode(1);
        Viewer.setEditMode('none');
        changeImage(findNextImage(currentImage,1));
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

      /*
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
            if (editor === "panopoly_wysiwyg_text") {
              id = Drupal.wysiwyg.activeId;
              value = tinyMCE.get(id).getContent();
            } else if (editor === 'full_html') {
              var $elems = $('#imager-edit-content textarea.form-textarea');
              $elems.each(function (index,elem) {
                value = $(elem).val();   // Last one wins - this is what we want
              });
            } else if (editor === 'plain_text') {
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
        Popups.$busy.show();
        displayMessage('Saving ...');
        Drupal.imager.ajaxProcess(this,
                    Drupal.imager.settings.actions.saveFileEntityField.url,
                    { action: 'save-file-entity-field',
                      field: editField,
                      fieldType: editFieldType,
                      value: value,
                      format: format,
                      uri: currentImage['src']
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
          Viewer.setViewMode(0);
        } else {
          localStorage.quickView = "FALSE";
          $(this).removeClass('checked');
          Viewer.setViewMode(1);
        }
      }); */



      // click on #mode-crop - set mode to edit=2
      $('#mode-crop').click(function() {
        if (viewMode === 2) {
          Viewer.setViewMode(1);
        } else {
          Viewer.setViewMode(2);
          Viewer.setEditMode('none');
        }
        Popups.status.dialogUpdate();
      });

    // div#view-buttons event handlers
      $('#view-edit').click(function() {

      });
      $('#view-browser').click(function() {
//      displayMessage('Extracting Image...');
        Popups.$busy.show();
        var img = getImage($('image-cropped').val(),false);
//      displayMessage('Saving Image...');
        Drupal.imager.ajaxProcess(this,
                    Drupal.imager.settings.actions.viewBrowser.url,
                    { action: 'view-browser',
                      uri: currentImage['src'],
                      imgBase64: img 
                    }, function (response) {
                      var address = '';
                      var path = response['data']['uri'];
                      window.open(path,'_blank');
                    });
      });
      $('#view-zoom-fit').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y);
        zoom(0);
      });
      $('#view-zoom-1').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y);
        zoom(0);
      });
      $('#view-zoom-in').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y);
        zoom(1);
      });
      $('#view-zoom-out').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y);
        zoom(-1);
      });
      $('#mode-fullscreen').click(function() {
        if (screenfull.enabled) {
          // We can use `this` since we want the clicked element
          screenfull.toggle(Drupal.imager.$wrapper[0]);
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
        Viewer.redraw();
        Viewer.setViewMode(1);
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

    // div#edit-buttons click event handlers
      // Rotatthumb
      $('#edit-ccw').click(function()          { Viewer.setEditMode('none');
                                                 rotate(-90); });
      $('#edit-cw').click(function()           { Viewer.setEditMode('none');
                                                 rotate(90); });
      // Crop
      $('#edit-crop').click(crop);
      $('#view-reset').click(function(evt)     { changeImage(currentImage); });
    }   // function initEvents()

    function initDialog(name, buttonId) {
      if (buttonId) {
        var $button = $(buttonId);
        if ($button) {
          var popup = Popups[name + 'C']({ '$selectButton': $button });
          Popups[name] = popup;
          $button.click(function() { 
            popup.dialogToggle(); 
          });
        }
      }
      else {
        var popup = Popups[name + 'C']({ '$selectButton': undefined });
        Popups[name] = popup;
      }
    }

    function initDialogs() {
      initDialog('color',              '#edit-color');
      initDialog('brightness',         '#edit-brightness');
      initDialog('config',             '#mode-configure');
      initDialog('info',               '#view-info');
      initDialog('status',              undefined);
      initDialog('messages',            undefined);
      initDialog('filesave_database',  '#file-database');
    };


    function initThumbEvents() {
      imgs = [];
      nimgs = 0;

      $thumbnails   = $(Drupal.imager.settings.cssContainer);
      if ($thumbnails.length === 0) return; // No thumbnails found, exit 
      
      $thumbnails.each(function(index,value) {
        // Add image to imgs array
        var $thumb = $(this).find(Drupal.imager.settings.cssImage);
        imgs[nimgs] = {};
        imgs[nimgs]['container'] = $(this);
        imgs[nimgs]['thumb'] = $thumb;
        imgs[nimgs]['tsrc'] = $thumb.attr('src');
        imgs[nimgs]['src'] = getFullPath($thumb.attr('src'));
        nimgs++;

        // Unbind any current event handlers on thumbnails
        $thumb.parent().unbind('click');

        // User clicks in thumbnail image
        $thumb.click(function(evt) {
          currentImage = findImageFromThumbSrc($thumb.attr('src'));
          if (viewMode === 1) {   // if the viewer is locked, select this image
            changeImage(currentImage);
          } else {               // if the viewer is not locked, then lock it?
            Viewer.setViewMode(1);
            Popups.status.dialogUpdate();
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
            currentImage['src'] = getFullPath(this);
            Viewer.setViewMode((localStorage.quickView === "TRUE") ? 0 : 1);
            changeImage(currentImage['src']);
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
              Popups.status.dialogUpdate();
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
 * @param {type} tsrc
 * @returns {unresolved}
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
           if (tsrc.charAt(index) === '/') { 
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

      var pt  = svg.createSVGPoint();
      ctx.transformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
      };

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
 * @param {type} $callingElement
 * @param {type} url
 * @param {type} postData
 * @param {type} processFunc
 * @returns {undefined}
 */
    Drupal.imager.ajaxProcess = function($callingElement, url, postData, processFunc) {
      postData['filePath']   = Drupal.imager.settings.filePath;
      $.ajax({
        type: "POST",
        url:   url, 
        data: postData, 
        success: function (response_json) {
          clearTimeout(messageTimeout);
          Popups.$busy.hide();
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
            Popups.messages.dialogOpen();
            $('#imager-messages-content').html(out);
          }
          if (processFunc) processFunc.call($callingElement,response);   // Execute users function
          if (localStorage['imagerDebugMessages'] === "FALSE") {
            setTimeout(function() {
              Popups.messages.dialogClose();
            },3000);
          }
        },
        error: function(evt) {
          Popups.$busy.hide();
          clearTimeout(messageTimeout);
          Popups.messages.dialogOpen();
          $('#imager-messages-content').html('<p class="error">Error: ' + evt.status + ': ' + evt.statusText + 
                                             '<br>Action: ' + postData.action + '</p>');
          if (processFunc) processFunc(response,evt);   // Execute users error function
          if (localStorage['imagerDebugMessages'] === "FALSE") {
            setTimeout(function() {
            Popups.messages.dialogClose();
            },10000);
          }
        }
      });
    }; // ajaxProcess()

    return {
      init:   _init,
      attach: _attach
    };
  };
})(jQuery);
