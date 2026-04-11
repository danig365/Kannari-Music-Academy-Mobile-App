import React, { useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Video } from 'expo-av'
import wave from './darkside.mp4'
import ab from './about.jpg'
import Header from '../Header'

const DIFFERENTIATORS = [
  {
    title: 'Structured Learning',
    description: 'Clear curriculum. Real progress. No guesswork.'
  },
  {
    title: 'Heart-Centered Teaching',
    description: 'Music from the heart, not just theory.'
  },
  {
    title: 'Cultural Depth, Global Reach',
    description: 'Rooted in heritage. Designed for the modern musician.'
  },
  {
    title: 'Real Artistic Development',
    description: 'Technique, creativity, performance confidence.'
  }
]

const PROGRAMS = [
  'Beginner Foundations',
  'Intermediate Development',
  'Advanced Performance Training',
  'Instrument-Specific Courses',
  'Live Sessions & Feedback',
  'Youth & Adult Tracks'
]

const FOOTER_LINKS = [
  { label: 'Home', screen: 'Home' },
  { label: 'Our Story', screen: 'About' },
  { label: 'Explore Courses', screen: 'AllCourses' },
  { label: 'FAQs & Help', screen: 'Faq' },
  { label: 'Privacy & Terms', screen: 'Policy' },
]

