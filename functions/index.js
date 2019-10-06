const functions = require('firebase-functions');
const admin=require('firebase-admin');


admin.initializeApp(functions.config().firestore,functions.config().database);
const getFirestore = () => admin.firestore()

exports.onComment = functions.firestore.document('posts/{postId}/comment/{commentid}').onCreate(async (snap, context) =>{
 
  await getFirestore().collection('posts').doc(context.params.postId).update({
    t_comment: admin.firestore.FieldValue.increment(1), // increment total count of comments
    });
/** Send comment notification to original post owner/user */
const otherUser     = await getFirestore().collection('users').doc(snap.data().uid).get(); //User id who commented on post
const ownerPostData = await getFirestore().collection('posts').doc(context.params.postId).get();//post data of owner's post
const user          = await getFirestore().collection('users').doc(ownerPostData.data().userid).get(); //post owner's user id
var   pushid        = await admin.database().ref().push().key;
var   time          = await admin.firestore.FieldValue.serverTimestamp();
var   comment       = snap.data().text;

//Check If any user has been tagged
if(comment.includes('@')){

  var TaggedUserName = comment.match(/(^|\s)@(\w+)/g).map(function(v){return v.trim().substring(1);});
  var tempUserID     = ""; //var to store userID, temprorily. 
  TaggedUserName.forEach(async (element) => {
    var TggedUserDetails =  await getFirestore().collection('users').where("username","==",element).get();
    TggedUserDetails.forEach(async(item)=>{
      console.log('TaggedUserID' + item.data().uid);
      if(item.data().uid === ownerPostData.data().userid && otherUser.data().uid === item.data().uid ) {
        console.log('Use Case 1 : user commented on post tagging himself once or multiple time')
      } else if(tempUserID ==="" ){
        tempUserID = item.data().uid; // store the current UserID
        console.log('Use Case 2 : user commented on post tagging someone'); 
        await getFirestore().collection('users').doc(item.data().uid).update({
          unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count.
        });
        //send app notification
        await getFirestore().collection("users").doc(item.data().uid).collection("Notification").doc(pushid).set({
          img_url : "",
          type:0,
          uid:snap.data().uid,
          username:otherUser.data().name,
          text:" mentioned you in comment.",
          id:pushid,
          time:time,
          postId: context.params.postId,
        });
        //check notification settings. Push notification to device if user has accepted for it. 
        console.log('user.data().nf_comment' + user.data().nf_comment);
        if(user.nf_comment || user.data().nf_comment || user.data().nf_comment === "true"){
          const payload = {
            notification: {
              title: `${user.data().name}`,
              body:`${otherUser.data().name} mentioned you in comment`, //`${otherUser.name} commented on your post.`,
              }
          };
        await admin.messaging().sendToDevice(item.data().fcm_tocken,payload);
        }
        //------------------------------------------Notify Post Owner---------------------------------//
        //send app notification
        if(item.data().uid !== ownerPostData.data().userid) {
          await getFirestore().collection('users').doc(ownerPostData.data().userid).update({
            unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count.
          });
          await getFirestore().collection("users").doc(ownerPostData.data().userid).collection("Notification").doc(pushid).set({
            img_url : "",
            type:0,
            uid:snap.data().uid,
            username:otherUser.data().name,
            text:" commented on your post.",
            id:pushid,
            time:time,
            postId: context.params.postId,
          });
          //check notification settings. Push notification to device if user has accepted for it. 
          console.log('user.data().nf_comment' + user.data().nf_comment);
          if(user.nf_comment || user.data().nf_comment || user.data().nf_comment === "true"){
            const payload = {
              notification: {
                title: `${user.data().name}`,
                body:`${otherUser.data().name} commented on your post`, //`${otherUser.name} commented on your post.`,
                }
            };
          await admin.messaging().sendToDevice(user.data().fcm_tocken,payload);
          }
      }
      } else if(tempUserID !== item.data().uid){
        console.log('Use Case 3 : User commented on post tagging same user twice or more');
        await getFirestore().collection('users').doc(item.data().uid).update({
          unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count.
        });
           //send app notification
        await getFirestore().collection("users").doc(item.data().uid).collection("Notification").doc(pushid).set({
          img_url : "",
          type:0,
          uid:snap.data().uid,
          username:otherUser.data().name,
          text:" mentioned you in comment.",
          id:pushid,
          time:time,
          postId: context.params.postId,
        });
        //check notification settings. Push notification to device if user has accepted for it. 
        console.log('user.data().nf_comment' + user.data().nf_comment);
        if(user.nf_comment || user.data().nf_comment || user.data().nf_comment === "true"){
          const payload = {
            notification: {
              title: `${user.data().name}`,
              body:`${otherUser.data().name} mentioned you in comment`, //`${otherUser.name} commented on your post.`,
              }
          };
        await admin.messaging().sendToDevice(item.data().fcm_tocken,payload);
        }
        //------------------------------------------Notify Post Owner---------------------------------//
        await getFirestore().collection('users').doc(ownerPostData.data().userid).update({
          unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count.
        });
        //send app notification
        await getFirestore().collection("users").doc(ownerPostData.data().userid).collection("Notification").doc(pushid).set({
          img_url : "",
          type:0,
          uid:snap.data().uid,
          username:otherUser.data().name,
          text:" commented on your post.",
          id:pushid,
          time:time,
          postId: context.params.postId,
        });
        //check notification settings. Push notification to device if user has accepted for it. 
        console.log('user.data().nf_comment' + user.data().nf_comment);
        if(user.nf_comment || user.data().nf_comment || user.data().nf_comment === "true"){
          const payload = {
            notification: {
              title: `${user.data().name}`,
              body:`${otherUser.data().name} commented on your post`, //`${otherUser.name} commented on your post.`,
              }
          };
        await admin.messaging().sendToDevice(user.data().fcm_tocken,payload);
        }

        tempUserID = item.data().uid; //store the current UserID
      }
  
    });
  });
}else{
  console.log('Use Case 4 : user commented on post without tagging anyone - notifiy postowner - user(name) commented on your post');
  if(otherUser.data().uid === ownerPostData.data().userid) {
    console.log(' Use Case 5 : User commented on his own post');
  } else {
  await getFirestore().collection('users').doc(ownerPostData.data().userid).update({
    unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count for liked post
  });
  //send app notification
  await getFirestore().collection("users").doc(ownerPostData.data().userid).collection("Notification").doc(pushid).set({
    img_url : "",
    type:0,
    uid:snap.data().uid,
    username:otherUser.data().name,
    text:" commented on your post.",
    id:pushid,
    time:time,
    postId: context.params.postId,
  });
  //check notification settings. Push notification to device if user has accepted for it. 
  console.log('user.data().nf_comment' + user.data().nf_comment);
  if(user.nf_comment || user.data().nf_comment || user.data().nf_comment === "true"){
    const payload = {
      notification: {
        title: `${user.data().name}`,
        body:`${otherUser.data().name} commented on your post`, //`${otherUser.name} commented on your post.`,
        }
    };
  await admin.messaging().sendToDevice(user.data().fcm_tocken,payload);
  }
}
}

}); // end of function.

