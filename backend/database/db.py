import asyncpg
import os

DB_URL = os.getenv("DATABASE_URL", "postgresql://myuser:mypassword@localhost:5433/bme_db")

async def get_connection():
    return await asyncpg.connect(DB_URL)

async def save_message(client_id, message_dict, message_id):
    print('saving info')
    conn = await get_connection()
    try:
        await conn.execute(
            "INSERT INTO messages (client_id, message_id, message) VALUES ($1, $2, $3)",
            client_id,
            message_id,
            message_dict
        )
    finally:
        await conn.close()


async def get_unacknowledged_messages(client_id):
    conn = await get_connection()
    try:
        return await conn.fetch(
            """
            SELECT message FROM messages
            WHERE acknowledged = FALSE
              AND client_id = $1
              AND created_at > NOW() - INTERVAL '1 hour'
            """,
            client_id
        )
    finally:
        await conn.close()



async def acknowledge_message(client_id: str, message_id: str):
    conn = await get_connection()
    try:
        await conn.execute(
            """
            UPDATE messages
            SET acknowledged = TRUE
            WHERE message_id = $1 AND client_id = $2
            """,
            message_id, client_id
        )
    finally:
        await conn.close()
