import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NOTE_SYMBOLS = {
  quarter: { label: '♩' },
  eighth: { label: '♪' },
  half: { label: '𝅗𝅥' },
  whole: { label: '𝅝' },
  dotted_quarter: { label: '♩·' },
};

const RhythmTimeline = ({
  noteTypes = [],
  expectedTimestamps = [],
  taps = [],
  toleranceMs = 130,
  totalDurationMs = null,
  playheadMs = null,
  phase = 'idle',
  width = 600,
  height = 160,
}) => {
  const padL = 50;
  const padR = 30;
  const trackWidth = width - padL - padR;
  const trackY = 80;

  const duration = totalDurationMs || (expectedTimestamps.length > 0
    ? Math.max(...expectedTimestamps) + 800
    : 4000);

  const msToX = (ms) => padL + (ms / duration) * trackWidth;

  const tapResults = useMemo(() => expectedTimestamps.map((exp) => {
    if (!taps.length) return 'miss';
    const closest = taps.reduce((best, tap) => {
      const bestDelta = Math.abs(best - exp);
      const tapDelta = Math.abs(tap - exp);
      return tapDelta < bestDelta ? tap : best;
    }, taps[0]);
    const delta = Math.abs(closest - exp);
    if (delta <= toleranceMs * 0.4) return 'perfect';
    if (delta <= toleranceMs) return 'good';
    return 'miss';
  }), [expectedTimestamps, taps, toleranceMs]);

  return (
    <View style={[styles.root, { width, height }]}> 
      <View style={[styles.bg, { width, height }]}>
        <View style={[styles.trackLine, { left: padL, right: padR, top: trackY }]} />

        {expectedTimestamps.map((ts, index) => {
          const x = msToX(ts);
          const noteType = noteTypes[index] || 'quarter';
          const noteInfo = NOTE_SYMBOLS[noteType] || NOTE_SYMBOLS.quarter;
          const result = tapResults[index];

          const resultColor = phase === 'result'
            ? (result === 'perfect' ? '#22c55e' : result === 'good' ? '#f59e0b' : '#ef4444')
            : '#94a3b8';

          return (
            <View key={`beat-${index}`} style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <View style={[styles.tick, { left: x - 0.5, top: trackY - 18, backgroundColor: resultColor }]} />
              <View
                style={[
                  styles.beatDot,
                  {
                    left: x - 10,
                    top: trackY - 10,
                    borderColor: resultColor,
                    backgroundColor: phase === 'result' ? resultColor : '#e2e8f0',
                  },
                ]}
              />
              <Text style={[styles.noteType, { left: x - 14, top: trackY - 42, color: resultColor }]}>{noteInfo.label}</Text>
              <Text style={[styles.beatNo, { left: x - 7, top: trackY + 26 }]}>{index + 1}</Text>

              {phase === 'result' ? (
                <Text style={[styles.resultLabel, { left: x - 30, top: trackY + 40, color: resultColor }]}>
                  {result === 'perfect' ? '✓ Perfect' : result === 'good' ? '~ Good' : '✗ Miss'}
                </Text>
              ) : null}
            </View>
          );
        })}

        {taps.map((tap, index) => {
          const x = msToX(tap);
          return (
            <View key={`tap-${index}`} style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <View style={[styles.tapDot, { left: x - 5, top: trackY - 5 }]} />
              <View style={[styles.tapRing, { left: x - 8, top: trackY - 8 }]} />
            </View>
          );
        })}

        {playheadMs !== null && phase !== 'result' ? (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={[styles.playhead, { left: msToX(playheadMs), top: trackY - 30 }]} />
            <Text style={[styles.playheadMarker, { left: msToX(playheadMs) - 5, top: trackY - 42 }]}>▼</Text>
          </View>
        ) : null}

        <Text style={styles.leftLabel}>Timeline</Text>
        <Text style={styles.rightLabel}>{(duration / 1000).toFixed(1)}s</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bg: {
    borderRadius: 12,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#475569',
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 36,
    opacity: 0.45,
  },
  beatDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  noteType: {
    position: 'absolute',
    width: 28,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'serif',
  },
  beatNo: {
    position: 'absolute',
    width: 14,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
  },
  resultLabel: {
    position: 'absolute',
    width: 60,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
  },
  tapDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
    opacity: 0.85,
  },
  tapRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
    opacity: 0.4,
  },
  playhead: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: '#38bdf8',
    opacity: 0.9,
  },
  playheadMarker: {
    position: 'absolute',
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  leftLabel: {
    position: 'absolute',
    left: 12,
    top: 10,
    color: '#64748b',
    fontSize: 11,
  },
  rightLabel: {
    position: 'absolute',
    right: 12,
    top: 10,
    color: '#64748b',
    fontSize: 11,
  },
});

export default RhythmTimeline;
