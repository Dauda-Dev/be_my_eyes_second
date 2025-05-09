// utils/audio.js

import { Audio } from 'expo-av';
import { sendAudioData } from './websocket';

let recording = null;
let isRecording = false;

// Start audio recording
export const startRecording = async () => {
  try {
    await Audio.requestPermissionsAsync();
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = newRecording;
    await recording.startAsync(); // Start recording
    isRecording = true;
    console.log("🎤 Recording started...");
  } catch (error) {
    console.error("❌ Error starting recording:", error);
  }
};

// Stop audio recording and send audio data over WebSocket
export const stopRecording = async () => {
  if (!isRecording) return;

  try {
    await recording.stopAndUnloadAsync();
    const audioUri = recording.getURI();
    const audioBuffer = await fetch(audioUri).then((res) => res.arrayBuffer());

    // Send audio buffer over WebSocket
    sendAudioData(audioBuffer);
    console.log("📝 Audio sent to WebSocket");

    // Reset
    isRecording = false;
    recording = null;
  } catch (error) {
    console.error("❌ Error stopping recording:", error);
  }
};
