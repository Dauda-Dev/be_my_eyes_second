import React, { useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import { View, ActivityIndicator, StyleSheet, Button, Text, TouchableOpacity, Slider,  Dimensions } from 'react-native';
import { sendAudioVideo } from '../utils/websocket';
import { generateMessageId } from '../utils/getClientId';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export default function CameraFeed({
  transcribeLang,
  translateLang,
  onRecordingStart,
  onRecordingStop,
  onSending,
  onSent,
  setPendingMessageId,
}: {
  transcribeLang: string;
  translateLang: string;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onSending: () => void;
  onSent: () => void;
  setPendingMessageId: (messageId: boolean) => void;
}) {
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const transcribeLangRef = useRef(transcribeLang);
  const translateLangRef = useRef(translateLang);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const monitorRef = useRef<NodeJS.Timeout | null>(null);
  const wasStoppedManuallyRef = useRef(false);
  

  useEffect(() => {
    transcribeLangRef.current = transcribeLang;
    translateLangRef.current = translateLang;
  }, [transcribeLang, translateLang]);

  const startCaptureLoop = () => {
    if (intervalRef.current) return;

    setIsBuffering(true);
    captureAndSend(); // First capture immediately

    intervalRef.current = setInterval(() => captureAndSend(), 5000);
  };

  const stopCaptureLoop = async () => {
    wasStoppedManuallyRef.current = true;
    setPendingMessageId(false); 

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }

    if (recordingRef.current) {
      try {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
          console.log("Recording stopped manually.");
        }
      } catch (e) {
        console.warn("Error stopping recording manually:", e);
      }
      recordingRef.current = null;
    }
  
    setIsRecording(false);
    onRecordingStop();
  };

  const captureAndSend = async () => {
    // if (!cameraRef.current) return;

    try {
      setIsBuffering(false);
      onRecordingStart();
      setIsRecording(true);

      const recording = new Audio.Recording();
      recordingRef.current = recording;


      await recording.prepareToRecordAsync({
        android: {
          extension: '.aac',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.aac',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        isMeteringEnabled: true
      });

      await recording.startAsync();

      monitorRef.current = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.metering) {
          setVolumeLevel(status.metering);
        }
      }, 500);

      await new Promise((res) => setTimeout(res, 4000));
      if(monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      onRecordingStop();

      // const photo = await cameraRef.current.takePictureAsync({
      //   base64: true,
      //   quality: 0.1,
      //   skipProcessing: true,
      // });

      if (wasStoppedManuallyRef.current) {
        wasStoppedManuallyRef.current = false;
        return;
      }

      const audioUri = recording.getURI();
      const audioBase64 = await fileToBase64(audioUri);

      
      const messageId = generateMessageId();
      setPendingMessageId(true);

      onSending();
      sendAudioVideo({
        message_id: messageId,
        type: 'audio_video',
        timestamp: Date.now() / 1000,
        // image: photo.base64,
        audio: audioBase64,
        // image_width: photo.width,
        // image_height: photo.height,
        transcribe_lang: transcribeLangRef.current,
        translate_lang: translateLangRef.current
  
      });
      onSent();

      recordingRef.current = null;
    } catch (err) {
      console.error('Capture/send error:', err);
      setIsRecording(false);
      onRecordingStop();
      // setIsBuffering(false);
      onSent();
      recordingRef.current = null;
    }
  };

  const fileToBase64 = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result?.split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.camera}>
     {/* <CameraView style={styles.camera} ref={cameraRef} facing={facing}> */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRecording ? styles.buttonStop : styles.buttonStart]}
          onPress={() => (isRecording ? stopCaptureLoop() : startCaptureLoop())}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.text}>
              {isRecording ? 'Stop' : 'Start'} Recording
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {isRecording && (
        <View style={styles.volumeMeterContainer}>
          <Text style={styles.text}>Mic Volume:</Text>
          <View style={styles.volumeBarWrapper}>
            <View style={[styles.volumeBar, { width: `${volumeLevel + 100}%` }]} />
          </View>
        </View>
      )}
    {/* </CameraView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 8,
  },
  buttonStart: {
    backgroundColor: 'green',
  },
  buttonStop: {
    backgroundColor: 'red',
  },
  text: {
    color: '#fff',
  },
  volumeMeterContainer: {
    // position: 'absolute',
    top: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
  volumeBarWrapper: {
    backgroundColor: '#333',
    height: 5,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 4,
  },
  volumeBar: {
    backgroundColor: '#0f2',
    height: '100%',
  },
});
