<?php
/**
 * @File - services.php
 * 
 * Processes AJAX calls from imager.js
 *   save-file - save image files
 *   display-entity - load and render file entity
 */

$out = array();
$out['debug'] = "\nStarting services.php - " . date("Y-m-d H:i:s") . "<br>\n";

if ($_POST && $_POST['action']) {
  $cli = false;
} else {
  $cli = true;
  $_POST['action']     = 'display-entity';
  $_POST['uri']        = "http://d/c16/sites/c16/files/image/2014:01:04/2014:01:04_09:08:30_0_12_1_1_1.jpg";
  $_POST['viewMode']   = 'DS Medium';
  $_POST['imgBase64']  = 'bogus image file';
  $_POST['drupalRoot'] = '/home/eco/d7';
}
if ($cli == true) print "starting services.php\n";
$action    = $_POST['action'];
$out['action'] = $action;
$out['status'] = 'pass';

$out['debug'] .= "action: - $action<br>\n";
if ($cli) print "errors.php $_POST[action]\n";
error_reporting(E_ALL);
ini_set('display_errors',TRUE);
ini_set('display_startup_errors',TRUE);
ini_set('max_execution_time',18000);

global $php_errormsg;
$tzoffset = -21600;

try {
  bootstrapDrupal();
  switch ($action) {
    case 'display-entity':       displayEntity(); break;
    case 'save-file':            saveFile();      break;
    case 'edit-form-load':       editFormLoad();  break;
    case 'edit-form-field-load': editFormFieldLoad();  break;
    case 'delete-file':          deleteFile();  break;
  }
  print json_encode($out);
} 
catch(exception $e) {
  $out['status'] = 'catch';
  $fp = fopen('/tmp/services_exception', 'w');
  fwrite($fp, 'Catch: ' . $e . '\n');
  fclose($fp);
  print json_encode($out);
}

//////////// End of main program, begin functions //////////////

/**
 * 
 * @global type $out
 * @param type $uri
 */
function displayEntity() {
  global $out;
  global $cli;
  if ($cli) print "starting displayEntity\n";
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
  $view['field_how']['#prefix']                   = "<img id='imager-field-who' $common />";
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
}

/**
 * 
 * @global type $out
 * @param type $uri
 */
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
  $form_id = 'imager_file_entity_edit';
  $form = drupal_get_form($form_id,$file);
//$viewMode = $_POST['viewMode'];
//$out['data'] = drupal_render(drupal_get_form('imager_file_entity_edit',$file));
  $field = $form[$fieldname];
  $out['data'] = drupal_render($field);
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
  if ($overwrite == "true") {      
    $path = "$_POST[drupalRoot]/sites/$_POST[sitename]/files/$cmp[dir]/$cmp[file].$cmp[suffix]";
    $out['info'] = "File $path overwritten<br>\n";
    system("rm $path");
  } else {
    $nfilename = makeUniqFilepath($cmp);
  //$out['debug'] .= "nfilename: " . $nfilename . "<br>\n";
    unset($file->fid);   // This forces file_save to create a new file entity
    $nuri = "public://$cmp[dir]/$nfilename.$cmp[suffix]";
    $out['debug'] .= "new uri: " . $nuri . "<br>\n";
    $file->uri = $nuri;
    $file->filename = $nfilename . '.' . $cmp['suffix'];
    $path = "$_POST[drupalRoot]/sites/$_POST[sitename]/files/$cmp[dir]/$nfilename.$cmp[suffix]";
    $out['info'] = "Saved new file $path<br>\n";
  }
  $filteredData = explode(',', $_POST['imgBase64']);

  $tmpPath = "/tmp/$cmp[filename].$cmp[suffix]";
  $out['debug'] .= "tmpPath: " . $tmpPath . "<br>\n";
  $fp = fopen($tmpPath,'w');
  fwrite($fp, base64_decode($filteredData[1]));
  fclose($fp);

  $cmd = "/usr/bin/convert -quality 50 \"$tmpPath\" \"$path\"";  
  system($cmd);

  file_save($file);  // Save/Resave the file in Drupal
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


/**
 * 
 * @global type $out
 * @param type $puri
 * @return type
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
 * 
 * @global type $out
 */
function bootstrapDrupal () {
  global $out;
  global $cli;
  global $user;


  $_SERVER['SCRIPT_NAME'] = "/bin/services.php";  // Path must start with a /
  $_SERVER['REMOTE_ADDR'] = 'anything.com';
  $_SERVER['HTTP_HOST']   = $_POST['siteName'];

  chdir($_POST['drupalRoot']);
  define('DRUPAL_ROOT', $_POST['drupalRoot']);

  require_once "includes/bootstrap.inc";
  drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
  $user->uid = $_POST['uid'];
  $out['debug'] .= "bootstrapDrupal() - done<br>\n";
  if ($cli) print "\n"; // Start a new line, drupal_bootstrap outputs a space somewhere
}

/**
 * 
 * @global type $out
 * @param type $root
 * @param type $dir
 * @param type $file
 * @param type $suffix
 * @return type
 */
function makeUniqFilepath ($cmp) {
  global $out;
  $n = 0;
  do {
    $n++;
    $path = "$_POST[drupalRoot]/sites/$_POST[sitename]/files/$cmp[dir]/$cmp[filename]_$n.$cmp[suffix]";
    $out['debug'] .= "makeUniqFilepath()  " . $path . "<br>\n";
  } while (file_exists($path));
  return $cmp[filename] . "_" . $n;
}

// register_shutdown_function( "fatal_handler" );

function fatal_handler() {
  $errfile = "unknown file";
  $errstr  = "shutdown";
  $errno   = E_CORE_ERROR;
  $errline = 0;

  $error = error_get_last();

  if( $error !== NULL) {
    $errno   = $error["type"];
    $errfile = $error["file"];
    $errline = $error["line"];
    $errstr  = $error["message"];

    $trace = print_r( debug_backtrace( false ), true );
    $fp = fopen('/tmp/services_error', 'w');
    fwrite($fp, 'Error: ' . $errno . '\n');
    fwrite($fp, 'Error File: ' . $errfile . '\n');
    fwrite($fp, 'Error Line: ' . $errline . '\n');
    fwrite($fp, 'Message: ' . $message . '\n');
    fwrite($fp, 'Trace: ' . $trace . '\n');
    fclose($fp);
  }

  $out = array();
  $out['debug'] = "\nStarting save.php - " . date("Y-m-d H:i:s") . "<br>\n";

  $out['status'] = 'error';
  $out['error'] = format_error( $errno, $errstr, $errfile, $errline, $trace );
  print json_encode($out);
}

function format_error( $errno, $errstr, $errfile, $errline, $trace ) {
  $content  = "<table><thead bgcolor='#c8c8c8'><th>Item</th><th>Description</th></thead><tbody>";
  $content .= "<tr valign='top'><td><b>Error</b></td><td><pre>$errstr</pre></td></tr>";
  $content .= "<tr valign='top'><td><b>Errno</b></td><td><pre>$errno</pre></td></tr>";
  $content .= "<tr valign='top'><td><b>File</b></td><td>$errfile</td></tr>";
  $content .= "<tr valign='top'><td><b>Line</b></td><td>$errline</td></tr>";
  $content .= "<tr valign='top'><td><b>Trace</b></td><td><pre>$trace</pre></td></tr>";
  $content .= '</tbody></table>';

  return $content;
}

