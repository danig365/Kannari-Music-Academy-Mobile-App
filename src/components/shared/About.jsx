import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import ab from './about.jpg'

const About = () => {
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.row}>
          <View style={styles.colLeft}>
            <View style={styles.imageWrapper}>
              <Image
                source={ab}
                style={styles.image}
              />
            </View>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.sectionTitle}>Our Story</Text>
            <Text style={styles.heading}>The Meaning Behind Kannari</Text>
            <Text style={styles.paragraph}>In Haitian culture, the kanari is a traditional clay vessel used to keep water fresh and pure. At Kannari Music Academy, we believe music should be preserved with the same care.</Text>
            <Text style={styles.paragraph}>We don't just teach notes. We pour discipline, expression, technique, confidence, and artistic identity into every student so they can carry inspiration, creativity, and light into the world.</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <View style={styles.featureCol}>
                  <Text style={styles.featureText}>→ Structured Learning</Text>
                </View>
                <View style={styles.featureCol}>
                  <Text style={styles.featureText}>→ Heart-Centered Teaching</Text>
                </View>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.featureCol}>
                  <Text style={styles.featureText}>→ Cultural Depth</Text>
                </View>
                <View style={styles.featureCol}>
                  <Text style={styles.featureText}>→ Global Reach</Text>
                </View>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.featureCol}>
                  <Text style={styles.featureText}>→ Technique + Expression</Text>
                </View>
                <View style={styles.featureCol}>
                  <Text style={styles.featureText}>→ Artistic Development</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  innerContainer: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  colLeft: {
    flex: 1,
  },
  colRight: {
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 10,
    paddingRight: 15,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    color: '#333',
  },
  featuresList: {
    marginTop: 16,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 16,
  },
  featureCol: {
    flex: 1,
  },
  featureText: {
    fontSize: 13,
    color: '#007bff',
    marginBottom: 8,
  },
})

export default About