exports.oncommentdelete = functions.firestore.document('posts/{postId}/comment/{commentId}')
  .onDelete(async (snap, context) =>{
  await getFirestore().collection('posts').doc(context.params.postId).update({
      t_comment: admin.firestore.FieldValue.increment(-1),
    });
      //TODO : Delete Comment Notifications

});

/** Trigger this funtion when any of the post is liked  */

exports.onlike = functions.firestore.document('posts/{postId}/likes/{otherUserId}')
  .onCreate(async (snap, context) =>{
  //Increase the total likes count by 1
    await getFirestore().collection('posts').doc(context.params.postId).update({
      t_like: admin.firestore.FieldValue.increment(1),
    });

/** Send like notification to original post owner/user
  * Person who liked the post **/
const otherUser     = await getFirestore().collection('users').doc(snap.id).get();
const ownerPostData = await getFirestore().collection('posts').doc(context.params.postId).get(); //post that has been liked
const user          = await getFirestore().collection('users').doc(ownerPostData.data().userid).get(); //owner of the post
var   pushid        = await admin.database().ref().push().key;
var   time          = await admin.firestore.FieldValue.serverTimestamp();

if(otherUser.data().uid === ownerPostData.data().userid) {
  console.log('User liked his own post');
} else {
  await getFirestore().collection('users').doc(ownerPostData.data().userid).update({
    unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count for liked post
  });
  //send app notification
  await getFirestore().collection("users").doc(ownerPostData.data().userid).collection("Notification").doc(pushid).set({
    img_url : "",
    type:0,
    uid:context.params.otherUserId,
    username:otherUser.data().name,
    text:" liked your post.",
    id:pushid,
    time:time,
    postId: context.params.postId,
  });
  //check notification settings. Push notification to device if user has accepted for it. 
  console.log('user.data().nf_like' + user.data().nf_like);
  if(user.data().nf_like){
    const payload = {
      notification: {
        title: `${user.data().name}`,
        body: `${otherUser.data().name} liked your post.`,
        }
    };
  await admin.messaging().sendToDevice(user.data().fcm_tocken,payload);
  }
}
});


