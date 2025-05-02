from groq import Groq
import asyncio

client = Groq()

async def translate_text(text: str, lang = 'Yoruba') -> str:
    def sync_call():
        res = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[
                {"role": "system", "content": f"Translate this {lang} text to English."},
                {"role": "user", "content": text}
            ]
        )
        return res.choices[0].message.content.strip()

    return await asyncio.to_thread(sync_call)
