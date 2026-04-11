import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const baseUrl = API_BASE_URL

const Faq = () => {
  const [faqData, setFaqData] = useState([])
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFaqData()
  }, [])

  const fetchFaqData = async () => {
    try {
      const response = await axios.get(baseUrl + '/faq/')
      setFaqData(response.data)
      setLoading(false)
    } catch (error) {
      console.log(error)
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FAQ's</Text>
      <View style={styles.accordionContainer}>
        {faqData &&
          faqData.map((row, index) => (
            <View key={index} style={styles.accordionItem}>
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
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
    marginTop: 20,
  },
  accordionContainer: {
    marginBottom: 20,
  },
  accordionItem: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  accordionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  accordionQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  accordionBody: {
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  accordionAnswer: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    lineHeight: 22,
  },
})

export default Faq