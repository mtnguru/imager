<?php

/**
 * @file
 * Implements Ajax service functions for imager module.
 */

/**
 * Ajax handler to retrieve a rendered file_entity.
 *
 * Given the URI of an image file, determine the FID, load the file_entity,
 * add edit buttons (images) to editable fields in render array,
 * render it, encode into json and print it.
 */
function imager_display_entity() {
  // dpm($_POST, 'imager_display_entity - $_POST'); .
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);
  // dpm($file, 'imager_display_entity - $file'); .
  $view = file_view($file, variable_get('imager_information_view_mode'));

  $icon_path = $GLOBALS['base_url'] . '/' . drupal_get_path('module', 'imager') . '/icons';
  $common = "class='imager-info-edit' src='$icon_path/edit.png'";
  foreach ($view as $key => $value) {
    if (preg_match('?^field_?', $key)) {
      $view[$key]['#prefix'] = "<img id='imager-" . $key . "' $common />";
    }
  }

  $out['data'] = drupal_render($view);
  print json_encode($out);
};

/**
 * Ajax handler to render a Google map showing image location.
 *
 * Does not work, JavaScript files are not loaded.
 */
function imager_display_map() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);
  $view_mode = check_plain($_POST['viewMapMode']);
  // $view = entity_view('file',array($file),$view_mode);
  $view = file_view($file, $view_mode);
  $out['data'] = drupal_render($view);
  print json_encode($out);
};

/**
 * Ajax handler to load and render the file_entity_edit form.
 *
 * This isn't currently used, instead individual fields are rendered with.
 */
function imager_edit_form_load() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $uri = urldecode(check_plain($_POST['uri']));
  $cmp = _imager_extract_path_components($uri);
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";

  // $out['debug'][] .= "uri: " . $uri . "<br>\n"; .
  // $out['debug'][] .= "public uri: " . $puri . "<br>\n"; .
  $fid = _imager_get_fid($puri);
  $file = file_load($fid);
  $form_id = 'file_entity_edit';
  $out['data'] = drupal_render(drupal_get_form($form_id, $file));
  print json_encode($out);
}

/**
 * Search a form element's render array and determine what #type it is.
 *
 * @todo This is a kludge, look for a property or API that can return the #type
 *
 * @param array $elem
 *   Top element of the form.
 * @param int $level
 *   Used for debugging by printing a hierarchical output while searching.
 *
 * @return string
 *   String which describes type of field being modified.
 */
function _imager_get_field_type(array $elem, $level) {
  if ($level > 10) {
    return "";
  }
  foreach ($elem as $key => $value) {
    if (is_array($value)) {
      $type = _imager_get_field_type($value, $level + 1);
      if (strlen($type)) {
        return $type;
      }
    }
    elseif (is_object($value)) {
    }
    else {
      if ($key === '#type') {
        switch ($value) {
          case 'hierarchical_select':
          case 'textfield':
          case 'textarea':
          case 'radios':
          case 'checkbox_tree':
          case 'date_combo':
            return $value;

          case 'text_format':
            if ($elem['value']['#type'] === 'textarea') {
              return 'textarea';
            }
            break;

          default:
            break;
        }
      }
    }
  }
  return '';
}

/**
 * Ajax handler to load and render a field from the file_entity_edit form.
 *
 * The URI of the current image is used to determine the file_entity FID.
 * Load the file_entity and use that to initialize the form field.
 */
function imager_edit_form_field_load() {
  module_load_include('inc', 'file_entity', 'file_entity.pages');
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);

  $field_name = preg_replace('/\-/', '_', check_plain($_POST['field']));
  $form_id = 'file_entity_edit';
  $form = drupal_get_form($form_id, $file);
  $field = $form[$field_name];
  $out['data']['rendered'] = drupal_render($field);
  $out['data']['type'] = _imager_get_field_type($field[LANGUAGE_NONE][0], 1);
  // $out['debug'][] .= '#type: ' . $out['data']['type']; .
  print json_encode($out);
}

/**
 * Write POSTed image to file path.
 *
 * @param string $path
 *   Path to write image to.
 */
