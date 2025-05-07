import React from 'react';
import { Text, StyleSheet, View, Dimensions } from 'react-native';
import { getColorForSpeaker } from '../utils/speakerColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Bbox = [number, number, number, number];
type FrameDim = [number, number];

interface SpeakerBox {
  speaker_id: string;
  bbox: Bbox | null;
  frame_dim: FrameDim | null;
}

interface CameraOverlayProps {
  bboxes: SpeakerBox[];
}

export default function CameraOverlay({ bboxes }: CameraOverlayProps) {
  if (!bboxes || bboxes.length === 0) return null;

  return (
    <>
      {bboxes.map(({ speaker_id, bbox, frame_dim }, index) => {
        if (!bbox || !frame_dim || frame_dim.length !== 2) return null;

        const [x1, y1, x2, y2] = bbox;
        const [frameH, frameW] = frame_dim;

        const FIXED_WIDTH = 150;
        const FIXED_HEIGHT = 150;

        const scaledX1 = x1  * SCREEN_WIDTH;
        const scaledY1 = y1  * SCREEN_HEIGHT;
        const scaledX2 = x2  * SCREEN_WIDTH;
        const scaledY2 = y2 * SCREEN_HEIGHT;

        const width = 50 + Math.random() * 100;
        const height = 50 + Math.random() * 100;


        const boxWidth = scaledX2 - scaledX1;
        const boxHeight = scaledY2 - scaledY1;
        const color = getColorForSpeaker(speaker_id);

        return (
          <View
            key={index}
            style={[
              styles.box,
              {
                left: scaledX1,
                top: scaledY1,
                width: FIXED_WIDTH,
                height: FIXED_HEIGHT,
                borderColor: color,
              },
            ]}
          >
             <Text style={[styles.label, { backgroundColor: color }]}>
                {speaker_id}
              </Text>
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 6,
    zIndex: 99,
  },
  label: {
    position: 'absolute',
    top: -20,
    left: 0,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
});
