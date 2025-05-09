const colors = [
  '#FF6B6B', '#4ECDC4', '#FFD93D', '#3A86FF', '#FF9F1C', '#8338EC', '#FB5607'
];

export const getColorForSpeaker = (speakerId: string | number) => {
  const id = typeof speakerId === 'string' ? parseInt(speakerId.replace(/\D/g, ''), 10) : speakerId;
  return colors[id % colors.length];
};
