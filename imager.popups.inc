<?php

/**
 * @file
 * Define render arrays for Imager popups.
 */

/**
 * Insert into $page the render arrays for all imager dialogs, popups, forms.
 *
 * @param array $page
 *   Render array for current page.
 *
 * @global string $_imager_path
 *   Path to imager module.
 */
function _imager_build_wrapper(array &$page) {
  global $_imager_path;
  $_imager_path = drupal_get_path('module', 'imager');
  $page['content']['imager_wrapper'] = array(
    '#prefix' => '<div id="imager-wrapper">',
    '#suffix' => '</div>',
    '#weight' => -100,
    '#attached' => array(
      'library' => array(
        array('system', 'ui.dialog'),
        array('system', 'ui.draggable'),
      ),
      'css' => array(
        $_imager_path . '/css/imgareaselect-animated.css',
        $_imager_path . '/css/imager.css',
      ),
      'js' => array(
        $_imager_path . '/js/vendor/hoverintent.js',
        $_imager_path . '/js/vendor/jquery.imgareaselect.min.js',
        $_imager_path . '/js/vendor/screenfull.js',
        $_imager_path . '/js/imager.core.js',
        $_imager_path . '/js/imager.image.js',
        $_imager_path . '/js/popups/imager.base.js',
        $_imager_path . '/js/popups/imager.config.js',
        $_imager_path . '/js/popups/imager.filesave.js',
        $_imager_path . '/js/popups/imager.info.js',
        $_imager_path . '/js/popups/imager.image.js',
        $_imager_path . '/js/popups/imager.edit.js',
        $_imager_path . '/js/popups/imager.color.js',
        $_imager_path . '/js/popups/imager.brightness.js',
        $_imager_path . '/js/popups/imager.status.js',
        $_imager_path . '/js/popups/imager.confirm.js',
        $_imager_path . '/js/popups/imager.messages.js',
        $_imager_path . '/js/popups/imager.viewer.js',
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
    ),

  // Render arrays are not loaded until needed.  Then they are loaded with AJAX.
  // To load a render array before that uncomment it here.
  // 'viewer'     => _imager_build_viewer(),
  // 'brightness' => _imager_build_brightness(),
  // 'color'      => _imager_build_color(),
  // 'filesave'   => _imager_build_filesave(),
  // 'status'     => _imager_build_status(),
  // 'info'       => _imager_build_info(),
  // 'image'      => _imager_build_image(),
  // 'edit'       => _imager_build_edit(),
  // 'messages'   => _imager_build_messages(),
  // 'canvasorg'  => _imager_build_canvas(),
    'busy' => _imager_build_busy(),
  // 'map'        => _imager_build_map(),
     'form'       => _imager_build_form(),
  // 'confirm'    => _imager_build_confirm(),
  // 'config'     => _imager_build_configuration()
  );
  //$page['content']['imager_wrapper']['#attached']['imager_library_load'][] = array('jquery.imgareaselect');
  //$page['content']['imager_wrapper']['#attached'][] = array('screenfull');
}

/**
 * Construct render array for a button.
 *
 * These are not true buttons.  They are images <IMG>
 *
 * @todo Use buttons instead of images
 *
 * @param int $weight
 *   Weight is used to determine the order of the buttons.
 * @param string $id
 *   CSS ID of button.
 * @param string $image
 *   Location of image.
 * @param string $title
 *   Title - pops up on hover.
 * @param bool $wraplink
 *   Wrap the button image in a link?
 *
 * @return array
 *   Render array for button
 */
function _imager_build_button($weight, $id, $image, $title, $wraplink = FALSE) {
  $item = array(
    '#id' => $id,
    '#weight' => $weight,
    // $title is a string literal being passed into this function.
    '#title' => $title,
    '#image' => $image,
    '#theme' => 'imager_add_button',
    '#wraplink' => $wraplink,
  );
  return $item;
}

/**
 * Render a button.
 *
 * @param array $variables
 *   An associative array containing a render element representing a form.
 *
 * @return string
 *   HTML for button
 */
function theme_imager_add_button(array $variables) {
  global $_imager_path;
  $element = $variables['element'];
  if ($element['#wraplink']) {
    $out = '<a href="#" id="' . $element['#id'] . '"><img src="' .
        $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/' .
        $element["#image"] . '" alt="" title="' .
        $element['#title'] . '" /></a>';
  }
  else {
    $out = '<img id="' . $element['#id'] . '" src="' .
        $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/' .
        $element["#image"] . '" alt="" title="' .
        $element['#title'] . '">';
  }
  return $out;
}

/**
 * Build render array for Large Image popup.
 *
 * @return array
 *    Render array for Viewer dialog
 */
function _imager_build_viewer() {
  global $_imager_path;
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
        'image_exit' => _imager_build_button(1, 'image-exit', 'redx.png', t('Exit image popup')),
        'mode_fullscreen' => _imager_build_button(2, 'mode-fullscreen', 'fullscreen.png', t('View image full screen')),
        'image_left' => _imager_build_button(3, 'image-left', 'left_arrow.png', t('View image to the left')),
        'image_right' => _imager_build_button(4, 'image-right', 'right_arrow.png', t('View image to the right')),
        'mode_configure' => _imager_build_button(5, 'mode-configure', 'configure.png', t('Configure settings')),
      ),
/*    'mode_buttons' => array(
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
//      'mode_view' => _imager_build_button(1, 'mode-view', 'eye.png', t('Enable/Disable quick image viewing - view on hover')),
        'mode_fullscreen' => _imager_build_button(3, 'mode-fullscreen', 'fullscreen.png', t('View image full screen')),
        'mode_configure' => _imager_build_button(4, 'mode-configure', 'configure.png', t('Configure settings')),
      ), */
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
        'view_browser' => _imager_build_button(1, 'view-browser', 'view.png', t('View image alone in Browser, useful when printing'), TRUE),
        'view_info' => _imager_build_button(2, 'view-info', 'information.png', t('View Image information')),
//      'view_map' => _imager_build_button(3, 'view-map', 'map.png', t('View map showing image locations for page')),
        'view_zoom_in' => _imager_build_button(5, 'view-zoom-in', 'zoomin.png', t('Zoom into the image')),
        'view_zoom_out' => _imager_build_button(6, 'view-zoom-out', 'zoomout.png', t('Zoom out of the image')),
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
        'mode_crop' => _imager_build_button(1, 'mode-crop', 'frame.png', t('Start crop - select area to crop')),
        'edit_crop' => _imager_build_button(2, 'edit-crop', 'scissors.png', t('Crop selected area')),
        'edit_brightness' => _imager_build_button(3, 'edit-brightness', 'contrast.png', t('Edit brightness and contrast')),
        'edit_color' => _imager_build_button(4, 'edit-color', 'color_wheel.png', t('Edit hue, saturation and lightness')),
        'edit_ccw' => _imager_build_button(5, 'edit-ccw', 'rotate-left.png', t('Rotate image 90 degrees counter-clockwise')),
        'edit_cw' => _imager_build_button(6, 'edit-cw', 'rotate-right.png', t('Rotate image 90 degrees clockwise')),
        // 'edit-reset' does not work.  It must be used by another program.
        'view_reset' => _imager_build_button(7, 'view-reset', 'reset.png', t('Reset the image back to the original')),
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
        // @todo don't display if doesn't have permissions.
        'file_database' => _imager_build_button(1, 'file-database', 'database_go.png', t('Save edited image to database')),
        // @todo don't display if doesn't have permissions.
        'file_delete' => _imager_build_button(2, 'file-delete', 'database_delete.png', t('Delete image from database')),
        'file_download' => _imager_build_button(3, 'file-download', 'download.png', t('Download image to local file system'), TRUE),
        // @todo Don't display if not at appropriate IP addresses
        'file_print' => _imager_build_button(4, 'file-print', 'print.png', t('Print Image')),
      ),
    ),
    'imager_canvas_wrapper' => array(
      '#prefix' => '<div id="imager-canvas-wrapper">',
      '#suffix' => '</div>',
      '#weight' => 2,
      'imager_image' => array(
        '#type' => 'markup',
        '#weight' => 2,
        '#markup' => '<img id="imager-image" src="' .
          $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/transparent.png' .
          '" alt="" title="" />',
      ),
      'imager_canvas' => array(
        '#weight' => 1,
        '#prefix' => '<canvas id="imager-canvas">',
        '#suffix' => '</canvas>',
      ),
    ),
  );
}

