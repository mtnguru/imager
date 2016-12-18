<?php

namespace Drupal\imager\Controller;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\OpenModalDialogCommand;

use Drupal\Core\Controller\ControllerBase;
use Drupal\imager\ImagerPopups;
use Drupal\imager\Ajax\ImagerCommand;

// use Symfony\Component\Yaml\Yaml;

/**
 * Class ImagerController.
 *
 * @package Drupal\imager\Controller
 */
class ImagerController extends ControllerBase {

  /**
   * Load a File.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function loadFile() {

    $response = new AjaxResponse();
//  $ymlContents = Yaml::decode(file_get_contents(drupal_get_path('module', 'imager') . '/' . $data['filepath']));
//  $response->addCommand(new LoadYmlCommand($data, $ymlContents));

    return $response;
  }

  /**
   * Save a file.
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function saveFile() {
    $response = new AjaxResponse();
    return $response;
  }

  /**
   * Delete a file.
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function deleteFile() {
    $response = new AjaxResponse();
    return $response;
  }

  /**
   * Load a map
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function loadMap() {
    $response = new AjaxResponse();
    return $response;
  }

  /**
   * Load the Image Edit form.
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function loadImageForm() {
    $response = new AjaxResponse();
    return $response;
  }

  /**
   * Load a field from the Image Edit form.
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function loadImageFieldForm() {
    $response = new AjaxResponse();
    return $response;
  }

  static $popups = null;
  /**
   * Load one of the Imager dialogs.
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function loadDialog() {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty(self::$popups)) {
      self::$popups = new ImagerPopups();
    }

    $build = self::$popups->build($data);
    $data['popupHtml'] = render($build);

    $response = new AjaxResponse();
    $response->addCommand(new ImagerCommand($data));
    return $response;
  }
}
