<?php

/**
 * @file
 * Provides full image viewing and editing capability from a page of thumbnails
 */

/**
 * Construct render array for a button
 *
 * @todo Use buttons instead of images - is this function necessary?
 *
 * @param type $weight
 * @param type $id
 * @param type $src
 * @param type $title
 * @param type $classes
 *
 * @return type
 */


/**
 * Insert into $page the render arrays for all imager dialogs, popups, forms.
 * 
 * @global type $_imager_path
 *   Path to imager module.
 * 
 * @param type $page
 *   Render array for page.
 */
function _imagerBuildWrapper(&$page) {
  global $_imager_path;
  $_imager_path = drupal_get_path('module', 'imager');
  $page['content']['imager_wrapper'] = array(
    '#prefix' => '<div id="imager-wrapper">',
    '#suffix' => '</div>',
    '#weight' => -100,
    '#attached' => array(
      'library' => array(
        array('system', 'ui.draggable'),
      ),
      'js' => array(
        $_imager_path . '/js/hoverintent.js',
        $_imager_path . '/js/jquery.imgareaselect.min.js',
        $_imager_path . '/js/screenfull.js',
        $_imager_path . '/js/imager.js',
        $_imager_path . '/js/imager.drupal.js',
        array(
          'type' => 'setting',
          'data' => array(
            'imager' => array(
              'modulePath' => $_imager_path,
              'filePath' => $_SERVER['DOCUMENT_ROOT'] . '/' . variable_get('file_public_path', ''),
              'cssContainer' => variable_get('imager_views_css_container'),
              'cssImage' => variable_get('imager_views_css_image'),
            ),
          ),
        ),
      ),
      'css' => array(
        $_imager_path . '/css/imgareaselect-animated.css',
        $_imager_path . '/css/imager.css',
      ),
    ),
    'viewer'     => _imagerBuildViewer(),
    'brightness' => _imagerBuildBrightness(),
    'color'      => _imagerBuildColor(),
    'filesave'   => _imagerBuildFilesave(),
//  'status'     => _imagerBuildStatus(),
    'info'       => _imagerBuildInfo(),
    'edit'       => _imagerBuildEdit(),
    'messages'   => _imagerBuildMessages(),
    'canvasorg'  => _imagerBuildCanvas(),
    'busy'       => _imagerBuildBusy(),
//  'map'        => _imagerBuildMap(),
    'form'       => _imagerBuildForm(),
    'confirm'    => _imagerBuildConfirm(),
//  'config'     => _imagerBuildConfig(),
  );
}


/**
 * Construct render array for a button
 *
 * @todo Use buttons instead of images - is this function necessary?
 *
 * @param type $weight
 * @param type $id
 * @param type $src
 * @param type $title
 * @param type $wraplink
 *
 * @return type
 */
function _imagerBuildButton($weight, $id, $image, $title, $wraplink = false) {
  $item = array(
    '#id' => $id,
    '#weight' => $weight,
    '#title' => t($title),  // I know, don't use t() on a variable
    '#image' => $image,
    '#theme' => 'imager_add_button',
    '#wraplink' => $wraplink,
  );
  return $item;
}

/**
 * Render a button
 *
 * @param type $variables
 *
 * @return type
 */
function theme_imager_add_button($variables) {
  global $_imager_path;
  $element = $variables['element'];
  if ($element['#wraplink']) {
    $out = '<a href="#" id="' . $element['#id'] . '">' .
             '<img ' .
             'src="' . $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/' . $element["#image"] . '" ' .
//           'class="imager-filesave-button" ' .
             'alt="" title="' . $element['#title'] . '" />' . 
           '</a>';
  }
  else {
    $out = '<img id="' . $element['#id'] . '" ' .
           'src="' . $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/' . $element["#image"] . '" ' .
//         'class="imager-filesave-button" ' .
           'alt="" title="' . $element['#title'] . '">'; 
  }
  return $out;
}

/**
 * Build render array for Large Image popup
 *
 * @return type render_array
 */