/**
 * Build render array for brightness/contrast slidebar popup.
 *
 * @return array
 *   Render array for brightness/contrast slider.
 */
function _imager_build_brightness() {
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
  );
}

/**
 * Build render array for HSL slider popup.
 *
 * @return array
 *   Render array for Hue/Saturation/Lightness dialog.
 */
function _imager_build_color() {
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
  );
}

/**
 * Build the form to save a file to local file system or back into Drupal.
 *
 * @return array
 *    Render array for filesave dialog
 */
function _imager_build_filesave() {
  return array(
    '#prefix' => '<div id="imager-filesave">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-filesave-content" class="imager-content">',
      '#suffix' => '</div>',
      'messages' => array(
        '#weight' => 2,
        '#prefix' => '<div id="imager-filesave-messages">',
        '#suffix' => '</div>',
      ),
      'table' => _imager_build_resolution_table(3),
      'filename' => array(
        '#weight' => 4,
        '#prefix' => '<div id="imager-filesave-filename-container">',
        '#suffix' => '</div>',
        '#type' => 'markup',
        '#markup' => "<span>" . t('File name:') . " </span><input id='imager-filesave-filename' type='text' />",
      ),
    ),
  );
}

/**
 * Build the render table for image resolutions to select when saving images.
 *
 * @param int $weight
 *   Weight determines position within dialog.
 *
 * @return array
 *   Render array for image resolution selection table.
 */
