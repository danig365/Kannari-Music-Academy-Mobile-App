import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherProgress = () => {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progressData, setProgressData] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [instrumentFilter, setInstrumentFilter] = useState('all')
  const [sortField, setSortField] = useState('progress_percentage')
  const [sortDirection, setSortDirection] = useState('desc')
  const [activeTab, setActiveTab] = useState('overview')

  const [teacherId, setTeacherId] = useState(null)

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId')
        setTeacherId(id)
      } catch (e) {
        console.log(e)
      }
    }

    getTeacherId()
  }, [])

  const fetchProgressData = useCallback(async () => {
    if (!teacherId) return

    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${baseUrl}/teacher/progress/${teacherId}/`)
      setProgressData(response.data)
    } catch (err) {
      console.error('Error fetching progress data:', err)
      setError('Unable to load progress data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchProgressData()
  }, [fetchProgressData])

  const filteredStudents = useMemo(() => {
    if (!progressData?.student_progress) return []

    let filtered = [...progressData.student_progress]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        (s.student_name || '').toLowerCase().includes(q) ||
        (s.instrument && s.instrument.toLowerCase().includes(q)) ||
        (s.student_email && s.student_email.toLowerCase().includes(q))
      )
    }

    if (levelFilter !== 'all') filtered = filtered.filter(s => s.level === levelFilter)
    if (statusFilter !== 'all') filtered = filtered.filter(s => s.status === statusFilter)
    if (instrumentFilter !== 'all') filtered = filtered.filter(s => s.instrument === instrumentFilter)

    filtered.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }

      if (sortDirection === 'asc') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    })

    return filtered
  }, [progressData, searchQuery, levelFilter, statusFilter, instrumentFilter, sortField, sortDirection])

  const uniqueInstruments = useMemo(() => {
    if (!progressData?.student_progress) return []
    const instruments = [...new Set(progressData.student_progress.map(s => s.instrument).filter(Boolean))]
    return instruments.sort()
  }, [progressData])

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#22c55e'
    if (percentage >= 60) return '#3b82f6'
    if (percentage >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getProgressClass = (percentage) => {
    if (percentage >= 80) return 'high'
    if (percentage >= 60) return 'medium'
    if (percentage >= 40) return 'low'
    return 'very-low'
  }

  const getMaxActivity = () => {
    if (!progressData?.weekly_activity) return 1
    return Math.max(...progressData.weekly_activity.map(a => a.activities), 1)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#16a34a' }
      case 'warning': return { bg: '#fef3c7', color: '#d97706' }
      case 'inactive': return { bg: '#fee2e2', color: '#dc2626' }
      default: return { bg: '#f1f5f9', color: '#64748b' }
    }
  }

  const capitalize = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size='large' color='#667eea' />
        <Text style={styles.loaderText}>Loading progress analytics...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerError}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity onPress={fetchProgressData} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!progressData || progressData.total_students === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Progress Analytics</Text>
          <Text style={styles.pageSubtitle}>Monitor student performance and track learning outcomes.</Text>
        </View>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyBigIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Students Yet</Text>
          <Text style={styles.emptyBody}>Once you have students assigned, their progress will appear here.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TeacherStudents')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Manage Students</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={styles.flexOne}>
          <Text style={styles.pageTitle}>Progress Analytics</Text>
          <Text style={styles.pageSubtitle}>Monitor student performance and track learning outcomes.</Text>
        </View>
        <TouchableOpacity onPress={fetchProgressData} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setActiveTab('overview')} style={[styles.tabBtn, activeTab === 'overview' ? styles.tabActive : styles.tabInactive]}>
          <Text style={activeTab === 'overview' ? styles.tabTextActive : styles.tabTextInactive}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('students')} style={[styles.tabBtn, activeTab === 'students' ? styles.tabActive : styles.tabInactive]}>
          <Text style={activeTab === 'students' ? styles.tabTextActive : styles.tabTextInactive}>Students ({progressData.total_students})</Text>
        </TouchableOpacity>
        {progressData.course_stats && progressData.course_stats.length > 0 && (
          <TouchableOpacity onPress={() => setActiveTab('courses')} style={[styles.tabBtn, activeTab === 'courses' ? styles.tabActive : styles.tabInactive]}>
            <Text style={activeTab === 'courses' ? styles.tabTextActive : styles.tabTextInactive}>Courses ({progressData.course_stats.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'overview' && (
        <>
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}><Text style={styles.metricLabel}>Overall Progress</Text><Text style={styles.metricValue}>{progressData.overall_progress}%</Text><Text style={styles.metricSub}>Class average</Text></View>
            <View style={styles.metricCard}><Text style={styles.metricLabel}>Completion Rate</Text><Text style={styles.metricValue}>{progressData.completion_rate}%</Text><Text style={styles.metricSub}>Lessons completed</Text></View>
            <View style={styles.metricCard}><Text style={styles.metricLabel}>Total Students</Text><Text style={styles.metricValue}>{progressData.total_students}</Text><Text style={styles.metricSub}>{progressData.total_enrollments || 0} enrollments</Text></View>
            <View style={styles.metricCard}><Text style={styles.metricLabel}>Active Lessons</Text><Text style={styles.metricValue}>{progressData.total_lessons}</Text><Text style={styles.metricSub}>{progressData.total_completed_courses || 0} courses completed</Text></View>
          </View>

          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>Progress Distribution</Text>
            {[
              { label: 'Excellent (80%+)', color: '#10b981', value: progressData.progress_distribution.excellent },
              { label: 'Good (60-79%)', color: '#667eea', value: progressData.progress_distribution.good },
              { label: 'Average (40-59%)', color: '#f59e0b', value: progressData.progress_distribution.average },
              { label: 'Needs Help (<40%)', color: '#ef4444', value: progressData.progress_distribution.needs_improvement }
            ].map((item, idx) => (
              <View key={idx} style={styles.distRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.distLabel}>{item.label}</Text>
                <Text style={styles.distValue}>{item.value}</Text>
                <Text style={styles.distPercent}>({progressData.total_students > 0 ? Math.round((item.value / progressData.total_students) * 100) : 0}%)</Text>
              </View>
            ))}
          </View>

          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
            <View style={styles.weeklyRow}>
              {progressData.weekly_activity.map((day, index) => {
                const height = (day.activities / getMaxActivity()) * 120
                const isToday = index === progressData.weekly_activity.length - 1
                return (
                  <View key={index} style={styles.weekItem}>
                    <View style={[styles.weekBar, { height: Math.max(height, 4), backgroundColor: isToday ? '#667eea' : 'rgba(102, 126, 234, 0.4)', opacity: day.activities === 0 ? 0.3 : 1 }]} />
                    <Text style={[styles.weekDate, isToday ? styles.weekDateToday : null]}>{day.date}</Text>
                    <Text style={styles.weekCount}>{day.activities}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.contentCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Top Performing Students</Text>
              <TouchableOpacity onPress={() => { setActiveTab('students'); setSortField('progress_percentage'); setSortDirection('desc') }}>
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>
            {progressData.top_students.length > 0 ? progressData.top_students.map((student, index) => (
              <View key={student.id} style={styles.studentListRow}>
                <View style={styles.rankCircle}><Text style={styles.rankText}>{index + 1}</Text></View>
                {student.student_profile_img ? (
                  <Image source={{ uri: `${baseUrl}${student.student_profile_img}` }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{student.student_name?.charAt(0) || '?'}</Text></View>
                )}
                <View style={styles.flexOne}>
                  <Text style={styles.studentRowName}>{student.student_name}</Text>
                  <Text style={styles.studentRowMeta}>{student.instrument ? capitalize(student.instrument) : ''}{student.level ? ` · ${capitalize(student.level)}` : ''}</Text>
                </View>
                <Text style={[styles.progressPill, { color: getProgressColor(student.progress_percentage) }]}>{student.progress_percentage}%</Text>
              </View>
            )) : <Text style={styles.mutedCenter}>No student data yet</Text>}
          </View>

          <View style={styles.contentCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Students Needing Attention</Text>
              <TouchableOpacity onPress={() => { setActiveTab('students'); setStatusFilter('warning') }}>
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>
            {progressData.attention_needed.length > 0 ? progressData.attention_needed.map((student) => {
              const statusColor = getStatusColor(student.status)
              return (
                <View key={student.id} style={styles.studentListRow}>
                  <View style={[styles.warnIcon, { backgroundColor: statusColor.bg }]}><Text style={{ color: statusColor.color }}>{student.status === 'warning' ? '!' : '×'}</Text></View>
                  <View style={styles.flexOne}>
                    <Text style={styles.studentRowName}>{student.student_name}</Text>
                    <Text style={styles.studentRowMeta}>Last active: {formatDate(student.last_active)}{student.instrument ? ` · ${capitalize(student.instrument)}` : ''}</Text>
                  </View>
                  <View style={styles.alignEnd}>
                    <Text style={[styles.statusBadge, { backgroundColor: statusColor.bg, color: statusColor.color }]}>{capitalize(student.status)}</Text>
                    <Text style={[styles.studentRowMeta, { color: getProgressColor(student.progress_percentage) }]}>{student.progress_percentage}%</Text>
                  </View>
                </View>
              )
            }) : (
              <View style={styles.centerGood}><Text style={styles.goodIcon}>✅</Text><Text style={styles.mutedCenter}>All students are on track!</Text></View>
            )}
          </View>
        </>
      )}

      {activeTab === 'students' && (
        <>
          <View style={styles.contentCard}>
            <TextInput
              placeholder='Search by name, email, or instrument...'
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />

            <View style={styles.filtersGrid}>
              <View style={styles.filterBox}>
                <Picker selectedValue={levelFilter} onValueChange={setLevelFilter}>
                  <Picker.Item label='All Levels' value='all' />
                  <Picker.Item label='Beginner' value='beginner' />
                  <Picker.Item label='Intermediate' value='intermediate' />
                  <Picker.Item label='Advanced' value='advanced' />
                </Picker>
              </View>

              <View style={styles.filterBox}>
                <Picker selectedValue={instrumentFilter} onValueChange={setInstrumentFilter}>
                  <Picker.Item label='All Instruments' value='all' />
                  {uniqueInstruments.map(inst => <Picker.Item key={inst} label={capitalize(inst)} value={inst} />)}
                </Picker>
              </View>

              <View style={styles.filterBox}>
                <Picker selectedValue={statusFilter} onValueChange={setStatusFilter}>
                  <Picker.Item label='All Statuses' value='all' />
                  <Picker.Item label='Active' value='active' />
                  <Picker.Item label='Warning' value='warning' />
                  <Picker.Item label='Inactive' value='inactive' />
                </Picker>
              </View>
            </View>

            {(searchQuery || levelFilter !== 'all' || statusFilter !== 'all' || instrumentFilter !== 'all') && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setLevelFilter('all'); setStatusFilter('all'); setInstrumentFilter('all') }} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.resultsText}>Showing {filteredStudents.length} of {progressData.student_progress.length} {progressData.student_progress.length === 1 ? 'student' : 'students'}</Text>
          </View>

          <View style={styles.contentCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
              {[['student_name', 'Student'], ['instrument', 'Instrument'], ['level', 'Level'], ['progress_percentage', 'Progress'], ['status', 'Status'], ['last_active', 'Last Active']].map(([field, label]) => (
                <TouchableOpacity key={field} onPress={() => handleSort(field)} style={styles.sortBtn}>
                  <Text style={styles.sortBtnText}>{label} {getSortIcon(field)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredStudents.length > 0 ? filteredStudents.map((student) => {
              const statusColor = getStatusColor(student.status)
              return (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentHead}>
                    {student.student_profile_img ? (
                      <Image source={{ uri: `${baseUrl}${student.student_profile_img}` }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{student.student_name?.charAt(0) || '?'}</Text></View>
                    )}
                    <View style={styles.flexOne}>
                      <Text style={styles.studentRowName}>{student.student_name}</Text>
                      {!!student.student_email && <Text style={styles.studentRowMeta}>{student.student_email}</Text>}
                      <Text style={styles.studentRowMeta}>{capitalize(student.instrument)} · {capitalize(student.level)}</Text>
                    </View>
                    <Text style={[styles.statusBadge, { backgroundColor: statusColor.bg, color: statusColor.color }]}>{capitalize(student.status)}</Text>
                  </View>

                  <View style={styles.studentStatsRow}>
                    <Text style={[styles.progressPill, { color: getProgressColor(student.progress_percentage) }]}>{student.progress_percentage}%</Text>
                    <Text style={styles.studentRowMeta}>{student.completed_courses || 0}/{student.enrolled_courses || 0} courses</Text>
                    <Text style={styles.studentRowMeta}>{formatDate(student.last_active)}</Text>
                  </View>
                </View>
              )
            }) : (
              <View style={styles.centerBox}><Text style={styles.mutedCenter}>No students match your filters</Text></View>
            )}
          </View>
        </>
      )}

      {activeTab === 'courses' && progressData.course_stats && (
        <>
          {progressData.course_stats.length > 0 ? progressData.course_stats.map((course) => (
            <View key={course.id} style={styles.contentCard}>
              <View style={styles.courseRow}>
                <View style={styles.courseIcon}><Text>📚</Text></View>
                <View style={styles.flexOne}>
                  <Text numberOfLines={1} style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.studentRowMeta}>{course.enrollments} student{course.enrollments !== 1 ? 's' : ''} enrolled</Text>
                </View>
              </View>

              <View style={styles.progressHeaderRow}>
                <Text style={styles.studentRowMeta}>Average Progress</Text>
                <Text style={[styles.progressPill, { color: getProgressColor(course.avg_progress) }]}>{course.avg_progress}%</Text>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${course.avg_progress}%`, backgroundColor: getProgressColor(course.avg_progress) }]} /></View>
            </View>
          )) : (
            <View style={styles.contentCard}>
              <View style={styles.centerBox}>
                <Text style={styles.emptyBigIcon}>📕</Text>
                <Text style={styles.emptyTitle}>Your musical journey starts here.</Text>
                <Text style={styles.emptyBody}>Create courses to see enrollment and progress analytics.</Text>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    gap: 16,
  },
  flexOne: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  loaderWrap: {
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: '#6b7280',
    fontSize: 14,
  },
  centerError: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  errorIcon: { fontSize: 64 },
  errorTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  errorBody: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 10 },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#667eea',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  headerBlock: { marginBottom: 10 },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#4b5563',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  emptyBigIcon: { fontSize: 56, color: '#d1d5db' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  emptyBody: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  refreshBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  refreshBtnText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  tabActive: { borderColor: '#667eea', backgroundColor: '#f0f4f8' },
  tabInactive: { borderColor: '#e5e7eb', backgroundColor: '#fff' },
  tabTextActive: { color: '#667eea', fontWeight: '600', fontSize: 13 },
  tabTextInactive: { color: '#6b7280', fontWeight: '500', fontSize: 13 },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    minWidth: 160,
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricLabel: { fontSize: 13, color: '#4b5563', marginBottom: 4, fontWeight: '500' },
  metricValue: { fontSize: 30, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  metricSub: { fontSize: 12, color: '#4b5563' },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f7fa',
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  distLabel: { flex: 1, fontSize: 13, color: '#4b5563', fontWeight: '500' },
  distValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '700', marginRight: 8 },
  distPercent: { fontSize: 12, color: '#6b7280' },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    gap: 6,
  },
  weekItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  weekBar: { width: 20, borderRadius: 6 },
  weekDate: { fontSize: 11, color: '#6b7280', marginTop: 6 },
  weekDateToday: { fontWeight: '700' },
  weekCount: { fontSize: 12, fontWeight: '600', color: '#1a1a1a' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  studentListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#f59e0b', fontWeight: '700', fontSize: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  studentRowName: { fontWeight: '600', color: '#1a1a1a', fontSize: 14 },
  studentRowMeta: { fontSize: 12, color: '#6b7280' },
  progressPill: { fontSize: 13, fontWeight: '700' },
  warnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  mutedCenter: { color: '#6b7280', textAlign: 'center' },
  centerGood: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 6 },
  goodIcon: { fontSize: 34 },
  searchInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  filtersGrid: {
    gap: 8,
  },
  filterBox: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  clearBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  resultsText: { fontSize: 12, color: '#6b7280' },
  sortRow: { maxHeight: 44 },
  sortBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  sortBtnText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
  studentCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  studentHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  studentStatsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },
})

export default TeacherProgress
