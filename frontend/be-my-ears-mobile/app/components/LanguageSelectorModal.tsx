import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (transcribeLang: string, translateLang: string) => void;
};

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'Yoruba', code: 'yo' },
  { label: 'French', code: 'fr' },
  { label: 'Spanish', code: 'es' },
  { label: 'Igbo', code: 'ig' },
  { label: 'Hausa', code: 'ha' }
];

export default function LanguageSelectorModal({ visible, onClose, onSelect }: Props) {
  const [transcribe, setTranscribe] = React.useState('en');
  const [translate, setTranslate] = React.useState('en');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.heading}>Choose Languages</Text>

          <Text style={styles.label}>Transcription Language</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setTranscribe(item.code)}>
                <Text style={[styles.option, transcribe === item.code && styles.selected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          <Text style={styles.label}>Translation Language</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code + "_translate"}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setTranslate(item.label)}>
                <Text style={[styles.option, translate === item.label && styles.selected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.confirm} onPress={() => onSelect(transcribe, translate)}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#0009',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  option: {
    fontSize: 15,
    paddingVertical: 6,
  },
  selected: {
    color: 'blue',
    fontWeight: 'bold',
  },
  confirm: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancel: {
    textAlign: 'center',
    marginTop: 10,
    color: 'gray',
  },
});
