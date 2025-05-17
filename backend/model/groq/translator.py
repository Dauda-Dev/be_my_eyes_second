from groq import Groq
import asyncio

client = Groq()


async def translate_text(text: str, lang: str = 'English', lang_to_translate_to: str = 'English') -> str:
    def sync_call():
        res = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[
                {"role": "system", "content": f"Translate this {lang} text to {lang_to_translate_to}."},
                {"role": "user", "content": text}
            ]
        )
        return res.choices[0].message.content.strip()

    return await asyncio.to_thread(sync_call)


#  if the text to be translated from {lang} to {lang_to_translate_to} doesnt make sense or is incoherent, just return the word 'incoherent'