function _imager_build_resolution_table($weight) {
  return array(
    '#weight' => $weight,
    '#type' => 'table',
    '#attributes' => array('class' => 'table-no-striping'),
    '#theme' => 'table',
    '#header' => array(
      '',
      t('Image'),
      t('Resolution'),
      t('Geometry'),
      t('Ratio'),
    ),
    '#sticky' => FALSE,
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
 * Build render array for current Status popup.
 *
 * @return array
 *   Render array for Imager status dialog.
 */
function _imager_build_status() {
  return array(
    '#prefix' => '<div id="imager-status">',
    '#suffix' => '</div>',
    'content' => array(
      '#attributes' => array('id' => array('imager-status-content')),
      '#weight' => 1,
      '#type' => 'container',
      'col_left' => array(
        '#type' => 'container',
        '#attributes' => array('class' => array('imager-status-col')),
        'table_general' => array(
          '#type' => 'table',
          '#theme' => 'table',
          '#header' => array(
            t('Name'),
            t('Value'),
          ),
          '#rows' => array(
            array(
              'Edit Mode',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-edit-mode',
              ),
            ),
            array(
              'Full Screen',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-full-screen',
              ),
            ),
            array(
              'Distance',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-distance',
              ),
            ),
            array(
              'Elapsed',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-elapsed',
              ),
            ),
            array(
              'Zoom',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-zoom',
              ),
            ),
            array(
              'Rotation',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-rotation',
              ),
            ),
            array(
              'Brightness',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-brightness',
              ),
            ),
            array(
              'Contrast',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-contrast',
              ),
            ),
            array(
              'Hue',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-hue',
              ),
            ),
            array(
              'Saturation',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-saturation',
              ),
            ),
            array(
              'Lightness',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-lightness',
              ),
            ),
          ),
        ),
      ),
      'col_right' => array(
        '#type' => 'container',
        '#attributes' => array('class' => array('imager-status-col')),
        'table_geometries' => array(
          '#type' => 'table',
          '#theme' => 'table',
          '#header' => array(
            t('Name'),
            t('Width'),
            t('Value'),
          ),
          '#rows' => array(
            array(
              'Maximum Canvas',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-max-canvas-width',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-max-canvas-height',
              ),
            ),
            array(
              'Actual Canvas',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-actual-canvas-width',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-actual-canvas-height',
              ),
            ),
            array(
              'Displayed Image',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-disp-image-width',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-disp-image-height',
              ),
            ),
            array(
              'Full Image',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-full-image-width',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-full-image-height',
              ),
            ),
          ),
        ),
        'table_points' => array(
          '#type' => 'table',
          '#title' => 'Points',
          '#theme' => 'table',
          '#header' => array(
            t('Name'),
            t('X'),
            t('Y'),
          ),
          '#rows' => array(
            array(
              'Mouse Now',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-now-x',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-now-y',
              ),
            ),
            array(
              'Mouse Now Tx',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-now-x-tx',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-now-y-tx',
              ),
            ),
            array(
              'Mouse Down',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-down-x',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-down-y',
              ),
            ),
            array(
              'Mouse Down Tx',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-down-x-tx',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-down-y-tx',
              ),
            ),
            array(
              'Crop Upper Left',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-crop-ul-x',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-crop-ul-y',
              ),
            ),
            array(
              'Crop Lower Right',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-crop-lr-x',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-crop-lr-y',
              ),
            ),
            array(
              'Upper Left Canvas',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-canvas-ul-x',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-canvas-ul-y',
              ),
            ),
            array(
              'Lower Right Canvas',
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-canvas-lr-x',
              ),
              array(
                'data' => '',
                'class' => 'imager-text-right',
                'id' => 'imager-status-canvas-lr-y',
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/**
 * Build render array for information dialog - displays rendered file_entity.
 *
 * @return array
 *   Render array for Information dialog.
 */
function _imager_build_info() {
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
  );
}

