import React, { useEffect, useState } from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const baseUrl = `${API_BASE_URL}/popular-courses/?all=1`

const PopularCourses = () => {
  const navigation = useNavigation()
  
  const [courseData, setCourseData] = useState([])
  const [nextUrl, setNextUrl] = useState(null)
  const [previousUrl, setPreviousUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData(baseUrl)
  }, [])

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

  const renderCourseCard = (item) => (
    <View style={styles.courseCard}>
      <TouchableOpacity
        style={styles.cardImage}
        onPress={() => navigation.navigate('CourseDetail', { courseId: item.course.id })}
      >
        <Image
          source={{ uri: item.course.featured_img }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CourseDetail', { courseId: item.course.id })}
        >
          <Text style={styles.cardTitle}>{item.course.title}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.sectionTitle}>Courses</Text>
        <Text style={styles.mainTitle}>Popular Courses</Text>
      </View>

      {loading && courseData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
        </View>
      ) : (
        <>
          <View style={styles.coursesGrid}>
            {courseData && courseData.map((item, index) => (
              <View key={index} style={styles.gridItem}>
                {renderCourseCard(item)}
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
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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

export default PopularCourses
