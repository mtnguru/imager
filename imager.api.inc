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
 * Implement hook to refresh images on thumbnail source page.
 *
 * Changes to images and file entity fields can be reflected back to the
 * thumbnail source page.  Your hook returns a rendered file entity for
 * the file entity that was altered.
 *
 * @param string $action
 *   Action to be executed.
 * @param int $fid
 *   File ID of image to reload.
 *
 * @return string
 *   Rendered file_entity that replace original
 */
function hook_imager_modify($action, $fid) {
  $views_row = '<h2>hook_imager_modify</h2><div>Replacement dude</div>';
  // Execute a view that takes an FID and returns rendered HTML.
  return $views_row;
}

/**
 * @} End of "addtogroup hooks"
 */
