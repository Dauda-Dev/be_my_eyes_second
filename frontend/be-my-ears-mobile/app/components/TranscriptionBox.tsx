import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getColorForSpeaker } from '../utils/speakerColors';

export default function TranscriptionBox({ transcriptions }: { transcriptions: any[] }) {
  return (
    <View style={styles.container}>
  <ScrollView>
        {transcriptions.map(({ speaker_id, text, translation }, index) => (
          <Text key={index} style={styles.text}>
            <Text style={{ color: getColorForSpeaker(speaker_id), fontWeight: 'bold' }}>
              {speaker_id}:
            </Text>
             <Text>"Transcription: "{text} </Text>
               <Text>"Translation: " {translation}</Text>
          </Text>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backdropFilter: 'blur(10px)', // **GLASSMORPHIC EFFECT**
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 8,
    zIndex: 999,
    maxHeight: '100%',
  },
  text: {
    fontSize: 15,
    marginBottom: 10,
    color: '#eee',
  },
});
