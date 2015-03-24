<?php

/**
 * @file
 * Implements Ajax service functions for imager module
 */

/**
 * Ajax handler to retrieve a rendered file_entity
 *
 * Given the URI of an image file, determine the FID, load the file_entity,
 * add edit buttons (images) to editable fields in render array,
 * render..enables users so users can edit the file_entity fields, render it and return
 *
 */
function imager_display_entity() {
//dpm($_POST, 'imager_display_entity - $_POST');
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);
//dpm($file, 'imager_display_entity - $file');
  $view = file_view($file, check_plain($_POST['viewMode']));

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
 * Ajax handler to render a Google map showing image location
 *
 * Doesn't work, JavaScript files aren't loaded
 *
 */
function imager_display_map() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $icon_path = $GLOBALS['base_url'] . '/' . drupal_get_path('module', 'imager') . '/icons';
  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);
  $view_mode = check_plain($_POST['viewMapMode']);
  //$view = entity_view('file',array($file),$view_mode);
  $view = file_view($file, $view_mode);
  $out['data'] = drupal_render($view);
  print json_encode($out);
};

/**
 * Ajax handler to load and render the file_entity_edit form
 *
 * This isn't currently used, instead individual fields are rendered with
 */
function imager_edit_form_load() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $uri = urldecode(check_plain($_POST['uri']));
  $cmp = _imager_extract_path_components($uri);
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "uri: " . $uri . "<br>\n";
  $out['debug'] .= "public uri: " . $puri . "<br>\n";

  $fid = _imager_get_fid($puri);
  $out['debug'] .= "fid: " . $fid . "<br>\n";
  $file = file_load($fid);
  //$view_mode = check_plain($_POST['viewMode']);
  //$out['data'] = drupal_render(drupal_get_form('imager_file_entity_edit',$file));
  $form_id = 'file_entity_edit';
  $out['data'] = drupal_render(drupal_get_form($form_id, $file));
  print json_encode($out);
}

/**
 * Search a form element's render array and determine what #type it is.
 *
 * @todo This is a kludge, look for a property or API that can return the #type
 *
 * @param type $elem
 * @param type $level
 *   Used for debugging by printing a hierarchical output while searching
 *
 * @return string
 */
function _imager_get_field_type($elem, $level) {
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
          default:
            break;
        }
      }
    }
  }
  return '';
}

/**
 * Ajax handler to load and render a single field from the file_entity_edit form
 *
 * The URI of the current image is used to determine the file_entity FID.
 * Load the file_entity and use that to initialize the form field
 *
 * @param type $uri
 */
function imager_edit_form_field_load() {
  module_load_include('inc', 'file_entity', 'file_entity.pages');
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $ps = _imager_get_paths(urldecode(check_plain($_POST['uri'])));
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);

  $field_name = preg_replace('/\-/', '_', check_plain($_POST['field']));
  $file_type = file_type_load('image');
  $form_id = 'file_entity_edit';
  $form = drupal_get_form($form_id, $file);
  $field = $form[$field_name];
  $out['data']['rendered'] = drupal_render($field);
  $out['data']['type'] .= _imager_get_field_type($field, 1);
  $out['debug'] .= '#type: ' . $out['data']['type'];
  print json_encode($out);
}

/**
 *
 * @param type $path
 */
function _imager_save_image($path) {
  $filtered_data = explode(',', check_plain($_POST['imgBase64']));
  $fp = fopen($path, 'w');
  fwrite($fp, base64_decode($filtered_data[1]));
  fclose($fp);
}

/**
 *
 * @param type $spath
 * @param type $dpath
 */
function _imager_convert_image($spath, $dpath) {
  // reduce image file size using jpeg quality of 50 and copy to $npath
  $out['debug'] .= "convert: " . $spath . " to " . $dpath . "<br>\n";
  $cmd = "/usr/bin/convert -quality 70 \"$spath\" \"$dpath\"";
  system($cmd);
  if (!file_exists($dpath)) {
    $cmd = "cp $spath $dpath";
    system($cmd);
  }
  $cmd = "rm $tmp_path";
  system($cmd);
}

/**
 * Create drupal public or private path and a new image
 * filename using the URI of the old image
 *
 * @param type $uri
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
 * Save an edited image - can be overwritten or a new file created
 *
 * @param type $uri
 */
