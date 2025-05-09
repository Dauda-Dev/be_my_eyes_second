import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

export const requestPermissions = async () => {
  const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
  const { status: micStatus } = await Audio.requestPermissionsAsync();
  return camStatus === 'granted' && micStatus === 'granted';
};