//Trigger this activity when disliked
exports.ondislike = functions.firestore.document('posts/{postId}/likes/{likeId}')
  .onDelete(async (snap, context) =>{
  await getFirestore().collection('posts').doc(context.params.postId).update({
      t_like: admin.firestore.FieldValue.increment(-1),
    });
  const postData = await getFirestore().collection('posts').doc(context.params.postId).get();
  const user     = await getFirestore().collection('users').doc(postData.data().userid).get(); //post owner's user id
 
    /*Delete Like Notification, when disliked */
    var likeNotification = await getFirestore().collection("users").doc(user.data().uid).collection('Notification').where("uid", "==", context.params.likeId).where("postId", "==", context.params.postId).get(); // deleteing Notification 
    likeNotification.forEach((item) => {
      getFirestore().collection('users').doc(user.data().uid).collection('Notification').doc(item.data().id).delete();
    });



});



exports.follow = functions.firestore.document('users/{userId}/follow/{otherUserId}')
  .onCreate(async (snap, context) =>{
 
    await getFirestore().collection('users').doc(context.params.userId).update({
        t_following: admin.firestore.FieldValue.increment(1),
      });
    await getFirestore().collection('users').doc(context.params.otherUserId).update({
        t_follower: admin.firestore.FieldValue.increment(1),
        unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
      });

    var name;
    var img_url;
    var tokens;
    var myname;
    const otherUser = await getFirestore().collection('users').doc(context.params.otherUserId).get();
    const user      = await getFirestore().collection('users').doc(context.params.userId).get();
    var pushid      = await admin.database().ref().push().key;
    var time        = await admin.firestore.FieldValue.serverTimestamp();

    if (otherUser.exists) {
     name= otherUser.data().name;
     console.log('otherusername if loop' + name);
     tokens= otherUser.data().fcm_tocken;
     console.log(otherUser.data());
    }else{ console.log("user does not exists"); }

    if (user.exists) {
    myname= user.data().name;
    img_url= user.data().img_url;
    console.log(user.data());
    }else{ console.log("user does not exists"); }

    /** Remove the self followers from the list of Following and followers*/
     var followingId = getFirestore().collection('users').doc(context.params.userId).collection('follow').where("id", "==", context.params.userId).get();
    console.log(followingId);
     /*
     followingId.forEach((item) => {
      getFirestore().collection('users').doc(user.data().uid).collection('follow').doc(item).delete();
      getFirestore().collection('users').doc(user.data().uid).collection('follower').doc(item).delete();
        getFirestore().collection('users').doc(context.params.userId).update({
          t_following: admin.firestore.FieldValue.increment(-1),
        });
        getFirestore().collection('users').doc(context.params.otherUserId).update({
          t_follower: admin.firestore.FieldValue.increment(-1),
        });
      
     });// TO DO : This can be removed when pupose is surved. */
    
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:0,
      uid:context.params.userId,
      username:myname,
      text:" started following you.",
      id:pushid,
      time:time,
    });

    var posts = await getFirestore().collection('users').doc(context.params.otherUserId).collection('posts').limit(10).get();
    posts.forEach((item)=>{
    var time =admin.firestore.FieldValue.serverTimestamp();
     getFirestore().collection('users').doc(context.params.userId).collection('feed')
    .doc(item.id).set({
      id:item.id,
      time:time,
    });
    });

      const payload = {
        notification: {
          title: `${name}`,
          body: `${myname} started following you.`,
          icon: `${img_url}`,
          }
      };
     await admin.messaging().sendToDevice(tokens,payload);
});


exports.followrequest = functions.firestore.document('users/{userId}/f_requested/{otherUserId}')
  .onCreate(async (snap, context) =>{
    
    var name;
    var img_url;
    var tokens;
    var myname;
   
    const otherUser= await getFirestore().collection('users').doc(context.params.otherUserId).get();
    const user= await getFirestore().collection('users').doc(context.params.userId).get();
    if (otherUser.exists) {
     name= otherUser.data().name;
     tokens= otherUser.data().fcm_tocken;
     console.log(otherUser.data());
    }
    else{
        console.log("user does not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    img_url= user.data().img_url;
    console.log(user.data());
    }
    else{
        console.log("user does not exists");
    }
    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection('users').doc(context.params.otherUserId).update({
      unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
    });
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:2,
      uid:context.params.userId,
      username:myname,
      text:" has requested to follow you.",
      id:pushid,
      time:time,
    });
         
      const payload = {
        notification: {
          title: `${name}`,
          body: `${myname} has requested to follow you.`,
          icon: `${img_url}`,
          }
      };
     await admin.messaging().sendToDevice(tokens,payload);

});

