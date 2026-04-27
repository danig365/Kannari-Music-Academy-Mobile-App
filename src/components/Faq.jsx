import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const baseUrl = API_BASE_URL

const FALLBACK_FAQS = [
  {
    question: 'Who can enroll in Kannari Music Academy?',
    answer:
      'Our programs are open to children, teens, and adults. We offer structured tracks for beginners, intermediate learners, and advanced students.',
  },
  {
    question: 'Do I need prior music experience?',
    answer:
      'No. Many students start with zero experience. Our curriculum is designed to build technique step by step while keeping learning inspiring and practical.',
  },
  {
    question: 'How are classes delivered?',
    answer:
      'Classes are delivered online through guided lessons, assignments, and teacher feedback. You can learn from home while still following a clear progression path.',
  },
  {
    question: 'What instruments or subjects are available?',
    answer:
      'We provide music fundamentals and instrument-specific pathways depending on your selected program. Course offerings are regularly expanded based on demand.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Open the registration flow, choose your learning path, and complete onboarding. Once enrolled, you can start lessons immediately and track your progress.',
  },
]

const Faq = () => {
  const { width } = useWindowDimensions()
  const isSmall = width < 360

  const [faqData, setFaqData] = useState([])
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetchFaqData()
  }, [])

  const fetchFaqData = async () => {
    try {
      const response = await axios.get(baseUrl + '/faq/')
      const payload = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : []

      if (payload.length > 0) {
        setFaqData(payload)
        setLoadError(false)
      } else {
        setFaqData(FALLBACK_FAQS)
        setLoadError(true)
      }
    } catch (error) {
      console.log(error)
      setFaqData(FALLBACK_FAQS)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroCard}>
        <Text style={[styles.badge, isSmall && styles.badgeSmall]}>Support</Text>
        <Text style={[styles.title, isSmall && styles.titleSmall]}>Frequently Asked Questions</Text>
        <Text style={[styles.subtitle, isSmall && styles.subtitleSmall]}>
          Find quick answers about enrollment, classes, and your learning journey at Kannari Music Academy.
        </Text>
      </View>

      {loadError && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Live FAQ content is currently unavailable. Showing essential questions so you can continue.
          </Text>
        </View>
      )}

      <View style={styles.accordionContainer}>
        {faqData &&
          faqData.map((row, index) => (
            <View key={`${row.question}-${index}`} style={styles.accordionItem}>
              <TouchableOpacity
                style={styles.accordionButton}
                onPress={() => toggleAccordion(index)}
              >
                <Text style={styles.accordionQuestion}>{row.question}</Text>
                <Text style={styles.expandIcon}>
                  {expandedIndex === index ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedIndex === index && (
                <View style={styles.accordionBody}>
                  <Text style={styles.accordionAnswer}>{row.answer}</Text>
                </View>
              )}
            </View>
          ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3fb',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 28,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e8f5',
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e7efff',
    color: '#255ecf',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 12,
    overflow: 'hidden',
  },
  badgeSmall: {
    fontSize: 11,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#101827',
    marginBottom: 10,
  },
  titleSmall: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  subtitleSmall: {
    fontSize: 14,
    lineHeight: 22,
  },
  noticeBox: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  noticeText: {
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 20,
  },
  accordionContainer: {
    marginBottom: 20,
  },
  accordionItem: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderColor: '#d9e3f3',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0f1d37',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  accordionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fbff',
  },
  accordionQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '700',
  },
  accordionBody: {
    borderTopColor: '#d9e3f3',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  accordionAnswer: {
    fontSize: 14,
    fontWeight: '400',
    color: '#334155',
    lineHeight: 23,
  },
})

export default Faq