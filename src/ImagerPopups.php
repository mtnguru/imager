<?php

namespace Drupal\imager;

use Drupal\imager\ImagerComponents;

class ImagerPopups {

  private function buildViewer($config) {
    $id = 'imager-viewer';
    $content = [
      'button_wrapper' => [
        '#prefix' => '<div id="button-wrapper">',
        '#suffix' => '</div>',
        '#weight' => 1,
        'image_buttons' => [
          '#prefix' => '<div id="image-buttons" class="imager-buttons">',
          '#suffix' => '</div>',
          '#weight' => 1,
          'title' => [
            '#type' => 'markup',
            '#markup' => t('Image'),
            '#prefix' => '<div>',
            '#suffix' => '</div>',
            '#weight' => 0,
          ],
          'image_exit' => ImagerComponents::buildButton(1, 'image-exit', 'redx.png', t('Exit image popup')),
          'image_left' => ImagerComponents::buildButton(3, 'image-left', 'left_arrow.png', t('View image to the left')),
          'image_right' => ImagerComponents::buildButton(4, 'image-right', 'right_arrow.png', t('View image to the right')),
        ],
        'view_buttons' => [
          '#prefix' => '<div id="view-buttons" class="imager-buttons">',
          '#suffix' => '</div>',
          '#weight' => 3,
          'title' => [
            '#type' => 'markup',
            '#markup' => t('View'),
            '#prefix' => '<div>',
            '#suffix' => '</div>',
            '#weight' => 0,
          ],
          'view_browser' => ImagerComponents::buildButton(1, 'view-browser', 'newtab.png', t('View image alone in Browser, useful when printing'), TRUE),
          'view_info' => ImagerComponents::buildButton(2, 'view-info', 'information.png', t('View Image information')),
//        'view_map' => ImagerComponents::buildButton(3, 'view-map', 'map.png', t('View map showing image locations for page')),
          'view_slideshow' => ImagerComponents::buildButton(2, 'view-slideshow', 'slideshow.png', t('View images in slideshow')),
          'mode_fullscreen' => ImagerComponents::buildButton(2, 'mode-fullscreen', 'fullscreen.png', t('View image full screen')),
          'view_zoom_in' => ImagerComponents::buildButton(5, 'view-zoom-in', 'zoomin.png', t('Zoom into the image')),
          'view_zoom_out' => ImagerComponents::buildButton(6, 'view-zoom-out', 'zoomout.png', t('Zoom out of the image')),
        ],
        'edit_buttons' => [
          '#prefix' => '<div id="edit-buttons" class="imager-buttons">',
          '#suffix' => '</div>',
          '#weight' => 4,
          'title' => [
            '#type' => 'markup',
            '#markup' => t('Edit'),
            '#prefix' => '<div>',
            '#suffix' => '</div>',
          ],
          'mode_crop' => ImagerComponents::buildButton(1, 'mode-crop', 'frame.png', t('Start crop - select area to crop')),
          'edit_crop' => ImagerComponents::buildButton(2, 'edit-crop', 'scissors.png', t('Crop selected area')),
          'edit_brightness' => ImagerComponents::buildButton(3, 'edit-brightness', 'contrast.png', t('Edit brightness and contrast')),
          'edit_color' => ImagerComponents::buildButton(4, 'edit-color', 'color_wheel.png', t('Edit hue, saturation and lightness')),
          'edit_ccw' => ImagerComponents::buildButton(5, 'edit-ccw', 'rotate-left.png', t('Rotate image 90 degrees counter-clockwise')),
          'edit_cw' => ImagerComponents::buildButton(6, 'edit-cw', 'rotate-right.png', t('Rotate image 90 degrees clockwise')),
//        'edit-reset' does not work.  It must be used by another program.
          'view_reset' => ImagerComponents::buildButton(7, 'view-reset', 'reset.png', t('Reset the image back to the original')),
        ],
        'file_buttons' => [
          '#prefix' => '<div id="file-buttons" class="imager-buttons">',
          '#suffix' => '</div>',
          '#weight' => 5,
          'title' => [
            '#type' => 'markup',
            '#markup' => t('File'),
            '#prefix' => '<div>',
            '#suffix' => '</div>',
          ],
          // @TODO don't display if doesn't have permissions.
          'file_save' => ImagerComponents::buildButton(1, 'file-save', 'database_go.png', t('Save edited image to database')),
          // @TODO Don't display if doesn't have permissions.
//        'file_delete' => ImagerComponents::buildButton(2, 'file-delete', 'database_delete.png', t('Delete image from database')),
          'file_download' => ImagerComponents::buildButton(3, 'file-download', 'download.png', t('Download image to local file system'), TRUE),
          // @TODO Don't display if not at appropriate IP addresses.
//        'file_print' => ImagerComponents::buildButton(4, 'file-print', 'print.png', t('Print Image')),
          'mode_configure' => ImagerComponents::buildButton(4, 'mode-configure', 'configure.png', t('Configure settings')),
        ],
        'debug_buttons' => [
          '#prefix' => '<div id="debug-buttons" class="imager-buttons">',
          '#suffix' => '</div>',
          '#weight' => -5,
//        'title' => [
//          '#type' => 'markup',
//          '#markup' => t('Debug'),
//          '#prefix' => '<div>',
//          '#suffix' => '</div>',
//        ],
          'debug_status' => ImagerComponents::buildButton(1, 'debug-status', 'bug.png', t('Toggle status output')),
//        'debug_messages' => ImagerComponents::buildButton(2, 'debug-messages', 'bug2.png', t('Toggle debug messages')),
        ],
      ],
      'imager_canvas_wrapper' => [
        '#prefix' => '<div id="imager-canvas-wrapper">',
        '#suffix' => '</div>',
        '#weight' => 2,
        'imager_canvas' => [
          '#weight' => 1,
          '#markup' => '<canvas id="imager-canvas"></canvas>',
          '#allowed_tags' => ['canvas'],
        ],
        'imager_image' => [
          '#type' => 'markup',
          '#weight' => 2,
          '#markup' => '<img id="imager-image" src="'
            . $GLOBALS["base_url"] . '/' . drupal_get_path('module', 'imager') . '/icons/transparent.png'
            . '" alt="" title="" />',
        ],
        'imager_canvas2' => [
          '#weight' => 3,
          '#markup' => '<canvas id="imager-canvas2"></canvas>',
          '#allowed_tags' => ['canvas'],
        ],
      ],
    ];
    return [
      'content' => $content,
      'id' => $id,
    ];
  }

