<?php
/**
 * @file
 * Provide configuration administration form
 */

/**
 * Create imager_admin_form.
 */
function imager_admin_form() {
  $form = array();

  $view_mode_settings = field_view_mode_settings('file', 'image');

  $entity_info = entity_get_info('file');
  $viewmodes = array('default' => t('Default'));
  foreach ($entity_info['view modes'] as $file_view_mode => $file_view_mode_info) {
    $viewmodes[$file_view_mode] = $file_view_mode_info['label'];
  }

  // General
  $form['general'] = array(
    '#type' => 'fieldset',
    '#title' => 'General',
  );
  $form['general']['imager_fid'] = array(
    '#type' => 'textfield',
    '#title' => t('CSS Class'),
    '#default_value' => variable_get('imager_fid', 1),
    '#description' => 
      t('<p>@TODO - FID of any file stored on the system.  Rather than store this as a configurable variable it should instead be a database call.  Or better yet find a way to initialize the file_entity_edit form without needing a pre-existing file.</p>'
       ),
    '#size' => 4,
    '#required' => TRUE,
  );
  // Views configuration
  $form['views'] = array(
    '#type' => 'fieldset',
    '#title' => 'Views',
  );
  $form['views']['imager_views_css_class'] = array(
    '#type' => 'textfield',
    '#title' => t('CSS Class'),
    '#default_value' => variable_get('imager_views_css_class', 'imager'),
    '#description' => 
      t('<p>Class name to identify Views that use the Imager module.<br>Default: imager</p>' . 
        '<p>To configure your View -- In the View configuration screen assign a class name under: Advanced -> Other -> CSS class.  List that class here.  (Do not prepend the class name with "." in either location).</p>'
       ),
    '#size' => 24,
    '#required' => TRUE,
  );
  $form['views']['imager_views_css_container'] = array(
    '#type' => 'textfield',
    '#title' => t('CSS Selector for container around thumbnail images'),
    '#default_value' => variable_get('imager_views_css_container', '.views-row'),
    '#description' => 
      t('<p>CSS Selector to identify those images to be viewed/edited with Imager module.<br>Default: .views-row</p>'),
    '#size' => 24,
    '#required' => TRUE,
  );
  $form['views']['imager_views_css_image'] = array(
    '#type' => 'textfield',
    '#title' => t('CSS Selector for thumbnail images'),
    '#default_value' => variable_get('imager_views_css_image', 'img'),
    '#description' => 
      t('<p>CSS Selector for thumbnail image.<br>Default: img</p>'),
    '#size' => 24,
    '#required' => TRUE,
  );

  // Information popup
  $form['information'] = array(
    '#type' => 'fieldset',
    '#title' => 'Information Popup',
    '#description' => t('The information popup can be selected while viewing an image.'),
  );
  $form['information']['imager_information_view_mode'] = array(
    '#type' => 'select',
    '#title' => t('View Mode'),
    '#default_value' => variable_get('imager_information_view_mode', 'media_imager_info'),
    '#description' => t('View Mode to display rendered file_entity in information popup.  Do not include the image.'),
    '#options' => $viewmodes,
  );

  // Browser window
  $form['browser'] = array(
    '#type' => 'fieldset',
    '#title' => 'Browser',
    '#description' => 
      t('<p>When viewing an image the user can select to generate a basic HTML page that is popped up in a new browser window.  This simple page is intended for clean printing - no menus, sidebars, etc.  The page is created by rendering the file_entity fields for this image using a View Mode that is specified in the VIEW MODES section below.</p>' .
        '<p>Since the image being viewed has possibly been edited or zoomed, it cannot be included in the rendered file_entity.  It has not been stored.  Therefore it is displayed either before or after the rendered file_entity.  Some browsers print large images across multiple pages.  Therefore specify a maximum width and height to limit image size.</p>'
      ),
  );
  $form['browser']['imager_browser_view_mode'] = array(
    '#type' => 'select',
    '#title' => t('View Mode'),
    '#default_value' => variable_get('imager_browser_view_mode', 'media_imager_browser'),
    '#description' => t('Select View Mode to render the file_entity.  Do not include the image, it is displayed separately.'),
    '#options' => $viewmodes,
  );
  $form['browser']['imager_browser_location'] = array(
    '#type' => 'select',
    '#title' => t('Image location'),
    '#default_value' => variable_get('imager_browser_location', 'Above'),
    '#description' => t('Display the image above or below the rendered file_entity.'),
    '#options' => array(
      'Above' => 'Above',
      'Below' => 'Below',
    ),
  );
  $form['browser']['container']['imager_browser_width'] = array(
    '#type' => 'textfield',
    '#title' => t('Max image width'),
    '#default_value' => variable_get('imager_browser_width', 1800),
    '#description' => t('Maximum image width in pixels.'),
    '#maxlength' => 4,
    '#size' => 4,
  );
  $form['browser']['container']['imager_browser_height'] = array(
    '#type' => 'textfield',
    '#title' => t('Max image height'),
    '#default_value' => variable_get('imager_browser_height', 2400),
    '#description' => t('Maximum image height in pixels.'),
    '#size' => 4,
  );

  // Email configuration
  $form['email'] = array(
    '#type' => 'fieldset',
    '#title' => 'Email Configuration',
    '#description' => 
      t('<p>When viewing or editing an image the user can select to email the image.  The users email client is started and the image is attached to an outgoing message.  For security reasons the email client requires the image be stored on a local file system.  Therefore the users PC and the site web server must share the same file system.</p>' .
        '<p>TODO: Since the file system must be shared this limits possible users to a list of known IP addresses.  Save a list of valid IP address (patterns) and do not allow users outside those IP addresses to select the email option.</p>'
      ),
  );
  $form['email']['imager_email_enable'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable attaching images to users email client.'),
    '#default_value' => variable_get('imager_email_enable', FALSE),
  );

  $form['email']['container'] = array(
    '#type' => 'container',
    '#states' => array(
      // Hide the additional picture settings when user pictures are disabled.
      'invisible' => array(
        'input[name="imager_email_enable"]' => array('checked' => FALSE),
      ),
    ),
  );
  $form['email']['container']['imager_email_view_mode'] = array(
    '#type' => 'select',
    '#title' => t('View Mode'),
    '#default_value' => variable_get('imager_email_view_mode', 'media_imager_email'),
    '#description' => t('View Mode for text portion of email - do not include the image, it is attached separately.'),
    '#options' => $viewmodes,
  );
  $form['email']['container']['imager_email_location'] = array(
    '#type' => 'select',
    '#title' => t('Image location'),
    '#default_value' => variable_get('imager_email_location', 'Above'),
    '#description' => t('Display the image above or below the rendered file_entity.'),
    '#options' => array(
      'Above' => 'Above',
      'Below' => 'Below',
    ),
  );
  $form['email']['container']['imager_email_local_path'] = array(
    '#type' => 'textfield',
    '#title' => t('Local file path'),
    '#default_value' => variable_get('imager_email_local_path', DRUPAL_ROOT . '/email'),
    '#description' => t('Local path to store temporary image files.'),
  );
  $form['email']['container']['imager_email_attach_linux'] = array(
    '#type' => 'textfield',
    '#title' => t('Remote file path - Linux'),
    '#default_value' => variable_get('imager_email_attach_linux', DRUPAL_ROOT . '/email'),
    '#description' => t('Linux path for email client to find temporary image files.'),
  );
  $form['email']['container']['imager_email_attach_windows'] = array(
    '#type' => 'textfield',
    '#title' => t('Remote file path - Windows'),
    '#default_value' => variable_get('imager_email_attach_windows', 'C:\\\\images'),
    '#description' => t('Windows path for email client to find temporary image files'),
  );

  return system_settings_form($form);
}

