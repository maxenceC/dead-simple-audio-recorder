(function() {
  $(document).ready(init);

  function init() {
    var audioRecorder = new AudioRecorder();

    $('#start-recording').on('click', function() {
      audioRecorder.startRecording();
    });

    $('#stop-recording').on('click', function() {
      audioRecorder.stopRecording('wav', 'wavFile');
    });
  }
})();