  /**
   * Build render array for information dialog - displays rendered file_entity.
   *
   * @return array
   */
  private function buildInfo($config) {
    $id = 'imager-info';
    $content = [
      '#prefix' => '<div id="imager-info">',
      '#suffix' => '</div>',
      'content' => [
        '#prefix' => '<div id="imager-info-content" class="imager-content">',
        '#suffix' => '</div>',
        '#weight' => 1,
        '#type' => 'markup',
        '#markup' => t('Placeholder for information popup'),
      ],
    ];
    return [
      'content' => $content,
      'buttons' => ['Close'],
      'id' => $id,
    ];
  }

  /**
   * Build render array for HSL slider popup.
   *
   * @return array
   *   Render array for Hue/Saturation/Lightness dialog.
   */
  private function buildColor($config) {
    $id = 'imager-color';
    $content = [
      '#theme' => 'table',
      '#attributes' => ['class' => 'table-no-striping'],
      '#rows' => [
        [
          'no_striping' => TRUE,
          'data' => [
            t('Hue'),
            [
              'data' => [
                '#markup' => '<input id="slider-hue" class="imager-slider" type="range" min="-100" max="100" step="1" />',
                '#allowed_tags' => ['input'],
              ],
            ],
          ],
        ],
        [
          'no_striping' => TRUE,
          'data' => [
            t('Saturation'),
            [
              'data' => [
                '#markup' => '<input id="slider-saturation" class="imager-slider" type="range" min="-100" max="100" step="1" />',
                '#allowed_tags' => ['input'],
              ],
            ],
          ],
        ],
        [
          'no_striping' => TRUE,
          'data' => [
            t('Lightness'),
            [
              'data' => [
                '#markup' => '<input id="slider-lightness"  class="imager-slider" type="range" min="-100" max="100" step="1" />',
                '#allowed_tags' => ['input'],
              ],
            ],
          ],
        ],
      ],
    ];
    return [
      'content' => $content,
      'buttons' => ['Cancel', 'Reset', 'Apply'],
      'id' => $id,
    ];
  }

/**
 * Build render array for brightness/contrast slidebar popup.
 *
 * @return array
 *   Render array for brightness/contrast slider.
 */
  private function buildBrightness($config) {
    $id = 'imager-brightness';
    $content = [
      '#theme' => 'table',
      '#attributes' => ['class' => 'table-no-striping'],
      '#rows' => [
        [
          'no_striping' => TRUE,
          'data' => [
            t('Brightness'),
            [
              'data' => [
                '#markup' => '<input id="slider-brightness" class="imager-slider" type="range" min="-100" max="100" step="1" />',
                '#allowed_tags' => ['input'],
              ],
            ],
          ],
        ],
        [
          'no_striping' => TRUE,
          'data' => [
            t('Contrast'),
            [
              'data' => [
                '#markup' => '<input id="slider-contrast"   class="imager-slider" type="range" min="-100" max="100" step="1" />',
                '#allowed_tags' => ['input'],
              ],
            ],
          ],
        ],
      ],
    ];
    return [
      'content' => $content,
      'buttons' => ['Cancel', 'Reset', 'Apply'],
      'id' => $id,
    ];
  }

