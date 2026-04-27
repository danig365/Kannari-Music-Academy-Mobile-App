import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SUBMISSION_TYPES = [
  { value: 'audio', label: 'Audio Recording', icon: '🎤', color: '#8b5cf6' },
  { value: 'video', label: 'Video Recording', icon: '🎥', color: '#ec4899' },
  { value: 'file_upload', label: 'File Upload', icon: '📤', color: '#f59e0b' },
  { value: 'discussion', label: 'Discussion', icon: '💬', color: '#06b6d4' },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '✅', color: '#3b82f6' },
];

const STATUS_BADGES = {
  assigned: { label: 'Assigned', bg: '#dbeafe', color: '#1d4ed8', icon: '📋' },
  submitted: { label: 'Submitted', bg: '#fef3c7', color: '#92400e', icon: '✅' },
  late: { label: 'Late', bg: '#fee2e2', color: '#991b1b', icon: '⏰' },
  graded: { label: 'Graded', bg: '#dcfce7', color: '#166534', icon: '🏅' },
};

const getTypeMeta = (val) => SUBMISSION_TYPES.find(t => t.value === val) || SUBMISSION_TYPES[0];

const OPTION_LETTERS = ['a', 'b', 'c', 'd'];

const TeacherAssignmentCreate = () => {
  const [teacherId, setTeacherId] = useState(null)
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isCompact = width < 768

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', submission_type: 'audio', max_points: 100,
    due_date: '', course_id: '', lesson_id: '', assignment_type: 'individual',
    student: '', group_class: ''
  });

  const [mcQuestions, setMcQuestions] = useState([]);

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId') || await AsyncStorage.getItem('teacher_id')
        setTeacherId(id)
      } catch (error) {
        console.log(error)
      }
    }

    getTeacherId()
  }, [])

  useEffect(() => {
    if (!teacherId) return

    fetchAssignments();
    fetchCourses();
    fetchStudents();
    fetchGroups();
  }, [teacherId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/assignments/`);
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    if (!teacherId) {
      setCourses([]);
      return;
    }

    try {
      const res = await axios.get(`${baseUrl}/teacher-course/${teacherId}`);
      const courseData = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.results) ? res.data.results : []);
      setCourses(courseData);
    } catch (err) {
      try {
        const fallbackRes = await axios.get(`${baseUrl}/teacher-course/${teacherId}/`);
        const fallbackData = Array.isArray(fallbackRes.data)
          ? fallbackRes.data
          : (Array.isArray(fallbackRes.data?.results) ? fallbackRes.data.results : []);
        setCourses(fallbackData);
      } catch (fallbackErr) {
        console.error('Error fetching teacher courses:', fallbackErr);
        setCourses([]);
      }
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/groups/`);
      setGroups(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []));
    } catch (err) {
      console.error('Error fetching groups:', err);
      setGroups([]);
    }
  };

  const fetchModules = async (courseId) => {
    if (!courseId) {
      setModules([]);
      setLessons([]);
      return;
    }
    try {
      const res = await axios.get(`${baseUrl}/course-chapters/${courseId}`);
      setModules(Array.isArray(res.data) ? res.data : []);
      setLessons([]);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchLessons = async (moduleId) => {
    if (!moduleId) {
      setLessons([]);
      return;
    }
    try {
      const res = await axios.get(`${baseUrl}/admin/module/${moduleId}/lessons/`);
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'course_id') fetchModules(value);
  };

  const addMcQuestion = () => {
    setMcQuestions(prev => [...prev, {
      question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
      correct_option: 'a', points: 1
    }]);
  };

  const updateMcQuestion = (idx, field, value) => {
    setMcQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const removeMcQuestion = (idx) => {
    setMcQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Warning', 'Title is required')
      return;
    }

    if (form.assignment_type === 'individual' && !form.student) {
      Alert.alert('Warning', 'Please select a student for individual assignments.')
      return;
    }
    if (form.assignment_type === 'group' && !form.group_class) {
      Alert.alert('Warning', 'Please select a group class for group assignments.')
      return;
    }

    if (form.submission_type === 'multiple_choice') {
      if (mcQuestions.length === 0) {
        Alert.alert('Warning', 'Please add at least one multiple-choice question.')
        return;
      }

      for (let i = 0; i < mcQuestions.length; i++) {
        const q = mcQuestions[i];
        if (!q.question_text?.trim()) {
          Alert.alert('Warning', `Question ${i + 1}: question text is required.`)
          return;
        }
        if (!q.option_a?.trim() || !q.option_b?.trim()) {
          Alert.alert('Warning', `Question ${i + 1}: options A and B are required.`)
          return;
        }
        if (q.correct_option === 'c' && !q.option_c?.trim()) {
          Alert.alert('Warning', `Question ${i + 1}: option C is marked correct but empty.`)
          return;
        }
        if (q.correct_option === 'd' && !q.option_d?.trim()) {
          Alert.alert('Warning', `Question ${i + 1}: option D is marked correct but empty.`)
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        submission_type: form.submission_type,
        max_points: parseInt(form.max_points) || 100,
        due_date: form.due_date || null,
        lesson: form.lesson_id || null,
        assignment_type: form.assignment_type,
      };

      if (form.submission_type === 'multiple_choice') {
        payload.mc_questions = mcQuestions.map((q) => ({
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          correct_option: q.correct_option,
          points: q.points || 1,
        }));
      }

      if (form.assignment_type === 'individual' && form.student) {
        payload.student = form.student;
      }
      if (form.assignment_type === 'group' && form.group_class) {
        payload.group_class = form.group_class;
      }

      await axios.post(`${baseUrl}/teacher/${teacherId}/assignments/`, payload);

      Alert.alert('Success', 'Assignment created!')
      setShowForm(false);
      setForm({ title: '', description: '', submission_type: 'audio', max_points: 100, due_date: '', course_id: '', lesson_id: '', assignment_type: 'individual', student: '', group_class: '' });
      setMcQuestions([]);
      setModules([]);
      setLessons([]);
      await fetchAssignments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to create assignment')
    }
    setSaving(false);
  };

  const handleDelete = async (assignmentId) => {
    Alert.alert(
      'Delete Assignment?',
      'This will permanently delete this assignment and all its submissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete it',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${baseUrl}/teacher/${teacherId}/assignment/${assignmentId}/`);
              Alert.alert('Success', 'Deleted!')
              await fetchAssignments();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete assignment.')
            }
          }
        }
      ]
    )
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrap}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 72 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={[styles.container, isCompact ? styles.containerCompact : styles.containerWide]}>
          <View style={styles.contentShell}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>📚 Assignments</Text>
          <Text style={styles.headerSubtitle}>Create and manage multi-type assignments for your students</Text>
        </View>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={[styles.topButton, showForm ? styles.cancelTopButton : styles.newTopButton]}>
          <Text style={styles.topButtonText}>{showForm ? 'Cancel' : 'New Assignment'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>➕ Create New Assignment</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(text) => handleFormChange('title', text)}
            placeholder='Assignment title'
          />

          <Text style={styles.label}>Max Points</Text>
          <TextInput
            style={styles.input}
            value={String(form.max_points)}
            keyboardType='numeric'
            onChangeText={(text) => handleFormChange('max_points', text)}
          />

          <Text style={styles.label}>Due Date</Text>
          <TextInput
            style={styles.input}
            value={form.due_date}
            onChangeText={(text) => handleFormChange('due_date', text)}
            placeholder='YYYY-MM-DD'
          />

          <Text style={styles.label}>Submission Type *</Text>
          <View style={styles.typeWrap}>
            {SUBMISSION_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                onPress={() => handleFormChange('submission_type', t.value)}
                style={[
                  styles.typeChip,
                  {
                    borderColor: form.submission_type === t.value ? t.color : '#e2e8f0',
                    borderWidth: form.submission_type === t.value ? 2 : 1,
                    backgroundColor: form.submission_type === t.value ? `${t.color}20` : '#fff',
                  }
                ]}
              >
                <Text style={[styles.typeChipText, { color: form.submission_type === t.value ? t.color : '#64748b' }]}>{t.icon} {t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Assignment Type *</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.assignment_type} onValueChange={(value) => handleFormChange('assignment_type', value)}>
              <Picker.Item label='Individual Student' value='individual' />
              <Picker.Item label='Group Class' value='group' />
            </Picker>
          </View>

          {form.assignment_type === 'individual' ? (
            <>
              <Text style={styles.label}>Student *</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={form.student} onValueChange={(value) => handleFormChange('student', value)}>
                  <Picker.Item label='Select student...' value='' />
                  {students.map(s => (
                    <Picker.Item key={s.id} label={s.student?.fullname || s.fullname || `Student #${s.id}`} value={s.student?.id || s.id} />
                  ))}
                </Picker>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Group Class *</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={form.group_class} onValueChange={(value) => handleFormChange('group_class', value)}>
                  <Picker.Item label='Select group...' value='' />
                  {groups.map(g => <Picker.Item key={g.id} label={g.name || `Group #${g.id}`} value={g.id} />)}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.label}>Course (optional)</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.course_id} onValueChange={(value) => handleFormChange('course_id', value)}>
              <Picker.Item label='Select course...' value='' />
              {courses.map(c => <Picker.Item key={c.id} label={c.title} value={c.id} />)}
            </Picker>
          </View>

          {modules.length > 0 && (
            <>
              <Text style={styles.label}>Module</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue='' onValueChange={(value) => fetchLessons(value)}>
                  <Picker.Item label='Select module...' value='' />
                  {modules.map(m => <Picker.Item key={m.id} label={m.title} value={m.id} />)}
                </Picker>
              </View>
            </>
          )}

          {lessons.length > 0 && (
            <>
              <Text style={styles.label}>Lesson</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={form.lesson_id} onValueChange={(value) => handleFormChange('lesson_id', value)}>
                  <Picker.Item label='Select lesson...' value='' />
                  {lessons.map(l => <Picker.Item key={l.id} label={l.title} value={l.id} />)}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.label}>Description / Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline={true}
            value={form.description}
            onChangeText={(text) => handleFormChange('description', text)}
            placeholder='Instructions for students...'
          />

          {form.submission_type === 'multiple_choice' && (
            <View style={styles.mcWrap}>
              <View style={styles.mcHeader}>
                <Text style={styles.mcTitle}>✅ Multiple Choice Questions ({mcQuestions.length})</Text>
                <TouchableOpacity onPress={addMcQuestion} style={styles.addQuestionBtn}>
                  <Text style={styles.addQuestionBtnText}>+ Add Question</Text>
                </TouchableOpacity>
              </View>

              {mcQuestions.length === 0 && (
                <Text style={styles.emptyQuestions}>No questions yet. Tap “Add Question” to start building your quiz.</Text>
              )}

              {mcQuestions.map((q, qIdx) => (
                <View key={qIdx} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionTitle}>Question {qIdx + 1}</Text>
                    <View style={styles.questionHeaderRight}>
                      <Text style={styles.smallLabel}>Points:</Text>
                      <TextInput
                        style={styles.pointsInput}
                        value={String(q.points)}
                        keyboardType='numeric'
                        onChangeText={(text) => updateMcQuestion(qIdx, 'points', parseInt(text) || 1)}
                      />
                      <TouchableOpacity onPress={() => removeMcQuestion(qIdx)}>
                        <Text style={styles.deleteQ}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder='Enter question text...'
                    value={q.question_text}
                    onChangeText={(text) => updateMcQuestion(qIdx, 'question_text', text)}
                  />

                  <View style={styles.optionsWrap}>
                    {OPTION_LETTERS.map((letter, i) => {
                      const fieldName = `option_${letter}`;
                      const isCorrect = q.correct_option === letter;
                      return (
                        <View key={letter} style={styles.optionRow}>
                          <TouchableOpacity
                            onPress={() => updateMcQuestion(qIdx, 'correct_option', letter)}
                            style={[styles.correctBtn, isCorrect ? styles.correctBtnActive : styles.correctBtnInactive]}
                          >
                            <Text style={[styles.correctBtnText, isCorrect ? styles.correctBtnTextActive : styles.correctBtnTextInactive]}>{isCorrect ? '✓' : letter.toUpperCase()}</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.input, styles.optionInput]}
                            placeholder={`Option ${letter.toUpperCase()}${i < 2 ? ' (required)' : ' (optional)'}`}
                            value={q[fieldName]}
                            onChangeText={(text) => updateMcQuestion(qIdx, fieldName, text)}
                          />
                        </View>
                      );
                    })}
                  </View>

                  <Text style={styles.questionHint}>Tap circle to mark the correct answer. Options A & B are required.</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.formButtons}>
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.createBtn}>
              <Text style={styles.createBtnText}>{saving ? 'Creating...' : 'Create Assignment'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerState}><Text style={styles.centerStateText}>Loading...</Text></View>
      ) : assignments.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateIcon}>📘</Text>
          <Text style={styles.emptyStateText}>No assignments created yet</Text>
        </View>
      ) : (
        <View style={styles.assignmentList}>
          {assignments.map(a => {
            const meta = getTypeMeta(a.submission_type);
            const status = a.status || 'assigned';
            const badge = STATUS_BADGES[status] || STATUS_BADGES.assigned;
            return (
              <View key={a.id} style={[styles.assignmentCard, { borderLeftColor: meta.color }]}>
                <View style={styles.assignmentTop}>
                  <View style={styles.flexOne}>
                    <Text style={styles.assignmentTitle}>{meta.icon} {a.display_title || a.title || a.lesson_title || 'Untitled'}</Text>
                    <Text style={styles.assignmentMeta}>
                      {a.student_name ? `${a.student_name} • ` : ''}
                      {a.group_name ? `${a.group_name} • ` : ''}
                      Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No date'} • Max: {a.max_points} pts
                    </Text>
                  </View>

                  <View style={styles.badgesWrap}>
                    <Text style={[styles.chip, { backgroundColor: `${meta.color}20`, color: meta.color }]}>{meta.label}</Text>
                    <Text style={[styles.chip, { backgroundColor: badge.bg, color: badge.color }]}>{badge.label}</Text>
                    <Text style={[styles.chip, styles.grayChip]}>{a.submission_count || 0} submissions</Text>
                    <TouchableOpacity onPress={() => handleDelete(a.id)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {a.description && <Text style={styles.assignmentDesc}>{a.description}</Text>}
              </View>
            );
          })}
        </View>
      )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  containerWide: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentShell: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  keyboardWrap: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitle: {
    margin: 0,
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 24,
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  topButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  newTopButton: {
    backgroundColor: '#6366f1',
  },
  cancelTopButton: {
    backgroundColor: '#ef4444',
  },
  topButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  formTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    fontSize: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  smallLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mcWrap: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  mcTitle: {
    margin: 0,
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 15,
  },
  addQuestionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  addQuestionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyQuestions: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 16,
  },
  questionCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  questionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionTitle: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
  },
  pointsInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  deleteQ: {
    fontSize: 16,
    color: '#ef4444',
  },
  optionsWrap: {
    gap: 8,
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  correctBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  correctBtnActive: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  correctBtnInactive: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  correctBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  correctBtnTextActive: {
    color: '#22c55e',
  },
  correctBtnTextInactive: {
    color: '#94a3b8',
  },
  optionInput: {
    flex: 1,
  },
  questionHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#94a3b8',
  },
  formButtons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  createBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  centerStateText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  emptyStateIcon: {
    fontSize: 40,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 14,
  },
  assignmentList: {
    gap: 12,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  assignmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  assignmentTitle: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 15,
  },
  assignmentMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  grayChip: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 12,
  },
  assignmentDesc: {
    marginTop: 8,
    fontSize: 13,
    color: '#475569',
  },
})

export default TeacherAssignmentCreate;
