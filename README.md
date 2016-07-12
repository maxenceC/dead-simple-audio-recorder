# audio-recorder

Record audio input from the user microphone, export to .wav or ArrayBuffer

## Methods



AudioRecorder has 2 public methods : ```startRecording()``` and ```stopRecording(format, filename, callback)```.

startRecording is synchronous and doesnt take any arguments.

stopRecording format argument accept 2 formats : 'wav' or 'Uint8Array', the first one must be called synchonously, the second one is async.
 


## Usage
```javascript
var audioRecorder = new AudioRecorder();

audioRecorder.startRecording();

//Sync usage with .wav
audioRecorder.stopRecording('wav', 'wavFile');

// Async usage with ArrayBuffer
audioRecorder.stopRecording('Uint8Array', 'ArrayBufferFile', function (error, result) {
    // result contains the audio file input Array buffer
});
```

## <a name="dependencies"></a> Dependencies

* Audio recording:
  * [mattdiamond/Recorderjs](https://github.com/mattdiamond/Recorderjs)




