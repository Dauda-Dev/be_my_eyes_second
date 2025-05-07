//import React, { useState, useEffect } from 'react';
//import { View, StyleSheet, StatusBar } from 'react-native';
//import CameraFeed from './components/CameraFeed';
//import CameraOverlay  from './components/Overlay';
//import TranscriptionBox from './components/TranscriptionBox';
//import { connectWebSocket } from './utils/websocket';
//import { connectMockWebSocket } from './utils/mockWebSocket';
//import { requestPermissions } from './utils/permissions';
//
//export default function App() {
//  const [bboxes, setBboxes] = useState([]); // array of { speaker_id, bbox: [x1, y1, x2, y2] }
//  const [transcriptions, setTranscriptions] = useState([]); // array of { speaker_id, text }
//
//  useEffect(() => {
//    (async () => {
//      const granted = await requestPermissions();
//      if (!granted) alert('Camera and mic required');
//    })();
//
//    connectWebSocket((data) => {
//    console.log("socket", data)
//      if (data.bboxes) setBboxes(data.bboxes); // array of { speaker_id, bbox }
//      if (data.transcription) {
//      console.log('check')
//        setTranscriptions((prev) => [...prev, data.transcription]); // { speaker_id, text }
//        }
//        console.log(data.transcription)
//    });
//
//// connectMockWebSocket((data) => {
//// console.log(data)
////    if (data.bboxes) setBboxes(data.bboxes);
////    if (data.transcription) {
////      setTranscriptions((prev) => [...prev, data.transcription]);
////    }
////  });
//  }, []);
//
//  return (
//    <View style={styles.container}>
//      <StatusBar hidden />
//      <CameraFeed />
//      <CameraOverlay bboxes={bboxes} />
//      <TranscriptionBox transcriptions={transcriptions} />
//    </View>
//  );
//}
//
//const styles = StyleSheet.create({
//  container: {
//    flex: 1,
//    backgroundColor: '#000',
//  },
//});


import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Button } from 'react-native';
import CameraFeed from './components/CameraFeed';
import CameraOverlay from './components/Overlay';
import TranscriptionBox from './components/TranscriptionBox';
import { connectWebSocket } from './utils/websocket';
import * as ScreenOrientation from 'expo-screen-orientation';
import TranscriptionFeed from './components/TranscriptionFeed';
import LanguageSelectorModal from './components/LanguageSelectorModal';

export default function App() {
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
    connectWebSocket((data) => {
      setMessageReceived(true);

//       if (data.bboxes) setBboxes(data.bboxes);

      if (data.transcription) {
        const entry = {
          speaker_id: data.transcription.speaker_id,
          text: data.transcription.text,
          translation: data.transcription.translate,
          timestamp: Date.now() / 1000,
          image: data.image, // if backend includes image base64
        };
        setTranscriptions((prev) => [...prev, entry]);
        setTimeout(() => setMessageReceived(false), 1000); // hide indicator after 1s
      }
  });

  }, []);

  useEffect(() => {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
}, []);


return (
  <View style={styles.container}>
//     <StatusBar />


      <LanguageSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleLanguageSelect}
      />
    <CameraFeed
      transcribeLang = {transcribeLang}
      translateLang = {translateLang}
      onLanguageSet={() => handleLanguageSelect}
      onRecordingStart={() => setIsRecording(true)}
      onRecordingStop={() => setIsRecording(false)}
      onSending={() => setIsSending(true)}
      onSent={() => setIsSending(false)}
    />
     <Button title="Select Languages" onPress={() => setModalVisible(true)} />
    <TranscriptionFeed
      entries={transcriptions}
      recording={isRecording}
      sending={isSending}
      received={messageReceived}
    />
  </View>
);

}


const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#000',
  },
});

