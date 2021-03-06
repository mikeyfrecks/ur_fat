<?php

require_once 'header.php';

if(!is_user_logged_in()) {
  $index_URL  = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
  $base = str_replace('index.php','',$index_URL);
  header("Location: user-login.php",TRUE,303);
  die();
}


$_SESSION['add_item_noonce'] = generate_noonce();

 ?>
<form id="add-item" method="POST" action="form-process-add-item.php">

  <input type="hidden" id="add_item_noonce" name="add_item_noonce" value="<?= $_SESSION['add_item_noonce'];?>" />
  <input type="hidden" id="add_noonce_key" name="noonce_key" value="add_item_noonce" />
  <label for="item_title">Food</label>
  <input type="text" required id="item_title" name="post_title" />
  <label for="item_amount">Amount</label>
  <INPUT type="text" id="item_amount" name="post_amount" />
  <label for="item_description">Notes</label>
  <textarea id="item_description" name="post_description"></textarea>
  <label for="item_date">When</label>
  <input type="datetime-local" id="item_date" name="post_date"/>
  <button type="submit">Add Item</button>

</form>
<?php



$now = new DateTime();
$ny_time  = new DateTimeZone('America/New_York');
$now->setTimezone($ny_time);
$now->modify(intval($_GET['offset']).' day');

$startTime =  strtotime($now->format('Y-m-d 00:00:00 O'));
$endTime = strtotime($now->format('Y-m-d 23:59:59 O'));



$today_posts = get_posts($startTime, $endTime, get_user()['id']);



foreach($today_posts as $t) {
  ?>
<div class="item">
  <h2><?= $t['post_title'];?></h2>
  <?php
$_SESSION['update_'.$t['id']] = generate_noonce();
   ?>
   <form method="POST" action="form-process-update-item.php">
     <input type="hidden" name="<?= 'update_'.$t['id'];?>" value="<?= $_SESSION['update_'.$t['id']];?>" />
     <input type="hidden" name="id" value="<?= $t['id'];?>">
     <input type="text" value="<?= $t['post_title'];?>" name="post_title" />
     <button type="submit">Update Post</button>
   </form>
   <form method="POST" action="form-process-delete-item.php">
     <?php $_SESSION['delete_'.$t['id']] = generate_noonce(); ?>
     <input type="hidden" name="<?= 'delete_'.$t['id'];?>" value="<?= $_SESSION['delete_'.$t['id']];?>" />
     <input type="hidden" name="id" value="<?= $t['id'];?>">
     <button type="submit">Delete Post</button>
   </form>
</div>

  <?php
}

?>

<a href="form-process-user-logout.php">Logout</a>