function _imager_write_image($path) {
  $filtered_data = explode(',', check_plain($_POST['imgBase64']));
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
function _imager_convert_image($spath, $dpath, $type = NULL) {
  switch ($type) {
    case 'browser':
      $geometry = variable_get('imager_browser_width', 1200) . 'x' .
        variable_get('imager_browser_height', 1200);
      $cmd = "/usr/bin/convert -quality 70 -scale $geometry \"$spath\" \"$dpath\" > /tmp/convert.log 2>&1";
      break;

    default:
      $cmd = "/usr/bin/convert -quality 70 \"$spath\" \"$dpath\" > /tmp/convert.log 2>&1";
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
 * Create drupal public or private path and a unique image filename.
 *
 * @param string $uri
 *   URI of file.
 *
 * @return object $ps
 *   Array of paths for this image.
 */
function _imager_get_paths($uri) {
  $ps = _imager_extract_path_components($uri);

  if (preg_match('/system\/files/', $uri)) {
    $ps['rootdir'] = variable_get('file_private_path');
    $ps['puri'] = "private://$ps[dir]$ps[filename].$ps[suffix]";
    $ps['nfilename'] = _imager_make_uniq_filepath($ps['rootdir'], $ps);
    $ps['npath'] = "$ps[rootdir]/$ps[dir]$ps[nfilename].$ps[suffix]";
    $ps['nuri'] = "private://$ps[dir]$ps[nfilename].$ps[suffix]";
  }
  else {
    $ps['rootdir'] = DRUPAL_ROOT . '/' . variable_get('file_public_path', conf_path() . '/files');
    $ps['puri'] = "public://$ps[dir]$ps[filename].$ps[suffix]";
    $ps['nfilename'] = _imager_make_uniq_filepath($ps['rootdir'], $ps);
    $ps['npath'] = "$ps[rootdir]/$ps[dir]$ps[nfilename].$ps[suffix]";
    $ps['nuri'] = "public://$ps[dir]$ps[nfilename].$ps[suffix]";
  }
  return $ps;
}

/**
 * Save an edited image - can be overwritten or a new file created.
 */
function imager_save_image() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $overwrite = check_plain($_POST['overwrite']);
  $uri = urldecode(check_plain($_POST['uri']));

  $ps = _imager_get_paths($uri);
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);

  // Save the image to a tmp file.
  $tmp_path = "/tmp/$ps[filename].$ps[suffix]";
  _imager_write_image($tmp_path);
  _imager_convert_image($tmp_path, $ps['npath']);

  if ($overwrite == "true") {
    $file->uri = $ps['nuri'];
    $file->filename = $ps['nfilename'] . '.' . $ps['suffix'];
    $file = file_save($file);
    $out['file_old'] = reset(module_invoke_all('imager_modify', $file->fid));
    // dpm($out,"overwrite"); .
  }
  else {
    unset($file->fid);
    // Forces file_save to create a new file entity.
    $file->uri = $ps['nuri'];
    $file->filename = $ps['nfilename'] . '.' . $ps['suffix'];
    $file = file_save($file);
    $result = reset(module_invoke_all('imager_modify', $file->fid));
    $out['file_new'] = $result;
  }
  print json_encode($out);
}

/**
 * Email edited image.
 *
 * Write file to tmp directory.
 * Return the path or calculate it on both sides?
 * Write the file to the P drive.  I can mount that but they need the path,
 */
function imager_email_file() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $uri = urldecode(check_plain($_POST['uri']));
  // $out['debug'][] .= "imagerEmailFile() start uri: " . $uri . "<br>\n"; .
  $ps = _imager_get_paths($uri);
  $ps['filename'] = substr($ps['filename'], 0, 12);
  $tmp_path = "/tmp/$ps[filename].$ps[suffix]";
  $dir = variable_get('imager_email_local_path');
  file_prepare_directory($dir, FILE_CREATE_DIRECTORY);
  $image_path = $dir . '/' . $ps['filename'] . '.' . $ps['suffix'];
  $image_path = preg_replace('/[:]/', '_', $image_path);
  _imager_write_image($tmp_path);
  _imager_convert_image($tmp_path, $image_path);

  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);

  if (strstr($_SERVER['HTTP_USER_AGENT'], 'inux')) {
    $out['data']['attachPath'] = variable_get('imager_email_attach_linux') . '/' .
      preg_replace('/:/', '_', $ps['filename'] . '.' . $ps['suffix']);
  }
  else {
    // Assume Windows.
    $out['data']['attachPath'] = variable_get('imager_email_attach_windows') . '\\' .
      preg_replace('/:/', '_', $ps['filename'] . '.' . $ps['suffix']);
  }
  $view = file_view($file, variable_get('imager_email_view_mode'));
  unset($view['links']);
  unset($view['#contextual_links']);
  unset($view['#pre_render']);
  unset($view['file']);

  // $out['data']['body'] = drupal_html_to_text(drupal_render($view));
  $html = drupal_render($view);
  $html = preg_replace('/<\/div>/i', "\n", $html);
  // $html = preg_replace('/<\/li>/i',"\n",$html); .
  // $html = preg_replace('/<li>/i','',$html); .
  // $html = preg_replace('/<\/ul>/i','',$html); .
  // $html = preg_replace('/<\/p>/i',"\n",$html); .
  $html = preg_replace('/\&nbsp;/', ' ', $html);
  $html = preg_replace('/<[^>]+>/i', '', $html);

  $out['data']['body'] = $html;
  $out['data']['subject'] = "Dairy Specialists - photo - $ps[filename]";
  $out['debug'][] = 'Email subject: ' . $out['data']['subject'];
  $out['debug'][] = 'Email body: ' . $html;
  $out['debug'][] = 'Email attachPath: ' . $out['data']['attachPath'];

  print json_encode($out);
}

