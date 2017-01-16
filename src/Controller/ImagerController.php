<?php

namespace Drupal\imager\Controller;

use Drupal\Core\Ajax\AjaxResponse;

use Drupal\Core\Controller\ControllerBase;
use Drupal\imager\ImagerPopups;
use Drupal\imager\Ajax\ImagerCommand;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\file\Entity\File;

use Drupal\Core\File\FileSystemInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;


/**
 * Class ImagerController.
 *
 * @package Drupal\imager\Controller
 */
class ImagerController extends ControllerBase {

  /**
   * The Entity Manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The configuration factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The File system.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected $fileSystem;

  /**
   * Constructs a \Drupal\system\ConfigFormBase object.
   *
   * @param Client $client
   *   Acquia Client.
   */
  public function __construct(ConfigFactoryInterface $config_factory, EntityTypeManagerInterface $entity_type_manager, FileSystemInterface $file_system) {
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
    $this->fileSystem = $file_system;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory'),
      $container->get('entity.manager'),
      $container->get('file_system')
    );
  }


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
  private function getFileParts($uri, $makeNew) {
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
    if ($makeNew) {
      do {
        $newfilename = $filename . '_' . ++$n . '.' . $fp['extension'];
        $newpath = DRUPAL_ROOT . $fp['dirname'] . '/' . $newfilename;
      } while (file_exists($newpath));

      $fp['newfilename'] = $newfilename;
      $fp['newpath'] = $newpath;
    }

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
   * Save an edited image into the current media entity or a new one.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function saveFile() {
    $data = json_decode(file_get_contents("php://input"), true);

    // Load the media entity.
    $media = $this->entityTypeManager->getStorage('media')->load($data['mid']);

    $fp = $this->getFileParts(urldecode($data['uri']), true);

    // Save the image, process through 'convert' command to reduce file size (quality).
    $tmpPath = file_directory_temp() . '/' . $fp['newfilename'] . '.' . $fp['extension'];
    $this->writeImage($tmpPath, $data['imgBase64']);
    $this->convertImage($tmpPath, $fp['newpath']);
    $file = File::create(['uri' => 'public://' . $fp['newfilename']]);
    $file->save();

    // Initialize some variables.
    $media->get('image')->setValue($this->image);
    $image = $media->get('image')->getValue();
    $thumb = $media->get('thumbnail')->getValue();

    $media = ($data['overwrite'] == "true") ? $media : $media->createDuplicate();

    // Set the primary image.
    $image[0]['target_id'] = $file->id();
    $media->get('image')->setValue(($image));

    // Set the thumbnail.
    $thumb[0]['target_id'] = $file->id();
    $media->get('thumbnail')->setValue($thumb);

    // Set the changed time to current time
    $media->get('changed')->setValue(REQUEST_TIME);

    // Save the media entity
    $media->save();

    // @TODO - return confirmation message.
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

  /**
   * Load one of the Imager dialogs.
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  static $popups = null;
  public function loadDialog() {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty(self::$popups)) {
      self::$popups = new ImagerPopups();
    }

    $dialog = self::$popups->build($data);
    $data['content'] = render($dialog['content']);
    if (!empty($dialog['buttonpane'])) {
      $data['buttonpane'] = render($dialog['buttonpane']);
    }
    $data['id'] = $dialog['id'];

    $response = new AjaxResponse();
    $response->addCommand(new ImagerCommand($data));
    return $response;
  }
  /**
   * Save the image so it can be displayed in a new tab in the browser.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   */
  public function viewBrowser() {
    $data = json_decode(file_get_contents("php://input"), true);

    // Load the media entity.
    $media = $this->entityTypeManager->getStorage('media')->load($data['mid']);


    // Directory where images and temporary html files are stored.
    $uri = urldecode($data['uri']);
    $fp = pathinfo($uri);

    $base_url = $GLOBALS['base_url'] . $GLOBALS['base_path'];
    $urlDir = 'public://imager';
    $fullDir = $this->entityTypeManager->realpath($urlDir);
    $dir = str_replace(DRUPAL_ROOT . '/', '', $fullDir);
    $path = $this->fileSystem->tempnam($fullDir);
    $np = pathinfo($path);
    $tmpImagePath = $path . '_tmp.' . $fp['extension'];
    $imagePath    = $path . '.' . $fp['extension'];
    $htmlPath     = $path . '.html';

    $np = pathinfo($path);
    $imageUrl = '/' . $dir . '/' . $np['basename'] . '.' . $fp['extension'];
    $htmlUrl = $base_url . $dir . '/' . $np['basename'] . '.html';

    file_prepare_directory($fullDir, FILE_CREATE_DIRECTORY);

    // Save the image, process through 'convert' command to reduce file size (quality).
    $this->writeImage($tmpImagePath, $data['imgBase64']);
    $this->convertImage($tmpImagePath, $imagePath);
    chmod($imagePath, 0744);

    $body = '<img src="' . $imageUrl . '" />';
    $page = '<html><head><title>' . 'Imager Page' . '</title></head><body>' . $body . '</body></html>';
    $fp = fopen($htmlPath, 'w');
    fwrite($fp, $page);
    fclose($fp);
    chmod($htmlPath, 0744);

    $data['url'] = $htmlUrl;

    $response = new AjaxResponse();
    $response->addCommand(new ImagerCommand($data));
    return $response;
  }

  public function displayEntity() {
    $data = json_decode(file_get_contents("php://input"), true);
    $config = $this->configFactory->get('imager.settings');

    // Load the media entity.
    $media = $this->entityTypeManager->getStorage('media')->load($data['mid']);

    $view_mode = explode('.', $config->get('view_mode_info'))[1];
//  $view_mode = $config->get('view_mode_info');
    $data['html'] = render($this->entityTypeManager->getViewBuilder('media')->view($media, $view_mode));

    $response = new AjaxResponse();
    $response->addCommand(new ImagerCommand($data));
    return $response;
  }
}



