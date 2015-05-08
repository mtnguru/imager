  
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
  
  Drupal.imager.viewer = {};
  Drupal.imager.popups.viewerC = function viewerC(spec) {
    var Popups = Drupal.imager.popups;
    var Core   = Drupal.imager.core;

    var dspec = $.extend({
                   name: 'Viewer',
                   autoOpen: false,
                   title: 'Imager Viewer/Editor',
                   zIndex: 1010,
                   width: 'auto',
                   dialogClass: 'imager-viewer-dialog imager-noclose',
                   cssId: 'imager-viewer',
                   height: 'auto',
                   resizable: true,
                   position:  { my: 'left top',
                                at: 'left top'
                              }
                 }, spec);

    var popup = Popups.baseC(dspec);
    var image;
    var img = document.createElement('IMG');
    var $imagerConfirm;

    var $canvas, $canvas2;
    var ctx, ctx2;
    var ias;

    var cw, ch;
    var mw, mh;
    var iw, ih;
    // @TODO Change these to classes - canvasC - have the image keep it's size in imageC

    var initScale = 1;
    var scaleFactor = 1.02;
    var cscale;
    var rotation = 0;

    var editMode = 'init';
    var fullScreen = false;
    var lastup = new Date();
    var dragging = false;
    var elapsed = 0;
    var distance = 0;

    var pt_down      = Core.pointC({'name': 'down',      'transform': true});
    var pt_now       = Core.pointC({'name': 'now',       'transform': true});
    var pt_crop_ul   = Core.pointC({'name': 'crop-ul',   'transform': true});
    var pt_crop_lr   = Core.pointC({'name': 'crop-lr',   'transform': true});
    var pt_canvas_ul = Core.pointC({'name': 'canvas-ul', 'transform': true});
    var pt_canvas_lr = Core.pointC({'name': 'canvas-lr', 'transform': true});
    Drupal.imager.viewer.pt_canvas_ul = pt_canvas_ul;
    Drupal.imager.viewer.pt_canvas_lr = pt_canvas_lr;

    Drupal.imager.viewer.getStatus = function getStatus() {
      return {
        'cw': cw,
        'ch': ch,
        'iw': iw,
        'ih': ih,
        'cscale': cscale,
        'rotation': rotation
      };
    };

    var changeImage = function changeImage(newImage) {
      Popups.$busy.show();
      ctx.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx.clearRect(0,0,cw,ch);        // Clear the canvas
      image = newImage;
      img.src = image.src;
      showInfo();
    };

    img.addEventListener('load', function () {
      initializeImage();
      redraw();                                        // Draw the image
      Popups.$busy.hide();
//    showPopups();               
    }, false);

    initializeImage = function initializeImage() {
      var hscale, vscale;
      rotation = 0;
      iw = img.width;
      ih = img.height;
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
        mh = $(window).height() - 20; // Maximum canvas height
        calcCanvasDims(iw,ih);
        cscale = cw/iw;
      }
      initScale = cscale;
      $canvas.attr({width:  cw,
                    height: ch});
      setEditMode('view');
      ctx.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx.clearRect(0,0,cw,ch);        // Clear the canvas
      pt_down.setPt(cw/2, ch/2, ctx);
      pt_now.setPt(0, 0, ctx);
      scale(cscale,false);                          // Set initial scaling to fit
    };

    // When image is loaded - load event is fired
   
    var redraw = Drupal.imager.viewer.redraw = function redraw() {
      pt_canvas_ul.setPt(0, 0, ctx);
      pt_canvas_lr.setPt($canvas[0].width, $canvas[0].height, ctx);
      if ((rotation === 0) || (rotation === 180)) {
        cscale = cw / Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x);
      } else {
        cscale = cw / Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y);
      }
      ctx.clearRect(pt_canvas_ul.getTxPt().x,
                    pt_canvas_ul.getTxPt().y,
                    pt_canvas_lr.getTxPt().x-pt_canvas_ul.getTxPt().x,
                    pt_canvas_lr.getTxPt().y-pt_canvas_ul.getTxPt().y);

      // Alternatively:
  //       ctx.save();
  //       ctx.setTransform(1,0,0,1,0,0);
  //       ctx.clearRect(0,0,$canvas[0].width,$canvas[0].height);
  //       ctx.restore();

      ctx.drawImage(img,0,0);
      updateStatus();
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

    var showInfo = function showInfo() {
      if (localStorage.imagerShowInfo   === "TRUE") {
        $('#view-info').addClass('checked');
        if (Popups.info.dialogIsOpen()) {
          Popups.info.dialogUpdate();
        } else {
          Popups.info.dialogOpen();
        }
      }
    };