/**
 * Create a rendered page of image to display in new browser tab.
 */
function imager_view_browser() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  $file = file_load(_imager_get_fid($ps['puri']));

  $dir = DRUPAL_ROOT . '/tmp';
  file_prepare_directory($dir, FILE_CREATE_DIRECTORY);

  $tmp_path = '/tmp/' . $ps['filename'] . '.' . $ps['suffix'];
  $html_path = $dir . '/file.html';
  $image_path = $dir . '/image.jpg';
  // @TODO The following paths need to be unique.
  $html_uri = $GLOBALS['base_url'] . '/tmp/file.html';
  $image_uri = $GLOBALS['base_url'] . '/tmp/image.jpg';

  _imager_write_image($tmp_path);
  _imager_convert_image($tmp_path, $image_path, 'browser');

  $view = file_view($file, variable_get('imager_browser_view_mode'));
  unset($view['links']);
  unset($view['#contextual_links']);
  $content = drupal_render($view);
  $content = preg_replace('/<h2.*h2>/', '', $content);
  // Remove the title.
  if (variable_get('imager_browser_location') == 'Above') {
    $body = '<img src="' . $image_uri . '" />' . $content;
  }
  else {
    $body = $content . '<img src="' . $image_uri . '" />';
  }
  $title = $file->file['field_file_imager_title_text'][LANGUAGE_NONE]['0']['safe_value'];
  $page = '<html><head><title>' . $title . '</title></head><body>' . $body . '</body></html>';
  $fp = fopen($html_path, 'w');
  fwrite($fp, $page);
  fclose($fp);

  $out['data']['uri'] = $html_uri;
  print json_encode($out);
}

/**
 * Delete an image file and the associated file_entity.
 */
function imager_delete_file() {
  $out['action'] = check_plain($_POST['action']);

  $uri = urldecode(check_plain($_POST['uri']));
  $ps = _imager_get_paths($uri);
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);
  $force = TRUE;
  file_delete($file, $force);

  $out['status'] = 'pass';
  print json_encode($out);
}

/**
 * Print image to a printer on the Web Server.
 */
function imager_print_image() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  // Send file to printer.
  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  // $file = file_load(_imager_get_fid($ps['puri'])); .
  $dir = DRUPAL_ROOT . '/tmp';
  file_prepare_directory($dir, FILE_CREATE_DIRECTORY);

  // Write image to file system.
  $tmp_path = '/tmp/' . $ps['filename'] . '.' . $ps['suffix'];
  _imager_write_image($tmp_path);

  $cmd = preg_replace('/IMAGEPATH/', $tmp_path,
           preg_replace('/NAME/', $_POST['printer'],
             variable_get('imager_printer_command')
           )
         );
  system($cmd);
  $out['debug'][] = 'Print Cmd: ' . $cmd;
  print json_encode($out);
}

/**
 * Save an edited file_entity field.
 */