/**
 * Build render array for image dialog - displays image for emailing, printing.
 *
 * @return array
 *   Render array for Information dialog.
 */
function _imager_build_image() {
  return array(
    '#prefix' => '<div id="imager-image">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-image-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      '#type' => 'markup',
      '#markup' => t('<img id="imager-image-img" src="#"></img>'),
    ),
  );
}

/**
 * Build render array for file_entity field editing popup.
 *
 * @return array
 *   Render array for file_entity field edit dialog.
 */
function _imager_build_edit() {
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
  );
}

/**
 * Build render array for Ajax and PHP debug message dialog.
 *
 * @return array
 *   Render array for communication messages debug dialog.
 */
function _imager_build_messages() {
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
  );
}

/**
 * Build render array for hidden second canvas - used to save images.
 *
 * @return array
 *   Render array for a second canvas which is used to temporarily save images.
 */
function _imager_build_canvas() {
  return array(
    '#prefix' => '<canvas id="imager-canvas-org">',
    '#suffix' => '</canvas>',
  );
}

/**
 * Build render array for Busy indicator - busy.gif.
 *
 * @global string $_imager_path
 *
 * @return array
 *   Render array for busy gif.
 */
function _imager_build_busy() {
  global $_imager_path;
  return array(
    '#type' => 'markup',
    '#markup' => '<img alt="" id="imager-busy" src="' . $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/busy.gif" />',
  );
}

/**
 * Build render array for map popup.
 *
 * @global string $_imager_path
 *
 * @return array
 *   Render array for map dialog.
 */
function _imager_build_map() {
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
      '<p>The plan is to put a full interactive map with markers showing all photos on originating page.  ' .
      'The current image\'s marker will be centered and highlighted with a different color.</p>' .
      '<img alt="" id="imager-map-image" src="' . $GLOBALS['base_url'] . '/' . $_imager_path . '/icons/fakemap.png">',
    ),
    'buttons' => array(
      '#prefix' => '<div id="imager-map-buttons" class="imager-buttons">',
      '#suffix' => '</div>',
      '#weight' => 2,
      'exit' => _imager_build_button(2, 'imager-map-exit', 'redx.png', t('Exit Map dialog')),
    ),
  );
}

