# import numpy as np
# import torch
# import torchaudio
# import scipy.signal
# from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
#
# # 🧠 Load fine-tuned Whisper model
# processor = AutoProcessor.from_pretrained("ccibeekeoc42/whisper-small-yoruba-07-17")
# model = AutoModelForSpeechSeq2Seq.from_pretrained("ccibeekeoc42/whisper-small-yoruba-07-17")
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# model.to(device)
#
# def denoise_audio(audio_np: np.ndarray, sr: int = 16000) -> np.ndarray:
#     """
#     Apply simple lowpass filter to remove high-frequency noise.
#     """
#     b, a = scipy.signal.butter(6, 3000 / (sr / 2), btype='low')
#     cleaned = scipy.signal.lfilter(b, a, audio_np)
#     return cleaned
#
# def normalize_audio(audio_np: np.ndarray) -> np.ndarray:
#     """
#     Normalize audio to -1.0 to 1.0 range.
#     """
#     audio_np = audio_np - np.mean(audio_np)  # Remove DC offset
#     max_val = np.max(np.abs(audio_np))
#     if max_val > 0:
#         audio_np = audio_np / max_val
#     return audio_np
#
# def preprocess_audio(audio_path: str) -> np.ndarray:
#     """
#     Load, resample to 16kHz mono, denoise, and normalize the audio.
#     """
#     waveform, sr = torchaudio.load(audio_path)
#     if sr != 16000:
#         resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)
#         waveform = resampler(waveform)
#     audio_np = waveform.squeeze().numpy()
#
#     # 🚿 Clean the audio
#     audio_np = denoise_audio(audio_np)
#     audio_np = normalize_audio(audio_np)
#     return torch.tensor(audio_np).unsqueeze(0)
#
#
#
# def is_valid_audio(audio_path):
#     try:
#         waveform, sr = torchaudio.load(audio_path)
#         if sr != 16000:
#             return False  # wrong sample rate
#
#         duration = waveform.size(1) / sr  # frames / sample rate = seconds
#         if duration < 0.5:
#             return False  # too short
#
#         energy = torch.mean(torch.abs(waveform))
#         if energy < 0.001:
#             return False  # too silent
#
#         return True
#
#     except Exception as e:
#         print(f"Audio validation failed: {e}")
#         return False
#
#
#
# def transcribe_and_translate(audio_path: str):
#     """
#     Clean input, transcribe in Yoruba, and translate to English.
#     """
#     if not is_valid_audio(audio_path):
#         return "Invalid or empty audio.", "Invalid audio."
#
#     cleaned_audio = preprocess_audio(audio_path)
#
#     inputs = processor(
#         cleaned_audio.squeeze(0),
#         sampling_rate=16000,
#         return_tensors="pt"
#     )
#     input_features = inputs.input_features.to(device)
#
#     # 1️⃣ Yoruba transcription
#     decoder_ids_transcribe = processor.get_decoder_prompt_ids(language="yoruba", task="transcribe")
#     with torch.no_grad():
#         gen_ids_transcribe = model.generate(
#             input_features,
#             forced_decoder_ids=decoder_ids_transcribe
#         )
#     transcription = processor.batch_decode(gen_ids_transcribe, skip_special_tokens=True)[0]
#
#     # 2️⃣ Yoruba ➔ English translation
#     decoder_ids_translate = processor.get_decoder_prompt_ids(language="en", task="translate")
#     with torch.no_grad():
#         gen_ids_translate = model.generate(
#             input_features,
#             forced_decoder_ids=decoder_ids_translate
#         )
#     translation = processor.batch_decode(gen_ids_translate, skip_special_tokens=True)[0]
#     print(f'transcript: {transcription}  translation: {translation}')
#     return transcription, translation


# backend/model/yoruba_transcriber.py
#
# import torch
# import torchaudio
# import torchaudio.transforms as T
# from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
#
# # 1. Load your fine-tuned model and processor
# processor = AutoProcessor.from_pretrained("ccibeekeoc42/whisper-small-yoruba-07-17")
# model = AutoModelForSpeechSeq2Seq.from_pretrained("ccibeekeoc42/whisper-small-yoruba-07-17")
#
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# model = model.to(device)
#
#
# # 2. Preprocessing function
# def preprocess_audio(audio_path: str):
#     waveform, sr = torchaudio.load(audio_path)
#
#     # Ensure mono (single channel)
#     if waveform.shape[0] > 1:
#         waveform = torch.mean(waveform, dim=0, keepdim=True)
#
#     # Resample if needed
#     if sr != 16000:
#         resampler = T.Resample(orig_freq=sr, new_freq=16000)
#         waveform = resampler(waveform)
#
#     # Normalize volume
#     waveform = waveform / waveform.abs().max()
#
#     return waveform, 16000
#
#
# # 3. Final transcription + translation
# def transcribe_and_translate(audio_path: str):
#     waveform, sampling_rate = preprocess_audio(audio_path)
#
#     inputs = processor(
#         waveform.squeeze(0),
#         sampling_rate=sampling_rate,
#         return_tensors="pt"
#     )
#
#     input_features = inputs.input_features.to(device)
#     attention_mask = inputs.get("attention_mask", None)
#     if attention_mask is not None:
#         attention_mask = attention_mask.to(device)
#
#     # 📝 Transcription (in Yoruba)
#     decoder_ids_transcribe = processor.get_decoder_prompt_ids(language="yoruba", task="transcribe")
#     with torch.no_grad():
#         gen_ids_transcribe = model.generate(
#             input_features,
#             attention_mask=attention_mask,
#             forced_decoder_ids=decoder_ids_transcribe
#         )
#     transcription = processor.batch_decode(gen_ids_transcribe, skip_special_tokens=True)[0]
#
#     # 🌍 Translation (to English)
#     decoder_ids_translate = processor.get_decoder_prompt_ids(language="en", task="translate")
#     with torch.no_grad():
#         gen_ids_translate = model.generate(
#             input_features,
#             attention_mask=attention_mask,
#             forced_decoder_ids=decoder_ids_translate
#         )
#     translation = processor.batch_decode(gen_ids_translate, skip_special_tokens=True)[0]
#
#     return transcription, translation



# backend/model/openai_whisper_transcriber.py

import whisper
import torch
import numpy as np
import torchaudio
import torchaudio.transforms as T

# 1. Load OpenAI Whisper model
model = whisper.load_model("base")  # You can use "base", "small", "medium", etc.
def preprocess_audio(audio_path: str):
    # Read as raw 16-bit PCM manually
    with open(audio_path, "rb") as f:
        pcm_data = f.read()

    # Convert bytes to numpy array
    audio_np = np.frombuffer(pcm_data, dtype=np.int16).astype(np.float32) / 32768.0  # normalize to [-1, 1]

    # Convert to torch tensor
    waveform = torch.from_numpy(audio_np).unsqueeze(0)  # shape (1, num_samples)

    return waveform, 16000  # now sample_rate = 16000 because frontend records at 16kHz



def transcribe_and_translate(audio_path: str):
    # 🛑 DO NOT preprocess manually if you use whisper model.transcribe()

    # Let whisper load internally
    result = model.transcribe(audio_path, language="yoruba", task="transcribe")
    transcription = result["text"]

    # Then for translation (optional step)
    # Since OpenAI Whisper doesn't do Yoruba-to-English translation separately,
    # You can either load another model or use prompt injection.

    return transcription, None  # or just return transcription