/**
* Save the current image into a second offscreen canvas. 
*/
    var setInitialImage = Drupal.imager.viewer.setInitialImage = function setInitialImage() {
      $canvas2.attr({width:  iw,     // Set image to be full size
                     height: ih});
      ctx2.setTransform(1,0,0,1,0,0);   // Set tranform matrix to identity matrix
      ctx2.drawImage($canvas[0],0,0);
    };

    var rotate = function(deg) {
      mw = $(window).width()  - 200; // Maximum canvas width
      mh = $(window).height() - 20;  // Maximum canvas height
      ctx.clearHistory();
      iw = img.width;
      ih = img.height;
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
        $canvas.attr({width: cw,
                      height: ch});
        cscale=cw/iw;
        pt_now.setPt(cw/2, cw/2, ctx);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,$canvas[0].width, $canvas[0].height);
        if (rotation === 180) {
          ctx.translate(cw,ch);
          ctx.rotate(angleInRadians(rotation));
        } else {
  //        ctx.translate(-cw,-ch);
  //        ctx.rotate(angleInRadians(rotation));
        }
      } else {
        calcCanvasDims(ih,iw);
        $canvas.attr({width:  cw,
                      height: ch});
        cscale=cw/ih;
        pt_now.setPt(cw/2, cw/2, ctx);
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,$canvas[0].width, $canvas[0].height);
        if (rotation === 90) {
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
    
    var crop = function crop() {
      Popups.$busy.show();
      var selection = ias.getSelection();
      pt_crop_ul.setPt(selection.x1, selection.y1, ctx);
      pt_crop_lr.setPt(selection.x2, selection.y2, ctx);
      var niw = pt_crop_lr.getTxPt().x - pt_crop_ul.getTxPt().x;
      var nih = pt_crop_lr.getTxPt().y - pt_crop_ul.getTxPt().y;

      $canvas.attr({width:  niw,           // Make canvas same size as the image
                   height: nih});
      ctx.clearRect(0,0,cw,ch);
      ctx.setTransform(1,0,0,1,0,0);
      ctx.drawImage(img,
                    pt_crop_ul.getTxPt().x,
                    pt_crop_ul.getTxPt().y,
                    niw,nih,0,0,niw,nih);  // Copy cropped area from img into canvas

      img.src = $canvas[0].toDataURL();  // Copy canvas image back into img
      calcCanvasDims(niw,nih);                  // Calculate maximum size of canvas
      $canvas.attr({width:  cw,            // Make canvas proper size
                    height: ch});
      ctx.scale(cw/niw,ch/nih);                 // Scale image to fit canvas
      updateStatusGeometries();
      Popups.$busy.hide();
    };

    var zoom = function zoom(clicks){
      scale(Math.pow(scaleFactor,clicks),true);
      redraw();
//    setStatusPoints();
      updateStatusFilters();
      updateStatusGeometries();
    };

    var scale = function scale(factor,checkScale) {
      if (checkScale && factor < 1 && localStorage.imagerBoundsEnable === 'TRUE') {
        if (cscale * factor < initScale) {
          factor = initScale / cscale;
        }
      }
      ctx.translate(pt_now.getTxPt().x,pt_now.getTxPt().y);
      ctx.scale(factor,factor);
      ctx.translate(-pt_now.getTxPt().x,-pt_now.getTxPt().y);
      var npt;
      npt = outOfBounds();
      if (npt) {
//      ctx.restore();
        ctx.translate(npt.x,npt.y);
      }
    };

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
      var pw;
      var ph;
      switch (rotation) {
        case 0:
          pt_canvas_ul.setPt(0,0,ctx);
          pt_canvas_lr.setPt(cw,ch,ctx);
          pw = iw * cscale;
          ph = ih * cscale;
          break;
        case 90:
          pt_canvas_ul.setPt(cw,0,ctx);
          pt_canvas_lr.setPt(0,ch,ctx);
          pw = ih * cscale;
          ph = iw * cscale;
          break;
        case 180:
          pt_canvas_ul.setPt(cw,ch,ctx);
          pt_canvas_lr.setPt(0,0,ctx);
          pw = iw * cscale;
          ph = ih * cscale;
          break;
        case 270:
          pt_canvas_ul.setPt(0,ch,ctx);
          pt_canvas_lr.setPt(cw,0,ctx);
          pw = ih * cscale;
          ph = iw * cscale;
          break;
      }
      var msg = '<p>outOfBounds - cw: ' + cw + '  pw: ' + pw + '</p>';
      msg += '<p>outOfBounds - ch: ' + ch + '  ph: ' + ph + '</p>';
      var x1 = pt_canvas_ul.getTxPt().x;
      var y1 = pt_canvas_ul.getTxPt().y;
      var x2 = iw - pt_canvas_lr.getTxPt().x;
      var y2 = ih - pt_canvas_lr.getTxPt().y;
      // @todo - When image is smaller than the canvas the image flips back and forth.
//    if (cw < pw) {   // @todo
        if (x2 < 0) {
          msg += '<p>outOfBounds - right:' + x2 + '</p>';
          npt.x = -x2;
        }
//    }
//    if (ch < ph) {
        if (y2 < 0) {
          msg += '<p>outOfBounds - bottom:' + y2 + '</p>';
          npt.y = -y2;
        }
//    }
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

// Mouse event functions

   /**
  *  
  * @param {type} evt
  */
    function mouseDown (evt){
      document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
      var x = evt.offsetX || (evt.pageX - $canvas[0].offsetLeft);
      var y;
      // @todo - pageY works intermittently
      //         Seems to be related to the div having css 'position: fixed'
      if (evt.offsetY) {
        y = evt.offsetY || (evt.pageY - $canvas[0].offsetTop);
      } else {
        y = evt.layerY + $canvas[0].offsetTop;  
      }
      pt_down.setPt(x, y, ctx);
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
      var x = evt.offsetX || (evt.pageX - $canvas[0].offsetLeft);
      var y;
      if (evt.offsetY) {
        y = evt.offsetY || (evt.pageY - $canvas[0].offsetTop);
      } else {
        y = evt.layerY + $canvas[0].offsetTop;
      }
      pt_now.setPt(x, y, ctx);
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
        redraw();
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
          } else if (editMode === 0) {
          }
        }
      }
    }