function imager_save_image() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $overwrite = check_plain($_POST['overwrite']);
  $uri = urldecode(check_plain($_POST['uri']));

  $out['debug'] .= "imagerSaveFile() overwrite: " . $overwrite . "<br>\n";
  $out['debug'] .= "imagerSaveFile() start uri: " . $uri . "<br>\n";

  $ps = _imager_get_paths($uri);
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);

  // save the image to a tmp file
  $tmp_path = "/tmp/$ps[filename].$ps[suffix]";
  _imager_save_image($tmp_path);
  _imager_convert_image($tmp_path, $ps['npath']);

  // doesn't actually overwrite,
  if ($overwrite == "true") {
    // creates a new file,
    // sets status of old file to 'revised'
    //  $opath = "check_plain($_POST[filePath])/files/$ps[dir]$ps[filename].$ps[suffix]";
    $out['info'] = "File $npath revised<br>\n";

    $otid = $file->field_status['und'][0]['tid'];
    // Resave the original entity with the new file
    $file->fid = $fid;
    $file->uri = $ps['nuri'];
    file_save($file);

    // Create a new file_entity and save old file under it
    unset($file->fid);
    $file->uri = $ps['puri'];
    $file->field_media_status['und'][0]['tid'] = reset(taxonomy_get_term_by_name('Revised', 'media_status'))->tid;
    // Change status to revised, Save/Resave the file in Drupal
    file_save($file);
  }
  else {
    //$out['debug'] .= "nfilename: " . $nfilename . "<br>\n";
    // This forces file_save to create a new file entity
    unset($file->fid);
    $out['debug'] .= "new uri: " . $ps['nuri'] . "<br>\n";
    $file->uri = $ps['nuri'];
    $file->filename = $ps['nfilename'] . '.' . $ps['suffix'];
    $file->field_media_status['und'][0]['tid'] = reset(taxonomy_get_term_by_name('Active', 'media_status'))->tid;
    $out['info'] = "Saved new file $ps[path]<br>\n";
    file_save($file);
  }
  print json_encode($out);
}

/**
 * Email an edited image - start users default email client with
 *   subject, body and attached image
 *
 * Write file to tmp directory.
 * Return the path or calculate it on both sides?
 * Write the file to the P drive.  I can mount that but they need the path,
 */
function imager_email_file() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $host = gethostname();  
  if ($host == "saphira") {
    $ldir = "/home/ds/mail";
    $ddir = "/home/ds/mail";
    $slash = "/";
  }
  elseif ($host == "dswebserver") {
    $ldir = "/home/ds/mail";
    $ddir = "DigitalImages:\\mail";
    $slash = "\\";
  }

  $uri = urldecode(check_plain($_POST['uri']));
  $out['debug'] .= "imagerEmailFile() start uri: " . $uri . "<br>\n";
  $ps = _imager_get_paths($uri);
  $tmp_path = "/tmp/$ps[filename].$ps[suffix]";
  $image_path = "$ldir$slash$ps[filename].$ps[suffix]";
  _imager_save_image($tmp_path);
  _imager_convert_image($tmp_path, $image_path);

  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);

  // Create text body
  $body = "Title: " . $file->title . "\n" . "Date taken: " . $file->field_create_date['und'][0]['value'] . "\n";
  if (isset($file->field_facility['und'][0]['target_id'])) {
    $nid = $file->field_facility['und'][0]['target_id'];
    $facility = entity_load('node', array($nid));
    $body .= "Facility: " . $facility[$nid]->title . "\n";
  }
  if (isset($file->field_image_purpose['und'][0]['tid'])) {
    $tid = $file->field_image_purpose['und'][0]['tid'];
    $body .= "Purpose: " . taxonomy_term_load($tid)->name . "\n";
  }
  if (isset($file->field_image_content['und'][0]['tid'])) {
    $tid = $file->field_image_content['und'][0]['tid'];
    $body .= "Content: " . taxonomy_term_load($tid)->name . "\n";
  }
  $tid = $file->field_image_content['und'][0]['tid'];
  $body .= "\nThank you,\n   " . $GLOBALS['user'] . "\n";

  $out['data']['attachPath'] = "$ddir$slash$ps[filename].$ps[suffix]";
  $out['data']['body'] = $body;
  $out['data']['subject'] = "Dairy Specialists - photo - $ps[filename]";
  print json_encode($out);
}

/**
 * Email an edited image - start users default email client with
 *   subject, body and attached image
 *
 * Write file to tmp directory.
 * Return the path or calculate it on both sides?
 * Write the file to the P drive.  I can mount that but they need the path,
 */