function _imagerBuildViewer() {
  return array(
    '#prefix' => '<div id="imager-viewer">',
    '#suffix' => '</div>',
    'button_wrapper' => array(
      '#prefix' => '<div id="button-wrapper">',
      '#suffix' => '</div>',
      '#weight' => 1,
      'image_buttons' => array(
        '#prefix' => '<div id="image-buttons" class="buttons">',
        '#suffix' => '</div>',
        '#weight' => 1,
        'title' => array(
          '#type' => 'markup',
          '#markup' => t('Image'),
          '#prefix' => '<div>',
          '#suffix' => '</div>',
          '#weight' => 0,
        ),
        'image_left' => _imagerBuildButton(1, 'image-left', 'left_arrow.png', t('View image to the left')),
        'image_right' => _imagerBuildButton(2, 'image-right', 'right_arrow.png', t('View image to the right')),
        'image_exit' => _imagerBuildButton(4, 'image-exit', 'redx.png', t('Exit image popup')),
      ),
      'mode_buttons' => array(
        '#prefix' => '<div id="mode-buttons" class="buttons">',
        '#suffix' => '</div>',
        '#weight' => 2,
        'title' => array(
          '#type' => 'markup',
          '#markup' => t('Mode'),
          '#prefix' => '<div>',
          '#suffix' => '</div>',
          '#weight' => 0,
        ),
        'mode_view' => _imagerBuildButton(1, 'mode-view', 'eye.png', t('Enable/Disable quick image viewing - view on hover')),
//      'mode_lock' => _imagerBuildButton(2, 'mode-lock', 'lock.png', t('Lock image to screen')),
        'mode_fullscreen' => _imagerBuildButton(3, 'mode-fullscreen', 'fullscreen.png', t('View image full screen')),
        'mode_configure' => _imagerBuildButton(4, 'mode-configure', 'configure.png', t('Configure settings')),
      ),   
      'view_buttons' => array(
        '#prefix' => '<div id="view-buttons" class="buttons">',
        '#suffix' => '</div>',
        '#weight' => 3,
        'title' => array(
          '#type' => 'markup',
          '#markup' => t('View'),
          '#prefix' => '<div>',
          '#suffix' => '</div>',
          '#weight' => 0,
        ),
        'view_browser' => _imagerBuildButton(1, 'view-browser', 'view.png', t('View image alone in Browser, useful when printing'), true),
        'view_info' => _imagerBuildButton(2, 'view-info', 'information.png', t('View Image information')),
//      'view_map' => _imagerBuildButton(3, 'view-map', 'map.png', t('View map showing image locations for page')),
        //      'view_edit'       => _imagerBuildButton(4, 'view-edit', 'edit.png', t('Edit image title, categories, etc.')),
        'view_zoom_in' => _imagerBuildButton(5, 'view-zoom-in', 'zoomin.png', t('Zoom into the image')),
        'view_zoom_out' => _imagerBuildButton(6, 'view-zoom-out', 'zoomout.png', t('Zoom out of the image')),
      ),
      'edit_buttons' => array(
        '#prefix' => '<div id="edit-buttons" class="buttons">',
        '#suffix' => '</div>',
        '#weight' => 4,
        'title' => array(
          '#type' => 'markup',
          '#markup' => t('Edit'),
          '#prefix' => '<div>',
          '#suffix' => '</div>',
        ),
        'mode_crop' => _imagerBuildButton(1, 'mode-crop', 'frame.png', t('Start crop - select area to crop')),
        'edit_crop' => _imagerBuildButton(2, 'edit-crop', 'scissors.png', t('Crop selected area')),
        'edit_brightness' => _imagerBuildButton(3, 'edit-brightness', 'contrast.png', t('Edit brightness and contrast')),
        'edit_color' => _imagerBuildButton(4, 'edit-color', 'color_wheel.png', t('Edit Hue, Saturation and Lightness')),
        'edit_ccw' => _imagerBuildButton(5, 'edit-ccw', 'rotate-left.png', t('Rotate image 90 degrees counter-clockwise')),
        'edit_cw' => _imagerBuildButton(6, 'edit-cw', 'rotate-right.png', t('Rotate image 90 degrees clockwise')),
        // 'edit-reset' does not work.  It must be used by another program
        'view_reset' => _imagerBuildButton(7, 'view-reset', 'reset.png', t('Reset the image back to the original')),
      ),
      'file_buttons' => array(
        '#prefix' => '<div id="file-buttons" class="buttons">',
        '#suffix' => '</div>',
        '#weight' => 5,
        'title' => array(
          '#type' => 'markup',
          '#markup' => t('File'),
          '#prefix' => '<div>',
          '#suffix' => '</div>',
        ),
        'file_database' => _imagerBuildButton(1, 'file-database', 'database_go.png', t('Save edited image to database')),
        'file_delete' => _imagerBuildButton(2, 'file-delete', 'database_delete.png', t('Delete image from database')),
        'file_download' => _imagerBuildButton(3, 'file-download', 'download.png', t('Download image to local file system')),
        'file_email' => _imagerBuildButton(4, 'file-email', 'mail.png', t('E-mail image')),
        //      'file_clipboard'   => _imagerBuildButton(5, 'file-clipboard', 'clipboard.png', t('Send image to clipboard')),
      ),
//    'debug_buttons' => array(
//      '#prefix' => '<div id="debug-buttons" class="buttons">',
//      '#suffix' => '</div>',
//      '#weight' => -5,
//      'title' => array(
//        '#type' => 'markup',
//        '#markup' => t('Debug'),
//        '#prefix' => '<div>',
//        '#suffix' => '</div>',
//      ),
//      'debug_status' => _imagerBuildButton(1, 'debug-status', 'bug.png', t('Toggle status output')),
//      'debug_messages' => _imagerBuildButton(2, 'debug-messages', 'bug2.png', t('Toggle debug messages')),
//    ),
    ),
    'imager_canvas_wrapper' => array(
      '#prefix' => '<div id="imager-canvas-wrapper">',
      '#suffix' => '</div>',
      '#weight' => 2,
      'imager_canvas' => array(
        '#prefix' => '<canvas id="imager-canvas">',
        '#suffix' => '</canvas>',
      ),
    ),
  );
}

