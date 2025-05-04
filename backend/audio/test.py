import librosa
import soundfile as sf

aac_path = 'C:/Users/dauda.dauda/AppData/Local/Temp/tmp_6tox7bf.aac'  # Replace with a real .aac file path
wav_path = 'test_output.wav'

try:
    # Try loading AAC audio
    audio, sr = librosa.load(aac_path, sr=16000, mono=True)
    print(f"✅ Successfully loaded AAC. Shape: {audio.shape}, Sample rate: {sr}")

    # Save to WAV for verification
    sf.write(wav_path, audio, samplerate=16000)
    print(f"✅ Successfully saved to WAV at: {wav_path}")

except Exception as e:
    print(f"❌ Librosa failed to decode AAC: {e}")
