// Object to hold all the incoming MIDI data. Includes methods for playing, recording and encoding SMFee
function recorderModel() {
  console.log("Creating new Midi recorder instance");
  var eventObjects = [];
  var recStartTime = 0
    , rAF
    , startTime
    , deltaSubtract = 0;
  var self = this;
  var eventPointer = 0;  // pointer to the MIDI event array
  this.status = '';
  this.playing = new SpEvent(this);
  this.recording = new SpEvent(this);
  this.idle = new SpEvent(this);
  this.paused = new SpEvent(this);
  this.video = '';

// Video stuff initialization
  var mediaRecorder;
  var recordedBlobs;
  var sourceBuffer;

  var options = {mimeType: 'video/webm;codecs=vp9'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.log(options.mimeType + ' is not Supported');
    options = {mimeType: 'video/webm;codecs=vp8'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = {mimeType: 'video/webm'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: ''};
      }
    }
  }

  function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  }

  function startVideoRecording() {

    try {
      mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
      console.error('Exception while creating MediaRecorder: ' + e);
      alert('Exception while creating MediaRecorder: '
        + e + '. mimeType: ' + options.mimeType);
      return;
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(100);
    console.log('MediaRecorder started', mediaRecorder);
  }

  // Add methods to the model
  this.startRecording =  function () {
    recordedBlobs = [];
    self.status = "recording";
    console.log("Starting recording");
    eventObjects = [];
    if (useVideo) startVideoRecording();
    recStartTime = performance.now();
    if (midisystem.selectedMidiInput) midisystem.selectedMidiInput.onmidimessage = self.onMidiMessage; // attaches a listener to the midi input
    self.recording.notify();
  }

  this.stopRecording =  function () {
    console.log("Stopping recording");
    console.log("event objects", eventObjects)
    self.status = 'idle';
    self.idle.notify();
    if (midisystem.selectedMidiInput) midisystem.selectedMidiInput.onmidimessage = null;
//    midiOutput&&midiOutput.clear();
    reset = [176, 123, 0]; // resets midi devices. Kills stuck sounds, etc.
    setTimeout(function() {
      if (midisystem.selectedMidiOuput) {
        midisystem.selectedMidiOutput&&midisystem.selectedMidiOutput.send(reset)
      }
    }, 350);
    deltaSubtract = 0;
    if (useVideo) {
      try {
        // Revoke ObjectURL if one was created previously to free up memory
        console.log("Revoking URL", recordedVideo.src);
        URL.revokeObjectURL(recordedVideo.src);
      } catch (e) {
        console.log("error revoking URL", e);
      }
      mediaRecorder.stop();
      setTimeout(function() {
        console.log('Recorded Blobs: ', recordedBlobs);
        var superBuffer = new Blob(recordedBlobs, {type: "video/webm;codecs=vp9"});
        console.log(superBuffer.size);
        console.log(superBuffer.type);
        self.video = superBuffer;
        console.log(self.video.size);
        console.log(self.video.type);
        console.log('superbuffer', superBuffer);
        recordedVideo.src = window.URL.createObjectURL(superBuffer);
      }, 1000);

    }
  }

  this.stopPlaying = function() {
    console.log("Stopping playing");
    eventPointer = 0;
    deltaSubtract = 0;
    self.status = 'idle';
    self.idle.notify();
//    midiOutput&&midiOutput.clear();
    reset = [176, 123, 0]; // resets midi devices. Kills stuck sounds, etc.
    setTimeout(function() {
      if (midisystem.selectedMidiOutput) {
        midisystem.selectedMidiOutput&&midisystem.selectedMidiOutput.send(reset)
      }
    }, 350);
    window.cancelAnimationFrame(rAF);
    if (recordedBlobs.length) {
      recordedVideo.pause();
      recordedVideo.currentTime = 0;
    }
  }

  this.stopPlayingLoaded = function() {
    console.log("Stopping playing");
    eventPointer = 0;
    deltaSubtract = 0;
    self.status = 'idle';
    self.idle.notify();
//    midiOutput&&midiOutput.clear();
    reset = [176, 123, 0]; // resets midi devices. Kills stuck sounds, etc.
    setTimeout(function() {
      if (midisystem.selectedMidiOutput) {
        midisystem.selectedMidiOutput&&midisystem.selectedMidiOutput.send(reset)
      }
    }, 350);
    window.cancelAnimationFrame(rAF);
    loadedVideo.pause();
    loadedVideo.currentTime = 0;
  }

  this.playEvents =  function () {
    internalStop();
    console.log("Playing...");
    self.status = 'playing';
    var eventObjectsLength = eventObjects.length;
    startTime = performance.now(); // stores the moment when the player is started.
    self.playing.notify();
    if (recordedBlobs.length) console.log('video should play');
    if (recordedBlobs.length) recordedVideo.play();
    if (eventObjectsLength) {
      rAF = window.requestAnimationFrame(
        function queueEvents(timeStamp) {
        // This next 'while' schedules the events supposed to run only between NOW and 150 milliseconds later.
        // This is done so that the player
        // can be stopped or tempo can be changed.
        // see http://www.html5rocks.com/en/tutorials/audio/scheduling/
          while (eventPointer<eventObjectsLength && eventObjects[eventPointer].receivedTime - deltaSubtract < (timeStamp - startTime) + 150) {
            if (eventObjects[eventPointer].receivedTime - deltaSubtract >= 0) {
              midisystem.selectedMidiOutput&&midisystem.selectedMidiOutput.send(eventObjects[eventPointer].data, startTime+eventObjects[eventPointer].receivedTime - deltaSubtract);
            }
            eventPointer++;
          }
          if (eventPointer<eventObjectsLength) {
            rAF = window.requestAnimationFrame(queueEvents); // this runs the function queueEvents and sends a timestamp in microseconds as an argument.
          } else {
            self.stopPlaying();
          }
        }
      );
    }
  }

  //Same as above but for loaded video/midi
  this.playLoadedEvents =  function () {
    internalStop();
    console.log("Playing...");
    self.status = 'playing';
    var eventObjectsLength = eventObjects.length;
    startTime = performance.now(); // stores the moment when the player is started.
    self.playing.notify();
    console.log('video should play');
    loadedVideo.play();
    if (eventObjectsLength) {
      rAF = window.requestAnimationFrame(
        function queueEvents(timeStamp) {
        // This next 'while' schedules the events supposed to run only between NOW and 150 milliseconds later.
        // This is done so that the player
        // can be stopped or tempo can be changed.
        // see http://www.html5rocks.com/en/tutorials/audio/scheduling/
          while (eventPointer<eventObjectsLength && eventObjects[eventPointer].receivedTime - deltaSubtract < (timeStamp - startTime) + 150) {
            if (eventObjects[eventPointer].receivedTime - deltaSubtract >= 0) {
              midisystem.selectedMidiOutput&&midisystem.selectedMidiOutput.send(eventObjects[eventPointer].data, startTime+eventObjects[eventPointer].receivedTime - deltaSubtract);
            }
            eventPointer++;
          }
          if (eventPointer<eventObjectsLength) {
            rAF = window.requestAnimationFrame(queueEvents); // this runs the function queueEvents and sends a timestamp in microseconds as an argument.
          } else {
            self.stopPlaying();
          }
        }
      );
    }
  }

  function internalStop() {  // stop without triggering stop event
      window.cancelAnimationFrame(rAF);
      reset = [176, 123, 0];
      //midiOutput.clear();
      if (midisystem.selectedMidiOutput) {
        midisystem.selectedMidiOutput&&midisystem.selectedMidiOutput.send(reset);
      }
  }

  this.pause = function () {
    if (this.status == 'playing') {
      console.log("pause clicked")
      internalStop();
      deltaSubtract = deltaSubtract + performance.now() - startTime;
      loadedVideo.pause();
      this.status = 'paused';
      self.paused.notify();
      // "Rewind" pointer until the delta time smaller than deltaSubtract
      while (eventObjects[eventPointer].receivedTime >= deltaSubtract ) {
        eventPointer--;
      }
    }
  }

  this.onMidiMessage = function (receivedEvent) {
    if ((event.data[0] & 0xf0) != 0xF0) { // filter out undesirable messages, like clock or SysEx messages
      // console.log("midi", receivedEvent.data);
      eventObjects.push({data: receivedEvent.data, receivedTime: receivedEvent.timeStamp - recStartTime});
    }
  }

  this.prepareSong = function(title) {
    song = {
      info: {
         title: title,
          //description: description,
           date: new Date().toLocaleString(),
         },
         data: eventObjects,
    }
    return song;
  }

  this.openSong = function(song){
    eventObjects = [];
    // song is the Firebase database node that contains the data, date and title of the song to be opened
    for (var i=0; i<song.length; i++){
      eventObjects.push(song[i]);
    }
  }

  this.createMIDIfile = function(){
//    console.log(eventObjects);
    var myMFile = [], myMTrack = []
    myMFile = myMFile.concat(createMIDIheader()); // Add header to file
    var encodedTrackArray = encodeMIDIevents(); // Encode events
    myMTrack = createTrackheader(encodedTrackArray); // Add header to track, including length
    myMTrack = myMTrack.concat(encodedTrackArray); // concat track header and encoded events
    myMFile = myMFile.concat(createTempoTrack()); //add empty tempo track. All SMF type 1 need Track 1 as tempo track
    myMFile = myMFile.concat(myMTrack); // add track to file
    // console.log(myMFile);
    // Get ready to save!
    var data = new Uint8Array(myMFile); // create typed array
    var blob = new Blob( [data], { type: "application/x-midi"});  // create file/blob
    var blobURL = URL.createObjectURL(blob); // URL of blob
    var save = document.createElement('a'); // and save
    save.href = blobURL;
    save.download = 'bfile.mid';
    save.click();
    URL.revokeObjectURL(save.href);
  }

  function encodeMIDIevents(){  // encodes a MIDI file
    var track = [];
    var previousTime = 0.0;
    var delta;
    for (var i = 0; i<eventObjects.length; i++ ) {
      // Each midi clock is 2.6041 milliseconds at 120 quarter notes per minute, using 192 MIDI clocks per quarter note (500 ms / 192 = 2.6041 ms
      // per MIDI clock ).
      delta = Math.round((eventObjects[i].receivedTime - previousTime) / 2.6041); // delta time measured in number of MIDI clocks
      previousTime = eventObjects[i].receivedTime;

      // calculate Variable Length bytes. see http://www.ccarh.org/courses/253/handout/vlv/
      if(delta >>> 21) {
        track.push(((delta >>> 21) & 0x7F) | 0x80);
      }
      if(delta >>> 14) {
        track.push(((delta >>> 14) & 0x7F) | 0x80);
      }
      if(delta >>> 7) {
        track.push(((delta >>> 7) & 0x7F) | 0x80);
      }
      track.push((delta & 0x7F));

      if (eventObjects[i].data[0] != null) track.push(eventObjects[i].data[0]);
      if (eventObjects[i].data[1] != null) track.push(eventObjects[i].data[1]);
      if (eventObjects[i].data[2] != null) track.push(eventObjects[i].data[2]);
    }
    // Adding the track end event
    track.push(0x00); track.push(0xFF); track.push(0x2F); track.push(0x00);
    console.log(track);
    return track;
  }

  function createMIDIheader() {
    var chunkType = [77, 84, 104, 100]; // MThd
    var chunkLength = [0,0,0,6]; // 6 bytes
    var format = [0,1]; // SMF type 1 (multitrack)
    var ntrks = [0, 2]; // Two tracks - first track is an empty tempo track
    var division = [0, 192]; // 192 ticks per beat
    return chunkType.concat(chunkLength,format,ntrks,division);
  }

  function createTrackheader(track) {
    var chunkType = [77, 84, 114, 107 ]; // MTrk
    var chunkLength = extractFourBytes(track.length);
    return chunkType.concat(chunkLength)
  }

  function createTempoTrack() {
    return [77, 84, 114, 107, 0, 0, 0, 4, 0, 255, 47, 0]; // MTrk  plus other header bytes for an empty tempo track.
  }

  /*
   * Helper function
   * Returns an array of 4 bytes from the value passed
   */

  function extractFourBytes(dec) {
    var hexaValue = dec.toString(16);
    hexaValue = "00000000" + hexaValue;
    hexaValue = hexaValue.substring(hexaValue.length-8);
    // console.log(hexaValue);
    var a = [], num, theByte;
    for (i=0; i<8; i += 2) {
      theByte = hexaValue.substring(i, i+2);
      // console.log(theByte);
      num = parseInt(theByte,16);
      a.push(num);
    }
    // console.log(a)
    return a;
  }

}

