import React, { useEffect, useState } from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const Search = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const searchstring = route.params?.searchstring || ''

  const [courseData, setCourseData] = useState([])
  const [nextUrl, setNextUrl] = useState(null)
  const [previousUrl, setPreviousUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchstring) {
      fetchData(`${baseUrl}/search-courses/${searchstring}`)
    }
  }, [searchstring])

  const paginationHandler = (url) => {
    fetchData(url)
  }

  const fetchData = (url) => {
    setLoading(true)
    try {
      axios.get(url)
        .then((res) => {
          setNextUrl(res.data.next)
          setPreviousUrl(res.data.previous)
          setCourseData(res.data.results)
        })
        .catch((error) => {
          console.log(error)
        })
        .finally(() => setLoading(false))
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  const renderCourseCard = (course) => (
    <View style={styles.courseCard}>
      <TouchableOpacity
        style={styles.cardImage}
        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
      >
        <Image
          source={{ uri: course.featured_img }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
        >
          <Text style={styles.cardTitle}>{course.title}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>All Courses for {searchstring}</Text>
      </View>

      {loading && courseData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
        </View>
      ) : courseData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No courses found for "{searchstring}"</Text>
        </View>
      ) : (
        <>
          <View style={styles.coursesGrid}>
            {courseData && courseData.map((course, index) => (
              <View key={index} style={styles.gridItem}>
                {renderCourseCard(course)}
              </View>
            ))}
          </View>

          <View style={styles.paginationContainer}>
            {previousUrl && (
              <TouchableOpacity
                style={styles.paginationBtn}
                onPress={() => paginationHandler(previousUrl)}
              >
                <Text style={styles.paginationBtnText}>← Previous</Text>
              </TouchableOpacity>
            )}
            {nextUrl && (
              <TouchableOpacity
                style={styles.paginationBtn}
                onPress={() => paginationHandler(nextUrl)}
              >
                <Text style={styles.paginationBtnText}>Next →</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 16,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  paginationBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  paginationBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
})

export default Search
