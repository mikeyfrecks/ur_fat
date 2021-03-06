

import Cookies from 'js-cookie';
import { h, render, Component  } from 'preact';

import axios from "axios";

var {EventEmitter} = require('fbemitter');
global.emitter = new EventEmitter();

var debounce = require('lodash.debounce');

import './styles/app.scss';

import LoginForm from './components/login-form.jsx';
import ItemForm from './components/item-form.jsx';
import List from './components/List.js';
import NavButton from './components/NavButton.jsx';

import updateNoonces from './utils/update-noonce.js';
import { removeItem, addItem, replaceItem,sorter } from './utils/list-operations.js';

class App extends Component {
  constructor(props) {
      super();
      let logged_in = (props.previousLogin) ? true : false ;
      let start = new Date();
      start.setHours(0,0,0,0);
      let end = new Date();
      end.setHours(23,59,59,999);
      start = Math.floor(start.getTime() / 1000);
      end = Math.floor(end.getTime() / 1000);
      console.log(localStorage.getItem("urfat_today_posts"));
      let todayPosts = JSON.parse(localStorage.getItem("urfat_today_posts")) || [];

      this.state = {
        logged_in : logged_in,
        user: null,
        checked_login: false,
        login_noonce: null,
        day: 0,
        form_opened: false,
        add_item_noonce: null,
        fetching_posts: true,
        today_posts: sorter(todayPosts,end,start),
        edit_noonces: [],
        top_threshold: end,
        bottom_threshold: start,
        editing: false,
        editItem: null,
        openItem: null
      }
    this.newItem = this.newItem.bind(this);
    this.updateItem = this.updateItem.bind(this);
    this.logout = this.logout.bind(this);
    this.checkLogin = this.checkLogin.bind(this)
    this.getItems = this.getItems.bind(this);
    this.cancelForm = this.cancelForm.bind(this);
    this.windowListener = debounce(function(){
      console.log('dd');
      this.setState({openItem: null});
    }.bind(this),200,{leading:true, trailing:false})
  }
  componentDidMount() {

    if(this.state.logged_in) {
      this.checkLogin();
      /*if not logged in, will do nothing*/
      this.getItems();
    }
    //this.checkLogin();

    this.loginListen = global.emitter.addListener('login-status',function(status, user){
      console.log(status);
      if(status) {
        this.setState({logged_in: true, checked_login: true});
        /*To GET ADD ITEM NOONCE*/
        this.checkLogin();
        this.getItems();
      }
      if(user) {
        this.setState({user:user});
      }
    }.bind(this));

    this.listItemOpenListener = global.emitter.addListener('list-item-open', function(id){
      this.setState({openItem: id});
    }.bind(this))

    this.updateListen = global.emitter.addListener('update-item',function(item,nonce){
      let formdata = new FormData();
      formdata.set('id',item.id);
      formdata.set('update_noonce',nonce);
      formdata.set('post_title',item.post_title);
      formdata.set('post_amount',item.post_amount);
      let update_key = this.state.today_posts.findIndex(function(e){
        return parseInt(e.id) === parseInt(item.id);
      });
      let old_post = this.state.today_posts['update_key'];
      this.setState({today_posts : replaceItem(this.state.today_posts,item.id,item)});

      axios({
        method: 'post',
        url: window.location.pathname+'api/update-item.php',
        config: { headers: {'Content-Type': 'multipart/form-data' }},
        data: formdata
      })
      .then(function (response) {

        let newItem = response.data.item;

        this.setState({
          today_posts: replaceItem(this.state.today_posts, newItem.id,newItem),
          edit_noonces: updateNoonces(this.state.edit_noonces,response.data.noonce,newItem.id)
        });


      }.bind(this))
      .catch(function (error) {
        let message = error.response.data.message || 'No dice on the update';

        alert(message);
        this.setState({
          today_posts: replaceItem(this.state.today_posts,old_post.id,old_post),
          edit_noonces: updateNoonces(this.state.edit_noonces,error.response.data.noonce,old_post.id)
        });


      }.bind(this));

    }.bind(this))

    this.deleteListen = global.emitter.addListener('delete-item',function(id,noonce){
      let formdata = new FormData();
      formdata.set('id',id);
      formdata.set('delete_noonce',noonce);
      let del_key = this.state.today_posts.findIndex(function(e) {
          return parseInt(e.id) === parseInt(id);
      });
      let del_item = this.state.today_posts[del_key];

      this.setState({today_posts: removeItem(this.state.today_posts, id)});
      axios({
        method: 'post',
        url: window.location.pathname+'api/delete-item.php',
        config: { headers: {'Content-Type': 'multipart/form-data' }},
        data: formdata
      })
      .then(function (response) {
        console.log('deleted')
      }.bind(this))
      .catch(function (error) {
        alert(error.response.data.error_msg);
        this.setState({
          edit_noonces: updateNoonces(this.state.edit_noonces, error.response.data.noonce),
          today_posts: addItem(this.state.today_posts,del_item)
        });


      }.bind(this));

    }.bind(this));

    this.newItemListen = global.emitter.addListener('add-item',function(item,nonce){
      let formdata = new FormData();
      formdata.set('post_title',item.post_title);
      formdata.set('post_amount',item.post_amount);
      formdata.set('local_id',item.id);
      formdata.set('add_item_noonce',nonce);
      //ADD LOCALLY
      var local_id = item.id;
      this.setState({
        today_posts: addItem(this.state.today_posts,item),
        editing: null,
        editItem: {}
      });

      axios({
        method: 'post',
        url: window.location.pathname+'api/add-item.php',
        config: { headers: {'Content-Type': 'multipart/form-data' }},
        data: formdata
      })
      .then(function (response) {
        let d = response.data;
        this.setState({
          today_posts: replaceItem(this.state.today_posts,local_id,d.new_item),
          add_item_noonce: d.add_item_noonce,
          edit_noonces: updateNoonces(this.state.edit_noonces,d.noonce,d.new_item.id)
        })


      }.bind(this))
      .catch(function (error) {
        alert(error.response.data.error_msg);

        this.setState({
          today_posts : removeItem(this.state.today_posts, local_id),
          add_item_noonce: error.response.data.add_item_noonce
        })

      }.bind(this));
    }.bind(this))

    this.openItemForm = global.emitter.addListener('open-item-form',function(item,method){
      if(method == "UPDATE") {this.updateItem(item) }
    }.bind(this));

  }
  checkLogin() {
    axios.get(window.location.pathname+'api/check-login.php')
    .then(function (response) {

      this.setState({
        checked_login: true,
        logged_in: response.data.logged_in,
        login_noonce: response.data.login_noonce,
      });
      if(response.data.logged_in) {
        this.setState({
          add_item_noonce: response.data.add_item_noonce,
          user: response.data.user
        });
      }
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });

  }
  getItems() {
    axios.get(window.location.pathname+'api/get-items.php')
    .then(function (response) {

      let d = response.data;
      this.setState({
        today_posts: d.items,
        bottom_threshold: d.bottom_threshold,
        top_threshold: d.top_threshold,
        fetching_posts: false,
        edit_noonces: d.edit_noonces
      });
      localStorage.setItem('urfat_today_posts',JSON.stringify(this.state.today_posts));

      return false;
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }
  cancelForm(e) {
    this.setState({
      editing: false,
      editItem: false
    });
  }

  logout(e) {
    e.preventDefault();

    if(!confirm("Are you sure you want to log out? ")) {
      return false;
    }
    let current = window.location.href;
    window.location.href = current+'form-process-user-logout.php?re='+current;
  }

  newItem(e) {
   e.preventDefault();
   let now = Math.floor(Date.now() / 1000)
   let item = {
    id: now,
    post_title: '',
    post_amount: '',
    post_date: now
   }
   this.setState({editing: "ADD", editItem: item});
  }
  updateItem(item) {
    let updateItem = {
      id: item.id,
      post_title: item.post_title,
      post_amount: item.post_amount,
      post_date: item.post_date
    }
    this.setState({editing: "UPDATE", editItem: updateItem});
  }

  componentWillUnmount() {
   this.loginListen.remove();
   this.newItemListen.remove();
   this.deleteListen.remove();
   this.updateListen.remove();

  }


  render(props, state) {
    let disableAdd = (!state.add_item_noonce) ? true : false,
        editForm = null;
    if( ( !state.logged_in)) {
      return <div class="app"><LoginForm /></div>;
    }
    if(state.editing) {
     editForm =  <ItemForm cancelForm={this.cancelForm}  editState={state.editing} item={state.editItem} />
    }
    return (
      <div>
      <div class="app">
        <header>
          <h1>What You Ate Today</h1>
        </header>
        <main onScroll={this.windowListener}>
          <List
      fetching_posts={state.fetching_posts}
      today_posts={state.today_posts}
      openItem={state.openItem}
      />
        </main>
        <nav>
          <NavButton disabled={disableAdd} type={"new-item"} copy={"Add Item"} clickAction={this.newItem} />

          <NavButton type={"logout"} copy={"Log Out"} clickAction={this.logout} />
        </nav>
      </div>
      {editForm}
      </div>

    )

  }
}

render(<App

       previousLogin={Cookies.get('ur_fat_remember_me')} />, document.getElementById('root'));
