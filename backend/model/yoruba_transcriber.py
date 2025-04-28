import os
import torchaudio
import torch
from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq

# Load processor & model
processor = AutoProcessor.from_pretrained("ccibeekeoc42/whisper-small-yoruba-07-17")
model = AutoModelForSpeechSeq2Seq.from_pretrained("ccibeekeoc42/whisper-small-yoruba-07-17")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

def transcribe_and_translate(audio_path: str):
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"🚫 Audio file not found at {audio_path}")

    # Load and resample audio
    try:
        speech_array, sampling_rate = torchaudio.load(audio_path)
    except Exception as e:
        raise RuntimeError(f"❌ Failed to load audio: {e}")

    if sampling_rate != 16000:
        resampler = torchaudio.transforms.Resample(orig_freq=sampling_rate, new_freq=16000)
        speech_array = resampler(speech_array)

    # Prepare model input
    inputs = processor(
        speech_array[0],
        sampling_rate=16000,
        return_tensors="pt"
    )
    input_features = inputs.input_features.to(device)

    # 1️⃣ Transcription (Yoruba)
    decoder_ids_transcribe = processor.get_decoder_prompt_ids(language="yoruba", task="transcribe")
    with torch.no_grad():
        gen_ids_transcribe = model.generate(
            input_features,
            forced_decoder_ids=decoder_ids_transcribe
        )
    transcription = processor.batch_decode(gen_ids_transcribe, skip_special_tokens=True)[0]

    # 2️⃣ Translation (Yoruba → English)
    decoder_ids_translate = processor.get_decoder_prompt_ids(language="en", task="translate")
    with torch.no_grad():
        gen_ids_translate = model.generate(
            input_features,
            forced_decoder_ids=decoder_ids_translate
        )
    translation = processor.batch_decode(gen_ids_translate, skip_special_tokens=True)[0]

    return transcription, translation
