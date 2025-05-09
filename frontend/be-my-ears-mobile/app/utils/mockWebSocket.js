export function connectMockWebSocket(onData) {
  const speakerIds = ['Speaker 1', 'Speaker 2', 'Speaker 3'];

  function randomBBox() {
    const x1 = Math.random() * 300;
    const y1 = Math.random() * 400;
    const width = 50 + Math.random() * 100;
    const height = 50 + Math.random() * 100;
    return [x1, y1, x1 + width, y1 + height];
  }

  function sendFakeData() {
    const speaker_id = speakerIds[Math.floor(Math.random() * speakerIds.length)];
    const text = `Hello from ${speaker_id} at ${new Date().toLocaleTimeString()}`;
    const bbox = randomBBox();

    onData({
      bboxes: [{ speaker_id, bbox }],
      transcription: { speaker_id, text },
    });
  }

  setInterval(sendFakeData, 2000); // Send fake data every 2 seconds
}