/**
 * Build render array for brightness/contrast slidebar popup
 *
 * @return type render_array
 */
function _imagerBuildBrightness() {
  return array(
    '#prefix' => '<div id="imager-brightness">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-brightness-content" class="imager-content">',
      '#suffix' => '</div>',
      'table' => array(
        '#theme' => 'table',
        '#attributes' => array('class' => 'table-no-striping'),
        '#rows' => array(
          array(
            'no_striping' => TRUE,
            'data' => array(
              t('Brightness'),
              '<input id="slider-brightness" class="slider" type="range" min="-100" max="100" step="1" />',
            ),
          ),
          array(
            'no_striping' => TRUE,
            'data' => array(
              t('Contrast'),
              '<input id="slider-contrast"   class="slider" type="range" min="-100" max="100" step="1" />',
            ),
          ),
        ),
      ),
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-brightness-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      'apply' => _imagerBuildButton(1, 'brightness-apply', 'checkmark.png', t('Apply changes and exit')),
      'reset' => _imagerBuildButton(2, 'brightness-reset', 'reset.png', t('Reset brightness and contrast')),
      'cancel' => _imagerBuildButton(3, 'brightness-cancel', 'redx.png', t('Exit without applying changes')),
    ),
  );
}

/**
 * Build render array for HSL slider popup
 *
 * @return type render_array
 */
function _imagerBuildColor() {
  return array(
    '#prefix' => '<div id="imager-color">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-color-content" class="imager-content">',
      '#suffix' => '</div>',
      'table' => array(
        '#theme' => 'table',
        '#attributes' => array('class' => 'table-no-striping'),
        '#rows' => array(
          array(
            'no_striping' => TRUE,
            'data' => array(
              t('Hue'),
              '<input id="slider-hue" class="slider" type="range" min="-100" max="100" step="1" />',
            ),
          ),
          array(
            'no_striping' => TRUE,
            'data' => array(
              t('Saturation'),
              '<input id="slider-saturation" class="slider" type="range" min="-100" max="100" step="1" />',
            ),
          ),
          array(
            'no_striping' => TRUE,
            'data' => array(
              t('Lightness'),
              '<input id="slider-lightness"  class="slider" type="range" min="-100" max="100" step="1" />',
            ),
          ),
        ),
      ),
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-brightness-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      'apply' => _imagerBuildButton(1, 'color-apply', 'checkmark.png', t('Apply changes and exit')),
      'reset' => _imagerBuildButton(2, 'color-reset', 'reset.png', t('Reset hue, saturation and lightness')),
      'cancel' => _imagerBuildButton(3, 'color-cancel', 'redx.png', t('Exit without applying changes')),
    ),
  );
}

/**
 * Build the form to save a file to local file system or back into Drupal
 *
 * @return type
 */
