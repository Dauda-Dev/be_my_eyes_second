import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Image
} from 'react-native';
import { TypingIndicator } from './TypingIndicator';

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
}

export default function TranscriptionFeed({ entries, recording, sending, received, pendingMessage }: Props) {
  const [modalImage, setModalImage] = useState<string | null>(null);

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
});