//trigger this activity on unfollow request.
exports.unfollow = functions.firestore.document('users/{userId}/follow/{otherUserId}')
  .onDelete(async (snap, context) =>{
    //decrement the following count
    await getFirestore().collection('users').doc(context.params.userId).update({
        t_following: admin.firestore.FieldValue.increment(-1),
      });
      //decrement the follwer count
    await getFirestore().collection('users').doc(context.params.otherUserId).update({
        t_follower: admin.firestore.FieldValue.increment(-1),
      });

});


exports.uploadpost = functions.firestore.document('users/{userId}/posts/{postId}')
.onCreate(async (snap, context) =>{

  await getFirestore().collection('users').doc(context.params.userId).update({
    t_posts: admin.firestore.FieldValue.increment(1),
    });

    var time =  await admin.firestore.FieldValue.serverTimestamp();
    var followerlist = await getFirestore().collection('users').doc(context.params.userId).collection('follower').get();
  
  
    followerlist.forEach((item)=>{
     var refrence= getFirestore().collection("users").doc(item.id).collection('feed')
    .doc(context.params.postId);
      refrence.set({
        id:context.params.postId,
        time:time,
      });
    });

    getFirestore().collection("users").doc(context.params.userId).collection('feed')
    .doc(context.params.postId).set({
      id:context.params.postId,
      time:time,
    });

  /** Notify the tagged users in the post 
    *  Get Post Data from user's postId
    *  Scan the caption and find out the tagged users in caption. */
  var postData = await getFirestore().collection('posts').doc(context.params.postId).get();
  var user     = await getFirestore().collection('users').doc(postData.data().userid).get(); //post owner's user id
  var   pushid   = await admin.database().ref().push().key;
  var   caption  = postData.data().caption;
  if(user !==null){ var gender   = user.data().gender; } 
  
  //Check If any user has been tagged
  if(caption.includes('@')){

    var TaggedUserName = caption.match(/(^|\s)@(\w+)/g).map(function(v){return v.trim().substring(1);});
    var tempUserID     = ""; //var to store userID, temprorily. 
    TaggedUserName.forEach(async (element) => {
      var TggedUserDetails =  await getFirestore().collection('users').where("username","==",element).get();
      TggedUserDetails.forEach(async(item)=>{
        console.log('TaggedUserID' + item.data().uid);
        if(item.data().uid === postData.data().userid) {
          console.log('Use Case 1 : user tagged himself in his post.')
        } else if(tempUserID ==="" ){
          tempUserID = item.data().uid; // store the current UserID
          console.log('Use Case 2 : user tagged someone in his post'); 
          await getFirestore().collection('users').doc(item.data().uid).update({
            unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count.
          });
          //send app notification
          await getFirestore().collection("users").doc(item.data().uid).collection("Notification").doc(pushid).set({
            img_url : "",
            type:0,
            uid:user.data().uid,
            username:user.data().name,
            text:` tagged you in ${gender===null? "their": (gender==="male" ? "his":"her")} post.`,
            id:pushid,
            time:time,
            postId: context.params.postId,
          });
          //check notification settings. Push notification to device if user has accepted for it. 
          console.log('user.data().nf_post' + user.data().nf_post);
          if(user.nf_post || user.data().nf_post || user.data().nf_post === "true"){
            const payload = {
              notification: {
                title: `${item.data().name}`,
                body:`${user.data().name} tagged you in ${gender===null? "their": (gender==="male" ? "his":"her")} post.`, //`${otherUser.name} commented on your post.`,
                }
            };
          await admin.messaging().sendToDevice(item.data().fcm_tocken,payload);
          console.log('item.data().fcm_tocken : ' + item.data().fcm_tocken); 
          }
          }else if(tempUserID !== item.data().uid){
            console.log('Use Case 3 : User tagged another user ');
            await getFirestore().collection('users').doc(item.data().uid).update({
            unseen_notification: admin.firestore.FieldValue.increment(1), // increase the notification count.
            });
            //send app notification
          await getFirestore().collection("users").doc(item.data().uid).collection("Notification").doc(pushid).set({
            img_url : "",
            type:0,
            uid:user.data().uid,
            username:user.data().name,
            text:` tagged you in ${gender===null? "their": (gender==="male" ? "his":"her")} post.`,
            id:pushid,
            time:time,
            postId: context.params.postId,
          });
          //check notification settings. Push notification to device if user has accepted for it. 
          console.log('user.data().nf_post' + user.data().nf_post); 
          if(user.nf_post || user.data().nf_post || user.data().nf_post === "true"){
            const payload = {
              notification: {
                title: `${item.data().name}`,
                body:`${user.data().name} tagged you in ${gender===null? "their": (gender==="male" ? "his":"her")} post.`, //`${otherUser.name} commented on your post.`,
                }
            };
          await admin.messaging().sendToDevice(item.data().fcm_tocken,payload);
          }
          tempUserID = item.data().uid; //store the current UserID
        }
    
      });
  });
}

//if(user !==null){ var gender   = user.data().gender; }  // i made it comment cause i don't know what is this line acctually doing {laughing emoji,laughing emoji}  
  
//Check If Post has HashTags
// ALGO  DESIGN AND DEVELOPED BY JIVAN_PATEL  
// first attempt is fail error in 590  {crying emoji,crying emoji}
// second attempt fail gender is already assiged {crying emoji,crying emoji}
// third attempt is SUCCESS {happy emoji,happy emoji}
// it's working on first deploy let's celebrate {happy emoji,happy emoji}

 if(caption.includes('#')){
  var HashTags = caption.match(/(^|\s)#(\w+)/g).map(function(v){return v.trim().substring(1);}); // geting hashtags form caption in array
  var db       = admin.database().ref();  // ref to firebase database

  HashTags.forEach(async (element) => {
   
    // hashtag db scama in firebase database
    // 
    // :[hashtags]--
    //              |- {hashtags_name}--
    //              |                    |-- username = "hashtags_name"
    //              |
    //              |- {hashtags_name}--
    //                                   |-- username = "hashtags_name"

    //  firestore db scama 
    //
    // :[hashtags]--
    //              |-{hashtasgs_name}--
    //              |                   |-- username ="hashtags_name"
    //              |                   |-- img_url  ="img_url..."
    //              |                   |-- t_posts = {counter of posts list } 
    //              |                   |-- t_report = {counter of report  } 
    //              |                   |--   [posts]--
    //              |                                  |-{post_id}--
    //              |                                  |            |- id == "post_ id"
    //              |                                  |            |- time == "time.. when posts adde in databsae"
    //              |                   |--   [follower]--
    //              |                                  |-{user_id}--
    //              |                                  |            |- id == "user id"
    //              |                                  |            |- time == "time.. when user started following"

  
     //hashtags data is get from firebase datbase and if this data is null means hashtags is not exist in database 
   
   
    await db.child("hashtag").child(element).once("value", function (snapshot)  {
      if(snapshot.val()!==null){
                console.log("hashtag already in db: " + snapshot.val());

                // means hashtag is already in db and we just need to increse counter of t_post and add post id to posts list in firestore 
                 getFirestore().collection("hashtags").doc(element).update({
                  t_posts:admin.firestore.FieldValue.increment(1), // increase the counter of hashtah with one
                  img_url:postData.data().images[0],  // posts image url is set as hashtag profile image so that hashtag profile update every time when whenever new post is added to it
                });
                 getFirestore().collection("hashtags").doc(element).collection("posts")
                      .doc(context.params.postId).set({
                        id:context.params.postId,  //  posts id 
                        time:postData.data().u_time, // upload time of post 
                      });
      }
      else{
                  console.log("hashtag not in db: " + snapshot.val());
                
                    // means hashtag is not in database and we need to add it first in database
                // and than firestore

                //creating hashtag in database so that it shows in search 
                hashtagdata=db.child("hashtag").child(element).set({
                  username:element,
                });

              // assiging basic perameter of hashtag in firestore
                 getFirestore().collection("hashtags").doc(element).set({
                  t_posts: 1, //  t_posts is assign with 1 beacouse is are addeing first post just after this statment
                  img_url:postData.data().images[0],  // posts image url is set as hashtag profile image 
                  // username=element, first attempt error
                  username:element
                });

                // adding posts in post_list of firestore
                 getFirestore().collection("hashtags").doc(element).collection("posts")
                      .doc(context.params.postId).set({
                        id:context.params.postId,  //  posts id 
                        time:postData.data().u_time, // upload time of post 
                });

      }
    }, function async (errorObject) {
                console.log("The read failed: " + errorObject.code);
                    // means hashtag is not in database and we need to add it first in database
                // and than firestore

                //creating hashtag in database so that it shows in search 
                hashtagdata=db.child("hashtag").child(element).set({
                  username:element,
                });

              // assiging basic perameter of hashtag in firestore
                 getFirestore().collection("hashtags").doc(element).set({
                  t_posts: 1, //  t_posts is assign with 1 beacouse is are addeing first post just after this statment
                  img_url:postData.data().images[0],  // posts image url is set as hashtag profile image 
                  // username=element, first attempt error
                  username:element
                });

                // adding posts in post_list of firestore
                 getFirestore().collection("hashtags").doc(element).collection("posts")
                      .doc(context.params.postId).set({
                        id:context.params.postId,  //  posts id 
                        time:postData.data().u_time, // upload time of post 
                });
              });

  });  // foreach is end !
}     // if is end!

});



exports.deletepost = functions.firestore.document('users/{userId}/posts/{postId}')
  .onDelete(async (snap, context) =>{
  await getFirestore().collection('users').doc(context.params.userId).update({
    t_posts: admin.firestore.FieldValue.increment(-1),
    });

    getFirestore().collection("users").doc(context.params.userId).collection('posts')
    .doc(context.params.postId).delete();


    ///[follwerlat] is list of user whofollowingpost ower
    var followerlist = await getFirestore().collection("users").get(); 

    await followerlist.forEach((item)=>{ // [item] is data of sibgle user
      console.log(item.data().uid);     // print user uid in log
     getFirestore().collection("users").doc(item.data().uid).collection('feed') // deleteing post id form user feed 
    .doc(context.params.postId).delete(); 
    });

    // delete post refrence form  hastags
    //ALGO DESIGN AND DEVELOPED BY JIVAN_PATEL
    var db       = admin.database().ref(); 
    await db.child("hashtag").once("value",function(snapshot){
      snapshot.forEach(async (item)=>{
         getFirestore().collection("hashtags").doc(item.username).collection("posts")
        .doc(context.params.postId).delete();
      });
       
    },function(errorObject){
      console.log("error in deleteting posts:" + errorObject.code);
    });

    await getFirestore().collection("posts").doc(context.params.postId).delete();// deleteing whole post data from post_collention 

});


exports.addcrush = functions.firestore.document('users/{userId}/crush/{otherUserId}')
  .onCreate(async (snap, context) =>{

  await getFirestore().collection('users').doc(context.params.userId).update({
      t_crush: admin.firestore.FieldValue.increment(1), // increase the crush count on self profile
    });
  await getFirestore().collection('users').doc(context.params.otherUserId).update({
      t_crush_on_you: admin.firestore.FieldValue.increment(1), // increase the crush on him/her count by 1
      unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
    });

    
    var name;
    var img_url;
    var tokens;
    var myname;
    
    const otherUser= await getFirestore().collection('users').doc(context.params.otherUserId).get();
    const user= await getFirestore().collection('users').doc(context.params.userId).get();
    if (otherUser.exists) {
     name= otherUser.data().name;
     img_url= otherUser.data().img_url;
     tokens= otherUser.data().fcm_tocken;
     console.log(otherUser.data());
    }
    else{
        console.log("user does not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    console.log(user.data());
    }
    else{
        console.log("user does not exists");
    }

    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:0,
      uid:context.params.userId,
      username:name,
      text:`has crush on you.`,
      id:pushid,
      time:time,
    });

    
      const payload = {
        notification: {
          title: `${name}`,
          body: `${myname} has crush on you.`,
          icon: `${img_url}`,
          }
      };
     console.log(payload);

     await admin.messaging().sendToDevice(tokens,payload);

});