function imager_save_file_entity_field() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';
  $field_name = preg_replace('/\-/', '_', check_plain($_POST['fieldName']));
  $field_type = check_plain($_POST['fieldType']);

  $uri = urldecode(check_plain($_POST['uri']));
  $ps = _imager_get_paths($uri);
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);
  // dpm($file,'imagerSaveFileEntityField - $file'); .
  // dpm(check_plain($_POST), 'POST'); .
  switch ($field_type) {
    case 'hierarchical_select':
      $file->{$field_name}[LANGUAGE_NONE][0]['tid'] = check_plain($_POST['value']);
      break;

    case 'date_combo':
      date_default_timezone_set($file->{$field_name}[LANGUAGE_NONE][0]['timezone']);
      $datetime = gmdate('Y-m-d H:i:s', strtotime(check_plain($_POST['value'])));
      $file->{$field_name}[LANGUAGE_NONE][0]['value'] = $datetime;
      break;

    case 'radios':
      $file->{$field_name}[LANGUAGE_NONE][0]['tid'] = check_plain($_POST['value']);
      break;

    case 'textfield':
      // Kludge - if value contains a number in parenthesis.
      if (preg_match('/\((\d*)\)/', check_plain($_POST['value']), $matches)) {
        // Treat it as an entity reference from autocomplete.
        $file->{$field_name}[LANGUAGE_NONE][0]['target_id'] = $matches[1];
      }
      else {
        // Otherwise its a normal text field.
        $vals = str_getcsv(check_plain($_POST['value']), ",", '"');
        // dpm($vals, 'vals - str_getcsv'); .
        // dpm($file, 'vals - $file'); .
        unset($file->{$field_name}[LANGUAGE_NONE]);
        foreach ($vals as $key => $value) {
          // $tid = reset(taxonomy_get_term_by_name($value, "galleries"))->tid;.
          // dpm($tid, "tid"); .
          /* $file->{$field_name}[LANGUAGE_NONE][$key]['tid'] = $tid; */
          $file->{$field_name}[LANGUAGE_NONE][$key]['value'] = $value;
        }
      }
      break;

    case 'textarea':
      $file->{$field_name}[LANGUAGE_NONE][0]['value'] = check_plain($_POST['value']);
      $file->{$field_name}[LANGUAGE_NONE][0]['format'] = check_plain($_POST['format']);
      break;

    case 'checkbox_tree':
      $file->{$field_name}[LANGUAGE_NONE][0]['tid'] = check_plain($_POST['value']);
      break;

    default:
      break;
  }
  // Change the appropriate field.
  file_save($file);
  print json_encode($out);
}

/**
 * Retrieve the rendered content of a dialog.
 */
function imager_render_dialog() {
  global $_imager_path;
  $_imager_path = drupal_get_path('module', 'imager');
  module_load_include('inc', 'imager', 'imager.popups');
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';
  $dialog_name = check_plain($_POST['dialogName']);
  $func_name = '_imager_build_' . $dialog_name;
  if (function_exists($func_name)) {
    $render = $func_name();
    $out['data'] = drupal_render($render);
  }
  else {
    $out['status'] = 'error';
    $out['error'] = 'Function does not exist: - ' . $func_name;
  }
  print json_encode($out);
}

/**
 * Extract the components of a URL.
 *
 * Extract the Base, site, addl dirs, file name, file suffix.
 *
 * @param string $uri
 *   URI of file.
 *
 * @return array
 *   Array of path components.
 */
function _imager_extract_path_components($uri) {
  $cmp = [];
  if (preg_match('/(^http.*files)\/(.+\/)([^\/]+)\.([a-zA-Z]+$)/', $uri, $matches)) {
    $cmp['root'] = $matches[1];
    $cmp['dir'] = $matches[2];
    $cmp['filename'] = $matches[3];
    $cmp['suffix'] = $matches[4];
  }
  elseif (preg_match('/(^http.*files)\/([^\/]+)\.([a-zA-Z]+$)/', $uri, $matches)) {
    $cmp['root'] = $matches[1];
    $cmp['dir'] = '';
    $cmp['filename'] = $matches[2];
    $cmp['suffix'] = $matches[3];
  }
  return $cmp;
}

/**
 * Given the public: URI of an image, search the database and find the FID.
 *
 * @param string $puri
 *   URI of file.
 *
 * @return int
 *   File ID of the file at path $puri.
 */
function _imager_get_fid($puri) {
  $results = db_query('SELECT fid,uri FROM {file_managed} WHERE uri = :uri',
    array(':uri' => $puri));
  $fid = 0;
  foreach ($results as $image) {
    $fid = $image->fid;
  }
  return $fid;
}

/**
 * Create a unique filename for a new image.
 *
 * @param string $dir
 *   Directory file will be saved in.
 * @param array $cmp
 *   Array of paths for this image.
 *
 * @return string
 *   New file name
 */
function _imager_make_uniq_filepath($dir, array $cmp) {
  $n = 0;
  do {
    ++$n;
    $path = "$dir/$cmp[dir]$cmp[filename]_$n.$cmp[suffix]";
  } while (file_exists($path));
  return $cmp['filename'] . "_" . $n;
}
