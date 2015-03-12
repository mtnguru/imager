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
 * @global type $out
 */
function imagerDisplayEntity() {
  global $out;
  $out['action'] = 'displayEntity';
  $out['status'] = 'pass';


  $ps = getPaths(urldecode($_POST['uri']));
  $fid = getFid($ps['puri']);
  $file = file_load($fid);
  $view = file_view($file,$_POST['viewMode']);

  $iconPath = $GLOBALS['base_url'] . '/' . drupal_get_path('module', 'imager') . '/icons';
  $common = "class='imager-info-edit' src='$iconPath/edit.png'";
  foreach ($view as $key => $value) {
    if (preg_match('?^field_?',$key)) {
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
 * @global type $out
 */
function imagerDisplayMap() {
  global $out;
  $out['action'] = 'displayMap';
  $out['status'] = 'pass';

  $iconPath = $GLOBALS['base_url'] . '/' . drupal_get_path('module', 'imager') . '/icons';
  $ps = getPaths(urldecode($_POST['uri']));
  $fid = getFid($ps['puri']);
  $file = file_load($fid);
  $viewMode = $_POST['viewMapMode'];
//$view = entity_view('file',array($file),$viewMode);
  $view = file_view($file,$viewMode);
  $out['data'] = drupal_render($view);
  print json_encode($out);
};


/**
 * Ajax handler to load and render the file_entity_edit form 
 *
 * This isn't currently used, instead individual fields are rendered with 
 * 
 * @global type $out 
 * @global type $cli
 */
function imagerEditFormLoad() {
  global $out;
  global $cli;
  if ($cli) print "starting imagerEditFormLoad\n";
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
 * @todo This is a kludge, there has to be a property or API that can return the #type
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
 * Ajax handler to load and render a single field from the file_entity_edit form 
 * 
 * The URI of the current image is used to determine the file_entity FID.
 * Load the file_entity and use that to initialize the form field
 * 
 * @global type $out
 * @param type $uri
 */
function imagerEditFormFieldLoad() {
  global $out;
  global $cli;
  module_load_include('inc', 'file_entity', 'file_entity.pages');
  if ($cli) print "starting imagerEditFormFieldLoad\n";
  $out['action'] = 'editFormFieldLoad';
  $out['status'] = 'pass';

  $ps = getPaths(urldecode($_POST['uri']));
  $fid = getFid($ps['puri']);
  $file = file_load($fid);

  $fieldName = preg_replace('/\-/','_',$_POST['field']);
  $file_type = file_type_load('image');
  $form_id = 'file_entity_edit';
  $form = drupal_get_form($form_id,$file);
  $field = $form[$fieldName];
  $out['data']['rendered'] = drupal_render($field);
  $out['data']['type'] .= getFieldType($field,1);
  $out['debug'] .= '#type: ' . $out['data']['type'];
  print json_encode($out);
}


function saveImage($path) {
  global $out;
  $filteredData = explode(',', $_POST['imgBase64']);
  $out['debug'] .= "store image as: " . $path . "<br>\n";
  $fp = fopen($path,'w');
  fwrite($fp, base64_decode($filteredData[1]));
  fclose($fp);
}

function convertImage($spath,$dpath) {
  // reduce image file size using jpeg quality of 50 and copy to $npath
  $out['debug'] .= "convert: " . $spath . " to " . $dpath . "<br>\n";
  $cmd = "/usr/bin/convert -quality 70 \"$spath\" \"$dpath\"";  
  system($cmd);
  if (! file_exists($dpath)) {
    $cmd = "cp $spath $dpath";
    system($cmd);
  }
  $cmd = "rm $tmpPath"; 
  system($cmd);
}

/**
 * Create drupal public or private path and a new image 
 * filename using the URI of the old image 
 * 
 * @param type $uri
 */
function getPaths($uri) {
  global $out;
  $ps = extractPathComponents($uri);

  $out['debug'] .= "getPaths() start uri: " . $uri . "<br>\n";
  if (preg_match('/system\/files/',$uri)) {
    $ps['rootdir'] = variable_get('file_private_path');
    $ps['puri'] = "private://$ps[dir]$ps[filename].$ps[suffix]";
    $out['debug'] .= "getPaths() private uri: " . $puri . "<br>\n";
    $ps['nfilename'] = makeUniqFilepath($ps['rootdir'],$ps);
    $ps['npath'] = "$ps[rootdir]/$ps[dir]$ps[nfilename].$ps[suffix]";
    $ps['nuri'] = "private://$ps[dir]$ps[nfilename].$ps[suffix]";
  } else {
    $ps['rootdir'] = DRUPAL_ROOT . '/' . variable_get('file_public_path', conf_path() . '/files');
    $ps['puri'] = "public://$ps[dir]$ps[filename].$ps[suffix]";
    $out['debug'] .= "getPaths() public uri: " . $puri . "<br>\n";
    $ps['nfilename'] = makeUniqFilepath($ps['rootdir'],$ps);
    $ps['npath'] = "$ps[rootdir]/$ps[dir]$ps[nfilename].$ps[suffix]";
    $ps['nuri'] = "public://$ps[dir]$ps[nfilename].$ps[suffix]";
  }
  return $ps;
}
  
/**
 * Save an edited image - can be overwritten or a new file created
 *  
 * @global type $out
 * @param type $uri
 */
function imagerSaveFile() {
  global $out;
  $out['action'] = 'saveFile';
  $out['status'] = 'pass';

  $overwrite = $_POST['overwrite'];
  $uri       = urldecode($_POST['uri']);

  $out['debug'] .= "imagerSaveFile() overwrite: " . $overwrite . "<br>\n";
  $out['debug'] .= "imagerSaveFile() start uri: " . $uri . "<br>\n";

  $ps = getPaths($uri);
  $fid = getFid($ps['puri']);
  $file = file_load($fid);

  // save the image to a tmp file
  $tmpPath = "/tmp/$ps[filename].$ps[suffix]";
  saveImage($tmpPath);
  convertImage($tmpPath,$ps['npath']);

  if ($overwrite == "true") {        // doesn't actually overwrite, 
                                     // creates a new file,
                                     // sets status of old file to 'revised'
//  $opath = "$_POST[filePath]/files/$ps[dir]$ps[filename].$ps[suffix]";
    $out['info'] = "File $npath revised<br>\n";

    $otid = $file->field_status['und'][0][tid];
    // Resave the original entity with the new file
    $file->fid = $fid;
    $file->uri = $ps['nuri'];
    file_save($file);

    // Create a new file_entity and save old file under it
    unset($file->fid);
    $file->uri = $ps['puri'];
    $file->field_media_status['und'][0][tid] = reset(taxonomy_get_term_by_name('Revised','media_status'))->tid;
    file_save($file);  // Change status to revised, Save/Resave the file in Drupal
  } else {
//$out['debug'] .= "nfilename: " . $nfilename . "<br>\n";
    unset($file->fid);   // This forces file_save to create a new file entity
    $out['debug'] .= "new uri: " . $ps['nuri'] . "<br>\n";
    $file->uri = $ps['nuri'];
    $file->filename = $ps['nfilename'] . '.' . $ps['suffix'];
    $file->field_media_status['und'][0][tid] = reset(taxonomy_get_term_by_name('Active','media_status'))->tid;
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
 * 
 * @global type $out
 */
function imagerEmailFile() {
  global $out;
  global $user;
  $out['action'] = 'emailFile';
  $out['status'] = 'pass';

  $host = gethostname();
  if ($host == "saphira") {
     $ldir = "/home/ds/mail";
     $ddir = "/home/ds/mail";
     $slash = "/";
  } else if ($host == "dswebserver") {
     $ldir = "/home/ds/mail";
     $ddir = "DigitalImages:\\mail";
     $slash = "\\";
  }

  $uri       = urldecode($_POST['uri']);
  $out['debug'] .= "imagerEmailFile() start uri: " . $uri . "<br>\n";
  $ps = getPaths($uri);
  $tmpPath = "/tmp/$ps[filename].$ps[suffix]";
  $imagePath = "$ldir$slash$ps[filename].$ps[suffix]";
  saveImage($tmpPath);
  convertImage($tmpPath,$imagePath);

  $fid = getFid($ps['puri']);
  $file = file_load($fid);

  // Create text body
  $body = "Title: " . $file->title . "\n" .
          "Date taken: " . $file->field_create_date[und][0][value] . "\n";
  if (isset($file->field_facility[und][0][target_id])) {
    $nid = $file->field_facility[und][0][target_id];
    $facility = entity_load('node',array($nid));
    $body .= "Facility: " . $facility[$nid]->title . "\n";
  }
  if (isset($file->field_image_purpose[und][0][tid])) {
    $tid = $file->field_image_purpose[und][0][tid];
    $body .= "Purpose: " . taxonomy_term_load($tid)->name . "\n";
  }
  if (isset($file->field_image_content[und][0][tid])) {
    $tid = $file->field_image_content[und][0][tid];
    $body .= "Content: " . taxonomy_term_load($tid)->name . "\n";
  }
  $tid = $file->field_image_content[und][0][tid];
  $body .= "\nThank you,\n   " . $user->name . "\n";

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
 * 
 * @global type $out
 */
function imagerViewBrowser() {
  global $out;
  global $user;
  $out['action'] = 'viewBrowser';
  $out['status'] = 'pass';

  $uri       = urldecode($_POST['uri']);
  $out['debug'] .= "imagerViewBrowser() start uri: " . $uri . "<br>\n";
  $ps = getPaths($uri);
  $tmpPath = "/tmp/$ps[filename].$ps[suffix]";
  $imagePath = "$_SERVER[DOCUMENT_ROOT]/images/$ps[filename].$ps[suffix]";
  saveImage($tmpPath);
  convertImage($tmpPath,$imagePath);

  $path = $GLOBALS['base_root'] . '/images/' . $ps['filename'] . "." . $ps['suffix'];
  $out['data']['imagePath'] = $path;
  print json_encode($out);
}

/**
 * Delete an image file and the associated file_entity
 *  
 * @global type $out
 */
function imagerDeleteFile() {
  global $out;
  $out['action'] = 'deleteFile';

  $uri       = urldecode($_POST['uri']);
  $ps = getPaths($uri);
  $fid = getFid($ps['puri']);
  $out['debug'] .= "deleteFile() fid: " . $fid . "<br>\n";

  $file = file_load($fid);
  $force = TRUE;
  file_delete($file,$force);

  $out['status'] = 'pass';
  print json_encode($out);
}

/**
 * Save an edited file_entity field
 *  
 * @global type $out
 */
function imagerSaveFileEntityField() {
  global $out;
  $out['action'] = 'imagerSaveFileEntityField';
  $out['status'] = 'pass';
  $fieldName = preg_replace('/\-/','_',$_POST['field']);
  $fieldType = $_POST['fieldType'];

  $uri       = urldecode($_POST['uri']);
  $out['debug'] .= "imagerSaveFileEntityField() start uri: " . $uri . "<br>\n";
  $ps = getPaths($uri);
  $fid = getFid($ps['puri']);
  $file = file_load($fid);
//dpm($file,'imagerSaveFileEntityField - $file');
  dpm($_POST,'POST');
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
        $vals = str_getcsv($_POST['value'], ",", '"');
        dpm($vals,'vals - str_getcsv');
        dpm($file,'vals - $file');
        unset ($file->{$fieldName}['und']);
        foreach ($vals as $key => $value) {
          $tid = reset(taxonomy_get_term_by_name($value, "galleries"))->tid;
          dpm($tid,"tid");
          $file->{$fieldName}['und'][$key]['tid'] = $tid;
        }
      }
      break;
    case 'textarea':
      $file->{$fieldName}['und'][0]['value'] = $_POST['value'];
      $file->{$fieldName}['und'][0]['format'] = $_POST['format'];
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
function makeUniqFilepath ($dir,$cmp) {
  global $out;
  $n = 0;
  do {
    $n++;
    $path = "$dir/$cmp[dir]$cmp[filename]_$n.$cmp[suffix]";
    $out['debug'] .= "makeUniqFilepath()  " . $path . "<br>\n";
  } while (file_exists($path));
  return $cmp[filename] . "_" . $n;
}