function imager_view_browser() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';

  $uri = urldecode(check_plain($_POST['uri']));
  $out['debug'] .= "imagerViewBrowser() start uri: " . $uri . "<br>\n";
  $ps = _imager_get_paths($uri);
  $tmp_path = "/tmp/$ps[filename].$ps[suffix]";
  $image_path = "$_SERVER[DOCUMENT_ROOT]/images/$ps[filename].$ps[suffix]";
  _imager_save_image($tmp_path);
  _imager_convert_image($tmp_path, $image_path);

  $path = $GLOBALS['base_root'] . '/images/' . $ps['filename'] . "." . $ps['suffix'];
  $out['data']['image_path'] = $path;
  print json_encode($out);
}

/**
 * Delete an image file and the associated file_entity
 */
function imager_delete_field() {
  $out['action'] = check_plain($_POST['action']);

  $uri = urldecode(check_plain($_POST['uri']));
  $ps = _imager_get_paths($uri);
  $fid = _imager_get_fid($ps['puri']);
  $out['debug'] .= "deleteFile() fid: " . $fid . "<br>\n";

  $file = file_load($fid);
  $force = TRUE;
  file_delete($file, $force);

  $out['status'] = 'pass';
  print json_encode($out);
}

/**
 * Save an edited file_entity field
 */
function imager_save_field_entity_field() {
  $out['action'] = check_plain($_POST['action']);
  $out['status'] = 'pass';
  $field_name = preg_replace('/\-/', '_', check_plain($_POST['field']));
  $field_type = check_plain($_POST['fieldType']);

  $uri = urldecode(check_plain($_POST['uri']));
  $out['debug'] .= "imagerSaveFileEntityField() start uri: " . $uri . "<br>\n";
  $ps = _imager_get_paths($uri);
  $fid = _imager_get_fid($ps['puri']);
  $file = file_load($fid);
  //dpm($file,'imagerSaveFileEntityField - $file');
  //dpm(check_plain($_POST), 'POST');
  switch ($field_type) {
    case 'hierarchical_select':
      $file->{$field_name}['und'][0]['tid'] = check_plain($_POST['value']);
      break;

    case 'date_combo':
      date_default_timezone_set($file->{$field_name}['und'][0]['timezone']);
      $datetime = gmdate('Y-m-d H:i:s', strtotime(check_plain($_POST['value'])));
      $file->{$field_name}['und'][0]['value'] = $datetime;
      break;

    case 'radios':
      $file->{$field_name}['und'][0]['tid'] = check_plain($_POST['value']);
      break;

    case 'textfield':
      // Kludge - if value contains a number in parantheses,
      if (preg_match('/\((\d*)\)/', check_plain($_POST['value']), $matches)) {
        // treat it as an entity reference from autocomplete
        $file->{$field_name}['und'][0]['target_id'] = $matches[1];
      }
      else {
        // otherwise its a normal text field
        $vals = str_getcsv(check_plain($_POST['value']), ",", '"');
//      dpm($vals, 'vals - str_getcsv');
//      dpm($file, 'vals - $file');
        unset($file->{$field_name}['und']);
        foreach ($vals as $key => $value) {
          $tid = reset(taxonomy_get_term_by_name($value, "galleries"))->tid;
//        dpm($tid, "tid");
          $file->{$field_name}['und'][$key]['tid'] = $tid;
        }
      }
      break;

    case 'textarea':
      $file->{$field_name}['und'][0]['value'] = check_plain($_POST['value']);
      $file->{$field_name}['und'][0]['format'] = check_plain($_POST['format']);
      break;

    case 'checkbox_tree':
      $file->{$field_name}['und'][0]['tid'] = check_plain($_POST['value']);
      break;

    default:
      break;
  }
  // change the appropriate field
  file_save($file);
  print json_encode($out);
}

/**
 * Extract the components of a URL
 *
 * Extract the Base, site, addl dirs, file name, file suffix
 *
 * @param type $uri
 *
 * @return array of path components
 */
function _imager_extract_path_components($uri) {
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
 * Given the public: URI of an image, search the database and find the FID
 *
 * @param type $puri
 *
 * @return FID
 */
function _imager_get_fid($puri) {
  $results = db_query('SELECT fid,uri ' .
                      'FROM {file_managed} ' .
                      'WHERE uri = :uri', array(':uri' => $puri));
  foreach ($results as $image) {
    $fid = $image->fid;
  }
  return $fid;
}

/**
 * Create a unique filename for a new image
 *
 * @param type $cmp
 *
 * @return new filename
 */
function _imager_make_uniq_filepath($dir, $cmp) {
  $n = 0;
  do {
    ++$n;
    $path = "$dir/$cmp[dir]$cmp[filename]_$n.$cmp[suffix]";
  } while (file_exists($path));
  return $cmp['filename'] . "_" . $n;
}

