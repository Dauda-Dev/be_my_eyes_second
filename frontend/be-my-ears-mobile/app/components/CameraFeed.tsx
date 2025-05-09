import React, { useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import { View, ActivityIndicator, StyleSheet, Button, Text, TouchableOpacity } from 'react-native';
import { sendAudioVideo } from '../utils/websocket';

export default function CameraFeed({
  transcribeLang,
  translateLang,
  onRecordingStart,
  onRecordingStop,
  onSending,
  onSent
}: {
  transcribeLang: string;
  translateLang: string;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onSending: () => void;
  onSent: () => void;

    }) {
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  const transcribeLangRef = useRef(transcribeLang);
  const translateLangRef = useRef(translateLang);


  useEffect(() => {
    transcribeLangRef.current = transcribeLang;
    translateLangRef.current = translateLang;
  }, [transcribeLang, translateLang]);

  useEffect(() => {
    const interval = setInterval(() => captureAndSend(), 25000);
    return () => clearInterval(interval);
  }, []);



  const captureAndSend = async () => {
    if (!cameraRef.current) return;

    try{
        console.log('pef.......', transcribeLangRef.current, translateLangRef.current)
        onRecordingStart();


        const recording = new Audio.Recording();
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
        });

        await recording.startAsync();
        console.log('recording.......')
        await new Promise((res) => setTimeout(res, 20000));
        await recording.stopAndUnloadAsync();
        console.log('done.......')

        onRecordingStop();

        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.1,
          skipProcessing: true,
        });


        const audioUri = recording.getURI();
        const audioBase64 = await fileToBase64(audioUri);

        onSending();

        console.log('sending.......')
        sendAudioVideo({
          type: 'audio_video',
          timestamp: Date.now() / 1000,
          image: photo.base64,
          audio: audioBase64,
          image_width: photo.width,
          image_height: photo.height,
          transcribe_lang: transcribeLangRef.current,   // ✅ Use ref
          translate_lang: translateLangRef.current
        });

        onSent();

    }catch(err){
        console.error('Capture/send error:', err);
    onRecordingStop();
    onSent();
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
    <CameraView style={styles.camera} ref={cameraRef} facing={facing} >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
    </CameraView>
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
});
