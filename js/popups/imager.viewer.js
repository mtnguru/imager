/**
 * @file
 * Declare Imager module Viewer dialog - Drupal.imager.popups.viewerC.
 */

/**
 * Wrap file in JQuery();.
 *
 * @param $
 */
(function ($) {
  "use strict";

  Drupal.imager.viewer = {};

  if (localStorage.getItem('imagerBoundsEnable') === null) {
    localStorage.setItem('imagerBoundsEnable', true);
  }

  /**
   * Define the viewerC dialog class.
   *
   * @param {type} spec - settings to override defaults
   *
   * @return {viewerC} popup
   */
  Drupal.imager.popups.viewerC = function viewerC(spec) {
    var Popups = Drupal.imager.popups;
    var Core = Drupal.imager.core;

    // Declare default specs and merge in additional specs.
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
      // position: {'fixed'},
      position: {
        my: 'left top',
        at: 'left top'
      },
      // Keep the dialog position fixed and in upper left corner.
      open: function (event, ui) {
        $(this).parent().css('position', 'fixed');
      }
    }, spec);

    var popup = Popups.baseC(dspec); // Initialize viewerC from baseC.
    var image;                       // Current image of imageC.
    var img = document.createElement('IMG'); // Storage for current image.
    var $imgOverlay;                 // Image that overlays the canvas.
    var clearOverlay = false;        // Clear the overlay with transparent image.
    var $canvas, $canvas2;    // Primary and Secondary canvas's
    var ctx, ctx2;            // Related contexts for canvas's
    var ias;                  // Image area select object.
    var cw, ch;               // Canvas width and height.
    var mw, mh;               // Maximum canvas width and height.
    var doInit;               // After loading should we reinitialize.
    var initScale = 1;        // Initial Zoom/scaling factor.
    var scaleFactor = 1.02;   // How much to scale image per click.
    var cscale;               // Current scaling factor.
    var rotation = 0;         // Current rotation.
    var editMode = 'init';    // init, view, crop, brightness, hsl,
                              // download, email, database, clipboard.
    var fullScreen = false;   // Full Screen mode.
    var lastup = new Date();  // Time of last mouse up event.
    var moveMode = 'none';    // none, dragging, zoom.
    var elapsed = 0;          // Time between mouse up events.
    var distance = 0;         // Distance image dragged since mouse down.

    // Points of interest
    // Location of last mouse down event.
    var pt_down = Core.pointC({name: 'down'});           // Last mouse down event.
    var pt_last = Core.pointC({name: 'down'});           // Last mouse move event.
    var pt_now = Core.pointC({name: 'now'});             // Mouse currently.
    var pt_crop_ul = Core.pointC({name: 'crop-ul'});     // Upper left crop point.
    var pt_crop_lr = Core.pointC({name: 'crop-lr'});     // Lower right crop point.
    var pt_canvas_ul = Core.pointC({name: 'canvas-ul'}); // Upper left corner of image.
    var pt_canvas_lr = Core.pointC({name: 'canvas-lr'}); // Lower right corner of image.

    // Make these points accessible globally.
    Drupal.imager.viewer.pt_canvas_lr = pt_canvas_lr;
    Drupal.imager.viewer.pt_canvas_ul = pt_canvas_ul;

    /**
     * Get current status of imager Viewer
     *
     * @return {Object}
     *   Current popup size, cscale and rotation.
     */
    Drupal.imager.viewer.getStatus = function getStatus() {
      return {
        cw: cw,
        ch: ch,
        cscale: cscale,
        rotation: rotation
      };
    };

    /**
     * Change the current image to a new image.
     *
     * The line -- img.src = image.src -- starts the loading of an image.
     * Upon completion of loading the 'load' Event Listener is fired.
     *
     * @param {Object} newImage
     *   New image to display of imageC.
     */
    var changeImage = function changeImage(newImage) {
      Popups.$busy.show();
      // Set transform matrix to identity matrix.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Clear the canvas.
      ctx.clearRect(0, 0, cw, ch);
      image = newImage;
      doInit = true;
      // Starts the loading, caught by 'load' listener.
      img.src = image.src;
    };

    /**
     * Upon completion of image loading, initialize and draw the image to canvas.
     */
    var drawImage = function drawImage() {
      if (doInit) {
        initializeImage();
        doInit = false;
      }
      redraw();
      showInfo();
      Popups.$busy.hide();
    };

    img.addEventListener('load', drawImage, false);

    /**
     * Calculate canvas and image dimensions, reset variables, initialize transforms
     *
     * @TODO - When calculating the canvas dimensions the borders and padding must be
     * accounted for.  Currently these are constants that look good with my theme.
     */
    var initializeImage = function initializeImage() {
      var hscale;
      var vscale;
      rotation = 0;
      image.iw = img.width;
      image.ih = img.height;
      if (fullScreen) {
        mw = $(window).width() - 45;
        // Maximum canvas width.
        mh = $(window).height() - 10;
        // Maximum canvas height.
        cw = mw;
        ch = mh;
        hscale = ch / image.ih;
        vscale = cw / image.iw;
        cscale = (hscale < vscale) ? hscale : vscale;
      }
      else {
        mw = $(window).width() - 95;
        // Maximum canvas width.
        mh = $(window).height() - 20;
        // Maximum canvas height.
        calcCanvasDims(image.iw, image.ih);
        cscale = cw / image.iw;
      }
      initScale = cscale;
      // Save scaling where image fits canvas.
      $canvas.attr({width: cw, height: ch});
      $imgOverlay.width(cw).height(ch);
      $('#imager-canvas-wrapper').width(cw).height(ch);
      setEditMode('view');
      // Set transform matrix to identity matrix.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Clear the canvas.
      ctx.clearRect(0, 0, cw, ch);

      pt_down.setPt(cw / 2, ch / 2, ctx);
      // Initialize last mouse down event to center.
      pt_now.setPt(0, 0, ctx);
      // Initialize last mouse event to upper left.
      scale(cscale, false);
      // Set initial scaling to fit canvas.
    };

    /**
     * Clear canvas and draw image to the canvas
     */
    var redraw = Drupal.imager.viewer.redraw = function redraw() {
      pt_canvas_ul.setPt(0, 0, ctx);
      pt_canvas_lr.setPt($canvas[0].width, $canvas[0].height, ctx);
      // Calculate the scale based on actual.
      if ((rotation === 0) || (rotation === 180)) {
        cscale = cw / Math.abs(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x);
      }
      else {
        cscale = cw / Math.abs(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y);
      }
      ctx.clearRect(
        pt_canvas_ul.getTxPt().x,
        pt_canvas_ul.getTxPt().y,
        pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x,
        pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y);

      ctx.drawImage(img, 0, 0);
      updateStatus();
    };

    /**
     * Given the screen width and height, calculate the canvas width and height.
     *
     * @param {number} sw - Screen width
     * @param {number} sh - Screen height
     */
    var calcCanvasDims = function calcCanvasDims(sw, sh) {
      ch = sh * mw / sw;
      if (ch < mh) {
        // Width determines max size.
        cw = mw;
      }
      else {
        // Height determines max size.
        ch = mh;
        cw = sw * mh / sh;
      }
      cw = parseInt(cw);
      ch = parseInt(ch);
    };

    /**
     * If enabled show the Information popup, if already showing update the contents
     */
    var showInfo = function showInfo() {
      if (localStorage.imagerShowInfo === "true") {
        $('#view-info').addClass('checked');
        if (Popups.info.dialogIsOpen()) {
          Popups.info.dialogUpdate();
        }
        else {
          Popups.info.dialogOpen();
        }
      }
    };

    /**
     * Print image to web server.
     */
    var printImage = function printImage() {
      // displayMessage('Extracting Image...');
      Popups.$busy.hide();
      var img = Drupal.imager.core.getImage('image-cropped', false);
      // displayMessage('Saving Image...');
      Drupal.imager.core.ajaxProcess(
        $('#file-print'),
        Drupal.imager.settings.actions.printImage.url,
        {action: 'file-print',
         uri: image.src,
         printer: localStorage.imagerPrinter,
         imgBase64: img
        }, function (response) {
          var path = response['data']['uri'];
          window.open(path, '_blank');
        }
      );
      setEditMode('view');
    };

    /**
     * Copy the primary canvas into a second offscreen canvas.
     */
    Drupal.imager.viewer.setInitialImage = function setInitialImage() {
      $canvas2.attr({
        width: image.iw,
        height: image.ih
      });
      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      // Set transform matrix to identity matrix.
      // The original img is kept unrotated.
      ctx2.drawImage($canvas[0], 0, 0);
      // ctx2.drawImage(img, 0, 0);
    };

    Drupal.imager.viewer.applyFilter = function applyFilter(filterFunction) {
      Popups.$busy.show();
      var $canvas3 = $(document.createElement('CANVAS'));

      $canvas2.attr({width:  image.iw, height: image.ih});
      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      ctx2.drawImage(img, 0, 0);

      $canvas3.attr({width:  image.iw, height: image.ih});
      // Colorize while transferring from canvas2 to canvas3.
      filterFunction($canvas2, $canvas3);
      img.src = $canvas3[0].toDataURL();

      redraw();
      setEditMode('view');
      Popups.$busy.hide();
    };

    /**
     * Rotate the image.
     *
     * @param {number} deg - Number of degrees to rotate - 0, 90, 180, 270
     */
    var rotate = function rotate(deg) {
      mw = $(window).width() - 200;
      // Maximum canvas width.
      mh = $(window).height() - 20;
      // Maximum canvas height.
      ctx.clearHistory();
      image.iw = img.width;
      image.ih = img.height;
      if (deg === 90) {
        rotation = (rotation === 270) ? 0 : rotation += 90;
      }
      else {
        if (deg === -90) {
          rotation = (rotation === 0) ? 270 : rotation -= 90;
        }
      }
      Popups.status.dialogUpdate({rotation: rotation});
      if (rotation === 0 || rotation === 180) {
        calcCanvasDims(image.iw, image.ih);
        $canvas.attr({width: cw, height: ch});
        $imgOverlay.width(cw).height(ch);
        $('#imager-canvas-wrapper').width(cw).height(ch);
        cscale = cw / image.iw;
        pt_now.setPt(cw / 2, cw / 2, ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, $canvas[0].width, $canvas[0].height);
        if (rotation === 180) {
          ctx.translate(cw, ch);
          ctx.rotate(Core.angleInRadians(rotation));
        }
        else {
          // ctx.translate(-cw, -ch);
          // ctx.rotate(Core.angleInRadians(rotation));
        }
      }
      else {
        calcCanvasDims(image.ih, image.iw);
        $imgOverlay.width(cw).height(ch);
        $('#imager-canvas-wrapper').width(cw).height(ch);
        $canvas.attr({width: cw, height: ch});
        cscale = cw / image.ih;
        pt_now.setPt(cw / 2, cw / 2, ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, $canvas[0].width, $canvas[0].height);
        if (rotation === 90) {
          ctx.translate(cw, 0);
        }
        else {
          ctx.translate(0, ch);
        }
        ctx.rotate(Core.angleInRadians(rotation));
      }
      initScale = cscale;
      ctx.scale(cscale, cscale);
      redraw();
      showPopups();
    };

    /**
     * Crop image.
     */
    var crop = function crop() {
      Popups.$busy.show();
      var selection = ias.getSelection();
      pt_crop_ul.setPt(selection.x1, selection.y1, ctx);
      pt_crop_lr.setPt(selection.x2, selection.y2, ctx);
      var niw = pt_crop_lr.getTxPt().x - pt_crop_ul.getTxPt().x;
      var nih = pt_crop_lr.getTxPt().y - pt_crop_ul.getTxPt().y;

      $canvas.attr({
        width: niw,
        // Make canvas same size as the image.
        height: nih
      });
      ctx.clearRect(0, 0, cw, ch);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img,
        pt_crop_ul.getTxPt().x,
        pt_crop_ul.getTxPt().y,
        niw, nih, 0, 0, niw, nih);
      // Copy cropped area from img into canvas.
      img.src = $canvas[0].toDataURL();
      // Copy canvas image back into img.
      calcCanvasDims(niw, nih);
      // Calculate maximum size of canvas.
      $canvas.attr({width: cw, height: ch});
      $imgOverlay.width(cw).height(ch);
      $('#imager-canvas-wrapper').width(cw).height(ch);
      ctx.scale(cw / niw, ch / nih);
      // Scale image to fit canvas.
      updateStatusGeometries();
      Popups.$busy.hide();
    };

    /**
     * Zoom image
     *
     * @param {number} clicks - how much zoom?
     */
    var zoom = function zoom(clicks) {
      scale(Math.pow(scaleFactor, clicks), true);
      redraw();
      // setStatusPoints();
      updateStatusFilters();
      updateStatusGeometries();
    };

    /**
     * Scale the image larger or smaller.
     *
     * @param {number} factor
     *   Scaling factor.
     * @param {boolean} checkScale
     *   Limit scaling to the not be smaller than the viewing area.
     */
    var scale = function scale(factor, checkScale) {
      // Check to see scaling will shrink image smaller than canvas.
      if (checkScale && factor < 1 && localStorage.imagerBoundsEnable === 'true') {
        if (cscale * factor < initScale) {
          factor = initScale / cscale;
        }
      }

      ctx.translate(pt_now.getTxPt().x, pt_now.getTxPt().y);
      ctx.scale(factor, factor);
      ctx.translate(-pt_now.getTxPt().x, -pt_now.getTxPt().y);
      var npt;
      npt = outOfBounds();
      if (npt) {
        ctx.translate(npt.x, npt.y);
      }
    };

    /**
     * Check if panning or zooming is causing image to leave a margin at edges.
     *
     * If so calculate the translation necessary to move image back to the edge.
     *
     * @return {Object}
     *   Return a point with offsets to move the image back on screen.
     */
    var outOfBounds = function outOfBounds() {
      var npt = {
        x: 0,
        y: 0
      };
      if (localStorage.imagerBoundsEnable === 'false') {
        return;
      }
      var pw;
      var ph;
      switch (rotation) {
        case 0:
          pt_canvas_ul.setPt(0, 0, ctx);
          pt_canvas_lr.setPt(cw, ch, ctx);
          pw = image.iw * cscale;
          ph = image.ih * cscale;
          break;

        case 90:
          pt_canvas_ul.setPt(cw, 0, ctx);
          pt_canvas_lr.setPt(0, ch, ctx);
          pw = image.ih * cscale;
          ph = image.iw * cscale;
          break;

        case 180:
          pt_canvas_ul.setPt(cw, ch, ctx);
          pt_canvas_lr.setPt(0, 0, ctx);
          pw = image.iw * cscale;
          ph = image.ih * cscale;
          break;

        case 270:
          pt_canvas_ul.setPt(0, ch, ctx);
          pt_canvas_lr.setPt(cw, 0, ctx);
          pw = image.ih * cscale;
          ph = image.iw * cscale;
          break;
      }
      var msg = '<p>outOfBounds - cw: ' + cw + '  pw: ' + pw + '</p>';
      msg += '<p>outOfBounds - ch: ' + ch + '  ph: ' + ph + '</p>';
      var x1 = pt_canvas_ul.getTxPt().x;
      var y1 = pt_canvas_ul.getTxPt().y;
      var x2 = image.iw - pt_canvas_lr.getTxPt().x;
      var y2 = image.ih - pt_canvas_lr.getTxPt().y;
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
      if (npt.x || npt.y) {
        return npt;
      }
      return;
    };

    /**
     * Mouse Down event handler.
     *
     * @param {Event} evt
     *  The event.
     */
    function mouseDown(evt) {
      if (evt.which !== 1) return;
      evt.preventDefault();
      setEditMode('view');
      document.body.style.mozUserSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';
      var y;
      var x = evt.offsetX || (evt.pageX - $canvas[0].offsetLeft);
      // @todo - pageY works intermittently
      // Appears to be related to the div having css 'position: fixed'
      if (evt.offsetY) {
        y = evt.offsetY || (evt.pageY - $canvas[0].offsetTop);
      }
      else {
        y = evt.layerY + $canvas[0].offsetTop;
      }
      pt_down.setPt(x, y, ctx);
      pt_now.setPt(x, y, ctx);
      pt_last.setPt(x, y, ctx);
      if (evt.shiftKey) {
        moveMode = 'zoom';
      }
      else {
        moveMode = 'dragging';
      }
      distance = 0;
      Popups.status.dialogUpdate({distance: parseInt(distance)});
    }

    /**
     * Mouse Move event handler
     *
     * @param {Event} evt
     *  The event.
     */
    function mouseMove(evt) {
      if (evt.which !== 1 || moveMode === 'none') {
        return;
      }
      evt.preventDefault();
      setEditMode('view');
      var x = evt.offsetX || (evt.pageX - $canvas[0].offsetLeft);
      var y;
      if (evt.offsetY) {
        y = evt.offsetY || (evt.pageY - $canvas[0].offsetTop);
      }
      else {
        y = evt.layerY + $canvas[0].offsetTop;
      }
      pt_now.setPt(x, y, ctx);

      if (evt.shiftKey) {
        moveMode = 'zoom';
      }
      else {
        moveMode = 'dragging';
      }
      switch (moveMode) {
        case 'dragging':
          distance = Math.sqrt((Math.pow(pt_down.getPt().x - pt_now.getPt().x, 2)) +
          (Math.pow(pt_down.getPt().y - pt_now.getPt().y, 2)));
          Popups.status.dialogUpdate({distance: parseInt(distance)});
          ctx.save();
          ctx.translate(pt_now.getTxPt().x - pt_down.getTxPt().x,
            pt_now.getTxPt().y - pt_down.getTxPt().y);
          var npt;
          // Recommended x and y motions that won't go out of bounds.
          npt = outOfBounds();
          if (npt !== undefined) {
            ctx.restore();
            ctx.translate(pt_now.getTxPt().x - pt_down.getTxPt().x + npt.x,
              pt_now.getTxPt().y - pt_down.getTxPt().y + npt.y);
          }
          redraw();
          break;

        case 'zoom':
          var clicks = (pt_last.getPt().y - pt_now.getPt().y) / 3;
          zoom(clicks);
          pt_last.setPt(x, y, ctx);
          break;
      }
    }

    /**
     * Mouse Up event handler
     *
     * @param {Event} evt
     *  The event.
     */
    function mouseUp(evt) {
      if (evt.which !== 1) return;
      evt.preventDefault();
      moveMode = 'none';
      var now = new Date();
      elapsed = now - lastup;
      Popups.status.dialogUpdate({elapsed: elapsed * 1000 / 1000000});
      lastup = now;
      if (distance < 20) {
        // If mouse didn't move between clicks.
        if (evt.ctrlKey) {
          zoom(evt.shiftKey ? -1 : 1);
        }
        else {
          if (elapsed < 500) {
            // If double click.
            if (fullScreen) {
              screenfull.exit();
              setFullScreen(false);
            }
            else {
              hidePopups();
            }
          }
          else {
            if (editMode === 0) {
              ;
            }
          }
        }
      }
    }

    /**
     * Mouse Wheel event handler
     *
     * @param {type} evt
     *   The event.
     *
     * @return {Boolean}
     *   Stops event propagation.
     */
    function mouseWheel(evt) {
      setEditMode('view');
      var delta = evt.wheelDelta ? evt.wheelDelta / 10 : -evt.detail ? evt.detail : 0;
      var y;
      var x = evt.offsetX || (evt.pageX - $canvas[0].offsetLeft);
      // @todo - pageY works intermittently
      // Appears to be related to the div having css 'position: fixed'
      if (evt.offsetY) {
        y = evt.offsetY || (evt.pageY - $canvas[0].offsetTop);
      }
      else {
        y = evt.layerY + $canvas[0].offsetTop;
      }
      pt_now.setPt(x, y, ctx);
      if (delta) {
        zoom(-delta);
      }
      evt.stopPropagation();
      evt.preventDefault();
      return false;
    }

    /**
     * Enable event handlers for panning, zooming - disable cropping handlers.
     */
    function enablePanZoom() {
      // canvas#image-canvas event handlers.
      // $imgOverlay[0].addEventListener('contextmenu', contextMenu, false);
      // $imgOverlay[0].addEventListener('click', click, false);
      $imgOverlay[0].addEventListener('mousedown', mouseDown, false);
      $imgOverlay[0].addEventListener('mousemove', mouseMove, false);
      $imgOverlay[0].addEventListener('mouseup', mouseUp, false);
      $imgOverlay[0].addEventListener('DOMMouseScroll', mouseWheel, false);
      $imgOverlay[0].addEventListener('mousewheel', mouseWheel, false);
      ias.setOptions({disable: true, hide: true});
    }

    /**
     * Enable event handlers for cropping - disable handlers for panning and zooming.
     */
    function enableCrop() {
      // $imgOverlay[0].removeEventListener('contextmenu', contextMenu);
      // $imgOverlay[0].removeEventListener('click', click);
      $imgOverlay[0].removeEventListener('mousedown', mouseDown);
      $imgOverlay[0].removeEventListener('mousemove', mouseMove);
      $imgOverlay[0].removeEventListener('mouseup', mouseUp);
      $imgOverlay[0].removeEventListener('DOMMouseScroll', mouseWheel);
      $imgOverlay[0].removeEventListener('mousewheel', mouseWheel);
      ias.setOptions({
        enable: true,
        hide: false,
        show: true,
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 0
      });
    }

    /**
     * Update status dialog - modes
     */
    var updateStatusModes = function updateStatusModes() {
      Popups.status.dialogUpdate({
        'edit-mode': editMode,
        'full-screen': fullScreen
      });
    };

    /**
     * Update status dialog - Filters
     */
    var updateStatusFilters = function updateStatusFilters() {
      Popups.status.dialogUpdate({
        rotation: rotation,
        zoom: parseInt((cscale * 100000) / 1000) / 100
      });
    };

    /**
     * Update Geometries of screen, canvas, image and portion of image displayed.
     */
    var updateStatusGeometries = function updateStatusGeometries() {
      Popups.status.dialogUpdate({
        'max-canvas-width': parseInt(mw),
        'max-canvas-height': parseInt(mh),
        'actual-canvas-width': parseInt(cw),
        'actual-canvas-height': parseInt(ch),
        'disp-image-width': parseInt(pt_canvas_lr.getTxPt().x - pt_canvas_ul.getTxPt().x),
        'disp-image-height': parseInt(pt_canvas_lr.getTxPt().y - pt_canvas_ul.getTxPt().y),
        'full-image-width': parseInt(image.iw),
        'full-image-height': parseInt(image.ih)
      });
    };

    /**
     * Update status dialog
     */
    var updateStatus = Drupal.imager.viewer.updateStatus = function updateStatus() {
      updateStatusModes();
      updateStatusFilters();
      updateStatusGeometries();
    };

    /**
     * Set the Edit mode
     *
     * @param {string} newMode
     *   The desired new mode.
     * @param {string} toggle
     *   Toggle the mode or set it.
     */
    var setEditMode = Drupal.imager.viewer.setEditMode = function setEditMode(newMode, toggle) {
      var oldMode = editMode;
      clearOverlayImg();
      if (newMode === editMode) {
        if (toggle) {
          newMode = 'view';
        }
        else {
          return;
        }
      }
      editMode = newMode;
      if (newMode !== oldMode) {
        switch (oldMode) {
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
            Popups.brightness.dialogClose();
            break;

          case 'color':
            Popups.color.dialogClose();
            break;

          case 'rotate':
            break;

          case 'database':
            Popups.filesave.dialogClose();
            $('#file-database').removeClass('checked');
            break;

          case 'email':
            Popups.filesave.dialogClose();
            $('#file-email').removeClass('checked');
            break;

          case 'print':
            $('#file-print').removeClass('checked');
            break;

          case 'download':
            Popups.filesave.dialogClose();
            $('#file-download').removeClass('checked');
            break;

          case 'clipboard':
            Popups.filesave.dialogClose();
            $('#file-clipboard').removeClass('checked');
            break;
        }
      }
      switch (editMode) {
        case 'view':
          // No editing.
          break;

        case 'crop':
          enableCrop();
          $('#mode-crop').addClass('checked');
          break;

        case 'brightness':
          Popups.brightness.dialogOpen();
          break;

        case 'color':
          Popups.color.dialogOpen();
          break;

        case 'rotate':
          break;

        case 'database':
          Popups.filesave.dialogOpen({saveMode: 'database'});
          $('#file-database').addClass('checked');
          break;

        case 'email':
          Popups.filesave.dialogOpen({saveMode: 'email'});
          $('#file-email').addClass('checked');
          break;

        case 'print':
          $('#file-print').addClass('checked');
          printImage();
          break;

        case 'download':
          Popups.filesave.dialogOpen({saveMode: 'download'});
          $('#file-download').addClass('checked');
          break;

        case 'clipboard':
          Popups.filesave.dialogOpen({saveMode: 'clipboard'});
          $('#file-clipboard').addClass('checked');
          break;
      }
      Popups.status.dialogUpdate({edit-mode: editMode});
    };

    /**
     * Track history of transforms done to this image.
     *
     * @param {Object} ctx
     *  I'm not sure, I didn't write it.
     */

    function trackTransforms(ctx) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
      var xform = svg.createSVGMatrix();
      // ctx.getTransform = function(){ return xform; };
      var savedTransforms = [];
      var save = ctx.save;
      ctx.save = function () {
        savedTransforms.push(xform.translate(0, 0));
        return save.call(ctx);
      };
      var restore = ctx.restore;
      ctx.restore = function () {
        xform = savedTransforms.pop();
        return restore.call(ctx);
      };

      var pt = svg.createSVGPoint();
      ctx.transformedPoint = function (x, y) {
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(xform.inverse());
      };

      var scale = ctx.scale;
      ctx.scale = function (sx, sy) {
        xform = xform.scaleNonUniform(sx, sy);
        return scale.call(ctx, sx, sy);
      };
      var translate = ctx.translate;
      ctx.translate = function (dx, dy) {
        xform = xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
      };
      var rotate = ctx.rotate;
      ctx.rotate = function (radians) {
        xform = xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
      };

      /* Var transform = ctx.transform;
         ctx.transform = function(a, b, c, d, e, f){
         var m2 = svg.createSVGMatrix();
           m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
            xform = xform.multiply(m2);
            return transform.call(ctx, a, b, c, d, e, f);
          }; */

      ctx.clearHistory = function () {
        savedTransforms = [];
      };
      var setTransform = ctx.setTransform;
      ctx.setTransform = function (a, b, c, d, e, f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
      };
    }   // trackTransforms

    /**
     * Display any popups that are enabled.
     */
    function showPopups() {
      popup.dialogOpen();
      showInfo();
      if (localStorage.imagerDebugStatus === "true") {
        $('#debug-status').addClass('checked');
        Popups.status.dialogOpen();
      }
      if (localStorage.imagerDebugMessages === "true") {
        $('#debug-messages').addClass('checked');
        // Popups.messages.dialogOpen();
      }
      if (localStorage.imagerShowMap === "true") {
        $('#view-map').addClass('checked');
        Popups.map.dialogOpen();
      }
    }

    /**
     * Hide all popups and the main viewer window.
     */
    var hidePopups = function hidePopups() {
      Popups.viewer.dialogClose();
      Popups.info.dialogClose();
      // $imagerEdit.hide();
      // $imagerMap.hide();
      Popups.status.dialogClose();
      Popups.messages.dialogClose();
      Popups.confirm.dialogClose();
      setEditMode('view');
    };

    var fillOverlayImg = function fillOverlayImg() {
      $imgOverlay[0].src = Drupal.imager.core.getImage('image-cropped', false);
      var start = new Date().getTime();
      var milliseconds = 250;
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
          break;
        }
      }
      clearOverlay = true;
    };

    var clearOverlayImg = function clearOverlayImg() {
      if (!clearOverlay) return;
      $imgOverlay[0].src = "/" + Drupal.imager.settings.modulePath + "/icons/transparent.png";
      clearOverlay = false;
    };

    // Dialog handling functions.
    popup.dialogOnCreate = function dialogOnCreate() {
      Drupal.imager.viewer.$canvas = $canvas = $('#imager-canvas');
      Drupal.imager.viewer.ctx = ctx = $canvas[0].getContext('2d');
      ias = $canvas.imgAreaSelect({
        // Attach handler to create cropping area.
        instance: true,
        disable: true,
        handles: true,
        autoHide: false,
        hide: true,
        show: true
      });

      Drupal.imager.viewer.$canvas2 = $canvas2 = $(document.createElement('CANVAS'));
      Drupal.imager.viewer.ctx2 = ctx2 = $canvas2[0].getContext('2d');
      $canvas2.hide();
      // Never displayed, used to save images temporarily.
      // Initialize Dialogs.
      Popups.initDialog('color', '#edit-color', function () {
        setEditMode("color", true);
      });
      Popups.initDialog('brightness', '#edit-brightness', function () {
        setEditMode("brightness", true);
      });
      Popups.initDialog('config', '#mode-configure', function () {
        Popups.config.dialogToggle();
      });
      Popups.initDialog('info', '#view-info', function () {
        Popups.info.dialogToggle();
      });
      Popups.initDialog('status', '', function () {
        Popups.status.dialogToggle();
      });
      Popups.initDialog('messages', '', function () {
        Popups.messages.dialogToggle();
      });
      Popups.initDialog('confirm', '#file-delete', function () {
        Popups.confirm.dialogToggle();
      });
      Popups.initDialog('edit', '', function () {
        Popups.edit.dialogToggle();
      });
      Popups.initDialog('filesave', '', undefined);

      // File Buttons.
      $('#file-database').click(function () {
        setEditMode('database', true);
        Popups.filesave.setSelectButton($(this));
      });

      /*
        $('#file-email').click(function () {
        setEditMode('email', true);
        Popups.filesave.setSelectButton($(this));
      }); */

      $('#file-download').click(function () {
        setEditMode('download', true);
        Popups.filesave.setSelectButton($(this));
      });

      /*
      $('#file-clipboard').click(function () {
        setEditMode('clipboard', true);
        Popups.filesave.setSelectButton($(this));
      }); */

      $('#file-print').click(function () {
        setEditMode('print');
      });

      $('#file-image').click(function (evt) {
        $imgOverlay.triggerHandler(evt);
      });

      $imgOverlay = $('#imager-image');
      $imgOverlay.on("contextmenu", fillOverlayImg);

      /* $imgOverlay.click(vun);
         $imgOverlay.mousedown(function (evt) { $canvas.mousedown(); return false; });
         $imgOverlay.mousemove(function (evt) { $canvas.mousemove(); return false; });
         $imgOverlay.mouseup(  function (evt) { $canvas.mouseup(); return false; });
         $imgOverlay[0].addEventListener('DOMMouseScroll', function (evt) { $canvas.DOMMouseScroll(evt); }, false);
         $imgOverlay[0].addEventListener('mousewheel', function (evt) { $canvas.mousewheel(); }, false);

         Popups.initDialog('image', '#file-image', function () {
           var dataurl = Drupal.imager.core.getImage('image-cropped', false);
           Popups.image.dialogToggle({
             'attr': {
               'src': Drupal.imager.core.getImage('image-cropped', false),
               'width': cw,
               'height': ch
             }
           });
         }); */

      // Edit Buttons.
      $('#mode-crop').click(function () {
        setEditMode('crop', true);
      });
      $('#edit-crop').click(function () {
        crop();
        setEditMode('view');
      });
      $('#edit-ccw').click(function () {
        setEditMode('rotate');
        rotate(-90);
      });
      $('#edit-cw').click(function () {
        setEditMode('rotate');
        rotate(90);
      });
      $('#view-reset').click(function () {
        setEditMode('view');
        changeImage(image);
      });

      // Image Buttons.
      $('#image-left').click(function () {
        setEditMode('view');
        changeImage(Drupal.imager.findNextImage(image, -1));
      });
      $('#image-right').click(function () {
        setEditMode('view');
        changeImage(Drupal.imager.findNextImage(image, 1));
      });
      $('#image-exit').click(function () {
        if (fullScreen) {
          screenfull.exit();
          setFullScreen(false);
        }
        else {
          hidePopups();
        }
      });

      // Mode Buttons.
      $('#mode-fullscreen').click(function () {
        if (screenfull.enabled) {
          // We can use `this` since we want the clicked element.
          screenfull.toggle(Drupal.imager.$wrapper[0]);
          if (fullScreen) {
            setFullScreen(false);
          }
          else {
            setFullScreen(true);
          }
        }
      });

      // View Buttons.
      $('#view-browser').click(function () {
        // displayMessage('Extracting Image...');
        Popups.$busy.hide();
        var img = Drupal.imager.core.getImage('image-cropped', false);
        // displayMessage('Saving Image...');
        Drupal.imager.core.ajaxProcess(
          this,
          Drupal.imager.settings.actions.viewBrowser.url,
          { action: 'view-browser',
            uri: image.src,
            imgBase64: img
          }, function (response) {
            var path = response['data']['uri'];
            window.open(path, '_blank');
          }
        );
      });
      $('#view-zoom-fit').click(function () {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(0);
      });
      $('#view-zoom-1').click(function () {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(0);
      });
      $('#view-zoom-in').click(function () {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(1);
      });
      $('#view-zoom-out').click(function () {
        pt_now.setPt(pt_down.getPt().x, pt_down.getPt().y, ctx);
        zoom(-1);
      });

      trackTransforms(ctx);
      setEditMode('view');

      popup.dialogOpen();
      return popup;
    };

    /**
     * Copy the canvas into the current IMG
     *
     * @return {viewerC} popup
     */
    Drupal.imager.viewer.copyCanvasToImg = function copyCanvasToImg() {
      img.src = $canvas[0].toDataURL();
      return popup;
    };

    /**
     * Return the <IMG> element containing the current image.
     * @return {Object} img
     */
    Drupal.imager.viewer.getImg = function getImg() {
      return img;
    };

    /**
     * Viewer dialog has finished opening
     *
     * @return {viewerC} popup
     */
    popup.dialogOnOpen = function dialogOnOpen() {
      popup.dialogUpdate();
      return popup;
    };

    /**
     * Viewer dialog has closed - do nothing
     *
     * @return {viewerC} popup
     */
    popup.dialogOnClose = function dialogOnClose() {
      return popup;
    };

    /**
     * Request to update the Viewer dialog.
     *
     * @param {object} settings
     *   These are the settings.
     *
     * @return {viewerC} popup
     */
    popup.dialogUpdate = function dialogUpdate(settings) {
      $.extend(popup.settings, settings);
      changeImage(popup.settings.image);
      return popup;
    };

    return popup;
  };
})(jQuery);
