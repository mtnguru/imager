<?php

namespace Drupal\imager;

use Drupal\imager\ImagerComponents;

class ImagerPopups {

  private function buildViewer($config) {
    $page = array(
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
          'image_exit' => ImagerComponents::buildButton(1, 'image-exit', 'redx.png', t('Exit image popup')),
          'mode_fullscreen' => ImagerComponents::buildButton(2, 'mode-fullscreen', 'fullscreen.png', t('View image full screen')),
          'image_left' => ImagerComponents::buildButton(3, 'image-left', 'left_arrow.png', t('View image to the left')),
          'image_right' => ImagerComponents::buildButton(4, 'image-right', 'right_arrow.png', t('View image to the right')),
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
          'mode_view' => ImagerComponents::buildButton(1, 'mode-view', 'eye.png', t('Enable/Disable quick image viewing - view on hover')),
          'mode_configure' => ImagerComponents::buildButton(4, 'mode-configure', 'configure.png', t('Configure settings')),
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
          'view_browser' => ImagerComponents::buildButton(1, 'view-browser', 'view.png', t('View image alone in Browser, useful when printing'), TRUE),
          'view_info' => ImagerComponents::buildButton(2, 'view-info', 'information.png', t('View Image information')),
          'view_map' => ImagerComponents::buildButton(3, 'view-map', 'map.png', t('View map showing image locations for page')),
          'view_zoom_in' => ImagerComponents::buildButton(5, 'view-zoom-in', 'zoomin.png', t('Zoom into the image')),
          'view_zoom_out' => ImagerComponents::buildButton(6, 'view-zoom-out', 'zoomout.png', t('Zoom out of the image')),
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
          'mode_crop' => ImagerComponents::buildButton(1, 'mode-crop', 'frame.png', t('Start crop - select area to crop')),
          'edit_crop' => ImagerComponents::buildButton(2, 'edit-crop', 'scissors.png', t('Crop selected area')),
          'edit_brightness' => ImagerComponents::buildButton(3, 'edit-brightness', 'contrast.png', t('Edit brightness and contrast')),
          'edit_color' => ImagerComponents::buildButton(4, 'edit-color', 'color_wheel.png', t('Edit hue, saturation and lightness')),
          'edit_ccw' => ImagerComponents::buildButton(5, 'edit-ccw', 'rotate-left.png', t('Rotate image 90 degrees counter-clockwise')),
          'edit_cw' => ImagerComponents::buildButton(6, 'edit-cw', 'rotate-right.png', t('Rotate image 90 degrees clockwise')),
//        'edit-reset' does not work.  It must be used by another program.
          'view_reset' => ImagerComponents::buildButton(7, 'view-reset', 'reset.png', t('Reset the image back to the original')),
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
          // @TODO don't display if doesn't have permissions.
          'file_database' => ImagerComponents::buildButton(1, 'file-database', 'database_go.png', t('Save edited image to database')),
          // @TODO Don't display if doesn't have permissions.
          'file_delete' => ImagerComponents::buildButton(2, 'file-delete', 'database_delete.png', t('Delete image from database')),
          'file_download' => ImagerComponents::buildButton(3, 'file-download', 'download.png', t('Download image to local file system'), TRUE),
          // @TODO Don't display if not at appropriate IP addresses.
          'file_print' => ImagerComponents::buildButton(4, 'file-print', 'print.png', t('Print Image')),
        ),
        'debug_buttons' => array(
          '#prefix' => '<div id="debug-buttons" class="buttons">',
          '#suffix' => '</div>',
          '#weight' => -5,
          'title' => array(
            '#type' => 'markup',
            '#markup' => t('Debug'),
            '#prefix' => '<div>',
            '#suffix' => '</div>',
          ),
          'debug_status' => ImagerComponents::buildButton(1, 'debug-status', 'bug.png', t('Toggle status output')),
          'debug_messages' => ImagerComponents::buildButton(2, 'debug-messages', 'bug2.png', t('Toggle debug messages')),
        ),
      ),
      'imager_canvas_wrapper' => array(
        '#prefix' => '<div id="imager-canvas-wrapper">',
        '#suffix' => '</div>',
        '#weight' => 2,
        'imager_canvas' => array(
          '#weight' => 1,
          '#markup' => '<canvas id="imager-canvas"></canvas>',
          '#allowed_tags' => ['canvas'],
        ),
        'imager_image' => array(
          '#type' => 'markup',
          '#weight' => 2,
          '#markup' => '<img id="imager-image" src="'
            . $GLOBALS["base_url"] . '/' . drupal_get_path('module', 'imager') . '/icons/transparent.png'
            . '" alt="" title="" />',
        ),
        'imager_canvas2' => array(
          '#weight' => 3,
          '#markup' => '<canvas id="imager-canvas2"></canvas>',
          '#allowed_tags' => ['canvas'],
        ),
      ),
    );
    return $page;
  }

  /**
   * Build render array for HSL slider popup.
   *
   * @return array
   *   Render array for Hue/Saturation/Lightness dialog.
   */
  private function buildColor($config) {
    $page = array(
      '#prefix' => '<div id="imager-color">',
      '#suffix' => '</div>',
      'content' => array(
        '#prefix' => '<div id="imager-color-content" class="imager-content">',
        '#suffix' => '</div>',
        '#allowed_tags' => ['input'],
        'table' => array(
          '#theme' => 'table',
          '#attributes' => array('class' => 'table-no-striping'),
          '#rows' => array(
            array(
              'no_striping' => TRUE,
              'data' => array(
                t('Hue'),
                array(
                  'data' => array(
                    '#markup' => '<input id="slider-hue" class="slider" type="range" min="-100" max="100" step="1" />',
                    '#allowed_tags' => ['input'],
                  ),
                ),
              ),
            ),
            array(
              'no_striping' => TRUE,
              'data' => array(
                t('Saturation'),
                array(
                  'data' => array(
                    '#markup' => '<input id="slider-saturation" class="slider" type="range" min="-100" max="100" step="1" />',
                    '#allowed_tags' => ['input'],
                  ),
                ),
              ),
            ),
            array(
              'no_striping' => TRUE,
              'data' => array(
                t('Lightness'),
                array(
                  'data' => array(
                    '#markup' => '<input id="slider-lightness"  class="slider" type="range" min="-100" max="100" step="1" />',
                    '#allowed_tags' => ['input'],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    return $page;
  }


/**
 * Build render array for brightness/contrast slidebar popup.
 *
 * @return array
 *   Render array for brightness/contrast slider.
 */
  private function buildBrightness($config) {
    $page = array(
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
                array(
                  'data' => array(
                    '#markup' => '<input id="slider-brightness" class="slider" type="range" min="-100" max="100" step="1" />',
                    '#allowed_tags' => ['input'],
                  ),
                ),
              ),
            ),
            array(
              'no_striping' => TRUE,
              'data' => array(
                t('Contrast'),
                array(
                  'data' => array(
                    '#markup' => '<input id="slider-contrast"   class="slider" type="range" min="-100" max="100" step="1" />',
                    '#allowed_tags' => ['input'],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    return $page;
  }

  /**
   * Build render array for current Status popup.
   *
   * @return array
   *   Render array for Imager status dialog.
   */
  private function buildStatus($config) {
    $page = array(
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
    return $page;
  }

  /**
   * Build render array for configuration dialog.
   *
   * @return array
   *    Render array for configuration dialog.
   */
  function buildConfiguration() {
//  $printers = array();
//  $handle = popen(variable_get('imager_printer_search'), 'r');
//  while (($line = fgets($handle)) !== FALSE) {
//    $printers[] = rtrim($line, "\n");
//  }
//  pclose($handle);

    $page = array(
      '#prefix' => '<div id="imager-config">',
      '#suffix' => '</div>',
      'content' => array(
        '#prefix' => '<div id="imager-config-content" class="imager-content">',
        '#suffix' => '</div>',
        '#weight' => 1,
//      'description' => array(
//        '#type' => 'markup',
//        '#markup' => '<p><em>Settings are specific to the browser.</em></p>',
//      ),
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
//      'printer' => array(
//        '#type' => 'fieldset',
//        '#title' => 'Printer',
//        'imager_printer_select' => array(
//          '#type' => 'select',
//          '#title' => t('Select a printer'),
//          '#default_value' => '',
//          '#options' => $printers,
//          '#attributes' => array('id' => 'imager-printer-select'),
//        ),
//      ),
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
    return $page;
  }

  /**
   * Build the form to save a file to local file system or back into Drupal.
   *
   * @return array
   *    Render array for filesave dialog
   */
  private function buildFilesave($config) {
    $page = array(
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
        'table' => $this->buildResolutionTable(3),
        'filename' => array(
          '#weight' => 4,
          '#prefix' => '<div id="imager-filesave-filename-container">',
          '#suffix' => '</div>',
          '#type' => 'markup',
          '#markup' => "<span>" . t('File name:') . "</span><input id='imager-filesave-filename' type='text' />",
          '#allowed_tags' => ['span', 'input'],
        ),
      ),
    );
    return $page;
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
  private function buildResolutionTable($weight) {
    $page = array(
      '#weight' => $weight,
      '#type' => 'table',
      '#attributes' => array('class' => array('table-no-striping')),
      '#theme' => 'table',
      '#header' => array(
        t(''),
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
            array(
              'data' => array(
                '#markup' => '<input type="radio" name="resolution" value="screen" />',
                '#allowed_tags' => ['input'],
              ),
            ),
            t('Displayed'),
            t('Screen'),
            array('id' => 'canvas-resolution'),
            array('id' => 'scale', 'rowspan' => 2),
          ),
        ),
        array(
          'no_striping' => TRUE,
          'data' => array(
            array(
              'data' => array(
                '#markup' => '<input type="radio" name="resolution" value="image-cropped" checked="checked" />',
                '#allowed_tags' => ['input'],
              ),
            ),
            t('Displayed'),
            t('Image'),
            array('id' => 'image-display-resolution'),
          ),
        ),
        array(
          'no_striping' => TRUE,
          'data' => array(
            array(
              'data' => array(
                '#markup' => '<input type="radio" name="resolution" value="image-full" />',
                '#allowed_tags' => ['input'],
              ),
            ),
            t('Full'),
            t('Image'),
            array('id' => 'image-full-resolution'),
          ),
        ),
      ),
    );
    return $page;
  }




  public function build($config) {
    $func = 'build' . $config['popupName'];
    return $this->$func($config);
  }
}

