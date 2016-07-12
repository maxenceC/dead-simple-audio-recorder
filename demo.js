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

/*
 Click Events
 */

(function () {
    $(document).ready(init);

    function init() {
        var audioRecorder = new AudioRecorder();

        $('#start-recording').on('click', function () {
            audioRecorder.startRecording();
        });

        $('#stop-recording').on('click', function () {
            audioRecorder.stopRecording('wav', 'wavFile');
        });
    }
})();


/*
 Recorder
 */

var WORKER_PATH = 'recorderWorker.js';

var Recorder = function (source, cfg) {
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    var numChannels = config.numChannels || 2;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
    this.context.createJavaScriptNode).call(this.context,
        bufferLen, numChannels, numChannels);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    worker.postMessage({
        command: 'init',
        config: {
            sampleRate: this.context.sampleRate,
            numChannels: numChannels
        }
    });
    var recording = false,
        currCallback;

    this.node.onaudioprocess = function (e) {
        if (!recording) return;
        var buffer = [];
        for (var channel = 0; channel < numChannels; channel++) {
            buffer.push(e.inputBuffer.getChannelData(channel));
        }
        worker.postMessage({
            command: 'record',
            buffer: buffer
        });
    };

    this.configure = function (cfg) {
        for (var prop in cfg) {
            if (cfg.hasOwnProperty(prop)) {
                config[prop] = cfg[prop];
            }
        }
    };

    this.record = function () {
        recording = true;
    };

    this.stop = function () {
        recording = false;
    };

    this.clear = function () {
        worker.postMessage({command: 'clear'});
    };

    this.getBuffer = function (cb) {
        currCallback = cb || config.callback;
        worker.postMessage({command: 'getBuffer'})
    };

    this.exportWAV = function (cb, type) {
        currCallback = cb || config.callback;
        type = type || config.type || 'audio/wav';
        if (!currCallback) throw new Error('Callback not set');
        worker.postMessage({
            command: 'exportWAV',
            type: type
        });
    };

    worker.onmessage = function (e) {
        var blob = e.data;
        currCallback(blob);
    };

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
};

Recorder.forceDownload = function (blob, filename) {
    console.log(blob)
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
};

window.Recorder = Recorder;



