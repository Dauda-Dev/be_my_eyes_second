from groq import Groq
import asyncio
from dotenv import load_dotenv

load_dotenv()
client = Groq()



async def transcribe_audio(audio_path: str, lang: str = 'en') -> str:
    def sync_call():
        with open(audio_path, "rb") as file:
            return client.audio.transcriptions.create(
                file=("audio.wav", file.read()),
                model="whisper-large-v3-turbo",
                response_format="verbose_json",
                language=lang

            ).text

    return await asyncio.to_thread(sync_call)