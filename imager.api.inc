<?php

/**
 * @file
 * Hooks provided by the Imager module.
 */

/**
 * @addtogroup hooks
 * @{
 */

/**
 * Notify of changes made to images and file_entities
 * Delete file entity - Hide .views-row
 * Save new file entity - Render and insert after current image.
 * Overwrite file entity - Render and insert after, color before in blue
 * Edit image - Render and replace views-row.
 * Edit fields through Imager viewer - Render and replace views-row
 * 
 * @param type $action
 * @param type $fid
 * 
 * @return rendered file_entity to replace original
 */
function hook_imager_modify($action, $fid) {
  $views_row = '<h2>hook_imager_modify</h2><div><Replacement dude</div>';
  // Execute a view that takes an FID and returns rendered HTML.
  return $views_row;
}

/**
 * @} End of "addtogroup hooks"
 */