exports.Crushrequest = functions.firestore.document('users/{userId}/crush_requested/{otherUserId}')
  .onCreate(async (snap, context) =>{

    var name;
    var img_url;
    var tokens;
    var myname;
    var gender; 
    const otherUser= await getFirestore().collection('users').doc(context.params.otherUserId).get();
    const user= await getFirestore().collection('users').doc(context.params.userId).get();
    if (otherUser.exists) {
     name= otherUser.data().name;
     tokens= otherUser.data().fcm_tocken;
  
     console.log(otherUser.data());
    }
    else{
        console.log("user does not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    gender = user.data().gender;
    img_url= user.data().img_url;
    console.log(user.data());
    }
    else{
        console.log("user does not exists");
    }
    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection('users').doc(context.params.otherUserId).update({
      unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
    });

    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:3,
      uid:context.params.userId,
      username:myname,
      text: `has requested to add you in ${gender===null? "their": (gender==="male" ? "his":"her")} crush list.`,
      id:pushid,
      time:time,
    });
         
      const payload = {
        notification: {
          title: `${name}`,
          body: `${myname} has requested to add you in ${gender===null? "their": (gender==="male" ? "his":"her")} crush list.`,
          icon: `${img_url}`,
          }
      };
     await admin.messaging().sendToDevice(tokens,payload);

});


