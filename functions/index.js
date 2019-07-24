const functions = require('firebase-functions');
const admin=require('firebase-admin');


admin.initializeApp(functions.config().firestore,functions.config().database);
const getFirestore = () => admin.firestore()

exports.onComment = functions.firestore.document('posts/{projectId}/comment/{instanceId}')
  .onCreate(async (snap, context) =>{
  await getFirestore().collection('posts').doc(context.params.projectId).update({
    t_comment: admin.firestore.FieldValue.increment(1),
    })
});

exports.oncommentdelete = functions.firestore.document('posts/{projectId}/comment/{instanceId}')
  .onDelete(async (snap, context) =>{
  await getFirestore().collection('posts').doc(context.params.projectId).update({
      t_comment: admin.firestore.FieldValue.increment(-1),
    })
});

exports.onlike = functions.firestore.document('posts/{projectId}/likes/{instanceId}')
  .onCreate(async (snap, context) =>{
  await getFirestore().collection('posts').doc(context.params.projectId).update({
      t_like: admin.firestore.FieldValue.increment(1),
    })
});

exports.ondslike = functions.firestore.document('posts/{projectId}/likes/{instanceId}')
  .onDelete(async (snap, context) =>{
  await getFirestore().collection('posts').doc(context.params.projectId).update({
      t_like: admin.firestore.FieldValue.increment(-1),
    })
});


exports.follow = functions.firestore.document('users/{userId}/follow/{otherUserId}')
  .onCreate(async (snap, context) =>{
 
 
    await getFirestore().collection('users').doc(context.params.userId).update({
      t_following: admin.firestore.FieldValue.increment(1),
    });
  await getFirestore().collection('users').doc(context.params.otherUserId).update({
      t_follower: admin.firestore.FieldValue.increment(1),
    });

    
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
        console.log("user not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    img_url= user.data().img_url;
    console.log(user.data());
    }
    else{
        console.log("user not exists");
    }
    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:0,
      uid:context.params.userId,
      username:name,
      text:" Started following you..",
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
          body: `${myname} is started following you.....`,
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
     img_url= otherUser.data().img_url;
     tokens= otherUser.data().fcm_tocken;
     console.log(otherUser.data());
    }
    else{
        console.log("user not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    console.log(user.data());
    }
    else{
        console.log("user not exists");
    }
    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:2,
      uid:context.params.userId,
      username:name,
      text:" is requesting to follow you...",
      id:pushid,
      time:time,
    });
         
      const payload = {
        notification: {
          title: `${name}`,
          body: `${myname} is requesting to follow you...`,
          icon: `${img_url}`,
          }
      };
     await admin.messaging().sendToDevice(tokens,payload);

});


exports.unfollow = functions.firestore.document('users/{userId}/follow/{otherUserId}')
  .onDelete(async (snap, context) =>{
    await getFirestore().collection('users').doc(context.params.userId).update({
        t_following: admin.firestore.FieldValue.increment(-1),
      });
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
    getFirestore().collection("posts").doc(context.params.postId)
      .collection("ref").doc(item.id).set({
        ref:refrence,
      });
    
    });

    getFirestore().collection("users").doc(context.params.userId).collection('feed')
    .doc(context.params.postId).set({
      id:context.params.postId,
      time:time,
    });
});






exports.deletepost = functions.firestore.document('users/{userId}/posts/{postId}')
  .onDelete(async (snap, context) =>{
  await getFirestore().collection('users').doc(context.params.userId).update({
    t_posts: admin.firestore.FieldValue.increment(-1),
    });

    getFirestore().collection("users").doc(context.params.userId).collection('posts')
    .doc(context.params.postId).delete();
    

    var followerlist = await admin.database().ref('users').once();
    await followerlist.forEach((item)=>{
      console.log(item.uid);
     var refrence = getFirestore().collection("users").doc(item.uid).collection('feed')
    .doc(context.params.postId);
    refrence.delete(); 
    });
});


exports.addcrush = functions.firestore.document('users/{userId}/crush/{otherUserId}')
  .onCreate(async (snap, context) =>{

  await getFirestore().collection('users').doc(context.params.userId).update({
      t_crush: admin.firestore.FieldValue.increment(1),
    });
  await getFirestore().collection('users').doc(context.params.otherUserId).update({
      t_crush_on_you: admin.firestore.FieldValue.increment(1),
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
        console.log("user not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    console.log(user.data());
    }
    else{
        console.log("user not exists");
    }

    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:0,
      uid:context.params.userId,
      username:name,
      text:`${myname}  has crush on you...`,
      id:pushid,
      time:time,
    });

    
      const payload = {
        notification: {
          title: `${name}`,
          body: `${myname}  has crush on you...`,
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
   
    const otherUser= await getFirestore().collection('users').doc(context.params.otherUserId).get();
    const user= await getFirestore().collection('users').doc(context.params.userId).get();
    if (otherUser.exists) {
     name= otherUser.data().name;
     img_url= otherUser.data().img_url;
     tokens= otherUser.data().fcm_tocken;
     console.log(otherUser.data());
    }
    else{
        console.log("user not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    console.log(user.data());
    }
    else{
        console.log("user not exists");
    }
    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:3,
      uid:context.params.userId,
      username:name,
      text:" is requesting for adding you in there crush list...",
      id:pushid,
      time:time,
    });
         
      const payload = {
        notification: {
          title: `${name}`,
          body: `is requesting for adding you in there crush list...`,
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

exports.addinSecretcrush = functions.firestore.document('users/{userId}/secret_crush/{otherUserId}')
  .onCreate(async (snap, context) =>{
  await getFirestore().collection('users').doc(context.params.userId).update({
      t_secret_crush: admin.firestore.FieldValue.increment(1),
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
        console.log("user not exists");
    }
    if (user.exists) {
    myname= user.data().name;
    console.log(user.data());
    }
    else{
        console.log("user not exists");
    }

    var pushid=await admin.database().ref().push().key;
    var time =  await admin.firestore.FieldValue.serverTimestamp();
    await getFirestore().collection("users").doc(context.params.otherUserId).collection("Notification").doc(pushid).set({
      img_url:img_url,
      type:1,
      uid:context.params.userId,
      username:name,
      text:`Someone has secret crush on you and name  starts with ${name.substring(0,1)}...`,
      id:pushid,
      time:time,
    });
     
      const payload = {
        notification: {
          title: `${myname}`,
          body: `Someone has secret crush on you and name starts with ${name.substring(0,1)}...`,
          icon: `${img_url}`,
          }
      };
     console.log(payload);

     await admin.messaging().sendToDevice(tokens,payload);

});



exports.deletefromSecretSecrush = functions.firestore.document('users/{userId}/secret_crush/{otherUserId}')
  .onDelete(async (snap, context) =>{
    await getFirestore().collection('users').doc(context.params.userId).update({
      t_secret_crush: admin.firestore.FieldValue.increment(-1),
  });
  

});