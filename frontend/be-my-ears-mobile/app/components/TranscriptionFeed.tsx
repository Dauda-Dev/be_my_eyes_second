import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, Button, Dimensions, StyleSheet, TouchableOpacity, Modal, Image
} from 'react-native';
import { TypingIndicator } from './TypingIndicator';

import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import { sendAudioVideo } from '../utils/websocket';
import { generateMessageId } from '../utils/getClientId';

type TranscriptionEntry = {
  id: string;
  speaker_id: string;
  text: string;
  translation: string;
  timestamp: number;
  image?: string; // base64 image
};

interface Props {
  entries: TranscriptionEntry[];
  recording: boolean;
  sending: boolean;
  received: boolean;
  pendingMessage: boolean;
  transcribeLang: string;
  translateLang: string;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onSending: () => void;
  onSent: () => void;
  setPendingMessageId: (messageId: boolean) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export default function TranscriptionFeed({ entries, 
  recording, 
  sending, 
  received, 
  pendingMessage,
  transcribeLang,
  translateLang,
  onRecordingStart,
  onRecordingStop,
  onSending,
  onSent,
  setPendingMessageId

}: Props) {
  const [modalImage, setModalImage] = useState<string | null>(null);
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


  const renderItem = ({ item }: { item: TranscriptionEntry }) => (
    <View style={styles.item}>
      {/* <Text style={styles.speaker}>🎤 Speaker: {item.speaker_id}</Text> */}
      <Text style={styles.translation}> Transcription 📝:  {item.text}</Text>
      <Text style={styles.text}> Translation 🌍:  {item.translation}</Text>
      <Text style={styles.time}>🕐 {new Date(item.timestamp * 1000).toLocaleTimeString()}</Text>
      {item.image && (
        <TouchableOpacity onPress={() => setModalImage(item.image)}>
          <Text style={styles.viewImage}>🖼️ View Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={recording ? styles.active : styles.inactive}>🎙️ Recording</Text>
        <Text style={sending ? styles.active : styles.inactive}>📤 Sending</Text>
        <Text style={received ? styles.active : styles.inactive}>📥 Received</Text>
      </View>

      {/* Feed List */}
      <FlatList
        data={pendingMessage ? [...entries, {id: 'typing'}] : entries}
        keyExtractor={(_, i) => i.toString()}
        // renderItem={renderItem}
        renderItem={({item}) => 
        item.id ==='typing' ? ( <TypingIndicator />) : renderItem({item})
      }
        contentContainerStyle={{ paddingBottom: 80 }}
        
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRecording ? styles.buttonStop : styles.buttonStart]}
          onPress={() => (isRecording ? stopCaptureLoop() : startCaptureLoop())}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.text}>
              {isRecording ? 'Stop' : 'Start'}
            </Text>
          )}
        </TouchableOpacity>
      </View>


{/* {recording &&  (
  <View style={styles.typingContainer}>
    <Text style={styles.typingText}>Processing</Text>
    <Text style={styles.ellipsis}>...</Text>
  </View>
)} */}
      {/* Image Modal */}
      <Modal visible={!!modalImage} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setModalImage(null)} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          {modalImage && (
            <Image
              source={{ uri: `data:image/jpeg;base64,${modalImage}` }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 10,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  item: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  speaker: { fontSize: 14, color: '#ffd700', fontWeight: 'bold' },
  text: { fontSize: 14, color: '#fff', marginTop: 4 },
  translation: { fontSize: 14, color: '#ffd700', marginTop: 4 },
  time: { fontSize: 12, color: '#888', marginTop: 4 },
  viewImage: {
    marginTop: 8,
    color: '#00ffff',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  active: {
    color: '#0f0',
    fontWeight: 'bold',
  },
  inactive: {
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
  },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  image: {
    width: '90%',
    height: '80%',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  typingText: {
    fontSize: 16,
    color: '#00ffff',
    marginRight: 5,
  },
  ellipsis: {
    fontSize: 24,
    color: '#00ffff',
    fontWeight: 'bold',
    letterSpacing: 2,
    animation: 'blink 1s infinite',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    padding: 30,
    backgroundColor: '#444',
    borderRadius: 100,
    shadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  buttonStart: {
    backgroundColor: 'green',
  },
  buttonStop: {
    backgroundColor: 'red',
  },
});
