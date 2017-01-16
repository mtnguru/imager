<?php

namespace Drupal\imager\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;

use Symfony\Component\DependencyInjection\ContainerInterface;


/**
 * Implements the GeolocationGoogleMapAPIkey form controller.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class ImagerSettingsForm extends ConfigFormBase implements ContainerInjectionInterface {

  /**
   * The entity manager.
   *
   * @var \Drupal\Core\Entity\EntityManagerInterface
   */
  protected $entityManager;

  /**
   * Constructs the ExifSettingsForm object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity manager.
   */
  public function __construct(EntityTypeManagerInterface $entityManager) {
    $this->entityManager = $entityManager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity.manager')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'imager_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'imager.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->configFactory()->get('imager.settings');
    $view_modes = $this->entityManager->getViewModes('media');

    $options = [];
    foreach ($view_modes as $key => $mode) {
      $options[$mode['id']] = $mode['label'];
    }

    $form['view_modes'] = [
      '#type' => 'fieldset',
      '#title' => t('View Modes'),
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
      'view_mode_info' => [
        '#type' => 'select',
        '#title' => $this->t('Information popup'),
        '#default_value' => $config->get('view_mode_info'),
        '#options' => $options,
        '#description' => $this->t('View mode when displaying media fields in a popup'),
      ],
      'view_mode_map' => [
        '#type' => 'select',
        '#title' => $this->t('Map marker popup'),
        '#default_value' => $config->get('view_mode_map'),
        '#options' => $options,
        '#description' => $this->t('View mode when user hovers over a map marker'),
      ],
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->configFactory()->getEditable('imager.settings');

    $config->set('view_mode_info', $form_state->getValue('view_mode_info'));
    $config->set('view_mode_map', $form_state->getValue('view_mode_map'));
    $config->save();

    parent::submitForm($form, $form_state);
  }

}