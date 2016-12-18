<?php

namespace Drupal\imager;

use Drupal\Component\Serialization\Yaml;
use Drupal\Component\Utility\Xss;

/**
 *
 * @package Drupal\imager
 */
class ImagerInit {
  static $js_loaded = false;

  static public function start($config) {
    $imager['id'] = $id = strtolower(str_replace(['_', ' '], '-', $config['imager_id']));
    if (!empty($config['mid'])) {
      $imager['mid'] = $config['mid'];
    }

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