/* ------------  View and Controller for player and recorder ----- */

function recorderViewController(model, target) {

  var constraints = {
    audio: true,
    video: {width: 320, height: 240},
  };

  var _target = target;
  var _model = model;

  target.find("*").off(); // disable previous listeners
  console.log("Adding listeners to ", target.attr('id'));

  model.idle.attach(function(){
    _target.find("#current-state").html("Idle");
    _target.find("#record").text("Rec").prop('disabled', false);
    _target.find("#play").text("Play").prop('disabled', false);
    _target.find("#pause").prop('disabled', true);
  });

  model.recording.attach(function(){
    _target.find("#current-state").html("Recording...");
    _target.find("#record").text("Stop").prop('disabled', false);
    _target.find("#play").prop('disabled', true);
    _target.find("#pause").prop('disabled', true);
  });

  model.playing.attach(function(){
    _target.find("#current-state").html("Playing...");
    _target.find("#play").text("Stop").prop('disabled', false);
    _target.find("#record").prop('disabled', true);
    _target.find("#pause").prop('disabled', false);
  });

  model.paused.attach(function() {
    _target.find("#play").text("Stop").prop('disabled', false);
    _target.find("#record").prop('disabled', true);
    _target.find("pause").prop('disabled', false);
    _target.find("#current-state").html("Paused");
  });

  target.find("#record").on('click', function() {
    if (_model.status == "recording") {
      _model.stopRecording();
    } else {
      _model.startRecording();
    }
  });

  target.find("#camera-switch").on("change", function() {toggleCamera(this);});

  target.find("#play").on("click", function(){
    if (_model.status == 'playing' || _model.status == 'paused') {
      _model.stopPlaying();
    } else {
      _model.playEvents();
    }
  });

  target.find("#playLoaded").on("click", function() {
    if (_model.status == 'playing' || _model.status == 'paused') {
      _model.stopPlayingLoaded();
    } else {
      _model.playLoadedEvents();
    }
  });

//  target.find('#encode').on("click", midiRecorderObject.createMIDIfile);

  target.find("#pause").on('click', function(checkboxtarget) {
    if (_model.status == 'playing') {
      console.log("pause");
      _model.pause();
    } else { // status is "paused"
      console.log('play after pause');
      _model.playEvents();
    }
  });

  target.find("#pauseLoaded").on('click', function(checkboxtarget) {
    if (_model.status == 'playing') {
      console.log("pause");
      _model.pause();
    } else {
      console.log('play after pause');
      _model.playLoadedEvents();
    }
  });

  target.find("#store").on('click', function() {
    if (_model.canStore == true) {
      console.log('model.canStore check');
      console.log("store button clicked");
      //Firebase storage variables and the postkey for midi to use for videos
      var databaseRef = firebase.database().ref();
      var userRef = firebase.database().ref(pathToUser);

      var numSongsExists;
      var numSongs;
      userRef.once('value').then(function(snapshot) {
        numSongsExists = snapshot.child('numSongs').exists();
        console.log('numSongsExists: ' + numSongsExists);
        if (!numSongsExists) {
          numSongs = 1;
        } else {
          numSongs = snapshot.child('numSongs').val();
          numSongs = numSongs + 1;
        }
      });

      // MDL dialog for song info
      var dialog = document.querySelector('dialog');
      dialog.showModal();
      /*if (! dialog.showModal) {
          dialogPolyfill.registerDialog(dialog);
        }*/
      dialog.querySelector('.close').addEventListener('click', function() {

        console.log(numSongs);
        userRef.child('numSongs').set(numSongs);

        var newPostKey = firebase.database().ref(pathToUserSongs).push(numSongs).key;
        var storageRef = firebase.storage().ref();
        console.log(_model.video.size);
        var blob = _model.video;
        console.log(blob.size);
        var ref = storageRef.child(pathToUser+'/videos/'+newPostKey);
        ref.put(blob).then(function(snapshot) {
          console.log('uploaded video');
        });

        var songTitle = dialog.querySelector('#songTitle').value;
        var song = _model.prepareSong(songTitle);
        var update = {};
        update[pathToSongData + '/' + newPostKey] = song.data;
        update[pathToSongInfo + '/' + newPostKey] = song.info;
        databaseRef.update(update).then(function () {
          console.log("Song saved");
        },
          function (error) {
            console.log("Error"+error.message)
          }
        );
        dialog.close();
      });
        /* Or dialog.show(); to show the dialog without a backdrop. */
      }
  });

  target.find("#load").on('click', function() {
    console.log("load button clicked");
    //if (_model.songID != songID.songid) {
      firebase.database().ref("songs/newPostKey").once('value').then(
        function(snapshot) {
          //console.log("Opening song "+songID.songid);
          _model.openSong(snapshot.val());
          //_model.songID = songID.songid;
          _model.playLoadedEvents();
        }
    );
    // Create a reference with an initial file path and name
    var storageRef = firebase.storage().ref();
    storageRef.child('testvideo').getDownloadURL().then(function(url) {
      loadedVideo.src = url;
    }).catch(function(error) {
      // Handle any errors
      console.log("Error: video download from firebase storage failed");
    });
  });

  var toggleCamera = function(checkboxtarget) {
    if(checkboxtarget.checked) {
      navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream) {
        console.log('getUserMedia() got stream: ', stream);
        window.stream = stream;
        gumVideo.src = window.URL.createObjectURL(stream);
        useVideo = true;
      })
      .catch(function(error){console.log("toggle camera error",error);});
    } else {
      window.stream.getTracks().forEach(function (track) {
        track.stop();
      });
      window.stream = null;
      useVideo = false;
      window.URL.revokeObjectURL(gumVideo.src);
      gumVideo.src = ''; // destroy previous src
    }
  }

  //recordedVideo.addEventListener('error', function(ev) {
  //  console.error('MediaRecording.recordedMedia.error()');
  //  alert('Your browser can not play\n\n' + recordedVideo.src
  //    + '\n\n media clip. event: ' + JSON.stringify(ev));
  //}, true);
}