function _imagerBuildFilesave() {
  return array(
    '#prefix' => '<div id="imager-filesave">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-filesave-content" class="imager-content">',
      '#suffix' => '</div>',
      'title' => array(
        '#weight' => 1,
        '#markup' => t('<h2 id="imager-filesave-title">' . t('bogus') . '</h2>'),
      ),
      'messages' => array(
        '#weight' => 2,
        '#prefix' => '<div id="imager-filesave-messages">',
        '#suffix' => '</div>',
      ),
      'filename' => array(
        '#weight' => 3,
        '#prefix' => '<div id="imager-filesave-filename-container">',
        '#suffix' => '</div>',
        '#type' => 'markup',
        '#markup' => "<div>" . t('File name:') . "</div><input id='imager-filesave-filename' type='text' />",
      ),
      'table' => _imagerBuildResTable(4),
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-filesave-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      'clipboard' => _imagerBuildButton(2, 'imager-filesave-clipboard', 'clipboard.png', t('Send image to clipboard and exit')),
      'file_download' => array(
        '#weight' => 3,
        'image' => _imagerBuildButton(3, 'imager-filesave-download', 'download.png', t('Download image to local file system'), true),
      ),
      'email' => _imagerBuildButton(4, 'imager-filesave-email', 'mail.png', t('Email image using default email client')),
      'new' => _imagerBuildButton(4, 'imager-filesave-new', 'database_add.png', t('Create new database entry and exit')),
      'overwrite' => _imagerBuildButton(5, 'imager-filesave-overwrite', 'database_go.png', t('Overwrite existing database entry')),
      'cancel' => _imagerBuildButton(6, 'imager-filesave-cancel', 'redx.png', t('Cancel saving file')),
    ),
  );
}

/**
 *
 * @param type $weight
 *
 * @return type
 */
function _imagerBuildResTable($weight) {
  return array(
    '#weight' => $weight,
    '#type' => 'table',
    '#attributes' => array('class' => 'table-no-striping'),
    '#theme' => 'table',
    '#header' => array(
//          t(' '),      // @todo Uncommenting these lines causes PHP error.
//          t('Image'),
//          t('Resolution'),
//          t('Geometry'),
//          t('Ratio')
    ),
    '#rows' => array(
      array(
        'no_striping' => TRUE,
        'data' => array(
          '<input type="radio" name="resolution" value="screen" />',
          t('Displayed'),
          t('Display'),
          array('id' => 'canvas-resolution'),
          array('id' => 'scale', 'rowspan' => 2),
        ),
      ),
      array(
        'no_striping' => TRUE,
        'data' => array(
          '<input type="radio" name="resolution" value="image-cropped" checked="checked" />',
          t('Displayed'),
          t('Image'),
          array('id' => 'image-display-resolution'),
        ),
      ),
      array(
        'no_striping' => TRUE,
        'data' => array(
          '<input type="radio" name="resolution" value="image-full" />',
          t('Full'),
          t('Image'),
          array('id' => 'image-full-resolution'),
        ),
      ),
    ),
  );
}

/**
 * Build render array for current Status popup
 *
 * @return type render_array
 */
function _imagerBuildStatus() {
  return array(
    '#prefix' => '<div id="imager-status">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-status-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      '#type' => 'markup',
      '#markup' => 'Placeholder for status popup',
    ),
  );
}

/**
 * Build render array for information dialog - displays rendered file_entity
 *
 * @return type render_array
 */
function _imagerBuildInfo() {
  return array(
    '#prefix' => '<div id="imager-info">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-info-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      '#type' => 'markup',
      '#markup' => t('Placeholder for information popup'),
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-info-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      '#weight' => 2,
      'exit' => _imagerBuildButton(1, 'imager-info-exit', 'redx.png', t('Exit Information dialog')),
    ),
  );
}

/**
 * Build render array for file_entity field editing popup
 *
 * @return type render_array
 */
function _imagerBuildEdit() {
  return array(
    '#prefix' => '<div id="imager-edit">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-edit-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      '#type' => 'markup',
      '#markup' => t('Placeholder for edit popup'),
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-edit-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      '#weight' => 2,
      'apply' => _imagerBuildButton(1, 'imager-edit-apply', 'database_go.png', t('Apply changes and exit')),
      'exit' => _imagerBuildButton(2, 'imager-edit-exit', 'redx.png', t('Exit Edit dialog')),
    ),
  );
}

/**
 * Build render array for Ajax and PHP debug message dialog
 *
 * @return type render_array
 */
function _imagerBuildMessages() {
  return array(
    '#prefix' => '<div id="imager-messages">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-messages-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      '#type' => 'markup',
      '#markup' => t('Placeholder for messages popup'),
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-filesave-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      'exit' => _imagerBuildButton(2, 'imager-messages-exit', 'redx.png', t('Exit Messages dialog')),
    ),
  );
}

/**
 * Build render array for hidden second canvas - used to save images
 *
 * @return type render_array
 */
function _imagerBuildCanvas() {
  return array(
    '#prefix' => '<canvas id="imager-canvas-org">',
    '#suffix' => '</canvas>',
  );
}

/**
 * Build render array for Busy indicator - busy.gif
 *
 * @global type $_imager_path
 *
 * @return type render_array
 */
