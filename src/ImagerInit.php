<?php

namespace Drupal\imager;

use Drupal\Component\Serialization\Yaml;
use Drupal\Component\Utility\Xss;

/**
 * Class ImagerInit
 * @package Drupal\imager
 */
class ImagerInit {
  static $js_loaded = false;

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

