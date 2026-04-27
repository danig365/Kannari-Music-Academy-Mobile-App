import React from 'react'
import { View, Text, Image, StyleSheet, ScrollView, useWindowDimensions } from 'react-native'
import ab from './about.jpg'

const About = () => {
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isSmall = width < 380

  const features = [
    'Structured Learning Path',
    'Heart-Centered Mentorship',
    'Cultural Roots',
    'Global Perspective',
    'Technique + Expression',
    'Artist Confidence Building',
  ]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={[styles.innerContainer, isMobile && styles.innerContainerMobile]}>
        <View style={styles.storyCard}>
          <Image source={ab} style={[styles.image, isMobile && styles.imageMobile]} />

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, isSmall && styles.sectionTitleSmall]}>Our Story</Text>
            <Text style={[styles.heading, isMobile && styles.headingMobile, isSmall && styles.headingSmall]}>
              The Meaning Behind Kannari
            </Text>

            <Text style={[styles.paragraph, isSmall && styles.paragraphSmall]}>
              In Haitian culture, the kanari is a clay vessel trusted to keep water pure, cool, and life-giving.
            </Text>
            <Text style={[styles.paragraph, isSmall && styles.paragraphSmall]}>
              That image defines our academy. We pour musical knowledge with intention so every student is formed with
              discipline, technique, and authentic expression.
            </Text>
            <Text style={[styles.paragraph, styles.paragraphLast, isSmall && styles.paragraphSmall]}>
              The result is not just better musicianship, but confident artists who can carry creativity, culture,
              and purpose into the world.
            </Text>

            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <View key={feature} style={[styles.featurePill, isMobile && styles.featurePillMobile]}>
                  <Text style={styles.featureText}>• {feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  container: {
    paddingVertical: 28,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  innerContainerMobile: {
    paddingHorizontal: 14,
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e3e8f4',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },
  imageMobile: {
    height: 230,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1d63c8',
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionTitleSmall: {
    fontSize: 15,
  },
  heading: {
    fontSize: 38,
    lineHeight: 44,
    color: '#111827',
    fontWeight: '800',
    marginBottom: 12,
  },
  headingMobile: {
    fontSize: 32,
    lineHeight: 38,
  },
  headingSmall: {
    fontSize: 28,
    lineHeight: 34,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#344256',
    marginBottom: 12,
  },
  paragraphSmall: {
    fontSize: 15,
    lineHeight: 24,
  },
  paragraphLast: {
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  featurePill: {
    width: '49%',
    backgroundColor: '#edf4ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  featurePillMobile: {
    width: '100%',
  },
  featureText: {
    color: '#1d63c8',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
})

export default About
