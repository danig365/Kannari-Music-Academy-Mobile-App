import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaUrl = API_BASE_URL.replace('/api', '')

const TeacherStudents = () => {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterInstrument, setFilterInstrument] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortField, setSortField] = useState('student_name')
  const [sortDir, setSortDir] = useState('asc')

  const [showAddModal, setShowAddModal] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addForm, setAddForm] = useState({ student: null, instrument: 'piano', level: 'beginner', notes: '' })

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignStudent, setAssignStudent] = useState(null)
  const [teacherCourses, setTeacherCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  const [expandedStudentId, setExpandedStudentId] = useState(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ id: null, instrument: '', level: '', notes: '', status: '' })

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

  const fetchStudents = useCallback(async () => {
    if (!teacherId) return

    try {
      setLoading(true)
      const response = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`)
      if (response.data && response.data.length > 0) {
        setStudents(response.data)
      } else {
        try {
          const enrollRes = await axios.get(`${baseUrl}/teacher/students-from-enrollments/${teacherId}/`)
          if (enrollRes.data.bool && enrollRes.data.students?.length > 0) {
            for (const s of enrollRes.data.students) {
              try {
                await axios.post(`${baseUrl}/teacher/students/${teacherId}/`, {
                  teacher: parseInt(teacherId),
                  student: s.id,
                  instrument: s.instrument || 'piano',
                  level: s.level || 'beginner',
                  status: 'active',
                  progress_percentage: s.progress_percentage || 0,
                })
              } catch (e) {
              }
            }
            const refetch = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`)
            setStudents(refetch.data || [])
          } else {
            setStudents([])
          }
        } catch (e) {
          setStudents([])
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (!teacherId || studentSearch.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await axios.get(`${baseUrl}/teacher/search-students/${teacherId}/?search=${encodeURIComponent(studentSearch)}`)
        setSearchResults(res.data.students || [])
      } catch (e) {
        setSearchResults([])
      }
      setSearching(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [studentSearch, teacherId])

  const filteredStudents = useMemo(() => {
    let filtered = [...students]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(s =>
        (s.student_name || '').toLowerCase().includes(q) ||
        (s.student_email || '').toLowerCase().includes(q)
      )
    }
    if (filterInstrument) filtered = filtered.filter(s => s.instrument === filterInstrument)
    if (filterLevel) filtered = filtered.filter(s => s.level === filterLevel)
    if (filterStatus) filtered = filtered.filter(s => s.status === filterStatus)

    filtered.sort((a, b) => {
      let aVal = a[sortField] ?? ''
      let bVal = b[sortField] ?? ''
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }
      if (sortDir === 'asc') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    })

    return filtered
  }, [students, searchTerm, filterInstrument, filterLevel, filterStatus, sortField, sortDir])

  const uniqueInstruments = useMemo(() => {
    return [...new Set(students.map(s => s.instrument).filter(Boolean))].sort()
  }, [students])

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  const getProgressColor = (p) => {
    if (p >= 80) return '#22c55e'
    if (p >= 60) return '#3b82f6'
    if (p >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#16a34a' }
      case 'warning': return { bg: '#fef3c7', color: '#d97706' }
      case 'inactive': return { bg: '#fee2e2', color: '#dc2626' }
      default: return { bg: '#f1f5f9', color: '#64748b' }
    }
  }

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A'

  const handleAddStudent = async () => {
    if (!addForm.student) {
      Alert.alert('Error', 'Please select a student')
      return
    }
    try {
      await axios.post(`${baseUrl}/teacher/students/${teacherId}/`, {
        teacher: parseInt(teacherId),
        student: addForm.student.id,
        instrument: addForm.instrument,
        level: addForm.level,
        notes: addForm.notes,
        status: 'active',
        progress_percentage: 0,
      })
      Alert.alert('Success', `${addForm.student.fullname} has been added as your student`)
      setShowAddModal(false)
      setAddForm({ student: null, instrument: 'piano', level: 'beginner', notes: '' })
      setStudentSearch('')
      setSearchResults([])
      fetchStudents()
    } catch (error) {
      const msg = error.response?.data?.student?.[0] || error.response?.data?.non_field_errors?.[0] || 'Failed to add student'
      Alert.alert('Error', msg)
    }
  }

  const handleRemoveStudent = (student) => {
    Alert.alert(
      'Remove Student?',
      `Remove ${student.student_name} from your students list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${baseUrl}/teacher/student/${student.id}/`)
              Alert.alert('Removed', `${student.student_name} has been removed`)
              fetchStudents()
              if (expandedStudentId === student.id) setExpandedStudentId(null)
            } catch (e) {
              Alert.alert('Error', 'Failed to remove student')
            }
          },
        },
      ]
    )
  }

  const openEditModal = (student) => {
    setEditForm({
      id: student.id,
      instrument: student.instrument || 'piano',
      level: student.level || 'beginner',
      notes: student.notes || '',
      status: student.status || 'active',
    })
    setShowEditModal(true)
  }

  const handleEditStudent = async () => {
    try {
      await axios.patch(`${baseUrl}/teacher/student/${editForm.id}/`, {
        instrument: editForm.instrument,
        level: editForm.level,
        notes: editForm.notes,
        status: editForm.status,
      })
      Alert.alert('Updated', 'Student info updated successfully')
      setShowEditModal(false)
      fetchStudents()
    } catch (e) {
      Alert.alert('Error', 'Failed to update student')
    }
  }

  const openAssignModal = async (student) => {
    setAssignStudent(student)
    setLoadingCourses(true)
    setShowAssignModal(true)
    try {
      const res = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${student.student?.id || student.student}/`)
      setTeacherCourses(res.data.courses || [])
    } catch (e) {
      setTeacherCourses([])
    }
    setLoadingCourses(false)
  }

  const handleAssignCourse = async (courseId) => {
    const studentId = assignStudent.student?.id || assignStudent.student
    try {
      const res = await axios.post(`${baseUrl}/teacher/assign-course/${teacherId}/`, {
        student_id: studentId,
        course_id: courseId,
      })
      if (res.data.bool) {
        Alert.alert('Enrolled!', res.data.message)
        const updated = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${studentId}/`)
        setTeacherCourses(updated.data.courses || [])
        fetchStudents()
      } else {
        Alert.alert('Info', res.data.message)
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || e.response?.data?.message || 'Failed to assign course')
    }
  }

  const handleUnassignCourse = async (courseId) => {
    const studentId = assignStudent.student?.id || assignStudent.student
    Alert.alert('Remove Enrollment?', 'This will remove the student from this course.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.post(`${baseUrl}/teacher/unassign-course/${teacherId}/`, {
              student_id: studentId,
              course_id: courseId,
            })
            Alert.alert('Removed', 'Enrollment removed')
            const updated = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${studentId}/`)
            setTeacherCourses(updated.data.courses || [])
            fetchStudents()
          } catch (e) {
            Alert.alert('Error', 'Failed to remove enrollment')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size='large' color='#667eea' />
        <Text style={styles.loaderText}>Loading students...</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>My Students</Text>
          <Text style={styles.pageSub}>Manage your assigned students, track progress, and assign courses.</Text>
        </View>
        <View style={styles.rowBtns}>
          <TouchableOpacity onPress={fetchStudents} style={styles.outlineBtn}><Text style={styles.outlineBtnText}>Refresh</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Add Student</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Total Students</Text><Text style={styles.statValue}>{students.length}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Active</Text><Text style={styles.statValue}>{students.filter(s => s.status === 'active').length}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Needs Attention</Text><Text style={styles.statValue}>{students.filter(s => s.status === 'warning' || s.status === 'inactive').length}</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Avg Progress</Text><Text style={styles.statValue}>{students.length > 0 ? Math.round(students.reduce((a, s) => a + (s.progress_percentage || 0), 0) / students.length) : 0}%</Text></View>
      </View>

      <View style={styles.card}>
        <TextInput style={styles.searchInput} placeholder='Search by name or email...' value={searchTerm} onChangeText={setSearchTerm} />
        <View style={styles.filtersRow}>
          <View style={styles.pickerBox}><Picker selectedValue={filterInstrument} onValueChange={setFilterInstrument}><Picker.Item label='All Instruments' value='' />{uniqueInstruments.map(i => <Picker.Item key={i} label={capitalize(i)} value={i} />)}</Picker></View>
          <View style={styles.pickerBox}><Picker selectedValue={filterLevel} onValueChange={setFilterLevel}><Picker.Item label='All Levels' value='' /><Picker.Item label='Beginner' value='beginner' /><Picker.Item label='Intermediate' value='intermediate' /><Picker.Item label='Advanced' value='advanced' /></Picker></View>
          <View style={styles.pickerBox}><Picker selectedValue={filterStatus} onValueChange={setFilterStatus}><Picker.Item label='All Statuses' value='' /><Picker.Item label='Active' value='active' /><Picker.Item label='Warning' value='warning' /><Picker.Item label='Inactive' value='inactive' /></Picker></View>
        </View>
        <Text style={styles.metaText}>Showing {filteredStudents.length} of {students.length} {students.length === 1 ? 'student' : 'students'}</Text>
      </View>

      {filteredStudents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No students match your filters</Text>
        </View>
      ) : (
        filteredStudents.map((student) => {
          const sc = getStatusColor(student.status)
          const isExpanded = expandedStudentId === student.id
          return (
            <View key={student.id} style={styles.studentCard}>
              <TouchableOpacity onPress={() => setExpandedStudentId(isExpanded ? null : student.id)} style={styles.studentHeader}>
                <View style={styles.studentMain}>
                  {student.student_profile_img ? (
                    <Image source={{ uri: `${baseUrl}${student.student_profile_img}` }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{(student.student_name || '?').charAt(0).toUpperCase()}</Text></View>
                  )}
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.student_name}</Text>
                    {!!student.student_email && <Text style={styles.studentEmail}>{student.student_email}</Text>}
                    <Text style={styles.studentMeta}>{capitalize(student.instrument)} · {capitalize(student.level)} · {student.progress_percentage}%</Text>
                  </View>
                </View>
                <Text style={[styles.statusBadge, { backgroundColor: sc.bg, color: sc.color }]}>{capitalize(student.status)}</Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.smallBtnBlue} onPress={() => openAssignModal(student)}><Text style={styles.smallBtnText}>Assign Course {getSortIcon('progress_percentage')}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.smallBtnGreen} onPress={() => openEditModal(student)}><Text style={styles.smallBtnText}>Edit</Text></TouchableOpacity>
                <TouchableOpacity style={styles.smallBtnRed} onPress={() => handleRemoveStudent(student)}><Text style={styles.smallBtnText}>Remove</Text></TouchableOpacity>
              </View>

              {isExpanded && (
                <View style={styles.expandedBox}>
                  <Text style={styles.expandedTitle}>Student Info</Text>
                  <Text style={styles.expandedText}>Assigned: {student.assigned_at ? new Date(student.assigned_at).toLocaleDateString() : 'N/A'}</Text>
                  {!!student.notes && <Text style={styles.expandedText}>Notes: {student.notes}</Text>}
                  <Text style={styles.expandedTitle}>Enrolled Courses</Text>
                  {student.enrolled_courses && student.enrolled_courses.length > 0 ? (
                    student.enrolled_courses.map((c) => (
                      <View key={c.enrollment_id} style={styles.enrolledItem}>
                        <Text style={styles.enrolledTitle}>{c.course_title}</Text>
                        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${c.progress_percent}%`, backgroundColor: getProgressColor(c.progress_percent) }]} /></View>
                        <Text style={styles.enrolledSub}>{c.progress_percent}% · {c.enrolled_time}</Text>
                      </View>
                    ))
                  ) : <Text style={styles.enrolledSub}>No courses enrolled yet.</Text>}
                </View>
              )}
            </View>
          )
        })
      )}

      {showAddModal && (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Student</Text>
          <TextInput style={styles.searchInput} placeholder='Type name or email...' value={studentSearch} onChangeText={setStudentSearch} />
          {searching && <Text style={styles.metaText}>Searching...</Text>}
          {searchResults.map((s) => (
            <TouchableOpacity key={s.id} style={styles.searchResultRow} onPress={() => { setAddForm({ ...addForm, student: s }); setSearchResults([]) }}>
              <Text style={styles.searchResultName}>{s.fullname}</Text>
              <Text style={styles.searchResultEmail}>{s.email}</Text>
            </TouchableOpacity>
          ))}
          {addForm.student && <Text style={styles.metaText}>Selected: {addForm.student.fullname}</Text>}

          <View style={styles.filtersRow}>
            <View style={styles.pickerBox}><Picker selectedValue={addForm.instrument} onValueChange={(value) => setAddForm({ ...addForm, instrument: value })}><Picker.Item label='Piano' value='piano' /><Picker.Item label='Guitar' value='guitar' /><Picker.Item label='Violin' value='violin' /><Picker.Item label='Voice' value='voice' /><Picker.Item label='Drums' value='drums' /><Picker.Item label='Flute' value='flute' /><Picker.Item label='Saxophone' value='saxophone' /><Picker.Item label='Other' value='other' /></Picker></View>
            <View style={styles.pickerBox}><Picker selectedValue={addForm.level} onValueChange={(value) => setAddForm({ ...addForm, level: value })}><Picker.Item label='Beginner' value='beginner' /><Picker.Item label='Intermediate' value='intermediate' /><Picker.Item label='Advanced' value='advanced' /></Picker></View>
          </View>

          <TextInput style={[styles.searchInput, styles.notesInput]} placeholder='Any notes about this student...' value={addForm.notes} onChangeText={(value) => setAddForm({ ...addForm, notes: value })} multiline={true} />
          <View style={styles.rowBtns}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowAddModal(false)}><Text style={styles.outlineBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddStudent}><Text style={styles.primaryBtnText}>Add Student</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {showAssignModal && assignStudent && (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Assign Course to {assignStudent.student_name}</Text>
          {loadingCourses ? <ActivityIndicator color='#667eea' /> : teacherCourses.length === 0 ? (
            <View>
              <Text style={styles.metaText}>You don't have any courses yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherCourseManagement')} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Create a Course</Text></TouchableOpacity>
            </View>
          ) : (
            teacherCourses.map((course) => (
              <View key={course.id} style={styles.courseRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseMeta}>{course.total_enrolled} students enrolled</Text>
                </View>
                {course.is_enrolled ? (
                  <TouchableOpacity style={styles.smallBtnRed} onPress={() => handleUnassignCourse(course.id)}><Text style={styles.smallBtnText}>Unassign</Text></TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.smallBtnBlue} onPress={() => handleAssignCourse(course.id)}><Text style={styles.smallBtnText}>Enroll</Text></TouchableOpacity>
                )}
              </View>
            ))
          )}
          <View style={styles.rowBtns}><TouchableOpacity style={styles.outlineBtn} onPress={() => setShowAssignModal(false)}><Text style={styles.outlineBtnText}>Close</Text></TouchableOpacity></View>
        </View>
      )}

      {showEditModal && (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Student</Text>
          <View style={styles.filtersRow}>
            <View style={styles.pickerBox}><Picker selectedValue={editForm.instrument} onValueChange={(value) => setEditForm({ ...editForm, instrument: value })}><Picker.Item label='Piano' value='piano' /><Picker.Item label='Guitar' value='guitar' /><Picker.Item label='Violin' value='violin' /><Picker.Item label='Voice' value='voice' /><Picker.Item label='Drums' value='drums' /><Picker.Item label='Flute' value='flute' /><Picker.Item label='Saxophone' value='saxophone' /><Picker.Item label='Other' value='other' /></Picker></View>
            <View style={styles.pickerBox}><Picker selectedValue={editForm.level} onValueChange={(value) => setEditForm({ ...editForm, level: value })}><Picker.Item label='Beginner' value='beginner' /><Picker.Item label='Intermediate' value='intermediate' /><Picker.Item label='Advanced' value='advanced' /></Picker></View>
          </View>
          <View style={styles.pickerBox}><Picker selectedValue={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}><Picker.Item label='Active' value='active' /><Picker.Item label='Warning' value='warning' /><Picker.Item label='Inactive' value='inactive' /></Picker></View>
          <TextInput style={[styles.searchInput, styles.notesInput]} placeholder='Teacher notes about this student...' value={editForm.notes} onChangeText={(value) => setEditForm({ ...editForm, notes: value })} multiline={true} />
          <View style={styles.rowBtns}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowEditModal(false)}><Text style={styles.outlineBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEditStudent}><Text style={styles.primaryBtnText}>Save Changes</Text></TouchableOpacity>
          </View>
        </View>
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
  loaderWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    color: '#6b7280',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pageSub: {
    fontSize: 15,
    color: '#4b5563',
  },
  rowBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  outlineBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    color: '#667eea',
    fontWeight: '600',
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#667eea',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    minWidth: 160,
    flexGrow: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  pickerBox: {
    minWidth: 150,
    flexGrow: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 10,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  studentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#64748b',
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  studentEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  studentMeta: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  smallBtnBlue: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnGreen: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnRed: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  expandedBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  expandedText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  enrolledItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  enrolledTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  enrolledSub: {
    fontSize: 11,
    color: '#6b7280',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  searchResultRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  courseMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  flexOne: {
    flex: 1,
  },
})

export default TeacherStudents
