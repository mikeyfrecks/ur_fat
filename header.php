<?php
date_default_timezone_set('UTC');
session_start();
/*
include 'func_genToken.php';
include 'func_user_check.php';
include 'func_request_check.php';
include 'func_check_remember_me.php';
*/

require 'db_connect.php';
$dir_path = '';
if($api_layer) {
  set_include_path('../');
  $dir_path = get_include_path();
}
$dir = new DirectoryIterator($dir_path.'global_functions');
foreach ($dir as $i) {
    if($i->getExtension() !== 'php' || !$i->isFile()) {
     continue;
    }
    include_once $i->getPathname();
}


if($need_to_install) {
  die('<a href="install.php">Install URFAT</a>');
}

 ?>
