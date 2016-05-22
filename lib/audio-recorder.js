/**
 * Created by maxencecornet on 06/10/15.
 */

AudioRecorder = function () {
    this.mediaStream = null;
    this.rec = null;
};

AudioRecorder.prototype.startRecording = function () {
    var audioContext = this._setCompatibility();
    this._record(audioContext);
};

AudioRecorder.prototype.stopRecording = function (format, filename, callback) {
    var self = this;

    // stop the media stream -- mediaStream.stop() is deprecated since Chrome 45
    if (typeof(self.mediaStream.stop) === 'function') {
        self.mediaStream.stop();
    } else {
        self.mediaStream.getTracks()[0].stop();
    }

    // stop Recorder.js
    self.rec.stop();

    // export it to WAV or Uint8Array
    self.rec.exportWAV(function (e) {
        self.clear();

        if (format == 'wav') {
            Recorder.forceDownload(e, "" + filename + ".wav");
        } else if (format == 'Uint8Array') {
            self._convertToArrayBuffer(e, function (e) {
                var newFile = new Uint8Array(e.target.result);
                callback(null, newFile);

            });
        }
    });
};

AudioRecorder.prototype.clear = function () {
    this.rec.clear();
    this.mediaStream = null;
};

/*
 Private methods :
 */

AudioRecorder.prototype._setCompatibility = function () {
    var navigator = window.navigator;
    navigator.getUserMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
    );

    var Context = window.AudioContext || window.webkitAudioContext;
    var context = new Context();

    return context;
};

AudioRecorder.prototype._convertToArrayBuffer = function (file, callback) {
    var fileReader = new FileReader();
    fileReader.onloadend = callback;
    fileReader.readAsArrayBuffer(file);
};

AudioRecorder.prototype._record = function (context) {
    var self = this;
    // ask for permission and start recording
    console.log('1')
    navigator.getUserMedia({audio: true}, function (localMediaStream) {
        self.mediaStream = localMediaStream;

        console.log('2')

        // create a stream source to pass to Recorder.js
        var mediaStreamSource = context.createMediaStreamSource(localMediaStream);

        // create new instance of Recorder.js using the mediaStreamSource
        self.rec = new Recorder(mediaStreamSource);

        self.rec.record();
    }, function (err) {
        console.log('Browser not supported : ' + err);
    });
};


