import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaUrl = API_BASE_URL.replace('/api', '')

const TeacherOverview = () => {
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [teacherId, setTeacherId] = useState(null)
  const isMobile = width < 900

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId')
        setTeacherId(id)
      } catch (err) {
        console.log(err)
      }
    }

    getTeacherId()
  }, [])

  const fetchDashboardData = useCallback(async () => {
    if (!teacherId) return

    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${baseUrl}/teacher/overview/${teacherId}/`)
      setData(response.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const getActivityIcon = (type) => {
    const icons = {
      check: '✓',
      document: '📄',
      play: '▶',
      comment: '💬',
      download: '⬇',
      calendar: '📅',
      trophy: '🏆',
      'person-plus': '👤',
      default: '•'
    }
    return icons[type] || icons.default
  }

  const getActivityColor = (type) => {
    const colors = {
      check: { bg: '#dcfce7', color: '#16a34a' },
      play: { bg: '#dbeafe', color: '#3b82f6' },
      comment: { bg: '#fef3c7', color: '#d97706' },
      document: { bg: '#f3e8ff', color: '#9333ea' },
      download: { bg: '#e0f2fe', color: '#0284c7' },
      calendar: { bg: '#fce7f3', color: '#db2777' },
      trophy: { bg: '#fef9c3', color: '#ca8a04' },
      'person-plus': { bg: '#dbeafe', color: '#2563eb' },
    }
    return colors[type] || { bg: '#f1f5f9', color: '#64748b' }
  }

  const getActivityVerb = (type) => {
    const verbs = {
      lesson_completed: 'completed lesson',
      assignment_submitted: 'submitted assignment for',
      course_started: 'started course',
      comment_added: 'commented on',
      material_downloaded: 'downloaded material from',
      session_attended: 'attended session',
      course_completed: 'completed course',
      enrolled: 'enrolled in',
    }
    return verbs[type] || type
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size='large' color='#667eea' />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={fetchDashboardData}>
          <Text style={styles.primaryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!data) return null

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerWrap}>
        <View>
          <Text style={styles.pageTitle}>Dashboard Overview</Text>
          <Text style={styles.pageSubtitle}>Welcome back, {data.teacher_name}. Here's your teaching summary.</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={fetchDashboardData} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('TeacherStudents')} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>View Students</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('TeacherCourseManagement')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Manage Courses</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}><Text style={styles.metricIcon}>👥</Text></View>
          <Text style={styles.metricLabel}>Total Students</Text>
          <Text style={styles.metricValue}>{data.total_students}</Text>
          {data.new_students_this_month > 0 && <Text style={styles.positiveText}>{data.new_students_this_month} new this month</Text>}
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}><Text style={styles.metricIcon}>📚</Text></View>
          <Text style={styles.metricLabel}>My Courses</Text>
          <Text style={styles.metricValue}>{data.total_courses}</Text>
          <Text style={styles.metricSubtext}>{data.total_chapters} chapter{data.total_chapters !== 1 ? 's' : ''} · {data.total_lessons} lesson{data.total_lessons !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}><Text style={styles.metricIcon}>🧑‍🎓</Text></View>
          <Text style={styles.metricLabel}>Enrollments</Text>
          <Text style={styles.metricValue}>{data.total_enrollments}</Text>
          {data.new_enrollments_this_week > 0
            ? <Text style={styles.positiveText}>{data.new_enrollments_this_week} this week</Text>
            : <Text style={styles.metricSubtext}>{data.active_enrollments} active</Text>}
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}><Text style={styles.metricIcon}>🏆</Text></View>
          <Text style={styles.metricLabel}>Completion Rate</Text>
          <Text style={styles.metricValue}>{data.total_enrollments > 0 ? `${data.completion_rate}%` : '—'}</Text>
          <Text style={styles.metricSubtext}>{data.completed_courses} of {data.total_enrollments} completed</Text>
        </View>
      </View>

      {data.courses && data.courses.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Courses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TeacherCourseManagement')}>
              <Text style={styles.linkText}>Manage All</Text>
            </TouchableOpacity>
          </View>

          {data.courses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={[styles.courseTopBar, { backgroundColor: course.total_enrolled > 0 ? '#667eea' : '#e5e7eb' }]} />
              <View style={styles.courseBody}>
                <View style={styles.courseRow}>
                  {course.featured_img ? (
                    <Image source={{ uri: `${mediaUrl}${course.featured_img}` }} style={styles.courseThumb} />
                  ) : (
                    <View style={styles.courseThumbPlaceholder}><Text style={styles.placeholderIcon}>📘</Text></View>
                  )}

                  <View style={styles.courseMetaWrap}>
                    <Text numberOfLines={1} style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseMeta}>{course.total_enrolled} enrolled</Text>
                    <Text style={styles.courseMeta}>{course.chapter_count} ch · {course.lesson_count} lessons</Text>
                  </View>
                </View>

                {course.total_enrolled > 0 && (
                  <View>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Avg student progress</Text>
                      <Text style={styles.progressLabel}>{course.avg_progress}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${course.avg_progress}%`,
                            backgroundColor: course.avg_progress >= 70 ? '#10b981' : course.avg_progress >= 40 ? '#f59e0b' : '#667eea'
                          }
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.twoColWrap, isMobile ? styles.twoColWrapMobile : null]}>
        <View style={[styles.leftCol, isMobile ? styles.fullColMobile : null]}>
          <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {data.recent_activities && data.recent_activities.length > 0 ? (
            data.recent_activities.map((activity, idx) => {
              const ac = getActivityColor(activity.icon_type)
              return (
                <View
                  key={activity.id}
                  style={[
                    styles.listRow,
                    idx < data.recent_activities.length - 1 ? styles.listRowBorder : null,
                  ]}
                >
                  <View style={[styles.activityIconWrap, { backgroundColor: ac.bg }]}>
                    <Text style={[styles.activityIconText, { color: ac.color }]}>{getActivityIcon(activity.icon_type)}</Text>
                  </View>

                  <View style={styles.flexOne}>
                    <Text style={styles.activityText}>
                      <Text style={styles.boldText}>{activity.student_name}</Text> {getActivityVerb(activity.activity_type)}{' '}
                      {activity.target_id ? (
                        <Text style={styles.linkText} onPress={() => navigation.navigate('Detail', { id: activity.target_id })}>{activity.target_name}</Text>
                      ) : (
                        <Text style={styles.linkText}>{activity.target_name}</Text>
                      )}
                    </Text>
                    <Text style={styles.timeText}>{activity.time_ago}</Text>
                  </View>
                </View>
              )
            })
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🕒</Text>
              <Text style={styles.emptyTitle}>No recent activity yet</Text>
              <Text style={styles.emptyText}>Activity will appear here when students interact with your courses.</Text>
            </View>
          )}
        </View>
        </View>

        <View style={[styles.rightCol, isMobile ? styles.fullColMobile : null]}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            {data.upcoming_sessions && data.upcoming_sessions.length > 0 ? (
              data.upcoming_sessions.map((session, idx) => (
                <View
                  key={session.id}
                  style={[
                    styles.listRow,
                    styles.alignCenter,
                    idx < data.upcoming_sessions.length - 1 ? styles.listRowBorder : null,
                  ]}
                >
                  <Text style={styles.sessionTime}>{session.scheduled_time}</Text>
                  <View style={styles.flexOne}>
                    <Text style={styles.sessionName}>{session.student_name}</Text>
                    <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    session.status === 'scheduled' ? styles.badgeScheduled : session.status === 'completed' ? styles.badgeCompleted : styles.badgeCancelled,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      session.status === 'scheduled' ? styles.badgeScheduledText : session.status === 'completed' ? styles.badgeCompletedText : styles.badgeCancelledText,
                    ]}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>No upcoming sessions</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Enrollments</Text>
            {data.recent_enrollments && data.recent_enrollments.length > 0 ? (
              data.recent_enrollments.map((enroll, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.listRow,
                    styles.alignCenter,
                    idx < data.recent_enrollments.length - 1 ? styles.listRowBorder : null,
                  ]}
                >
                  {enroll.student_profile_img ? (
                    <Image source={{ uri: `${mediaUrl}${enroll.student_profile_img}` }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{(enroll.student_name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                  )}

                  <View style={styles.flexOne}>
                    <Text style={styles.sessionName}>{enroll.student_name}</Text>
                    <Text numberOfLines={1} style={styles.sessionTitle}>enrolled in <Text style={styles.boldText}>{enroll.course_title}</Text></Text>
                  </View>

                  <Text style={[
                    styles.progressPercent,
                    { color: enroll.progress_percent >= 70 ? '#10b981' : enroll.progress_percent >= 30 ? '#f59e0b' : '#667eea' }
                  ]}>
                    {enroll.progress_percent}%
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>➕</Text>
                <Text style={styles.emptyText}>No enrollments yet</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {data.total_courses === 0 && (
        <View style={styles.emptyStartCard}>
          <Text style={styles.startIcon}>🚀</Text>
          <Text style={styles.startTitle}>Get Started!</Text>
          <Text style={styles.startText}>Create your first course and start sharing your musical knowledge with students.</Text>

          <View style={styles.startActions}>
            <TouchableOpacity onPress={() => navigation.navigate('TeacherCourseManagement')} style={styles.primaryBtnWide}>
              <Text style={styles.primaryBtnText}>Create a Course</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('TeacherStudents')} style={styles.outlineBtnWide}>
              <Text style={styles.outlineBtnText}>Add Students</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
    gap: 20,
  },
  loadingWrap: {
    flex: 1,
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  errorWrap: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#4b5563',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  outlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 10,
  },
  outlineBtnWide: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 10,
  },
  outlineBtnText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
    borderRadius: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnWide: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#667eea',
    borderRadius: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 240,
    flexGrow: 1,
  },
  metricIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e9edff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  metricIcon: {
    fontSize: 28,
    color: '#667eea',
  },
  metricLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  metricSubtext: {
    fontSize: 13,
    color: '#4b5563',
  },
  positiveText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  linkText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
  },
  courseCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  courseTopBar: {
    height: 6,
  },
  courseBody: {
    padding: 20,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  courseThumb: {
    width: 56,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  courseThumbPlaceholder: {
    width: 56,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  courseMetaWrap: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  courseMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  twoColWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  twoColWrapMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  leftCol: {
    flex: 1,
    minWidth: 300,
  },
  rightCol: {
    flex: 1,
    minWidth: 300,
    gap: 16,
  },
  fullColMobile: {
    width: '100%',
    minWidth: 0,
  },
  listRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  flexOne: {
    flex: 1,
  },
  activityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 20,
  },
  activityText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
    color: '#cbd5e1',
  },
  emptyTitle: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
  alignCenter: {
    alignItems: 'center',
  },
  sessionTime: {
    minWidth: 56,
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center',
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badgeScheduled: {
    backgroundColor: '#e3f2fd',
  },
  badgeCompleted: {
    backgroundColor: '#d4edda',
  },
  badgeCancelled: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeScheduledText: {
    color: '#1976d2',
  },
  badgeCompletedText: {
    color: '#10b981',
  },
  badgeCancelledText: {
    color: '#ef4444',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'right',
  },
  emptyStartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 60,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startIcon: {
    fontSize: 56,
    color: '#667eea',
    marginBottom: 24,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  startText: {
    color: '#4b5563',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 400,
    marginBottom: 28,
  },
  startActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
})

export default TeacherOverview
