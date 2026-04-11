import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const Stars = ({ stars }) => {
  const ratingStar = Array.from({ length: 5 }, (elm, index) => {
    let number = index + 0.5
    let starChar = '☆'
    let starStyle = styles.empty

    if (stars >= index + 1) {
      starChar = '★'
      starStyle = styles.filled
    } else if (stars >= number) {
      starChar = '★'
      starStyle = styles.half
    }

    return (
      <Text key={index} style={[styles.star, starStyle]}>
        {starChar}
      </Text>
    )
  })

  return <View style={styles.container}>{ratingStar}</View>
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 18,
    lineHeight: 24,
  },
  filled: {
    color: '#ffc107',
    fontWeight: '700',
  },
  half: {
    color: '#ffc107',
    fontWeight: '500',
    opacity: 0.65,
  },
  empty: {
    color: '#ffc107',
    opacity: 0.35,
  },
})

export default Stars
