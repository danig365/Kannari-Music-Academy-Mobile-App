import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import LoadingSpinner from '../shared/LoadingSpinner'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { Bootstrap } from '../shared/BootstrapIcon'

import { API_BASE_URL } from '../../config';

const baseUrl = `${API_BASE_URL}/course/`;

const AllCourses = () => {
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [studentLoginStatus, setStudentLoginStatus] = useState(null)
  const [courseData, setCourseData] = useState([])
  const [nextUrl, setNextUrl] = useState()
  const [previousUrl, setPreviousUrl] = useState()
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const isCompact = width < 768

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const status = await AsyncStorage.getItem('studentLoginStatus')
        setStudentLoginStatus(status)
      } catch (error) {
        console.log(error)
      }
    }
    loadAuth()
  }, [])

  useEffect(() => {
    if (studentLoginStatus !== null && studentLoginStatus !== 'true') {
      navigation.navigate('StudentLogin')
    }
  }, [studentLoginStatus, navigation])


  useEffect(() => {
    fetchData(baseUrl)
  }, [])

  const openCourseDetail = (course) => {
    if (!course?.id) return
    navigation.navigate('CourseDetail', { course_id: course.id })
  }

  const paginationHandler = (url) => {
    setCurrentPage(url.includes('page=') ? parseInt(url.split('page=')[1]) : 1)
    fetchData(url)
  }

  const fetchData = async (url) => {
    setLoading(true)
    try {
      const res = await axios.get(url)
      setNextUrl(res.data.next)
      setPreviousUrl(res.data.previous)
      setCourseData(res.data.results)
      setLoading(false)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  if (studentLoginStatus !== null && studentLoginStatus !== 'true') {
    return null
  }

  if (loading) {
    return (
      <View style={styles.allCoursesMainLoading}>
        <LoadingSpinner size="lg" text="Loading courses..." />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.allCoursesMain}
      contentContainerStyle={[styles.allCoursesMainContent, isCompact ? styles.allCoursesMainContentCompact : styles.allCoursesMainContentWide]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.contentShell}>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderTitleRow}>
              <Bootstrap name="music-note-list" size={24} color="#3b82f6" />
              <Text style={styles.pageHeaderTitle}>All Courses</Text>
            </View>
            <Text style={styles.pageHeaderSubtitle}>
              Discover your next musical journey — explore our full catalogue
            </Text>
          </View>

          <View style={styles.coursesGrid}>
            {courseData && courseData.length > 0 ? courseData.map((course, index) => (
              <View style={[styles.courseCard, !isCompact ? styles.courseCardWide : null]} key={index}>
                <TouchableOpacity
                  style={styles.courseImageWrapper}
                  onPress={() => openCourseDetail(course)}
                >
                  {course.featured_img ? (
                    <Image
                      source={{ uri: course.featured_img }}
                      style={styles.courseImage}
                    />
                  ) : (
                    <View style={styles.coursePlaceholder}>
                      <Bootstrap name="music-note-beamed" size={48} color="rgba(255, 255, 255, 0.7)" />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.courseBody}>
                  <Text style={styles.courseTitle}>
                    <Text onPress={() => openCourseDetail(course)}>
                      {course.title}
                    </Text>
                  </Text>
                  <Text style={styles.courseDescription}>
                    {course.description?.substring(0, 80)}...
                  </Text>

                  <View style={styles.courseMeta}>
                    {course.teacher && (
                      <View style={[styles.metaBadge, styles.metaBadgeTeacher]}>
                        <Bootstrap name="person-badge" size={11} color="#2563eb" />
                        <Text style={styles.metaBadgeTeacherText}>{course.teacher?.full_name || 'Instructor'}</Text>
                      </View>
                    )}
                    {course.category && (
                      <View style={[styles.metaBadge, styles.metaBadgeCategory]}>
                        <Bootstrap name="tag" size={11} color="#059669" />
                        <Text style={styles.metaBadgeCategoryText}>{course.category?.title}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.courseStats}>
                    <View style={styles.courseStatItem}>
                      <Bootstrap name="star-fill" size={12} color="#f59e0b" />
                      <Text style={styles.courseStatText}>{course.course_rating ? course.course_rating.toFixed(1) : 'Not rated yet'}</Text>
                    </View>
                    <View style={styles.courseStatItem}>
                      <Bootstrap name="people" size={12} color="#10b981" />
                      <Text style={styles.courseStatText}>
                        {course.total_enrolled_students || 0} {(course.total_enrolled_students || 0) === 1 ? 'Student' : 'Students'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.courseFooter}>
                    <TouchableOpacity
                      style={styles.viewCourseBtn}
                      onPress={() => openCourseDetail(course)}
                    >
                      <Text style={styles.viewCourseBtnText}>View Course</Text>
                      <Bootstrap name="arrow-right" size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )) : (
                <View style={styles.emptyStateWrap}>
                <View style={styles.emptyState}>
                  <Bootstrap name="music-note-beamed" size={56} color="#3b82f6" />
                  <Text style={styles.emptyStateTitle}>No Courses Available Yet</Text>
                  <Text style={styles.emptyStateText}>New music courses are on the way — check back soon!</Text>
                </View>
              </View>
            )}
          </View>

          {(previousUrl || nextUrl) && (
            <View style={styles.paginationWrapper}>
              {previousUrl && (
                <TouchableOpacity
                  style={styles.paginationBtn}
                  onPress={() => paginationHandler(previousUrl)}
                >
                  <Bootstrap name="chevron-left" size={14} color="#3b82f6" />
                  <Text style={styles.paginationBtnText}>Previous</Text>
                </TouchableOpacity>
              )}
              <View style={styles.paginationInfoWrap}>
                <Text style={styles.paginationInfo}>Page {currentPage}</Text>
              </View>
              {nextUrl && (
                <TouchableOpacity
                  style={styles.paginationBtn}
                  onPress={() => paginationHandler(nextUrl)}
                >
                  <Text style={styles.paginationBtnText}>Next</Text>
                  <Bootstrap name="chevron-right" size={14} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>
          )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  allCoursesContainer: {
    flexDirection: 'row',
    minHeight: '100%',
    backgroundColor: '#f0f9ff',
    flex: 1,
  },
  allCoursesContent: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  allCoursesMain: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f8fbff',
  },
  allCoursesMainContent: {
    flexGrow: 1,
  },
  allCoursesMainContentCompact: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  allCoursesMainContentWide: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  contentShell: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  mobileHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.1)',
    zIndex: 100,
  },
  sidebarToggle: {
    padding: 8,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMini: {
    fontWeight: '700',
    color: '#3b82f6',
    fontSize: 15,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  allCoursesMainLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  pageHeader: {
    marginBottom: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  pageHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  pageHeaderTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  pageHeaderSubtitle: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '400',
  },
  coursesGrid: {
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.10)',
    width: '100%',
    flexDirection: 'column',
  },
  courseCardWide: {
    maxWidth: 430,
    alignSelf: 'center',
  },
  courseImageWrapper: {
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  coursePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseBody: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
    flex: 1,
    flexDirection: 'column',
  },
  courseTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  courseDescription: {
    fontSize: 14,
    marginBottom: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaBadgeTeacher: {
    backgroundColor: '#eff6ff',
  },
  metaBadgeTeacherText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '600',
  },
  metaBadgeCategory: {
    backgroundColor: '#ecfdf5',
  },
  metaBadgeCategoryText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.08)',
  },
  courseStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  courseStatText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  courseFooter: {
    paddingTop: 6,
    marginTop: 'auto',
  },
  viewCourseBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    minHeight: 44,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 2,
  },
  viewCourseBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyStateWrap: {
    width: '100%',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderStyle: 'dashed',
    maxWidth: 480,
    alignSelf: 'center',
    marginTop: 40,
  },
  emptyStateTitle: {
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '700',
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    marginBottom: 24,
    fontSize: 15,
    textAlign: 'center',
  },
  paginationWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  paginationBtn: {
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  paginationBtnText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  paginationInfoWrap: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  paginationInfo: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
})

export default AllCourses
