import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherMyCourses = () => {
  const navigation = useNavigation()
  const [courseData, setCourseData] = useState([])
  const [teacherId, setTeacherId] = useState(null)
  const [totalResult, settotalResult] = useState([0])

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId')
        setTeacherId(id)
      } catch (error) {
        console.log(error)
      }
    }

    getTeacherId()
  }, [])

  useEffect(() => {
    if (!teacherId) return

    try {
      axios.get(baseUrl + '/teacher-course/' + teacherId)
      .then((res) => {
        setCourseData(res.data)
      })
    } catch (error) {
      console.log(error)
    }
  }, [teacherId])

  const handleDeleteClick = (course_id) => {
    Alert.alert('Confirm', 'Are you sure you want to delete data?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          Alert.alert('Error', 'Data has not been deleted !!')
        },
      },
      {
        text: 'Continue',
        onPress: () => {
          try {
            axios.delete(baseUrl + '/teacher-course-detail/' + course_id)
            .then((res) => {
              Alert.alert('Success', 'Data has been deleted Successfully')
              try {
                axios.get(baseUrl + '/teacher-course/' + teacherId)
                .then((res) => {
                  settotalResult(res.data.length)
                  setCourseData(res.data)
                })
              } catch (error) {
                console.log(error)
              }
            })
          } catch (error) {
            Alert.alert('Error', 'Data has not been deleted !!')
          }
        },
      },
    ])
  }

  const renderCourseItem = (course) => {
    return (
      <View key={course.id} style={styles.rowCard}>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherCourseManagement', { id: course.id })}>
          <Text style={styles.courseTitle}>{course.title}</Text>
        </TouchableOpacity>

        <View style={styles.ratingRow}>
          <Text style={styles.starIcon}>★</Text>
          {course.course_rating && <Text style={styles.ratingText}>Rating : {course.course_rating}/5</Text>}
          {!course.course_rating && <Text style={styles.ratingText}>Rating : New</Text>}
        </View>

        <Image style={styles.thumbnail} source={{ uri: course.featured_img }} />

        <TouchableOpacity onPress={() => navigation.navigate('TeacherEnrolledStudents', { id: course.id })}>
          <Text style={styles.enrolledText}>{course.total_enrolled_students} 👥</Text>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('TeacherCourseManagement', { id: course.id })}>
            <Text style={styles.btnText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('TeacherStudyMaterial', { id: course.id })}>
            <Text style={styles.btnText}>Study Material</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={() => navigation.navigate('TeacherCourseManagement', { id: course.id })}>
            <Text style={styles.btnText}>Add Chapter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={() => handleDeleteClick(course.id)}>
            <Text style={styles.btnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.teacherPageWrapper}>
      <View style={styles.card}>
        <Text style={styles.cardHeader}>📚 My Courses</Text>

        <View style={styles.cardBody}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderText}>Name</Text>
            <Text style={styles.tableHeaderText}>Thumbnail</Text>
            <Text style={styles.tableHeaderText}>Total Enrolled</Text>
            <Text style={styles.tableHeaderText}>Ratings</Text>
          </View>

          {courseData.map((course) => renderCourseItem(course))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  teacherPageWrapper: {
    width: '100%',
    padding: 0,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 0,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 16,
  },
  cardBody: {
    padding: 24,
  },
  tableHeaderRow: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tableHeaderText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 6,
  },
  courseTitle: {
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  starIcon: {
    color: '#f59e0b',
    marginRight: 6,
  },
  ratingText: {
    color: '#374151',
  },
  thumbnail: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    borderRadius: 40,
    marginBottom: 12,
  },
  enrolledText: {
    textAlign: 'center',
    color: '#3b82f6',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  btn: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  btnPrimary: {
    backgroundColor: '#4285f4',
  },
  btnSuccess: {
    backgroundColor: '#10b981',
  },
  btnDanger: {
    backgroundColor: '#ef4444',
  },
  btnSecondary: {
    backgroundColor: '#6b7280',
  },
  btnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
})

export default TeacherMyCourses
