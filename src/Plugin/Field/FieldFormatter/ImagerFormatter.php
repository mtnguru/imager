<?php

/**
 * @file
 * Contains \Drupal\imager\Plugin\Field\FieldFormatter\ImagerFormatter 
 */

namespace Drupal\imager\Plugin\Field\FieldFormatter;


use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Link;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Url;
use Drupal\image\Entity\ImageStyle;
use Drupal\image\Plugin\Field\FieldFormatter\ImageFormatterBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Cache\Cache;


use Drupal\imager\ImagerFiles;
use Drupal\imager\ImagerInit;

/**
 * Plugin implementation of the 'imager_mode' formatter.
 *
 * @FieldFormatter(
 *   id = "imager_formatter",
 *   label = @Translation("Imager"),
 *   description = @Translation("Display an image in an imager viewer window."),
 *   field_types = {
 *     "image", 
 *   }
 * )
 */
class ImagerFormatter extends ImageFormatterBase implements ContainerFactoryPluginInterface {

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountInterface
   */
  protected $currentUser;

  /**
   * The image style entity storage.
   *
   * @var \Drupal\image\ImageStyleStorageInterface
   */
  protected $imageStyleStorage;

  /**
   * Constructs an ImageFormatter object.
   *
   * @param string $plugin_id
   *   The plugin_id for the formatter.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
   *   The definition of the field to which the formatter is associated.
   * @param array $settings
   *   The formatter settings.
   * @param string $label
   *   The formatter label display setting.
   * @param string $view_mode
   *   The view mode.
   * @param array $third_party_settings
   *   Any third party settings settings.
   * @param \Drupal\Core\Session\AccountInterface $current_user
   *   The current user.
   */
  public function __construct($plugin_id, $plugin_definition, FieldDefinitionInterface $field_definition, array $settings, $label, $view_mode, array $third_party_settings, AccountInterface $current_user, EntityStorageInterface $image_style_storage) {
    parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $label, $view_mode, $third_party_settings);
    $this->currentUser = $current_user;
    $this->imageStyleStorage = $image_style_storage;
  }

 /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $plugin_id,
      $plugin_definition,
      $configuration['field_definition'],
      $configuration['settings'],
      $configuration['label'],
      $configuration['view_mode'],
      $configuration['third_party_settings'],
      $container->get('current_user'),
      $container->get('entity.manager')->getStorage('image_style')
    );
  }

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return array(
      'imager_mode' => 'popup',
      'imager_style' => '',
    );
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $image_styles = image_style_options(FALSE);
    $description_link = Link::fromTextAndUrl(
      $this->t('Configure Image Styles'),
      Url::fromRoute('entity.image_style.collection')
    );
    $elements['imager_style'] = [
      '#title' => t('Image style'),
      '#type' => 'select',
      '#default_value' => $this->getSetting('image_style'),
      '#empty_option' => t('None (original image)'),
      '#options' => $image_styles,
      '#description' => $description_link->toRenderable() + [
        '#access' => $this->currentUser->hasPermission('administer image styles')
      ],
    ];

    $imager = $this->getSetting('imager_mode');
    $elements['imager_mode'] = array(
      '#type' => 'select',
      '#options' => array("popup" => 'Popup', 'inplace' => 'In place'),
      '#title' => t('Imager mode'),
      '#default_value' => ($imager) ? $imager : defaultSettings()['imager_mode'],
      '#required' => TRUE,
    );

    return $elements;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = array();
    $summary[] = t('Imager: @imager', array('@imager' => $this->getSetting('imager_mode')));

    return $summary;
  }

  static $libraries_attached = false;


  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $elements = array();
    $files = $this->getEntitiesToView($items, $langcode);

    // Early opt-out if the field is empty.
    if (empty($files)) {
      return $elements;
    }

    $image_style_setting = $this->getSetting('imager_style');

    // Collect cache tags to be added for each item in the field.
    $base_cache_tags = [];
    if (!empty($image_style_setting)) {
      $image_style = $this->imageStyleStorage->load($image_style_setting);
      $base_cache_tags = $image_style->getCacheTags();
    }


    foreach ($files as $delta => $file) {
      $cache_contexts = [];
      $cache_tags = Cache::mergeTags($base_cache_tags, $file->getCacheTags());

      // Extract field item attributes for the theme function, and unset them
      // from the $item so that the field template does not re-render them.
      $item = $file->_referringItem;
      $item_attributes = $item->_attributes;
      unset($item->_attributes);

      $item_attributes['class'][] = 'im-image';
      $item_attributes['data-mid'] = $items->getEntity()->mid->value;

      $elements[$delta] = array(
        '#theme' => 'imager_formatter',
        '#item' => $item,
        '#item_attributes' => $item_attributes,
        '#image_style' => $image_style_setting,
        '#cache' => array(
          'tags' => $cache_tags,
          'contexts' => $cache_contexts,
        ),
      );

      if (self::$libraries_attached == false) {
        self::$libraries_attached = true;
        $imager = ImagerInit::start([
          'atom_id' => 1,
          'imager_id' => 'Imager Viewer',
          'imager_mode' => $this->getSetting('imager_mode'),
          'label' => 'Imager Formatter',
        ]);
        $elements[$delta]['#attached'] = $imager['#attached'];
      }
    }

    /***
    $elements = array();

    foreach ($items as $delta => $item) {
    // Read in the config/imager file

    $mid = $items->getEntity()->mid->value;
    $config = [
    ];

    $elements[$delta] = ImagerInit::start($config);
    }
    **/

    return $elements;
  }
}
