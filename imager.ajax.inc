<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function displayEntity() {
  $iconPath = drupal_get_path('module', 'imager') . '/icons';
  $uri       = urldecode($_POST['uri']);
  $cmp = extractPathComponents($uri);
  $puri = "public://$cmp[dir]/$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "uri: " . $uri . "<br>\n";
  $out['debug'] .= "public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "fid: " . $fid . "<br>\n";
  $file = file_load($fid);
//$user = user_load($file->field_who[und][0]['target_id']);
//$file->field_who[und][0]['entity'] = $user;
  $viewMode = $_POST['viewMode'];
  $modulePath = $_POST['modulePath'];
  $view = file_view($file,$viewMode);

  $common = "class='imager-info-edit' src='$modulePath/icons/edit.png'";
  $view['field_file_image_title_text']['#prefix'] = "<img id='imager-field-file-image-title-text' $common />";
  $view['field_who']['#prefix']                   = "<img id='imager-field-who' $common />";
  $view['field_how']['#prefix']                   = "<img id='imager-field-how' $common />";
  $view['field_what']['#prefix']                  = "<img id='imager-field-what' $common />";
  $view['field_create_date']['#prefix']           = "<img id='imager-field-create-date' $common />";
  $view['field_status']['#prefix']                = "<img id='imager-field-status' $common />";
  $view['field_detail']['#prefix']                = "<img id='imager-field-detail' $common />";

  // Geometry and filesize added by ecoMedia module - cannot be edited
  $view['field_geometry']['#prefix'] = "<img id='imager-field-geometry' " .
            "class='imager-info-edit' src='$modulePath/icons/blank.png' />";
  $view['field_filename']['#prefix'] = "<img id='imager-field-filename' " .
            "class='imager-info-edit' src='$modulePath/icons/blank.png' />";
  $view['field_owner']['#prefix']    = "<img id='imager-field-owner' " .
            "class='imager-info-edit' src='$modulePath/icons/blank.png' />";
  $view['field_filesize']['#prefix'] = "<img id='imager-field-filesize' " .
            "class='imager-info-edit' src='$modulePath/icons/blank.png' />";

  $out['data'] = drupal_render($view);
  print json_encode($out);
};
  
function editFormLoad() {
  global $out;
  global $cli;
  if ($cli) print "starting editFormLoad\n";
  $uri       = urldecode($_POST['uri']);
  $cmp = extractPathComponents($uri);
  $puri = "public://$cmp[dir]/$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "uri: " . $uri . "<br>\n";
  $out['debug'] .= "public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "fid: " . $fid . "<br>\n";
  $file = file_load($fid);
//$viewMode = $_POST['viewMode'];
//$out['data'] = drupal_render(drupal_get_form('imager_file_entity_edit',$file));
  $form_id = 'imager_file_entity_edit';
  $out['data'] = drupal_render(drupal_get_form($form_id,$file));
  print json_encode($out);
}
/**
 * 
 * @global type $out
 * @param type $uri
 */
function editFormFieldLoad() {
  global $out;
  global $cli;
  if ($cli) print "starting editFormFieldLoad\n";
  $fieldname = preg_replace('/\-/','_',$_POST['field']);
  $uri       = urldecode($_POST['uri']);
  $cmp = extractPathComponents($uri);
  $puri = "public://$cmp[dir]/$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "field: " . $fieldname . "<br>\n";
  $out['debug'] .= "uri: " . $uri . "<br>\n";
  $out['debug'] .= "public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "fid: " . $fid . "<br>\n";
  $file = file_load($fid);
  $form_id = 'file_entity_edit';
  $form = drupal_get_form($form_id,$file);
//$viewMode = $_POST['viewMode'];
//$out['data'] = drupal_render(drupal_get_form('imager_file_entity_edit',$file));
  $field = $form[$fieldname];
  $out['data'] = drupal_render($field);
  print json_encode($out);
}

/**
 * 
 * @global type $out
 * @param type $uri
 */
function saveFile() {
  global $out;
  $overwrite = $_POST['overwrite'];
  $uri       = urldecode($_POST['uri']);

  $out['debug'] .= "saveFile() overwrite: " . $overwrite . "<br>\n";
  $out['debug'] .= "saveFile() start uri: " . $uri . "<br>\n";

  $cmp = extractPathComponents($uri);
  
  $puri = "public://$cmp[dir]/$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "saveFile() public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "saveFile() fid: " . $fid . "<br>\n";

  $file = file_load($fid);

  // save the image to a tmp file
  $nfilename = makeUniqFilepath($cmp);
  $npath = "$_POST[drupalRoot]/sites/$_POST[siteName]/files/$cmp[dir]/$nfilename.$cmp[suffix]";
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

  $nuri = "public://$cmp[dir]/$nfilename.$cmp[suffix]";
  if ($overwrite == "true") {        // doesn't actually overwrite, creates a revision
    $opath = "$_POST[drupalRoot]/sites/$_POST[siteName]/files/$cmp[dir]/$cmp[filename].$cmp[suffix]";
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
    $out['info'] = "Saved new file $path<br>\n";
    file_save($file);
  }
  print json_encode($out);
}


function deleteFile() {
  global $out;
  $uri       = urldecode($_POST['uri']);
  $out['debug'] .= "deleteFile() start uri: " . $uri . "<br>\n";
  $cmp = extractPathComponents($uri);
  
  $puri = "public://$cmp[dir]/$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "deleteFile() public uri: " . $puri . "<br>\n";

  $fid = getFid($puri);
  $out['debug'] .= "deleteFile() fid: " . $fid . "<br>\n";

  $file = file_load($fid);
  $force = TRUE;
  file_delete($file,$force);
  print json_encode($out);
}

function extractPathComponents($uri) {
  global $out;
  preg_match('/(^http.*files)\/(.+)\/([^\/]+)\.([a-zA-Z]+$)/',$uri,$matches);
  $cmp['root']     = $matches[1];
  $cmp['dir']      = $matches[2];
  $cmp['filename'] = $matches[3];
  $cmp['suffix']   = $matches[4];
  $out['debug'] .= "root: " . $cmp['root'] . "<br>\n" .
                   "dir: " . $cmp['dir'] . "<br>\n" .
                   "filename: " . $cmp['filename'] . "<br>\n" .
                   "suffix: " . $cmp['suffix'] . "<br>\n";
  return $cmp;
}


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


function makeUniqFilepath ($cmp) {
  global $out;
  $n = 0;
  do {
    $n++;
    $path = "$_POST[drupalRoot]/sites/$_POST[siteName]/files/$cmp[dir]/$cmp[filename]_$n.$cmp[suffix]";
    $out['debug'] .= "makeUniqFilepath()  " . $path . "<br>\n";
  } while (file_exists($path));
  return $cmp[filename] . "_" . $n;
}
