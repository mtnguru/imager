<?php

namespace Drupal\imager\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Url;
use Drupal\Core\Form\FormStateInterface;


/**
 * Class ImagerControlsForm.
 *
 * @package Drupal\imager\Form
 */
class ImagerControlsForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'imager_controls_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, $controlSet = array()) {

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
            /* 'mode_fullscreen' => _imager_build_button(2, 'mode-fullscreen', 'fullscreen.png', t('View image full screen')), */
            'image_left' => _imager_build_button(3, 'image-left', 'left_arrow.png', t('View image to the left')),
            'image_right' => _imager_build_button(4, 'image-right', 'right_arrow.png', t('View image to the right')),
            'mode_configure' => _imager_build_button(5, 'mode-configure', 'configure.png', t('Configure settings')),
          ),
          /*  'mode_buttons' => array(
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
                'mode_view' => _imager_build_button(1, 'mode-view', 'eye.png', t('Enable/Disable quick image viewing - view on hover')),
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
            /* 'view_info' => _imager_build_button(2, 'view-info', 'information.png', t('View Image information')), */
            /* 'view_map' => _imager_build_button(3, 'view-map', 'map.png', t('View map showing image locations for page')), */
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
            // @TODO don't display if doesn't have permissions.
            'file_database' => _imager_build_button(1, 'file-database', 'database_go.png', t('Save edited image to database')),
            // @TODO Don't display if doesn't have permissions.
            'file_delete' => _imager_build_button(2, 'file-delete', 'database_delete.png', t('Delete image from database')),
            'file_download' => _imager_build_button(3, 'file-download', 'download.png', t('Download image to local file system'), TRUE),
            // @TODO Don't display if not at appropriate IP addresses.
            'file_print' => _imager_build_button(4, 'file-print', 'print.png', t('Print Image')),
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
            'debug_status' => _imager_build_button(1, 'debug-status', 'bug.png', t('Toggle status output')),
            /* 'debug_messages' => _imager_build_button(2, 'debug-messages', 'bug2.png', t('Toggle debug messages')), */
          ),
        ),
        'imager_canvas_wrapper' => array(
          '#prefix' => '<div id="imager-canvas-wrapper">',
          '#suffix' => '</div>',
          '#weight' => 2,
          'imager_image' => array(
            '#type' => 'markup',
            '#weight' => 2,
            '#markup' => '<img id="imager-image" src="'
              . $GLOBALS["base_url"] . '/' . $_imager_path . '/icons/transparent.png'
              . '" alt="" title="" />',
          ),
          'imager_canvas' => array(
            '#weight' => 1,
            '#prefix' => '<canvas id="imager-canvas">',
            '#suffix' => '</canvas>',
          ),
        ),
      );
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    if ($form_state->hasValue('label')) {
        $cached_values['label'] = $form_state->getValue('label');
      }
      if ($form_state->hasValue('id')) {
        $cached_values['id'] = $form_state->getValue('id');
      }
      if (is_null($this->machine_name) && !empty($cached_values['id'])) {
        $this->machine_name = $cached_values['id'];
      }
      $this->getTempstore()->set($this->getMachineName(), $cached_values);
      if (!$form_state->get('ajax')) {
        $form_state->setRedirect($this->getRouteName(), $this->getNextParameters($cached_values));
      }

  }

}

