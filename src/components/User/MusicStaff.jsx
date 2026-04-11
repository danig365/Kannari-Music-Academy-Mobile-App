import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TREBLE_NOTE_MAP = {
  C4: 125, D4: 117.5, E4: 110, F4: 102.5, G4: 95,
  A4: 87.5, B4: 80, C5: 72.5, D5: 65, E5: 57.5,
  F5: 50, G5: 42.5, A5: 35,
  B3: 132.5, A3: 140,
};

const BASS_NOTE_MAP = {
  E2: 125, F2: 117.5, G2: 110, A2: 102.5, B2: 95,
  C3: 87.5, D3: 80, E3: 72.5, F3: 65, G3: 57.5,
  A3: 50, B3: 42.5, C4: 35,
  D2: 132.5, C2: 140,
};

function getLedgerLines(noteY, staffTop, staffBottom, spacing) {
  const lines = [];
  if (noteY >= staffBottom + spacing / 2) {
    for (let y = staffBottom + spacing; y <= noteY + spacing / 4; y += spacing) {
      lines.push(y);
    }
  }
  if (noteY <= staffTop - spacing / 2) {
    for (let y = staffTop - spacing; y >= noteY - spacing / 4; y -= spacing) {
      lines.push(y);
    }
  }
  return lines;
}

const MusicStaff = ({
  clef = 'treble',
  note = 'E4',
  highlight = null,
  width = 340,
  height = 180,
}) => {
  const staffTop = 50;
  const spacing = 15;
  const staffBottom = staffTop + 4 * spacing;
  const staffLeft = 70;
  const staffRight = width - 20;
  const noteX = width / 2 + 20;

  const noteMap = clef === 'bass' ? BASS_NOTE_MAP : TREBLE_NOTE_MAP;
  const noteY = noteMap[note] ?? 80;
  const ledgerLines = getLedgerLines(noteY, staffTop, staffBottom, spacing);

  let noteColor = '#222';
  if (highlight === 'correct') noteColor = '#22c55e';
  if (highlight === 'incorrect') noteColor = '#ef4444';

  const showUpStem = noteY >= 80;

  return (
    <View style={[styles.root, { width, height }]}>
      <View style={[styles.sheet, { width, height }]}>
        {[0, 1, 2, 3, 4].map((lineIndex) => (
          <View
            key={lineIndex}
            style={[
              styles.staffLine,
              {
                left: staffLeft,
                right: width - staffRight,
                top: staffTop + lineIndex * spacing,
              },
            ]}
          />
        ))}

        <Text
          style={[
            styles.clef,
            {
              left: staffLeft + 2,
              top: clef === 'treble' ? staffTop - 6 : staffTop + 2,
              fontSize: clef === 'treble' ? 58 : 50,
            },
          ]}
        >
          {clef === 'treble' ? '𝄞' : '𝄢'}
        </Text>

        {ledgerLines.map((ledgerY, index) => (
          <View
            key={`ledger-${index}`}
            style={[
              styles.ledgerLine,
              {
                left: noteX - 18,
                top: ledgerY,
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.noteHead,
            {
              left: noteX - 9,
              top: noteY - 6.5,
              borderColor: noteColor,
              backgroundColor: noteColor,
              transform: [{ rotate: '-15deg' }],
            },
          ]}
        />

        <View
          style={[
            styles.noteStem,
            {
              left: showUpStem ? noteX + 8 : noteX - 8,
              top: showUpStem ? noteY - 35 : noteY + 2,
              height: 33,
              backgroundColor: noteColor,
            },
          ]}
        />

        {!highlight ? (
          <Text style={[styles.questionMark, { left: noteX - 6, top: noteY < 80 ? noteY + 35 : noteY - 55 }]}>?</Text>
        ) : (
          <Text style={[styles.noteLabel, { left: noteX + 25, top: noteY - 2, color: noteColor }]}>{note}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  staffLine: {
    position: 'absolute',
    height: 1.2,
    backgroundColor: '#555',
  },
  clef: {
    position: 'absolute',
    color: '#333',
  },
  ledgerLine: {
    position: 'absolute',
    width: 36,
    height: 1,
    backgroundColor: '#555',
  },
  noteHead: {
    position: 'absolute',
    width: 18,
    height: 13,
    borderRadius: 8,
    borderWidth: 1,
  },
  noteStem: {
    position: 'absolute',
    width: 1.5,
  },
  questionMark: {
    position: 'absolute',
    fontSize: 20,
    color: '#f59e0b',
    fontWeight: '700',
    opacity: 0.8,
  },
  noteLabel: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MusicStaff;