exports.deleteaddcrush = functions.firestore.document('users/{userId}/crush/{otherUserId}')
  .onDelete(async (snap, context) =>{
    await getFirestore().collection('users').doc(context.params.userId).update({
      t_crush: admin.firestore.FieldValue.increment(-1),
      });
    await getFirestore().collection('users').doc(context.params.otherUserId).update({
      t_crush_on_you: admin.firestore.FieldValue.increment(-1),
      });

});


exports.addinSecretcrush = functions.firestore.document('users/{userId}/secret_crush/{otherUserId}').onCreate(async (snap, context) =>{
  await getFirestore().collection('users').doc(context.params.userId).update({
      t_secret_crush: admin.firestore.FieldValue.increment(1),
    });
 
    var name;
    var img_url;
    var tokens;
    var myname;
    var gender;
    var isMatch;
    const otherUser= await getFirestore().collection('users').doc(context.params.otherUserId).get();
    const user= await getFirestore().collection('users').doc(context.params.userId).get();
    const ismutualcrush = await getFirestore().collection('users').doc(context.params.otherUserId).collection('secret_crush').doc(context.params.userId).get();
    //console.log("ismutualcrush..." + ismutualcrush.data().match);
    if (otherUser.exists) {
     name= otherUser.data().name;
     tokens= otherUser.data().fcm_tocken;
     console.log(otherUser.data());
    }else{
        console.log("user does not exists");
    }

    if (user.exists) {
    myname= user.data().name;
    console.log(user.data());
    gender = user.data().gender;
    img_url= otherUser.data().img_url;
    }else{
        console.log("user does not exists");
    }
    if(ismutualcrush.exists){
      if(ismutualcrush.data().match !== null){
       isMatch = ismutualcrush.data().match;
      }
    } else{
      console.log("Mutual crush does not exist");
      isMatch = false;
    }

    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();

    /** check if secret cursh shown is mutual, if not, notify the other user
     * else, send the mutual secret crush notification to both users. 
     */
    if(isMatch === false){
      await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
        img_url:img_url,
        type:1,
        uid: "ZelHdixKHkWpzP5BAZfxCKIwt6h1", //context.params.userId, Temp Fix
        username:"",
        text:`Someone has secret crush on you, ${gender===null? "their": (gender==="male" ? "his":"her")} name starts with ${myname.substring(0,1)}`,
        id:pushid,
        time:time,
      });
      await getFirestore().collection('users').doc(context.params.otherUserId).update({
        unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
      });
        const payload = {
          notification: {
            title: `${name}`, 
            body: `Someone has secret crush on you, ${gender===null? "their": (gender==="male" ? "his":"her")} name starts with ${myname.substring(0,1)}`,
            icon: `${img_url}`,
            }
        };
      console.log(payload);

      await admin.messaging().sendToDevice(tokens,payload);
    }else if(isMatch === true || isMatch === "true"){ 
      getFirestore().collection('users').doc(context.params.otherUserId).collection('secret_crush').doc(context.params.userId).update({match:true});
      getFirestore().collection('users').doc(context.params.userId).collection('secret_crush').doc(context.params.otherUserId).update({match:true});
      await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
        img_url:img_url,
        type:4, 
        uid1:context.params.userId,
        uid2:context.params.otherUserId,
        id:pushid,
        time:time,
      });
      await getFirestore().collection("users").doc(context.params.userId).collection("Notification").doc(pushid).set({
        img_url:img_url,
        type:4,
        uid1:context.params.otherUserId,
        uid2:context.params.userId,
        id:pushid,
        time:time,
      });
      await getFirestore().collection('users').doc(context.params.otherUserId).update({
        unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
      });
      await getFirestore().collection('users').doc(context.params.userId).update({
        unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
      });
      
        const payload = {
          notification: {
            icon:"https://png.pngtree.com/svg/20170520/2dd3ad4b9c.svg",
            title: `${name}`,
            body: "YaY! you've got a match. Check out your secret crush list.",
            //icon: `${img_url}`,
            }
        };
      console.log(payload);

      await admin.messaging().sendToDevice(tokens,payload);
    }else{
      getFirestore().collection('users').doc(context.params.otherUserId).collection('secret_crush').doc(context.params.userId).update({match:true});
      getFirestore().collection('users').doc(context.params.userId).collection('secret_crush').doc(context.params.otherUserId).update({match:true});
      await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
        img_url:img_url,
        type:4, 
        uid1:context.params.userId,
        uid2:context.params.otherUserId,
        id:pushid,
        time:time,
      });
      await getFirestore().collection("users").doc(context.params.userId).collection("Notification").doc(pushid).set({
        img_url:img_url,
        type:4,
        uid1:context.params.otherUserId,
        uid2:context.params.userId,
        id:pushid,
        time:time,
      });
      await getFirestore().collection('users').doc(context.params.otherUserId).update({
        unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
      });
      await getFirestore().collection('users').doc(context.params.userId).update({
        unseen_notification : admin.firestore.FieldValue.increment(1), //increase the unseen notification count by 1
      });
      
        const payload = {
          notification: {
            icon:"https://png.pngtree.com/svg/20170520/2dd3ad4b9c.svg",
            title: `${name}`,
            body: "YaY! you've got a match. Check out your secret crush list.",
            //icon: `${img_url}`,
            }
        };
      console.log(payload);

      await admin.messaging().sendToDevice(tokens,payload);
    }
});


