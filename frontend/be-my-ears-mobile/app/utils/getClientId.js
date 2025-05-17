import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

export async function getClientId() {
   try {
    let id = await AsyncStorage.getItem('client_id');
    if (!id) {
      id = uuid.v4();
     if (typeof id === 'string') { await AsyncStorage.setItem('client_id', id);}
    }
    return id;
  } catch (err) {
    console.error("Failed to get client ID:", err);
    return null;
  }
}


export function generateMessageId () {
  return uuid.v4();
}
