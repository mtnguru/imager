<?php
/**
 * @file
 * Implements Ajax service functions for imager module
 */

/**
 * Retrieve a rendered file_entity - add edit buttons
 * 
 * Given the URI of an image file, determine the FID, load the entity
 * add buttons so users can edit the file_entity fields, render it and return
 * 
 * @global type $out
 */
function displayEntity() {
  global $out;
  $out['action'] = 'displayEntity';
  $out['status'] = 'pass';

  $iconPath = $GLOBALS['base_url'] . '/' . drupal_get_path('module', 'imager') . '/icons';
  $uri       = urldecode($_POST['uri']);
  $cmp = extractPathComponents($uri);
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "uri: " . $uri . "<br>\n";
  $out['debug'] .= "public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "fid: " . $fid . "<br>\n";
  $file = file_load($fid);
  $viewMode = $_POST['viewMode'];
  $view = file_view($file,$viewMode);

  $common = "class='imager-info-edit' src='$iconPath/edit.png'";
  $view['field_file_image_title_text']['#prefix'] = "<img id='imager-field-file-image-title-text' $common />";
  $view['field_who']['#prefix']                   = "<img id='imager-field-who' $common />";
  $view['field_how']['#prefix']                   = "<img id='imager-field-how' $common />";
  $view['field_what']['#prefix']                  = "<img id='imager-field-what' $common />";
  $view['field_create_date']['#prefix']           = "<img id='imager-field-create-date' $common />";
  $view['field_status']['#prefix']                = "<img id='imager-field-status' $common />";
  $view['field_detail']['#prefix']                = "<img id='imager-field-detail' $common />";

  // Geometry and filesize added by ecoMedia module - cannot be edited
  $view['field_geometry']['#prefix'] = "<img id='imager-field-geometry' " .
            "class='imager-info-edit' src='$iconPath/blank.png' />";
  $view['field_filename']['#prefix'] = "<img id='imager-field-filename' " .
            "class='imager-info-edit' src='$iconPath/blank.png' />";
  $view['field_owner']['#prefix']    = "<img id='imager-field-owner' " .
            "class='imager-info-edit' src='$iconPath/blank.png' />";
  $view['field_filesize']['#prefix'] = "<img id='imager-field-filesize' " .
            "class='imager-info-edit' src='$iconPath/blank.png' />";

  $out['data'] = drupal_render($view);
  print json_encode($out);
};
  
/**
 * Load and render the file_entity_edit form 
 * 
 * @global type $out 
 * @global type $cli
 */
function editFormLoad() {
  global $out;
  global $cli;
  if ($cli) print "starting editFormLoad\n";
  $out['action'] = 'editFormLoad';
  $out['status'] = 'pass';

  $uri       = urldecode($_POST['uri']);
  $cmp = extractPathComponents($uri);
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "uri: " . $uri . "<br>\n";
  $out['debug'] .= "public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "fid: " . $fid . "<br>\n";
  $file = file_load($fid);
//$viewMode = $_POST['viewMode'];
//$out['data'] = drupal_render(drupal_get_form('imager_file_entity_edit',$file));
  $form_id = 'file_entity_edit';
  $out['data'] = drupal_render(drupal_get_form($form_id,$file));
  print json_encode($out);
}

/**
 * Search a form element's render array and determine what #type it is.
 *
 * @todo This is a kludge, there has to be a property somewhere with better
 *   information than what can be extracted using this function.
 *   
 * @param type $elem
 * @param type $level
 *   Used for debugging by printing a hierarchical output while searching
 * @return string
 */
