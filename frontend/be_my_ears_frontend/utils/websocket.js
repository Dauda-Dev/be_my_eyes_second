//const WEBSOCKET_URL = 'ws://192.168.113.49:8765';
//
//let websocket: WebSocket;
//let isConnected = false;
//let onMessageCallback: any = null;
//const reconnectInterval = 5000;
//
//export const connectWebSocket = (onMessage: (data: any) => void) => {
//  websocket = new WebSocket(WEBSOCKET_URL);
//
//  websocket.onopen = () => {
//    console.log('✅ WebSocket connected');
//    isConnected = true;
//  };
//
//  websocket.onmessage = (e) => {
//    try {
//      const df = JSON.parse(e.data);
//      onMessage(df);
//    } catch (err) {
//      console.error('❌ WS Parsing Error:', err);
//    }
//  };
//
//  websocket.onerror = (error) => {
//    console.error('❌ WebSocket error:', error);
//  };
//
//  websocket.onclose = (e) => {
//    console.warn('🔌 WebSocket closed', e);
//    isConnected = false;
//    setTimeout(() => connectWebSocket(onMessage), reconnectInterval);
//  };
//
//  onMessageCallback = onMessage;
//};
//
//export const sendAudioVideo = (payload: any) => {
//  if (isConnected && websocket.readyState === WebSocket.OPEN) {
//    websocket.send(JSON.stringify(payload));
//  } else {
//    console.warn('⚠️ Cannot send, WebSocket not connected');
//  }
//};
//
//export const closeWebSocket = () => {
//  if (websocket) websocket.close();
//};
