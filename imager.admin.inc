<?php
/**
 * @file
 * Provide configuration administration form
 */

/**
 * Create the imager_display_ hook_menu().
 */
function imager_admin_form() {
  $form = array();

  $form['imager_admin_form'] = array(
    '#type' => 'textfield',
    '#title' => t('Maximum number of links'),
    '#default_value' => variable_get('onthisdate_maxdisp', 3),
    '#size' => 2,
    '#maxlength' => 2,
    '#description' => t("The maximum number of links to display in the block."),
    '#required' => TRUE,
  );

  return system_settings_form($form);
}

