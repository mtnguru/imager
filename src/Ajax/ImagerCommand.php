<?php


namespace Drupal\imager\Ajax;
use Drupal\Core\Ajax\CommandInterface;

class ImagerCommand implements CommandInterface {
  public function __construct($data) {
    $this->data = $data;
  }

  public function render() {
    return array(
      'command' => 'ImagerCommand',
      'data' => $this->data,
    );
  }
}