exports.onChat = functions.firestore.document('chats/{chatsId}/chat/{chatId}').onCreate(async (snap, context) =>{
  
/** Send message notification to receiver
  *  */
const chatDetails    = await getFirestore().collection('chats').doc(context.params.chatsId).collection('chat').doc(context.params.chatId).get(); //get chats-Id-chat details
const receiverDetails= await getFirestore().collection('users').doc(chatDetails.data().r_id).get();
const senderDetails = await getFirestore().collection('users').doc(chatDetails.data().s_id).get(); 
await getFirestore().collection('users').doc(chatDetails.data().r_id).update({
  unread_message : admin.firestore.FieldValue.increment(1),
}); //To mark message-unread on homepage
await getFirestore().collection('users').doc(chatDetails.data().r_id).collection('chat').doc(chatDetails.data().s_id).update({
  unseen_message : admin.firestore.FieldValue.increment(1),
}) //update unseen_message count in users-Id-Chat-collection - count of user's message list. 
//check notification settings. Push notification to device if user has accepted for it. 
console.log('user.data().nf_message' + receiverDetails.data().nf_message);
if(receiverDetails.data().nf_message){
  const payload = {
    notification: {
      title: receiverDetails.data().name,
      body:`${senderDetails.data().name} sent you a message.`, //`${otherUser.name} commented on your post.`,
      }
  };
 await admin.messaging().sendToDevice(receiverDetails.data().fcm_tocken,payload);
}
});

