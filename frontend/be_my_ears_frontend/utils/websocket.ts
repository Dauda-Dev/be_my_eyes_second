const WEBSOCKET_URL = 'ws://192.168.190.49:8765'; // Replace with your IP or server

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
  image: string

  bboxes: BBox[];
};
// Connect and handle WebSocket
export const connectWebSocket = (onMessage: (data: WebSocketMessage) => void) => {
  websocket = new WebSocket(WEBSOCKET_URL);

  websocket.onopen = () => {
    console.log('✅ WebSocket connected');
    isConnected = true;
  };

  websocket.onmessage = (e: MessageEvent<string>) => {
    try {
//       console.log("🛬 Raw incoming data:", e.data);

      const df: WebSocketMessage = JSON.parse(e.data);
//       console.log("✅ After parsing:", df);

      if (df.transcription) {
        console.log("📝 Text:", df.transcription.text);
      } else {
        console.warn("⚠️ No transcription found!");
      }

      // Dispatch to app callback
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

  // Save the callback for future messages
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

// Manually close WebSocket
export const closeWebSocket = () => {
  if (websocket) {
    websocket.close();
  }
};