function _imagerBuildBusy() {
  global $_imager_path;
  return array(
    '#type' => 'markup',
    '#markup' => '<img alt="" id="imager-busy" src="' . $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/busy.gif" />',
  );
}

/**
 * Build render array for map popup
 *
 * @global type $_imager_path
 *
 * @return type render_array
 */
function _imagerBuildMap() {
  global $_imager_path;
  return array(
    '#prefix' => '<div id="imager-map">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-map-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      '#type' => 'markup',
      '#markup' => '<h3>' . t('Interactive Map - Under Construction') . '</h3>' .
      '<p>The plan is to put a full interactive map with markers showing all photos on originating page.  The current image\'s marker will be centered and highlighted with a different color.</p><img alt="" id="imager-map-image" src="' . $GLOBALS['base_url'] . '/' . $_imager_path . '/icons/fakemap.png">',
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-map-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      '#weight' => 2,
      'exit' => _imagerBuildButton(2, 'imager-map-exit', 'redx.png', t('Exit Map dialog')),
    ),
  );
}

/**
 * Load the file_entity_edit form - default form for image file type
 *
 * Loading the full form as the page loads ensures all javascript code for
 * form fields are also loaded.
 * 
 * Complex file_entity_edit forms use a lot of additional javascript:
 * - date popup
 * - autocomplete - entity reference
 * - ckeditor
 * - hierarchical select
 * - ...
 *
 * @todo This form isn't used and is removed by imager.js.  A better approach
 * is to only load the necessary JavaScript and CSS files and not
 * render the form.  
 *  Questions:
 *   - Can JavaScript files be loaded through AJAX?
 *   - If so those modules that use #attached should work OK.
 *   - Modules using drupal_load_js won't work. 
 *
 * @return type render_array
 */
function _imagerBuildForm() {
  module_load_include('inc', 'file_entity', 'file_entity.pages');
  // @TODO Instead of specifying file ID 1, 
  // query database to load one random image.
  $file = file_load(1);
  $form_id = "file_entity_edit";
  $title1 = drupal_get_title();
  $form = drupal_get_form($form_id, $file);
  drupal_set_title($title1);

  $div = array(
    '#prefix' => '<div id="imager-form">',
    '#suffix' => '</div>',
    'editform' => $form,
  );
  return $div;
}

/**
 *
 * @global type $_imager_path
 *
 * @return type
 */
function _imagerBuildConfirm() {
  global $_imager_path;
  return array(
    '#prefix' => '<div id="imager-confirm">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-confirm-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      '#type' => 'markup',
      '#markup' => '<p>' . t('Placeholder for confirm dialog') . '</p>',
    ),
    'buttons-wrapper' => array(
      '#prefix' => '<div id="imager-confirm-buttons-wrapper">',
      '#suffix' => '</div>',
      '#weight' => 2,
      'buttons' => array(
        '#prefix' => '<div id="imager-confirm-buttons" class="imager-buttons">',
        '#suffix' => '</div>',
        'apply' => _imagerBuildButton(1, 'imager-confirm-apply', 'checkmark.png', t('Apply action')),
        'exit' => _imagerBuildButton(2, 'imager-confirm-exit', 'redx.png', t('Do nothing and exit dialog')),
      ),
    ),
  );
}


function _imagerBuildConfig() {
  global $_imager_path;
  return array(
    '#prefix' => '<div id="imager-config">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-config-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      'description' => array(
        '#type' => 'markup',
        '#markup' => '<p><em>All values are stored specific to the browser you are using.</em></p>',
      ),
      'viewer' => array(
        '#type' => 'fieldset',
        '#title' => 'Image Viewer',
        'imager_bounds_enable' => array(
          '#type' => 'checkbox',
          '#title' => t('Enable Bounds limiting'),
          '#description' => t('Prevents image from zooming smaller than the viewing area.  Also prevents image from being panned (dragged) offscreen.'),
          '#attributes' => array('id' => 'imager-bounds-enable'),
        ),
      ),
      'debug' => array(
        '#type' => 'fieldset',
        '#title' => 'Debug',
        'imager_debug_status' => array(
          '#type' => 'checkbox',
          '#title' => t('Display Status'),
          '#description' => t('Display current state of variables.'),
          '#attributes' => array('id' => 'imager-debug-status'),
        ),
        'imager_debug_messages' => array(
          '#type' => 'checkbox',
          '#title' => t('Display Messages'),
          '#description' => t('Display messages involving AJAX communications and debug messages.'),
          '#attributes' => array('id' => 'imager-debug-messages'),
        ),
      ),
    ),
  );
}