/**
* 
* @param {type} evt
* @returns {Boolean}
*/
    function mouseWheel(evt){
      var delta = evt.wheelDelta ? evt.wheelDelta/10 : -evt.detail ? evt.detail : 0;
      if (delta) zoom(-delta);
//    evt.stopPropagation();
      return evt.preventDefault() && false;
    };


/**
* Enable events for panning and zooming and disable cropping events.
*/
    function enablePanZoom() {
      // canvas#image-canvas event handlers
      $canvas[0].addEventListener('mousedown',mouseDown,false);
      $canvas[0].addEventListener('mousemove',mouseMove,false);
      $canvas[0].addEventListener('mouseup',mouseUp,false);
      $canvas[0].addEventListener('DOMMouseScroll',mouseWheel,false);
      $canvas[0].addEventListener('mousewheel',mouseWheel,false);
      ias.setOptions({disable: true, hide: true});
    }

/**
* Enable events for cropping and disable events for cropping and zooming.
*/
    function enableCrop() {
      $canvas[0].removeEventListener('mousedown',mouseDown);
      $canvas[0].removeEventListener('mousemove',mouseMove);
      $canvas[0].removeEventListener('mouseup',mouseUp);
      $canvas[0].removeEventListener('DOMMouseScroll',mouseWheel);
      $canvas[0].removeEventListener('mousewheel',mouseWheel);
      ias.setOptions({enable: true, 
                      hide: false, 
                      show: true,
                      x1: 0,
                      x2: 0,
                      y1: 0,
                      y2: 0});
    }


