<?php

namespace Drupal\imager;

/**
 * Class ImagerInit
 *
 * @package Drupal\imager
 */
class ImagerInit {

  /**
   * Create render array to attach necessary libraries and settings.
   *
   * @param $config
   * @return array
   */
  static public function start($config) {
    $build = array(
      '#attached' => array(
        'drupalSettings' => array(
          'imager' => array(
            'objects' => 'space to pass something',
          ),
        ),
        'library' => [
          'imager/imager-base',
          'imager/imager-editor',
        ],
      ),
    );
    return $build;
  }

}