exports.deletefromSecretSecrush = functions.firestore.document('users/{userId}/secret_crush/{otherUserId}')
  .onDelete(async (snap, context) =>{
    await getFirestore().collection('users').doc(context.params.userId).update({
      t_secret_crush: admin.firestore.FieldValue.increment(-1),
  });
  
});


//trigger this function on profile visit.
exports.profileVisit = functions.firestore.document('users/{userId}/profile_visits/{visitorId}').onCreate(async (snap, context) =>{
  //increment the following count
  await getFirestore().collection('users').doc(context.params.userId).update({
      t_profile_visits: admin.firestore.FieldValue.increment(1),
    });
});


exports.scheduledFunctionCrontab =
functions.pubsub.schedule('1 12 * * *').onRun(async(context) => {
    console.log('Scheduler : Refresh Suggestion Feed');
    var allUserList = await getFirestore().collection('users').get();
    allUserList.forEach(async(user)=>{
      var suggestionList;
      var followList = await getFirestore().collection('users').doc(user.uid).collection('Follow').get();
      followList.forEach(async(following)=> {
        allUserList.forEach(async(checkSuggestion)=> {
          if(checkSuggestion.uid !== following.id){
            suggestionList.add(checkSuggestion.uid);
            var pushid=await admin.database().ref().push().key;
            getFirestore().collection('users').doc(user.uid).collection('Suggestion').doc(pushid).set({
              id:checkSuggestion.uid,
              pushid:pushid,
            });
            if(suggestionList.length > 49){
              return 0;
            }
          }
        
        });

      });

    });
});