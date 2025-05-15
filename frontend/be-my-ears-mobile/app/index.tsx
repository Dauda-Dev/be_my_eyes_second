import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Button } from 'react-native';
import CameraFeed from './components/CameraFeed';
import CameraOverlay from './components/Overlay';
import TranscriptionBox from './components/TranscriptionBox';
import { connectWebSocket } from './utils/websocket';
import * as ScreenOrientation from 'expo-screen-orientation';
import TranscriptionFeed from './components/TranscriptionFeed';
import LanguageSelectorModal from './components/LanguageSelectorModal';
import { requestPermissions } from './utils/permissions';

export default function Index() {
  const [bboxes, setBboxes] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageReceived, setMessageReceived] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [transcribeLang, setTranscribeLang] = useState('en');
  const [translateLang, setTranslateLang] = useState('English');

  const handleLanguageSelect = (transcribe: string, translate: string) => {
    console.log("selected languages: ", transcribe, translate)
    setTranscribeLang(transcribe);
    setTranslateLang(translate);
    setModalVisible(false);
  };





  useEffect(() => {

     (async () => {
        const granted = await requestPermissions();
        if (!granted){
         alert('Camera and mic required');
         return;
         }

    connectWebSocket((data) => {
      setMessageReceived(true);

      if (data.transcription) {
        const entry = {
          speaker_id: data.transcription.speaker_id,
          text: data.transcription.text,
          translation: data.transcription.translation,
          timestamp: Date.now() / 1000,
          image: data.image, // if backend includes image base64
        };
        setTranscriptions((prev) => [...prev, entry]);
        setTimeout(() => setMessageReceived(false), 1000); // hide indicator after 1s
      }
  });
 })();

}, []);

  useEffect(() => {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
}, []);


return (
  <View style={styles.container}>
  <StatusBar />

      <LanguageSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleLanguageSelect}
      />
    <View style={styles.cameraContainer}>
    <CameraFeed
      transcribeLang = {transcribeLang}
      translateLang = {translateLang}
      onLanguageSet={() => handleLanguageSelect}
      onRecordingStart={() => setIsRecording(true)}
      onRecordingStop={() => setIsRecording(false)}
      onSending={() => setIsSending(true)}
      onSent={() => setIsSending(false)}
    />
    </View>
     
    <Button title="Select Languages" onPress={() => setModalVisible(true)} />
    <View style={styles.transcriptionContainer}>
        <TranscriptionFeed
          entries={transcriptions}
          recording={isRecording}
          sending={isSending}
          received={messageReceived}
        />
    </View>
  </View>
);

}


const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#000',
  },
  transcriptionContainer: {
    flex: 6, // Increase this to give it more vertical space
  },
  cameraContainer: {
    flex: 1.5
  }
});