// Update Status

    var updateStatusModes = function updateStatusModes () {
      Popups.status.dialogUpdate({
        'edit-mode': editMode,
        'full-screen': fullScreen
      });
     };

    var updateStatusFilters = function updateStatusFilters () {
      Popups.status.dialogUpdate({
        'rotation': rotation,
        'zoom': parseInt((cscale * 100000) / 1000) / 100
      });
    };

    var updateStatusGeometries = function updateStatusGeometries () {
      Popups.status.dialogUpdate({
        'max-canvas-width':     parseInt(mw),
        'max-canvas-height':    parseInt(mh),
        'actual-canvas-width':  parseInt(cw),
        'actual-canvas-height': parseInt(ch),
        'disp-image-width':     parseInt(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x),
        'disp-image-height':    parseInt(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y),
        'full-image-width':     parseInt(iw),
        'full-image-height':    parseInt(ih)
      });
    };


    var updateStatus = Drupal.imager.viewer.updateStatus = function updateStatus() {
      updateStatusModes();
      updateStatusFilters();
      updateStatusGeometries();
    };

    var setEditMode = Drupal.imager.viewer.setEditMode = function setEditMode(newMode, toggle) {
      var calledBy = {'calledBy': 'setEditMode'};
      if (newMode === editMode) {
        if (toggle) {
          newMode = 'view';
        } else {
          return;
        }
      }
      if (newMode !== editMode) {
        switch (editMode) {
          case 'init':
            enablePanZoom();
            break;
          case 'view':
            break;
          case 'crop':
            enablePanZoom();
            $('#mode-crop').removeClass('checked');
            break;
          case 'brightness':
            Popups.brightness.dialogClose(calledBy);
            break;
          case 'color':
            Popups.color.dialogClose(calledBy);
            break;
          case 'rotate':
            break;
          case 'database':
            Popups.filesave.dialogClose(calledBy);
            $('#file-database').removeClass('checked');
            break;
          case 'email':
            Popups.filesave.dialogClose(calledBy);
            $('#file-email').removeClass('checked');
            break;
          case 'download':
            Popups.filesave.dialogClose(calledBy);
            $('#file-download').removeClass('checked');
            break;
          case 'clipboard':
            Popups.filesave.dialogClose(calledBy);
            $('#file-clipboard').removeClass('checked');
            break;
        }
      }
      editMode = newMode;
      switch (editMode) {
        case 'view':   // no editing
          break;
        case 'crop':
          enableCrop();
          $('#mode-crop').addClass('checked');
          break;
        case 'brightness':
          Popups.brightness.dialogOpen(calledBy);
          break;
        case 'color':
          Popups.color.dialogOpen(calledBy);
          break;
        case 'rotate':
          break;
        case 'database':
          Popups.filesave.dialogOpen({'calledBy': 'setEditMode', 'saveMode': 'database'});
          $('#file-database').addClass('checked');
          break;
        case 'email':
          Popups.filesave.dialogOpen({'calledBy': 'setEditMode', 'saveMode': 'email'});
          $('#file-email').addClass('checked');
          break;
        case 'download':
          Popups.filesave.dialogOpen({'calledBy': 'setEditMode', 'saveMode': 'download'});
          $('#file-download').addClass('checked');
          break;
        case 'clipboard':
          Popups.filesave.dialogOpen({'calledBy': 'setEditMode', 'saveMode': 'clipboard'});
          $('#file-clipboard').addClass('checked');
          break;
      };
      Popups.status.dialogUpdate({'edit-mode': editMode});
    };

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
 ;     };

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
* Display any popups that are enabled. 
*/
    function showPopups() {
      popup.dialogOpen();
      showInfo();
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
    var hidePopups = function hidePopups() {
      Popups.viewer.dialogClose();
      Popups.info.dialogClose();
//    $imagerEdit.hide();
//    $imagerMap.hide();
      Popups.status.dialogClose();
      Popups.messages.dialogClose();
      $imagerConfirm.hide();
      setEditMode('view');
    };

    var initEvents = function initEvents() {

      // Image Buttons

      $('#image-left').click(function() {
        setEditMode('view');
        changeImage(Drupal.imager.findNextImage(image,-1));   
      });

      $('#image-right').click(function() {
        setEditMode('view');
        changeImage(Drupal.imager.findNextImage(image,1));
      });

      $('#image-exit').click(function() {
        if (fullScreen) {
          screenfull.exit();
          setFullScreen(false);
        } else {
          hidePopups();
        }
      });

      // Mode Buttons

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

      // View Buttons

      $('#view-zoom-fit').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(0);
      });
      $('#view-zoom-1').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(0);
      });
      $('#view-zoom-in').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(1);
      });
      $('#view-zoom-out').click(function() {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(-1);
      });

    }; // initEvents()


