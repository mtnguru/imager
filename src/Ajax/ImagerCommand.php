<?php

namespace Drupal\imager\Ajax;

use Drupal\Core\Ajax\CommandInterface;

/**
 * Class ImagerCommand
 * @package Drupal\imager\Ajax
 */
class ImagerCommand implements CommandInterface {

  /**
   * ImagerCommand constructor.
   * @param $data
   */
  public function __construct($data) {
    $this->data = $data;
  }

  /**
   * Create the command array.
   *
   * @return array
   */
  public function render() {
    return array(
      'command' => 'ImagerCommand',
      'data' => $this->data,
    );
  }

}