  /**
   * Build render array for current Status popup.
   *
   * @return array
   *   Render array for Imager status dialog.
   */
  private function buildStatus($config) {
    $id = 'imager-status';
    $content = [
      '#prefix' => '<div id="' . $id . '">',
      '#suffix' => '</div>',
      'content' => [
        '#attributes' => ['id' => ['imager-status-content']],
        '#weight' => 1,
        '#type' => 'container',
        'col_left' => [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['imager-status-col'],
            'id' => 'imager-status-col-1',
          ],
          'table_general' => [
            '#type' => 'table',
            '#theme' => 'table',
            '#header' => [
              t('Name'),
              t('Value'),
            ],
            '#rows' => [
              [
                'Edit Mode',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-edit-mode',
                ],
              ],
              [
                'Full Screen',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-full-screen',
                ],
              ],
              [
                'Distance',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-distance',
                ],
              ],
              [
                'Elapsed',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-elapsed',
                ],
              ],
              [
                'Zoom',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-zoom',
                ],
              ],
              [
                'Rotation',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-rotation',
                ],
              ],
              [
                'Brightness',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-brightness',
                ],
              ],
              [
                'Contrast',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-contrast',
                ],
              ],
              [
                'Hue',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-hue',
                ],
              ],
              [
                'Saturation',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-saturation',
                ],
              ],
              [
                'Lightness',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-lightness',
                ],
              ],
            ],
          ],
        ],
        'col_right' => [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['imager-status-col'],
            'id' => 'imager-status-col-2',
          ],
          'table_geometries' => [
            '#type' => 'table',
            '#theme' => 'table',
            '#header' => [
              t('Name'),
              t('Width'),
              t('Value'),
            ],
            '#rows' => [
              [
                'Maximum Canvas',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-max-canvas-width',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-max-canvas-height',
                ],
              ],
              [
                'Actual Canvas',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-actual-canvas-width',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-actual-canvas-height',
                ],
              ],
              [
                'Displayed Image',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-disp-image-width',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-disp-image-height',
                ],
              ],
              [
                'Full Image',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-full-image-width',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-full-image-height',
                ],
              ],
            ],
          ],
          'table_points' => [
            '#type' => 'table',
            '#title' => 'Points',
            '#theme' => 'table',
            '#header' => [
              t('Name'),
              t('X'),
              t('Y'),
            ],
            '#rows' => [
              [
                'Mouse Now',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-now-x',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-now-y',
                ],
              ],
              [
                'Mouse Now Tx',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-now-x-tx',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-now-y-tx',
                ],
              ],
              [
                'Mouse Down',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-down-x',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-down-y',
                ],
              ],
              [
                'Mouse Down Tx',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-down-x-tx',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-down-y-tx',
                ],
              ],
              [
                'Crop Upper Left',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-crop-ul-x',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-crop-ul-y',
                ],
              ],
              [
                'Crop Lower Right',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-crop-lr-x',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-crop-lr-y',
                ],
              ],
              [
                'Upper Left Canvas',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-canvas-ul-x',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-canvas-ul-y',
                ],
              ],
              [
                'Lower Right Canvas',
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-canvas-lr-x',
                ],
                [
                  'data' => '',
                  'class' => 'imager-text-right',
                  'id' => 'imager-status-canvas-lr-y',
                ],
              ],
            ],
          ],
        ],
      ],
    ];
    return [
      'content' => $content,
      'buttons' => ['Close'],
      'id' => $id,
    ];
  }

  /**
   * Build render array for configuration dialog.
   *
   * @return array
   *    Render array for configuration dialog.
   */
  function buildConfig() {
    $id = 'imager-config';
    $content = [
      '#weight' => 1,
      'viewer' => [
        '#type' => 'fieldset',
        '#title' => 'Image Viewer',
        'imager_bounds_enable' => [
          '#type' => 'checkbox',
          '#title' => t('Enable Bounds limiting'),
          '#description' => t('Prevents image from zooming smaller than the viewing area and from being panned (dragged) offscreen.'),
          '#attributes' => ['id' => 'imager-bounds-enable'],
        ],
      ],
      'slideshow' => [
        '#type' => 'fieldset',
        '#title' => 'Slideshow',
        'imager_slideshow-interval' => [
          '#type' => 'number',
          '#title' => t('Interval'),
          '#min' => 0,
          '#max' => 60,
          '#default_value' => 5,
          '#description' => t('Number of seconds between image changes.'),
          '#attributes' => ['id' => 'imager-slideshow-interval'],
        ],
      ],
      'debug' => [
        '#type' => 'fieldset',
        '#title' => 'Debug',
        'imager_debug_status' => [
          '#type' => 'checkbox',
          '#title' => t('Display Status'),
          '#description' => t('Display current state of variables.'),
          '#attributes' => ['id' => 'imager-debug-status'],
        ],
        'imager_debug_messages' => [
          '#title' => t('Display Messages'),
          '#description' => t('Display messages involving AJAX communications and debug messages.'),
          '#attributes' => ['id' => 'imager-debug-messages'],
        ],
      ],
    ];
    return [
      'content' => $content,
      'buttons' => ['Cancel', 'Apply'],
      'id' => $id,
    ];
  }

  /**
   * Build the form to save a file to local file system or back into Drupal.
   *
   * @return array
   *    Render array for filesave dialog
   */
  private function buildFilesave($config) {
    $id = 'imager-filesave';
    $content = [
      'messages' => [
        '#weight' => 2,
        '#prefix' => '<div id="imager-filesave-messages">',
        '#suffix' => '</div>',
      ],
      'table' => $this->buildResolutionTable(3),
      'filename' => [
        '#weight' => 4,
        '#prefix' => '<div id="imager-filesave-filename-container">',
        '#suffix' => '</div>',
        '#type' => 'markup',
        '#markup' => "<span>" . t('File name:') . "</span><input id='imager-filesave-filename' type='text' />",
        '#allowed_tags' => ['span', 'input'],
      ],
    ];
    return [
      'content' => $content,
      'buttons' => ['Cancel', 'Overwrite', 'New image', 'Download image'],
      'id' => $id,
    ];
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
    $build = [
      '#weight' => $weight,
      '#type' => 'table',
      '#attributes' => ['class' => ['table-no-striping']],
      '#theme' => 'table',
      '#header' => [
        t(''),
        t('Image'),
        t('Resolution'),
        t('Geometry'),
//      t('Ratio'),
      ],
      '#sticky' => FALSE,
      '#rows' => [
        [
          'no_striping' => TRUE,
          'data' => [
            [
              'data' => [
                '#markup' => '<input type="radio" name="resolution" value="screen" />',
                '#allowed_tags' => ['input'],
              ],
            ],
            t('Displayed'),
            t('Screen'),
            ['id' => 'canvas-resolution'],
//          ['id' => 'scale', 'rowspan' => 2],
          ],
        ],
        [
          'no_striping' => TRUE,
          'data' => [
            [
              'data' => [
                '#markup' => '<input type="radio" name="resolution" value="image-cropped" checked="checked" />',
                '#allowed_tags' => ['input'],
              ],
            ],
            t('Displayed'),
            t('Image'),
            ['id' => 'image-display-resolution'],
          ],
        ],
        [
          'no_striping' => TRUE,
          'data' => [
            [
              'data' => [
                '#markup' => '<input type="radio" name="resolution" value="image-full" />',
                '#allowed_tags' => ['input'],
              ],
            ],
            t('Full'),
            t('Image'),
            ['id' => 'image-full-resolution'],
          ],
        ],
      ],
    ];
    return $build;
  }

  public function build($config) {
    $func = 'build' . $config['popupName'];

    // Define the dialog contents
    $build = $this->$func($config);

    // If the dialog has buttons than create them.
    if ($build['buttons']) {
      $build['buttonpane'] = [
        '#type' => 'container',
      ];
      foreach ($build['buttons'] as $name) {
        $build['buttonpane'][$name] = [
          '#type' => 'button',
          '#value' => $name,
          '#attributes' => [
            'class' => ['imager-button'],
            'id' => 'imager-' . strtolower($config['popupName']) . '-' . str_replace(' ', '-', strtolower($name)),
          ],
        ];
      }
    }

    return $build;
  }
}

