import getClientId from './getClientId';


const WEBSOCKET_BASE_URL = 'wss://home.vsionai.store'; // Replace with your IP or server
// const WEBSOCKET_BASE_URL = 'ws://192.168.213.215:8000';

let websocket: WebSocket | null = null;
let isConnected = false;
let onMessageCallback: ((data: any) => void) | null = null;
const reconnectInterval = 5000; // 5 seconds


type BBox = {
  bbox: [number, number, number, number] | null;
  speaker_id: string;
  frame_dim:[number, number] | null;
};

type WebSocketMessage = {
  frame_width: number;
  frame_height: number;
  transcription: {
    speaker_id: string;
    text: string;
    translation: string
  };
  image: string;
  bboxes: BBox[];
  type: string;
  message_id: string;
};
// Connect and handle WebSocket
export const connectWebSocket = async (onMessage: (data: WebSocketMessage) => void) => {

    const clientId = await getClientId();

    if (!clientId) {
    console.error("No client ID available for WebSocket connection");
    return;
  }
    console.log(`client-id: ${clientId}`)
    const websocketUrl = `${WEBSOCKET_BASE_URL}?client_id=${clientId}`;
    console.log(websocketUrl)

    websocket = new WebSocket(websocketUrl);

  websocket.onopen = () => {
    console.log('✅ WebSocket connected');
    isConnected = true;
  };

  websocket.onmessage = (e: MessageEvent<string>) => {
    try {
      const df: WebSocketMessage = JSON.parse(e.data);

      if (df.transcription) {
        console.log("📝 Text:", df.transcription.text);
      } else {
        console.warn("⚠️ No transcription found!");
      }

      if(df.message_id){
          console.log('Acknowledging message receipt ', df.message_id)
          sendAcknowledgement({
              type: "ack",
              message_id: df.message_id,
              timestamp: df.timestamp
              })

          }
      if (onMessageCallback) {
        onMessageCallback(df);
      }

    } catch (err) {
      console.error('❌ WS message parsing error:', err);
    }
  };

  websocket.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };

  websocket.onclose = (e) => {
    console.warn('🔌 WebSocket closed', e.reason || '(no reason)');
    isConnected = false;
    websocket = null;
    setTimeout(() => {
      console.log('🔁 Trying to reconnect WebSocket...');
      connectWebSocket(onMessageCallback!);
    }, reconnectInterval);
  };

  onMessageCallback = onMessage;
};

// Send audio/video payload
export const sendAudioVideo = (payload: any) => {
  if (isConnected && websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      websocket.send(JSON.stringify(payload));
      console.log('📤 Sent audio/video payload');
    } catch (e) {
      console.error('❌ Failed to send WebSocket message:', e);
    }
  } else {
    console.warn('⚠️ Cannot send, WebSocket not connected or not ready');
  }
};


export const sendAcknowledgement = (payload: any) => {
  if (isConnected && websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      websocket.send(JSON.stringify(payload));
      console.log('📤 Sent ack payload');
    } catch (e) {
      console.error('❌ Failed to send WebSocket message:', e);
    }
  } else {
    console.warn('⚠️ Cannot send, WebSocket not connected or not ready');
  }
};

    // Manually close WebSocket
    export const closeWebSocket = () => {
      if (websocket) {
        websocket.close();
      }
};
