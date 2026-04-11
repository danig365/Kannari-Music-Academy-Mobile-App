import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const baseUrl = API_BASE_URL

const Pages = () => {
  const route = useRoute()
  const { page_id, page_slug } = route.params || {}

  const [pageData, setPageData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!page_id || !page_slug) {
      setError('Invalid page parameters')
      setLoading(false)
      return
    }

    const fetchPageData = async () => {
      try {
        const response = await axios.get(`${baseUrl}/pages/${page_id}/${page_slug}`)
        setPageData(response.data)
        setError('')
      } catch (fetchError) {
        console.log(fetchError)
        setError('Unable to load page content')
      } finally {
        setLoading(false)
      }
    }

    fetchPageData()
  }, [page_id, page_slug])

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#06BBCC" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{pageData.title}</Text>
      <Text style={styles.content}>{pageData.content}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 32,
  },
  content: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
  },
  errorText: {
    fontSize: 15,
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 22,
  },
})

export default Pages