function getFieldType($elem,$level) {
  if ($level > 10) return "";
  foreach ($elem as $key => $value) {
    if (is_array($value)) {
      $type = getFieldType($value,$level + 1);
      if (strlen($type)) return $type;
    } else if (is_object($value)) {
//      print "wow again";
    } else {
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
 * Show the hierarchy in a render array for a form element 
 * 
 * Intended for debugging only, not useful otherwise
 * 
 * @param type $elem
 * @param type $level
 * @return string
 */
function showElem($elem,$level) {
  if ($level > 10) return "";
  foreach ($elem as $key => $value) {
    if (is_array($value)) {
      $sub = showElem($value,$level + 1);
      if (strlen($sub)) {
        $out .= "<li>$key<ul>$sub</ul></li>";
      } else {
//      $out .= "<li>$key</li>";
      }
    } else {
      if (is_object($value)) {
//      print "wow again";
      } else {
        if ($key === '#type') {
/*        switch ($value) {
            case 'checkbox_tree':
            case 'hierarchical_select':
//            return $value;
            case 'textfield':
//            return $value;
            case 'radios':
//            return $value;
            case 'date_combo':
//            return $value;
            case 'text_format':
//            if ($value['value']['#type'] === 'textarea') {
//              return $textarea;
//            }
            default:
              break;
          } 
          $out .= "<li>$key $value</li>"; */
        }
      }
    }
  } 
  return $out;
}


/**
 * Load and render a single field from the file_entity_edit form 
 * 
 * The URI of the current image is used to determine the file_entity FID.
 * Load the file_entity and use that to initialize the form field
 * 
 * @global type $out
 * @param type $uri
 */
function editFormFieldLoad() {
  global $out;
  global $cli;
  if ($cli) print "starting editFormFieldLoad\n";
  $out['action'] = 'editFormFieldLoad';
  $out['status'] = 'pass';

  $fieldName = preg_replace('/\-/','_',$_POST['field']);
  $uri       = urldecode($_POST['uri']);
  $cmp = extractPathComponents($uri);
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "field: " . $fieldName . "<br>\n";
  $out['debug'] .= "uri: " . $uri . "<br>\n";
  $out['debug'] .= "public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "fid: " . $fid . "<br>\n";
  $file_type = file_type_load('image');
  $file = file_load($fid);
  $form_id = 'file_entity_edit';
  $form = drupal_get_form($form_id,$file);
  $field = $form[$fieldName];
  $out['debug'] .= "<ul>" . showElem($field,1) . "</ul>";
  $out['data']['rendered'] = drupal_render($field);
  $out['data']['type'] .= getFieldType($field,1);
  $out['debug'] .= '#type: ' . $out['data']['type'];
  print json_encode($out);
}

/**
 * Save an edited image - can be overwritten or a new file created
 *  
 * @global type $out
 * @param type $uri
 */
function saveFile() {
  global $out;
  $out['action'] = 'saveFile';
  $out['status'] = 'pass';
  $overwrite = $_POST['overwrite'];
  $uri       = urldecode($_POST['uri']);

  $out['debug'] .= "saveFile() overwrite: " . $overwrite . "<br>\n";
  $out['debug'] .= "saveFile() start uri: " . $uri . "<br>\n";

  $cmp = extractPathComponents($uri);
  
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "saveFile() public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "saveFile() fid: " . $fid . "<br>\n";

  $file = file_load($fid);

  // save the image to a tmp file
  $nfilename = makeUniqFilepath($cmp);
  $npath = "$_SERVER[DOCUMENT_ROOT]/sites/$_POST[siteName]/files/$cmp[dir]$nfilename.$cmp[suffix]";
  $filteredData = explode(',', $_POST['imgBase64']);
  $tmpPath = "/tmp/$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "store image as: " . $tmpPath . "<br>\n";
  $fp = fopen($tmpPath,'w');
  fwrite($fp, base64_decode($filteredData[1]));
  fclose($fp);

  // reduce image file size using jpeg quality of 50 and copy to $npath
  $out['debug'] .= "convert: " . $tmpPath . " to " . $npath . "<br>\n";
  $cmd = "/usr/bin/convert -quality 70 \"$tmpPath\" \"$npath\"";  
  system($cmd);
  if (! file_exists($npath)) {
    $cmd = "cp $tmpPath $npath";
    system($cmd);
  }
  $cmd = "rm $tmpPath"; 
//system($cmd);

  $nuri = "public://$cmp[dir]$nfilename.$cmp[suffix]";
  if ($overwrite == "true") {        // doesn't actually overwrite, creates a revision
    $opath = "$_SERVER[DOCUMENT_ROOT]/sites/$_POST[siteName]/files/$cmp[dir]$cmp[filename].$cmp[suffix]";
    $out['info'] = "File $npath revised<br>\n";

    $otid = $file->field_status['und'][0][tid];
    // Resave the original entity with the new file
    $file->fid = $fid;
    $file->uri = $nuri;
    file_save($file);

    // Create a new file_entity and save old file under it
    unset($file->fid);
    $file->uri = $puri;
    $file->field_status['und'][0][tid] = reset(taxonomy_get_term_by_name('Revised','status'))->tid;
    file_save($file);  // Change status to revised, Save/Resave the file in Drupal
  } else {
//$out['debug'] .= "nfilename: " . $nfilename . "<br>\n";
    unset($file->fid);   // This forces file_save to create a new file entity
    $out['debug'] .= "new uri: " . $nuri . "<br>\n";
    $file->uri = $nuri;
    $file->filename = $nfilename . '.' . $cmp['suffix'];
    $file->field_status['und'][0][tid] = reset(taxonomy_get_term_by_name('Active','status'))->tid;
    $out['info'] = "Saved new file $path<br>\n";
    file_save($file);
  }
  print json_encode($out);
}

/**
 * Delete an image file and the associated file_entity
 *  
 * @global type $out
 */
function deleteFile() {
  global $out;
  $out['action'] = 'deleteFile';
  $out['status'] = 'pass';

  $uri       = urldecode($_POST['uri']);
  $out['debug'] .= "deleteFile() start uri: " . $uri . "<br>\n";
  $cmp = extractPathComponents($uri);
  
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "deleteFile() public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "deleteFile() fid: " . $fid . "<br>\n";

  $file = file_load($fid);
  $force = TRUE;
  file_delete($file,$force);
  print json_encode($out);
}

/**
 * Save an edited file_entity field
 *  
 * @global type $out
 */
function saveFileEntityField() {
  global $out;
  $out['action'] = 'saveFileEntityField';
  $out['status'] = 'pass';
  $fieldName = preg_replace('/\-/','_',$_POST['field']);
  $fieldType = $_POST['fieldType'];

  $uri       = urldecode($_POST['uri']);
  $out['debug'] .= "saveFileEntityField() start uri: " . $uri . "<br>\n";
  $cmp = extractPathComponents($uri);
  
  $puri = "public://$cmp[dir]$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "saveFileEntityField() public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "saveFileEntityField() fid: " . $fid . "<br>\n";

  $file = file_load($fid);
  switch ($fieldType) {
    case 'hierarchical_select':
      $file->{$fieldName}['und'][0]['tid'] = $_POST['value'];
      break;
    case 'date_combo':
      date_default_timezone_set($file->{$fieldName}['und'][0]['timezone']);
      $datetime = gmdate('Y-m-d H:i:s',strtotime($_POST['value']));
      $file->{$fieldName}['und'][0]['value'] = $datetime;
      break;
    case 'radios':
      $file->{$fieldName}['und'][0]['tid'] = $_POST['value'];
      break;
    case 'textfield':
      // Kludge - if value contains a number in parantheses, 
      if (preg_match('/\((\d*)\)/',$_POST['value'],$matches)) {
        // treat it as an entity reference from autocomplete
        $file->{$fieldName}['und'][0]['target_id'] = $matches[1];
      } 
      else {
        // otherwise its a normal text field
        $file->{$fieldName}['und'][0]['value'] = $_POST['value'];
      }
      break;
    case 'textarea':
      $file->{$fieldName}['und'][0]['value'] = $_POST['value'];
      break;
    case 'checkbox_tree':
      $file->{$fieldName}['und'][0]['tid'] = $_POST['value'];
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
 * @global array $out
 * @param type $uri
 * @return array of path components
 */

function extractPathComponents($uri) {
  global $out;
  if (preg_match('/(^http.*files)\/(.+\/)([^\/]+)\.([a-zA-Z]+$)/',$uri,$matches)) {
    $cmp['root']     = $matches[1];
    $cmp['dir']      = $matches[2];
    $cmp['filename'] = $matches[3];
    $cmp['suffix']   = $matches[4];
  }
  else if (preg_match('/(^http.*files)\/([^\/]+)\.([a-zA-Z]+$)/',$uri,$matches)) {
    $cmp['root']     = $matches[1];
    $cmp['dir']      = '';
    $cmp['filename'] = $matches[2];
    $cmp['suffix']   = $matches[3];
  }
  $out['debug'] .= "root: " . $cmp['root'] . "<br>\n" .
                   "dir: " . $cmp['dir'] . "<br>\n" .
                   "filename: " . $cmp['filename'] . "<br>\n" .
                   "suffix: " . $cmp['suffix'] . "<br>\n";
  return $cmp;
}


/**
 * Given the public: URI of an image, search the database and find the FID
 *  
 * @global type $out
 * @param type $puri
 * @return FID
 */
function getFid($puri) {
  global $out;
  $out['debug'] .= "getFid() puri: " . $puri . "<br>\n";
  $results = db_query('SELECT fid,uri 
                       FROM {file_managed} 
                       WHERE uri = :uri',array(':uri' => $puri));
  foreach ($results as $image) {
    $fid = $image->fid;
    $out['debug'] .= "getFid() File URI: " . $image->uri . "<br>\n";
    $out['debug'] .= "getFid() FID: " . $image->fid . "<br>\n";
  }
  return $fid;
}


/**
 * Create a unique filename for a new image
 *  
 * @global string $out
 * @param type $cmp
 * @return new filename
 */
function makeUniqFilepath ($cmp) {
  global $out;
  $n = 0;
  do {
    $n++;
    $path = "$_SERVER[DOCUMENT_ROOT]/sites/$_POST[siteName]/files/$cmp[dir]$cmp[filename]_$n.$cmp[suffix]";
    $out['debug'] .= "makeUniqFilepath()  " . $path . "<br>\n";
  } while (file_exists($path));
  return $cmp[filename] . "_" . $n;
}