// dialog handling functions

    popup.dialogOnCreate = function dialogOnCreate() {

      $canvas = $('#imager-canvas');
      ctx  = $canvas[0].getContext('2d');
      Drupal.imager.viewer.$canvas  = $canvas;
      Drupal.imager.viewer.ctx  = ctx;
      ias = $canvas.imgAreaSelect({  // attach handler to create cropping area
        instance: true,
        disable: true,
        handles: true,
        autoHide: false,
        hide: true,
        show: true
      });         

      $canvas2 = $(document.createElement('CANVAS'));
      ctx2 = $canvas2[0].getContext('2d');  
      Drupal.imager.viewer.$canvas2 = $canvas2;
      Drupal.imager.viewer.ctx2 = ctx2;
      $imagerConfirm = $('#imager-confirm');
      $imagerConfirm.hide();
      $canvas2.hide();              // Never displayed, used to save images temporarily

      Popups.initDialog('color',              '#edit-color',      function() {setEditMode("color", true);});
      Popups.initDialog('brightness',         '#edit-brightness', function() {setEditMode("brightness", true);});
      Popups.initDialog('config',             '#mode-configure',  function() {Popups.config.dialogToggle();});
      Popups.initDialog('info',               '#view-info',       function() {Popups.info.dialogToggle();});
      Popups.initDialog('status',              undefined,         function() {Popups.status.dialogToggle();});
      Popups.initDialog('messages',            undefined,         function() {Popups.messages.dialogToggle();});

      Popups.initDialog('filesave',   undefined);
      $('#file-database').click(function ()  { setEditMode('database', true);  Popups.filesave.setSelectButton($(this));});
      $('#file-email').click(function ()     { setEditMode('email', true);     Popups.filesave.setSelectButton($(this));});
      $('#file-download').click(function ()  { setEditMode('download', true);  Popups.filesave.setSelectButton($(this));});
      $('#file-clipboard').click(function () { setEditMode('clipboard', true); Popups.filesave.setSelectButton($(this));});

      $('#mode-crop').click(function()       { setEditMode('crop',true);});
      $('#edit-ccw').click(function()        { setEditMode('rotate'); rotate(-90); });
      $('#edit-cw').click(function()         { setEditMode('rotate'); rotate(90); });
      $('#view-reset').click(function(evt)   { setEditMode('view');   changeImage(image); });

      initEvents();
      trackTransforms(ctx); 
      setEditMode('view');

      popup.dialogOpen();
    };

    Drupal.imager.viewer.copyCanvasToImg = function copyCanvasToImg () {
      img.src = $canvas[0].toDataURL();
    };

    Drupal.imager.viewer.getImage = function getImage() {
      return image;
    };


    popup.dialogOnOpen = function dialogOnOpen() {
      popup.dialogUpdate();
    };

    popup.dialogOnClose = function dialogOnClose() {
    };

    popup.dialogInit = function dialogInit() {
    };

    popup.dialogUpdate = function dialogUpdate(settings) {
      $.extend(popup.settings,settings);
      changeImage(popup.settings.image);
    };

    return popup;
  };
})(jQuery);
