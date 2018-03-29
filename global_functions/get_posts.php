<?php

function get_posts($from,$to,$limit,$page,$user_id) {
 $where_queries = [];
 if($user_id) {
  $where_queries[] = 'post_author ='.intval($user_id);
 }
 if($from) {
  $where_queries[] = "post_date >=".intval($from); 
 }
 if($to) {
  $where_queries[] = "post_date <=".intval($to);
 }
 if($limit && intval($limit) > 0) {
   $limit_query = "LIMIT ".intval($limit);
 }
 if($page && intval($page) > 0) {
   $offset_query = "OFFSET ".((intval($page) - 1) * intval($limit));
 }




}
