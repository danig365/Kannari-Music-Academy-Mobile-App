import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import LoadingSpinner from '../shared/LoadingSpinner'
import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const SUBMISSION_TYPES = [
  { value: 'audio', label: 'Audio Recording', color: '#8b5cf6' },
  { value: 'video', label: 'Video Recording', color: '#ec4899' },
  { value: 'file_upload', label: 'File Upload', color: '#f59e0b' },
  { value: 'discussion', label: 'Discussion Thread', color: '#06b6d4' },
  { value: 'multiple_choice', label: 'Multiple Choice', color: '#3b82f6' },
]

const STATUS_BADGES = {
  assigned: { label: 'Assigned', bg: '#dbeafe', color: '#1d4ed8' },
  submitted: { label: 'Submitted', bg: '#dcfce7', color: '#166534' },
  late: { label: 'Late', bg: '#fee2e2', color: '#991b1b' },
  graded: { label: 'Graded', bg: '#f3e8ff', color: '#7c3aed' },
}

const getTypeInfo = (type) => SUBMISSION_TYPES.find((item) => item.value === type) || SUBMISSION_TYPES[0]

const SchoolLessonAssignments = () => {
  const [schoolId, setSchoolId] = useState(null)

  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [groups, setGroups] = useState([])
  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])

  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState({ status: '', submission_type: '' })
  const [mcQuestions, setMcQuestions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'individual',
    submission_type: 'audio',
    student: '',
    group_class: '',
    lesson: '',
    due_date: '',
    audio_required: true,
    max_points: 100,
    notes: '',
  })

  useEffect(() => {
    const bootstrap = async () => {
      const storedSchoolId = await AsyncStorage.getItem('schoolId')
      setSchoolId(storedSchoolId)

      if (!storedSchoolId) {
        setLoading(false)
        return
      }

      fetchData(storedSchoolId)
    }

    bootstrap()
  }, [])

  const fetchData = async (currentSchoolId = schoolId) => {
    if (!currentSchoolId) return

    try {
      const [assignRes, studentRes, groupRes, courseRes] = await Promise.all([
        axios.get(`${baseUrl}/school/lesson-assignments/${currentSchoolId}/`),
        axios.get(`${baseUrl}/school/students/${currentSchoolId}/`),
        axios.get(`${baseUrl}/school/groups/${currentSchoolId}/`),
        axios.get(`${baseUrl}/school/courses/${currentSchoolId}/`),
      ])
      setAssignments(assignRes.data)
      setStudents(studentRes.data)
      setGroups(groupRes.data)
      setCourses(courseRes.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId)
    if (!courseId) {
      setModules([])
      setLessons([])
      return
    }

    try {
      const res = await axios.get(`${baseUrl}/course-chapters/${courseId}`)
      setModules(res.data)
      setLessons([])
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }

  const handleModuleChange = async (moduleId) => {
    if (!moduleId) {
      setLessons([])
      return
    }

    try {
      const res = await axios.get(`${baseUrl}/admin/module/${moduleId}/lessons/`)
      setLessons(res.data)
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  const validateMcQuestions = () => {
    if (mcQuestions.length === 0) {
      Alert.alert('Validation', 'Please add at least one multiple-choice question.')
      return false
    }

    for (let i = 0; i < mcQuestions.length; i += 1) {
      const question = mcQuestions[i]
      if (!question.question_text?.trim()) {
        Alert.alert('Validation', `Question ${i + 1}: question text is required.`)
        return false
      }
      if (!question.option_a?.trim() || !question.option_b?.trim()) {
        Alert.alert('Validation', `Question ${i + 1}: options A and B are required.`)
        return false
      }
    }

    return true
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignment_type: 'individual',
      submission_type: 'audio',
      student: '',
      group_class: '',
      lesson: '',
      due_date: '',
      audio_required: true,
      max_points: 100,
      notes: '',
    })
    setMcQuestions([])
    setSelectedCourse('')
    setModules([])
    setLessons([])
  }

  const handleSubmit = async () => {
    if (!schoolId) return

    if (formData.submission_type === 'multiple_choice' && !validateMcQuestions()) return

    try {
      const data = { ...formData, school: schoolId }

      if (formData.assignment_type === 'individual') {
        delete data.group_class
      } else {
        delete data.student
      }

      if (formData.submission_type !== 'audio') {
        data.audio_required = false
      }

      if (formData.submission_type === 'multiple_choice') {
        data.mc_questions = mcQuestions.map((question) => ({
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c || '',
          option_d: question.option_d || '',
          correct_option: question.correct_option,
          points: question.points || 1,
        }))
      }

      await axios.post(`${baseUrl}/school/lesson-assignments/${schoolId}/`, data)
      setMessage('Assignment created successfully!')
      setShowForm(false)
      resetForm()
      fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`Error creating assignment: ${error.response?.data?.message || 'Unknown error'}`)
    }
  }

  const handleDelete = async (id) => {
    Alert.alert('Remove Assignment', 'Remove this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${baseUrl}/school/lesson-assignment/${id}/`)
            fetchData()
          } catch (error) {
            console.error('Error:', error)
          }
        },
      },
    ])
  }

  const getComputedStatus = (assignment) => {
    if (assignment.computed_status) return assignment.computed_status
    if (assignment.status) return assignment.status
    return 'assigned'
  }

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (filter.status && getComputedStatus(assignment) !== filter.status) return false
      if (filter.submission_type && assignment.submission_type !== filter.submission_type) return false
      return true
    })
  }, [assignments, filter])

  const statusCounts = useMemo(() => {
    const counts = { assigned: 0, submitted: 0, late: 0, graded: 0 }
    assignments.forEach((assignment) => {
      const currentStatus = getComputedStatus(assignment)
      if (counts[currentStatus] !== undefined) counts[currentStatus] += 1
    })
    return counts
  }, [assignments])

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <LoadingSpinner size='lg' text='Loading assignments...' />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>📒 Lesson Assignments</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowForm((prev) => !prev)}>
          <Text style={styles.primaryBtnText}>{showForm ? 'Cancel' : 'Create Assignment'}</Text>
        </TouchableOpacity>
      </View>

      {!!message && (
        <View style={styles.messageWrap}>
          <Text style={styles.messageText}>{message}</Text>
          <TouchableOpacity onPress={() => setMessage('')}>
            <Text style={styles.messageClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsWrap}>
        {Object.entries(STATUS_BADGES).map(([key, badge]) => {
          const isActive = filter.status === key
          return (
            <TouchableOpacity
              key={key}
              style={[styles.statCard, { backgroundColor: isActive ? badge.bg : '#fff' }]}
              onPress={() => setFilter((prev) => ({ ...prev, status: prev.status === key ? '' : key }))}
            >
              <Text style={[styles.statValue, { color: badge.color }]}>{statusCounts[key]}</Text>
              <Text style={styles.statLabel}>{badge.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {showForm && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>➕ Create Assignment</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder='Assignment title (or uses lesson title)'
            />

            <Text style={styles.label}>Submission Type *</Text>
            <View style={styles.typePillsWrap}>
              {SUBMISSION_TYPES.map((type) => {
                const selected = formData.submission_type === type.value
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typePill,
                      {
                        borderColor: selected ? type.color : '#e2e8f0',
                        backgroundColor: selected ? `${type.color}20` : '#fff',
                      },
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        submission_type: type.value,
                        audio_required: type.value === 'audio',
                      })
                    }
                  >
                    <Text style={[styles.typePillText, { color: selected ? type.color : '#64748b' }]}>{type.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={styles.label}>Assignment Type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.assignment_type}
                onValueChange={(value) => setFormData({ ...formData, assignment_type: value, student: '', group_class: '' })}
              >
                <Picker.Item label='Individual Student' value='individual' />
                <Picker.Item label='Group Class' value='group' />
              </Picker>
            </View>

            <Text style={styles.label}>{formData.assignment_type === 'individual' ? 'Student *' : 'Group Class *'}</Text>
            <View style={styles.pickerWrap}>
              {formData.assignment_type === 'individual' ? (
                <Picker
                  selectedValue={formData.student}
                  onValueChange={(value) => setFormData({ ...formData, student: value })}
                >
                  <Picker.Item label='Select Student' value='' />
                  {students.map((student) => (
                    <Picker.Item
                      key={student.id}
                      value={String(student.student?.id || '')}
                      label={student.student?.fullname || 'Student'}
                    />
                  ))}
                </Picker>
              ) : (
                <Picker
                  selectedValue={formData.group_class}
                  onValueChange={(value) => setFormData({ ...formData, group_class: value })}
                >
                  <Picker.Item label='Select Group' value='' />
                  {groups.map((group) => (
                    <Picker.Item key={group.id} value={String(group.id)} label={group.name} />
                  ))}
                </Picker>
              )}
            </View>

            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
              placeholder='YYYY-MM-DD'
            />

            <Text style={styles.label}>Course</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={selectedCourse} onValueChange={handleCourseChange}>
                <Picker.Item label='Select Course' value='' />
                {courses.map((course) => (
                  <Picker.Item
                    key={course.id}
                    value={String(course.course?.id || course.id)}
                    label={course.course?.title || 'Course'}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Module</Text>
            <View style={styles.pickerWrap}>
              <Picker enabled={modules.length > 0} onValueChange={handleModuleChange}>
                <Picker.Item label='Select Module' value='' />
                {modules.map((module) => (
                  <Picker.Item key={module.id} value={String(module.id)} label={module.title} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Lesson</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.lesson}
                enabled={lessons.length > 0}
                onValueChange={(value) => setFormData({ ...formData, lesson: value })}
              >
                <Picker.Item label='Select Lesson' value='' />
                {lessons.map((lesson) => (
                  <Picker.Item key={lesson.id} value={String(lesson.id)} label={lesson.title} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Max Points</Text>
            <TextInput
              style={styles.input}
              keyboardType='numeric'
              value={String(formData.max_points)}
              onChangeText={(text) => setFormData({ ...formData, max_points: text })}
            />

            <Text style={styles.label}>Description / Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder='Describe what students should do...'
            />

            <Text style={styles.label}>Internal Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder='Internal notes (not shown to students)'
            />

            {formData.submission_type === 'multiple_choice' && (
              <View style={styles.mcWrap}>
                <View style={styles.mcHead}>
                  <Text style={styles.mcTitle}>Multiple Choice Questions ({mcQuestions.length})</Text>
                  <TouchableOpacity
                    style={styles.smallPrimaryBtn}
                    onPress={() =>
                      setMcQuestions((prev) => [
                        ...prev,
                        {
                          question_text: '',
                          option_a: '',
                          option_b: '',
                          option_c: '',
                          option_d: '',
                          correct_option: 'a',
                          points: 1,
                        },
                      ])
                    }
                  >
                    <Text style={styles.smallPrimaryBtnText}>Add Question</Text>
                  </TouchableOpacity>
                </View>

                {mcQuestions.length === 0 ? (
                  <Text style={styles.mcEmptyText}>No questions yet. Add one to build your quiz.</Text>
                ) : (
                  mcQuestions.map((question, questionIdx) => (
                    <View key={questionIdx} style={styles.mcCard}>
                      <View style={styles.mcCardHead}>
                        <Text style={styles.mcCardTitle}>Question {questionIdx + 1}</Text>
                        <View style={styles.mcPointsWrap}>
                          <Text style={styles.pointsLabel}>Pts</Text>
                          <TextInput
                            style={styles.pointsInput}
                            keyboardType='numeric'
                            value={String(question.points || 1)}
                            onChangeText={(text) =>
                              setMcQuestions((prev) =>
                                prev.map((item, idx) =>
                                  idx === questionIdx ? { ...item, points: parseInt(text, 10) || 1 } : item
                                )
                              )
                            }
                          />
                          <TouchableOpacity
                            style={styles.removeQuestionBtn}
                            onPress={() => setMcQuestions((prev) => prev.filter((_, idx) => idx !== questionIdx))}
                          >
                            <Text style={styles.removeQuestionText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TextInput
                        style={styles.input}
                        value={question.question_text}
                        placeholder='Enter question text...'
                        onChangeText={(text) =>
                          setMcQuestions((prev) =>
                            prev.map((item, idx) => (idx === questionIdx ? { ...item, question_text: text } : item))
                          )
                        }
                      />

                      {['a', 'b', 'c', 'd'].map((letter) => {
                        const optionKey = `option_${letter}`
                        return (
                          <View key={letter} style={styles.optionRow}>
                            <TouchableOpacity
                              style={[
                                styles.correctOptionBtn,
                                question.correct_option === letter ? styles.correctOptionBtnActive : null,
                              ]}
                              onPress={() =>
                                setMcQuestions((prev) =>
                                  prev.map((item, idx) =>
                                    idx === questionIdx ? { ...item, correct_option: letter } : item
                                  )
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.correctOptionBtnText,
                                  question.correct_option === letter ? styles.correctOptionBtnTextActive : null,
                                ]}
                              >
                                {letter.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                            <TextInput
                              style={styles.optionInput}
                              value={question[optionKey]}
                              placeholder={`Option ${letter.toUpperCase()}${letter <= 'b' ? ' (required)' : ' (optional)'}`}
                              onChangeText={(text) =>
                                setMcQuestions((prev) =>
                                  prev.map((item, idx) =>
                                    idx === questionIdx ? { ...item, [optionKey]: text } : item
                                  )
                                )
                              }
                            />
                          </View>
                        )
                      })}
                    </View>
                  ))
                )}
              </View>
            )}

            <View style={styles.formActionsRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
                <Text style={styles.primaryBtnText}>Create Assignment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.filtersRow}>
        <Text style={styles.filterLabel}>Filter:</Text>
        <View style={styles.filterPickerWrap}>
          <Picker
            selectedValue={filter.submission_type}
            onValueChange={(value) => setFilter((prev) => ({ ...prev, submission_type: value }))}
          >
            <Picker.Item label='All Types' value='' />
            {SUBMISSION_TYPES.map((type) => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>
        {(filter.status || filter.submission_type) && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setFilter({ status: '', submission_type: '' })}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>📋 All Assignments ({filteredAssignments.length})</Text>
        </View>
        <View style={styles.cardBody}>
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment, index) => {
              const typeInfo = getTypeInfo(assignment.submission_type)
              const status = getComputedStatus(assignment)
              const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.assigned
              return (
                <View key={assignment.id || index} style={styles.assignmentRow}>
                  <View style={styles.rowTop}>
                    <Text style={styles.assignmentIndex}>#{index + 1}</Text>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(assignment.id)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.assignmentTitle}>
                    {assignment.display_title || assignment.title || assignment.lesson_title || 'Untitled'}
                  </Text>
                  {!!assignment.description && (
                    <Text style={styles.assignmentDescription} numberOfLines={2}>
                      {assignment.description}
                    </Text>
                  )}

                  <View style={styles.tagsWrap}>
                    <Text style={[styles.tag, { backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }]}>
                      {typeInfo.label}
                    </Text>
                    <Text
                      style={[
                        styles.tag,
                        {
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.color,
                        },
                      ]}
                    >
                      {statusBadge.label}
                    </Text>
                    <Text style={[styles.tag, styles.targetTag]}>
                      {assignment.assignment_type === 'group' ? 'Group' : 'Individual'}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Target: {assignment.student_name || assignment.group_name || 'N/A'}</Text>
                    <Text style={styles.metaText}>Due: {assignment.due_date || '—'}</Text>
                    <Text style={styles.metaText}>Points: {assignment.max_points || 100}</Text>
                  </View>
                </View>
              )
            })
          ) : (
            <Text style={styles.emptyState}>
              {assignments.length > 0
                ? 'No assignments match your filters.'
                : 'No lesson assignments yet. Click "Create Assignment" to get started.'}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a2332',
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  messageWrap: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    color: '#1e40af',
    fontSize: 12,
    flex: 1,
  },
  messageClose: {
    color: '#1e40af',
    fontWeight: '700',
  },
  statsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardHeader: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a2332',
  },
  cardBody: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#1e293b',
    fontSize: 13,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  typePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mcWrap: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mcHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mcTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  smallPrimaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smallPrimaryBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  mcEmptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    paddingVertical: 10,
  },
  mcCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  mcCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  mcCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  mcPointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  pointsInput: {
    width: 56,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#1e293b',
    textAlign: 'center',
  },
  removeQuestionBtn: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  removeQuestionText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  correctOptionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctOptionBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  correctOptionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  correctOptionBtnTextActive: {
    color: '#fff',
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1e293b',
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  filterPickerWrap: {
    minWidth: 170,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  clearBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  assignmentRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 12,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentIndex: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  assignmentDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  targetTag: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  metaRow: {
    gap: 2,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  emptyState: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 24,
  },
})

export default SchoolLessonAssignments
