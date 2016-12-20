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
   * Create drupal public or private path and a unique image filename.
   *
   * @param string $uri
   *   URI of file.
   *
   * @return object $ps
   *   Array of paths for this image.
   */
  private function getFileParts($uri) {
    $fp = pathinfo($uri);

    // Create newfilename - append _1 or increment if already counting.
    $filename = $fp['filename'];
    if (preg_match('/_(\d)$/', $filename, $matches)) {
      $n = $matches[0];
      $filename = preg_replace('/_\d$/', '', $filename);
    }
    else {
      $n = 0;
    }
    do {
      $newfilename = $filename . '_' . ++$n . '.' . $fp['extension'];
      $newpath = DRUPAL_ROOT . $fp['dirname'] . '/' . $newfilename;
    } while (file_exists($newpath));

    $fp['newfilename'] = $newfilename;
    $fp['newpath'] = $newpath;

    return $fp;
  }


  /**
   * Write POSTed image to file path.
   *
   * @param string $path
   *   Path to write image to.
   */
  private function writeImage($path, $base64Img) {
    $filtered_data = explode(',', $base64Img);
    $fp = fopen($path, 'w');
    fwrite($fp, base64_decode($filtered_data[1]));
    fclose($fp);
  }

  /**
   * Execute ImageMagick convert command to scale image.
   *
   * @param string $spath
   *   Source path for image.
   * @param string $dpath
   *   Destination path for image.
   * @param string $type
   *   If $type == browser then scale to saved configuration settings.
   */
  private function convertImage($spath, $dpath, $type = NULL) {
    switch ($type) {
      case 'browser':
        $geometry = variable_get('imager_browser_width', 1200) . 'x' .
          variable_get('imager_browser_height', 1200);
        $cmd = "/usr/bin/convert -quality 60 -scale $geometry \"$spath\" \"$dpath\" > /tmp/convert.log 2>&1";
        break;

      default:
        $cmd = "/usr/bin/convert -quality 60 \"$spath\" \"$dpath\" > /tmp/convert.log 2>&1";
        break;
    }
    system($cmd);
    if (!file_exists($dpath)) {
      $cmd = "cp $spath $dpath";
      system($cmd);
    }
    $cmd = "rm $spath";
    system($cmd);
  }

  /**
   * Save an image file.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function saveFile() {
    $data = json_decode(file_get_contents("php://input"), true);
    $out['action'] = $data['action'];
    $out['status'] = 'pass';

    $overwrite = $data['overwrite'];
    $uri = urldecode($data['uri']);
    $mid = $data['mid'];

    $fp = $this->getFileParts($uri);

    $media = \Drupal::entityTypeManager()->getStorage('media')->load($mid);

//  $media->set('mid')
    // Save the image to a tmp file.
    $tmpPath = file_directory_temp() . '/' . $fp['newfilename'] . '.' . $fp['extension'];
    $this->writeImage($tmpPath, $data['imgBase64']);

    // @TODO Make this configurable
    $this->convertImage($tmpPath, $fp['newpath']);

    if ($overwrite == "true") {
      $file->uri = $ps['nuri'];
      $file->filename = $ps['nfilename'] . '.' . $ps['suffix'];
      $file = file_save($file);
      $out['file_old'] = reset(module_invoke_all('imager_modify', $file->fid));
      // dpm($out,"overwrite"); .
    }
    else {
      unset($media->values['mid']);
      // Forces file_save to create a new file entity.
      $file->uri = $ps['nuri'];
      $file->filename = $ps['nfilename'] . '.' . $ps['suffix'];
      $file = file_save($file);
      $result = reset(module_invoke_all('imager_modify', $file->fid));
      $out['file_new'] = $result;
    }
    print json_encode($out);

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

