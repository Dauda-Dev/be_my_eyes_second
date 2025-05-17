import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

export const TypingIndicator = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.typingBubble}>
      <Text style={styles.typingText}>Transcribing{dots}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  typingBubble: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  typingText: {
    color: '#ccc',
    fontStyle: 'italic',
  },
});