const Home = () => {
  const navigation = useNavigation()
  const scrollRef = useRef(null)
  const { width } = useWindowDimensions()

  const [showBackToTop, setShowBackToTop] = useState(false)

  const isSmall = width < 360
  const isTablet = width >= 768
  const contentMaxWidth = isTablet ? 760 : 680

  const spacing = useMemo(() => {
    if (width >= 1024) return { section: 88, horizontal: 40 }
    if (width >= 768) return { section: 72, horizontal: 28 }
    if (width < 360) return { section: 56, horizontal: 16 }
    return { section: 64, horizontal: 20 }
  }, [width])

  const handleNavigate = (screen) => {
    try {
      navigation.navigate(screen)
    } catch (error) {
      console.log(`Navigation target not found: ${screen}`)
    }
  }

  return (
    <View style={styles.safeArea}>
      <Header />

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => setShowBackToTop(event.nativeEvent.contentOffset.y > 360)}
        scrollEventThrottle={16}
      >
        <View style={[styles.heroSection, { minHeight: isTablet ? 640 : 540 }]}>
          <Video
            source={wave}
            style={styles.videoBackground}
            resizeMode="cover"
            shouldPlay
            isLooping
            isMuted
          />
          <View style={styles.heroOverlay} />

          <View style={[styles.heroContent, { paddingHorizontal: spacing.horizontal }]}> 
            <Text style={[styles.heroSmallTitle, isSmall && styles.heroSmallTitleSmall]}>KANNARI MUSIC ACADEMY</Text>
            <Text style={[styles.heroMainTitle, isSmall && styles.heroMainTitleSmall]}>
              Music Poured with Purpose.
            </Text>
            <Text style={[styles.heroDescription, isSmall && styles.heroDescriptionSmall]}>
              Structured Online Music Education for the Modern Musician. Inspired by the Haitian kanari - a vessel that preserves
              fresh water - Kannari Music Academy pours structured musical knowledge into every student, empowering them to share
              fresh sound with the world.
            </Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.buttonPrimary} onPress={() => handleNavigate('StudentRegister')}>
                <Text style={[styles.buttonPrimaryText, isSmall && styles.buttonTextSmall]}>Start Learning Today</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.buttonSecondary} onPress={() => handleNavigate('AllCourses')}>
                <Text style={[styles.buttonSecondaryText, isSmall && styles.buttonTextSmall]}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.storySection, { paddingVertical: spacing.section, paddingHorizontal: spacing.horizontal }]}>
          <View style={[styles.storyInner, { maxWidth: contentMaxWidth }]}> 
            <Image source={ab} style={styles.storyImage} />

            <View style={styles.storyContent}>
              <View style={styles.storyBadge}>
                <Text style={styles.storyBadgeText}>OUR STORY</Text>
              </View>

              <Text style={[styles.storyTitle, isSmall && styles.storyTitleSmall]}>The Meaning Behind Kannari</Text>

              <Text style={styles.storyParagraph}>
                In Haitian culture, the kanari is a traditional clay vessel used to keep water fresh and pure.
              </Text>
              <Text style={styles.storyParagraph}>
                At Kannari Music Academy, we believe music should be preserved with the same care.
              </Text>
              <Text style={styles.storyParagraph}>
                We do not just teach notes. We pour discipline, expression, technique, confidence, and artistic identity into every
                student.
              </Text>
              <Text style={[styles.storyParagraph, styles.storyParagraphLast]}>
                Once filled, they carry that music into the world - distributing inspiration, creativity, and light.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.differencesSection, { paddingVertical: spacing.section, paddingHorizontal: spacing.horizontal }]}> 
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}> 
            <Text style={[styles.sectionTitle, isSmall && styles.sectionTitleSmall]}>What Makes Us Different</Text>
            <Text style={styles.sectionSubtitle}>Structured Online Music Education for the Modern Musician.</Text>

            {DIFFERENTIATORS.map((item) => (
              <View key={item.title} style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>{item.title}</Text>
                <Text style={styles.infoCardDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.programsSection, { paddingVertical: spacing.section, paddingHorizontal: spacing.horizontal }]}>
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}> 
            <Text style={[styles.sectionTitle, isSmall && styles.sectionTitleSmall]}>Our Programs</Text>

            {PROGRAMS.map((program) => (
              <View key={program} style={styles.programCard}>
                <Text style={styles.programCardText}>{program}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.viewAllButton} onPress={() => handleNavigate('AllCourses')}>
              <Text style={styles.viewAllButtonText}>View All Courses</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.missionSection, { paddingVertical: spacing.section, paddingHorizontal: spacing.horizontal }]}>
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}> 
            <Text style={[styles.missionTitle, isSmall && styles.sectionTitleSmall]}>Our Mission</Text>
            <Text style={[styles.missionSubtitle, isSmall && styles.missionSubtitleSmall]}>
              Music from the heart. Music that inspires. Music that grows.
            </Text>
            <Text style={styles.missionDescription}>
              Kannari Music Academy exists to develop musicians who are grounded in technique, rich in expression, and prepared to
              share their sound globally.
            </Text>
          </View>
        </View>

        <View style={[styles.footerSection, { paddingHorizontal: spacing.horizontal, paddingTop: spacing.section - 8, paddingBottom: 36 }]}> 
          <View style={[styles.sectionInner, { maxWidth: contentMaxWidth }]}> 
            <View style={styles.footerBrandRow}>
              <Text style={styles.footerBrandIcon}>♫</Text>
              <Text style={styles.footerBrandTitle}>KANNARI MUSIC ACADEMY</Text>
            </View>

            <Text style={styles.footerDescription}>Structured Online Music Education for the Modern Musician.</Text>
            <Text style={styles.footerDescription}>
              Inspired by the Haitian kanari - a vessel that preserves fresh water - we pour structured musical knowledge into every
              student.
            </Text>
            <Text style={styles.footerMission}>Music from the heart. Music that inspires. Music that grows.</Text>

            <Text style={styles.footerHeading}>What We Pour</Text>
            <Text style={styles.footerBullet}>• Discipline</Text>
            <Text style={styles.footerBullet}>• Expression</Text>
            <Text style={styles.footerBullet}>• Technique</Text>
            <Text style={styles.footerBullet}>• Confidence</Text>
            <Text style={styles.footerBullet}>• Artistic identity</Text>

            <Text style={styles.footerHeading}>Our Programs</Text>
            {PROGRAMS.map((program) => (
              <Text key={`footer-${program}`} style={styles.footerBullet}>• {program}</Text>
            ))}

            <TouchableOpacity style={styles.footerCta} onPress={() => handleNavigate('AllCourses')}>
              <Text style={styles.footerCtaText}>View All Courses</Text>
            </TouchableOpacity>

            <Text style={styles.footerHeading}>Quick Links</Text>
            {FOOTER_LINKS.map((item) => (
              <TouchableOpacity key={`footer-link-${item.label}`} onPress={() => handleNavigate(item.screen)}>
                <Text style={styles.footerLink}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.footerBottom}>
              <Text style={styles.footerCopyright}>© 2026 KANNARI MUSIC ACADEMY. All Rights Reserved.</Text>
              <View style={styles.footerBottomLinks}>
                <TouchableOpacity onPress={() => handleNavigate('StudentRegister')}>
                  <Text style={styles.footerBottomLink}>Start Learning Today</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleNavigate('AllCourses')}>
                  <Text style={styles.footerBottomLink}>Explore Courses</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {showBackToTop && (
        <TouchableOpacity
          style={styles.backToTop}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          activeOpacity={0.85}
        >
          <Text style={styles.backToTopText}>↑</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  heroSection: {
    width: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(95, 96, 196, 0.84)',
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroSmallTitle: {
    color: '#23284d',
    letterSpacing: 3,
    fontWeight: '600',
    fontSize: 11,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSmallTitleSmall: {
    letterSpacing: 2,
    fontSize: 10,
  },
  heroMainTitle: {
    color: '#151939',
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 18,
  },
  heroMainTitleSmall: {
    fontSize: 20,
    lineHeight: 28,
  },
  heroDescription: {
    color: '#edf1ff',
    fontSize: 13,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 760,
  },
  heroDescriptionSmall: {
    fontSize: 12,
    lineHeight: 23,
  },
  heroButtons: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    rowGap: 16,
  },
  buttonPrimary: {
    width: '100%',
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: '#5d71d6',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonSecondary: {
    width: '100%',
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonTextSmall: {
    fontSize: 15,
  },
  storySection: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  storyInner: {
    width: '100%',
  },
  storyImage: {
    width: '100%',
    height: 500,
    borderRadius: 22,
    marginBottom: 32,
  },
  storyContent: {
    width: '100%',
  },
  storyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f2fe',
    borderRadius: 40,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginBottom: 18,
  },
  storyBadgeText: {
    color: '#6170d7',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  storyTitle: {
    color: '#15181f',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    marginBottom: 16,
  },
  storyTitleSmall: {
    fontSize: 20,
    lineHeight: 28,
  },
  storyParagraph: {
    color: '#616a78',
    fontSize: 14,
    lineHeight: 34,
    marginBottom: 2,
  },
  storyParagraphLast: {
    marginBottom: 0,
  },
  differencesSection: {
    backgroundColor: '#e9ecf1',
    alignItems: 'center',
  },
  sectionInner: {
    width: '100%',
  },
  sectionTitle: {
    textAlign: 'center',
    color: '#14171f',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionTitleSmall: {
    fontSize: 20,
    lineHeight: 28,
  },
  sectionSubtitle: {
    textAlign: 'center',
    color: '#636b7b',
    fontSize: 13,
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 22,
    marginBottom: 16,
    shadowColor: '#101420',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  infoCardTitle: {
    color: '#161a22',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoCardDescription: {
    color: '#666f7e',
    fontSize: 14,
    lineHeight: 30,
  },
  programsSection: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  programCard: {
    backgroundColor: '#f1f3fa',
    borderRadius: 12,
    minHeight: 68,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 18,
  },
  programCardText: {
    color: '#4f5866',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  viewAllButton: {
    marginTop: 18,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    minHeight: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6676dc',
  },
  viewAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  missionSection: {
    backgroundColor: '#091334',
    alignItems: 'center',
  },
  missionTitle: {
    color: '#f5f7ff',
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    marginBottom: 14,
  },
  missionSubtitle: {
    color: '#f2f4fb',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 34,
    marginBottom: 14,
  },
  missionSubtitleSmall: {
    fontSize: 13,
    lineHeight: 30,
  },
  missionDescription: {
    color: '#d3d8e7',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 30,
  },
  footerSection: {
    backgroundColor: '#17191d',
    alignItems: 'center',
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerBrandIcon: {
    color: '#6878e4',
    fontSize: 34,
    marginRight: 12,
  },
  footerBrandTitle: {
    color: '#f5f6fb',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
    flexShrink: 1,
  },
  footerDescription: {
    color: '#cfd3dc',
    fontSize: 13,
    lineHeight: 23,
    marginBottom: 2,
  },
  footerMission: {
    color: '#f5f7ff',
    fontSize: 13,
    lineHeight: 23,
    marginTop: 4,
    marginBottom: 14,
  },
  footerHeading: {
    color: '#f4f6fb',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  footerBullet: {
    color: '#c7ccd8',
    fontSize: 12,
    lineHeight: 26,
  },
  footerCta: {
    marginTop: 10,
    marginBottom: 14,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#6f78e5',
    alignSelf: 'flex-start',
  },
  footerCtaText: {
    color: '#f4f6fb',
    fontSize: 14,
    fontWeight: '700',
  },
  footerLink: {
    color: '#c9ced9',
    fontSize: 12,
    lineHeight: 30,
  },
  footerBottom: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#2f323a',
    paddingTop: 18,
  },
  footerCopyright: {
    color: '#9aa0ad',
    fontSize: 11,
    lineHeight: 20,
    marginBottom: 10,
  },
  footerBottomLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 10,
  },
  footerBottomLink: {
    color: '#c8cdd8',
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '600',
  },
  backToTop: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#6f76dc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6f76dc',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  backToTopText: {
    color: '#f9fbff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
})

export default Home
