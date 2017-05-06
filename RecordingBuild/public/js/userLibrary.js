function getUserSongs() {
  console.log("getUserSongs called. pathToUserSongs: " + pathToUserSongs);
  var songs = [];
  var query = firebase.database().ref(pathToUserSongs).orderByValue();
  query.once("value")
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var key = childSnapshot.key;
        console.log("unique key: " + key);
        // childData will be the actual contents of the child
        var songNumber = childSnapshot.val() - 1;
        console.log('songNumber: ' + songNumber);
        songs[songNumber] = key;
        console.log('songs: ' + songs);
        var count;
        for (count = songs.length; count > 1; count--) {
          console.log('count: ' + count);
          var node = document.createElement("LI");
          var textnode = document.createTextNode(songs[count]);
          console.log(textnode);
          node.appendChild(textnode);
          var songList = document.getElementById("#songList");
          if (songList != null) {
            songList.appendChild(node);
          }
        }
      });
    });
}

document.onload = getUserSongs();



/*

function getUserSongs() {
  console.log("getUserSongs called. pathToUserSongs: " + pathToUserSongs);
  return new Promise(resolve => {
    console.log('getUserSongs called');
    var songs = [];
    var query = firebase.database().ref(pathToUserSongs).orderByValue();
    query.once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          console.log("unique key: " + key);
          // childData will be the actual contents of the child
          var songNumber = childSnapshot.val() - 1;
          console.log('songNumber: ' + songNumber);
          songs[songNumber] = key;
          console.log('songs: ' + songs);
        });
      });
    console.log('songs: ' + songs);
    resolve(songs);
  });
}

async function listUserSongs() {
  var songs = await getUserSongs();
  return songs;
}

listUserSongs().then(songs => {
  console.log('listUserSongs called');
  console.log('songs: ' + songs);
  var count;
  for (count = songs.length; count > 1; count--) {
    console.log('count: ' + count);
    var node = document.createElement("LI");
    var textnode = document.createTextNode(songs[count]);
    console.log(textnode);
    node.appendChild(textnode);
    document.getElementById("#songList").appendChild(node);
  }
})

/*
async function getNumSongs(pathToUser, callback) {
  var numSongs;
  var ref = firebase.database().ref(pathToUser + '/numSongs');
  ref.once("value")
    .then(function(snapshot) {
      numSongs = snapshot.key;
      console.log('numSongs: ' + numSongs);
    });
  await numSongs;
  callback(numSongs, listUserSongs);
}

function getUserSongs(numSongs, callback) {
  // Loop through users in order with the forEach() method. The callback
  // provided to forEach() will be called synchronously with a DataSnapshot
  // for each child:
  console.log('pullUserSongs called');
  var songs = [];
  var query = firebase.database().ref(pathToUserSongs).orderByValue();
  query.once("value")
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var key = childSnapshot.key;
        console.log("unique key: " + key);
        // childData will be the actual contents of the child
        var songNumber = childSnapshot.val() - 1;
        console.log('songNumber: ' + songNumber);
        songs[songNumber] = key;
        console.log('songs: ' + songs);
    });
  });
  console.log('songs: ' + songs);
  await songs;
  callback(songs);
}

function listUserSongs(songs) {
  console.log('listUserSongs called');
  console.log('songs: ' + songs);
  var count;
  for (count = songs.length; count > 1; count--) {
    console.log('count: ' + count);
    var node = document.createElement("LI");
    var textnode = document.createTextNode(songs[count]);
    console.log(textnode);
    node.appendChild(textnode);
    document.getElementById("#songList").appendChild(node);
  }
  return await songs;
}
*/