/**
 * Load the file_entity_edit form - default form for image file type.
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
 * @return array
 *   Render array for file_entity_edit form.
 */
function _imager_build_form() {
  module_load_include('inc', 'file_entity', 'file_entity.pages');
  // @TODO Instead of specifying file ID 1,
  // query database to load one random image.
  $file = file_load(1);
  $form_id = "file_entity_edit";
  $title1 = drupal_get_title();
  $form = drupal_get_form($form_id, $file);
  drupal_set_title($title1);

  $div = array(
    '#prefix' => '<div id="imager-hidden-form">',
    '#suffix' => '</div>',
    'editform' => $form,
  );
  return $div;
}

/**
 * Build render array for confirmation dialog.
 *
 * @deprecated - Am I sure about this?
 *
 * @return array
 *   Render array for image deletion confirmation dialog.
 */
function _imager_build_confirm() {
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
  );
}


/**
 * Build render array for configuration dialog.
 *
 * @return array
 *    Render array for configuration dialog.
 */
function _imager_build_configuration() {
  // lpstat -t | grep "^printer" | grep -v fax | cut -f 2 -d " "

  $printers = array();
  $handle = popen(variable_get('imager_printer_search'), 'r');
  while (($line = fgets($handle)) !== false) {
    $printers[] = chop($line,"\n");
  }
  pclose($handle);

  return array(
    '#prefix' => '<div id="imager-config">',
    '#suffix' => '</div>',
    'content' => array(
      '#prefix' => '<div id="imager-config-content" class="imager-content">',
      '#suffix' => '</div>',
      '#weight' => 1,
      'description' => array(
        '#type' => 'markup',
        '#markup' => '<p><em>All settings are stored specific to each browser you use.</em></p>',
      ),
      'viewer' => array(
        '#type' => 'fieldset',
        '#title' => 'Image Viewer',
        'imager_bounds_enable' => array(
          '#type' => 'checkbox',
          '#title' => t('Enable Bounds limiting'),
          '#description' => t('Prevents image from zooming smaller than the viewing area and from being panned (dragged) offscreen.'),
          '#attributes' => array('id' => 'imager-bounds-enable'),
        ),
      ),
      'printer' => array(
        '#type' => 'fieldset',
        '#title' => 'Printer',
        'imager_printer_select' => array(
          '#type' => 'select',
          '#title' => t('Select a printer'),
          '#default_value' => localStorage.imagerPrinter,
          '#options' => $printers,
          '#attributes' => array('id' => 'imager-printer-select'),
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

/**
 * Smart library loader.
 *
 * Checks for  packed or minified version and falls back to the default
 * version if neither of them were found.
 *
 * @param string $name
 *   Library name.
 * @param array $variants
 *   Array of allowed variants.
 *
 * @return array
 *   Associative array of library information as returned from libraries_info().
 *
 * @see libraries_load()
 */
function imager_library_load($name, array $variants = NULL) {
  $loaded = &drupal_static(__FUNCTION__, array());

  if (!isset($loaded[$name])) {
    $loaded[$name] = array();

    $library = cache_get($name, 'cache_libraries');
    if ($library) {
      $library = $library->data;
    }
    else {
      $library = libraries_detect($name);
      cache_set($name, $library, 'cache_libraries');
    }

    if (empty($variants)) {
      $variants = array('packed', 'minified', NULL);
    }

    foreach ((array) $variants as $variant) {
      if ($variant) {
        if (!empty($library['variants'][$variant]['installed'])) {
          $loaded[$name] = libraries_load($name, $variant);
          break;
        }
      }
      elseif ($library['installed']) {
        $loaded[$name] = libraries_load($name, $variant);
        break;
      }
    }

    return $loaded[$name];
  }
}
