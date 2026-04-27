import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator, Linking, KeyboardAvoidingView, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio, Video } from 'expo-av'
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const baseUrl = API_BASE_URL;

const STATUS_BADGES = {
  assigned: { label: 'Assigned', bg: '#dbeafe', color: '#1d4ed8', icon: '📋' },
  submitted: { label: 'Submitted', bg: '#fef3c7', color: '#92400e', icon: '✅' },
  late: { label: 'Late', bg: '#fee2e2', color: '#991b1b', icon: '⏰' },
  graded: { label: 'Graded', bg: '#dcfce7', color: '#166534', icon: '🏅' },
  pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e', icon: '⌛' },
};

const TYPE_META = {
  audio: { label: 'Audio', icon: '🎤', color: '#8b5cf6' },
  video: { label: 'Video', icon: '🎥', color: '#ec4899' },
  file_upload: { label: 'File Upload', icon: '📤', color: '#f59e0b' },
  discussion: { label: 'Discussion', icon: '💬', color: '#06b6d4' },
  multiple_choice: { label: 'Multiple Choice', icon: '✅', color: '#3b82f6' },
};

const getTypeMeta = (t) => TYPE_META[t] || TYPE_META.audio;

const TeacherAssignmentReviews = () => {
  const [teacherId, setTeacherId] = useState(null)

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const [grades, setGrades] = useState({});
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [playingId, setPlayingId] = useState(null)
  const scrollRef = useRef(null)
  const soundRef = useRef(null)
  const insets = useSafeAreaInsets()

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

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {})
      }
    }
  }, []);

  useEffect(() => {
    if (!teacherId) return
    fetchSubmissions();
  }, [teacherId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/lesson-assignment-submissions/`);
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setMessage('Failed to load submissions.');
    }
    setLoading(false);
  };

  const updateGradeInput = (submissionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: { ...(prev[submissionId] || {}), [field]: value }
    }));
  };

  const saveGrade = async (submission) => {
    const gradeData = grades[submission.id] || {};
    if (gradeData.points_awarded === undefined || gradeData.points_awarded === '') {
      setMessage('Please enter points before saving.');
      return;
    }

    setSavingId(submission.id);
    try {
      await axios.patch(
        `${baseUrl}/teacher/${teacherId}/lesson-assignment-submission/${submission.id}/grade/`,
        { points_awarded: Number(gradeData.points_awarded), teacher_feedback: gradeData.teacher_feedback || '' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessage('Grade saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      await fetchSubmissions();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to save grade.');
    }
    setSavingId(null);
  };

  const getStatus = (s) => {
    if (s.points_awarded !== null && s.points_awarded !== undefined) return 'graded';
    return 'submitted';
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'pending') return s.points_awarded === null || s.points_awarded === undefined;
    if (filter === 'graded') return s.points_awarded !== null && s.points_awarded !== undefined;
    return true;
  });

  const pendingCount = submissions.filter(s => s.points_awarded === null || s.points_awarded === undefined).length;
  const gradedCount = submissions.filter(s => s.points_awarded !== null && s.points_awarded !== undefined).length;

  const toggleAudio = async (submission) => {
    try {
      if (!submission.audio_file) return

      if (playingId === submission.id && soundRef.current) {
        await soundRef.current.pauseAsync()
        setPlayingId(null)
        return
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      const { sound } = await Audio.Sound.createAsync({ uri: submission.audio_file }, { shouldPlay: true })
      soundRef.current = sound
      setPlayingId(submission.id)

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingId(null)
          sound.unloadAsync().catch(() => {})
          soundRef.current = null
        }
      })
    } catch (e) {
      Alert.alert('Error', 'Unable to play audio file')
    }
  }

  const renderSubmissionContent = (submission) => {
    const subType = submission.assignment_submission_type || 'audio';

    return (
      <View style={styles.contentWrap}>
        {subType === 'audio' && submission.audio_file && (
          <View>
            <Text style={styles.contentLabel}>🎤 Audio Recording</Text>
            <TouchableOpacity style={styles.playBtn} onPress={() => toggleAudio(submission)}>
              <Text style={styles.playBtnText}>{playingId === submission.id ? 'Pause Audio' : 'Play Audio'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {subType === 'video' && submission.video_file && (
          <View>
            <Text style={styles.contentLabel}>🎥 Video Recording</Text>
            <Video
              source={{ uri: submission.video_file }}
              useNativeControls
              style={styles.video}
              resizeMode='contain'
            />
          </View>
        )}

        {subType === 'file_upload' && submission.file && (
          <View>
            <Text style={styles.contentLabel}>📄 Uploaded File</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(submission.file)}
              style={styles.downloadBtn}
            >
              <Text style={styles.downloadBtnText}>Download Submission</Text>
            </TouchableOpacity>
          </View>
        )}

        {subType === 'discussion' && submission.text_content && (
          <View>
            <Text style={styles.contentLabel}>💬 Discussion Response</Text>
            <View style={styles.textContentBox}>
              <Text style={styles.textContent}>{submission.text_content}</Text>
            </View>
          </View>
        )}

        {subType === 'multiple_choice' && (
          <View>
            <Text style={styles.contentLabel}>✅ Multiple Choice (Auto-Graded)</Text>
            {submission.text_content && (
              <View style={styles.autoGradeBox}>
                <Text style={styles.autoGradeText}>{submission.text_content}</Text>
              </View>
            )}
          </View>
        )}

        {!submission.audio_file && !submission.video_file && !submission.file && !submission.text_content && subType !== 'multiple_choice' && (
          <View style={styles.noContentBox}>
            <Text style={styles.noContentText}>No submission content found.</Text>
          </View>
        )}
      </View>
    );
  };

  const handleGradeFieldFocus = (submissionId) => {
    if (expandedId !== submissionId) {
      setExpandedId(submissionId);
    }
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrap}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.container, { paddingBottom: 16 + Math.max(insets.bottom, 8) }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='on-drag'
    >
      <View style={styles.headerWrap}>
        <Text style={styles.title}>📝 Assignment Reviews</Text>
        <Text style={styles.subtitle}>Review all submission types, grade with points and feedback.</Text>
      </View>

      {!!message && (
        <View style={styles.messageBar}>
          <Text style={styles.messageText}>{message}</Text>
          <TouchableOpacity onPress={() => setMessage('')}>
            <Text style={styles.closeMsg}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: `All (${submissions.length})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'graded', label: `Graded (${gradedCount})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[
              styles.filterBtn,
              filter === tab.key ? styles.filterBtnActive : styles.filterBtnInactive,
            ]}
          >
            <Text style={filter === tab.key ? styles.filterBtnTextActive : styles.filterBtnTextInactive}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color='#64748b' />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      ) : filteredSubmissions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyText}>{submissions.length > 0 ? 'No submissions match your filter.' : 'No student submissions yet.'}</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {filteredSubmissions.map(submission => {
            const maxPoints = submission.assignment_max_points || 100;
            const status = getStatus(submission);
            const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.submitted;
            const subType = submission.assignment_submission_type || 'audio';
            const typeMeta = getTypeMeta(subType);
            const isExpanded = expandedId === submission.id;

            const initialPoints = grades[submission.id]?.points_awarded !== undefined
              ? grades[submission.id].points_awarded
              : (submission.points_awarded ?? '');
            const initialFeedback = grades[submission.id]?.teacher_feedback !== undefined
              ? grades[submission.id].teacher_feedback
              : (submission.teacher_feedback || '');

            return (
              <View key={submission.id} style={[styles.card, { borderLeftColor: typeMeta.color }]}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(isExpanded ? null : submission.id)}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardTitle}>{typeMeta.icon} {submission.assignment_title || submission.assignment_lesson_title || 'Assignment'} {isExpanded ? '▲' : '▼'}</Text>
                    <Text style={styles.cardMeta}>
                      {submission.student_name} • {new Date(submission.submitted_at).toLocaleString()}
                      {submission.graded_at ? ` • Graded: ${new Date(submission.graded_at).toLocaleString()}` : ''}
                    </Text>
                  </View>

                  <View style={styles.badgesWrap}>
                    <Text style={[styles.badge, { backgroundColor: `${typeMeta.color}20`, color: typeMeta.color }]}>{typeMeta.label}</Text>
                    <Text style={[styles.badge, { backgroundColor: statusBadge.bg, color: statusBadge.color }]}>{statusBadge.label}</Text>
                    {status === 'graded' && (
                      <Text style={[styles.badge, styles.scoreBadge]}>{submission.points_awarded}/{maxPoints}</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedWrap}>
                    {renderSubmissionContent(submission)}

                    {submission.submission_notes && submission.submission_notes !== 'Auto-graded multiple choice' && (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>🗒️ {submission.submission_notes}</Text>
                      </View>
                    )}

                    {status === 'graded' && (
                      <View style={styles.gradedBox}>
                        <Text style={styles.gradedScore}>🏅 Score: {submission.points_awarded} / {maxPoints} ({Math.round((submission.points_awarded / maxPoints) * 100)}%)</Text>
                        {submission.teacher_feedback && <Text style={styles.feedbackText}>💬 {submission.teacher_feedback}</Text>}
                        {submission.graded_by_name && <Text style={styles.gradedByText}>Graded by {submission.graded_by_name}</Text>}
                      </View>
                    )}

                    <View style={styles.gradeForm}>
                      <Text style={styles.gradeTitle}>{status === 'graded' ? 'Update Grade' : 'Grade Submission'}</Text>

                      <TextInput
                        style={styles.input}
                        keyboardType='numeric'
                        placeholder={`Points / ${maxPoints}`}
                        value={String(initialPoints)}
                        onChangeText={(text) => updateGradeInput(submission.id, 'points_awarded', text)}
                        onFocus={() => handleGradeFieldFocus(submission.id)}
                      />

                      <TextInput
                        style={[styles.input, styles.feedbackInput]}
                        placeholder='Feedback for student...'
                        value={initialFeedback}
                        onChangeText={(text) => updateGradeInput(submission.id, 'teacher_feedback', text)}
                        multiline={true}
                        onFocus={() => handleGradeFieldFocus(submission.id)}
                      />

                      <TouchableOpacity
                        style={styles.saveBtn}
                        disabled={savingId === submission.id}
                        onPress={() => saveGrade(submission)}
                      >
                        <Text style={styles.saveBtnText}>{savingId === submission.id ? 'Saving...' : 'Save'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: 16,
  },
  headerWrap: {
    marginBottom: 24,
  },
  title: {
    margin: 0,
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 24,
  },
  subtitle: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 14,
  },
  messageBar: {
    backgroundColor: '#e0f2fe',
    borderColor: '#7dd3fc',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    color: '#075985',
    flex: 1,
    paddingRight: 8,
  },
  closeMsg: {
    color: '#075985',
    fontWeight: '700',
  },
  filterTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  filterBtnActive: {
    borderWidth: 2,
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  filterBtnInactive: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  filterBtnTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 13,
  },
  filterBtnTextInactive: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 40,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
  listWrap: {
    gap: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  cardHeader: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  flexOne: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: 15,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  scoreBadge: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
  },
  expandedWrap: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  contentWrap: {
    marginTop: 14,
    marginBottom: 12,
  },
  contentLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  playBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  playBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  video: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  downloadBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  downloadBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 13,
  },
  textContentBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  autoGradeBox: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  autoGradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  noContentBox: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  noContentText: {
    fontSize: 13,
    color: '#92400e',
  },
  notesBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
  },
  gradedBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  gradedScore: {
    fontWeight: '600',
    color: '#166534',
    fontSize: 15,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
  },
  gradedByText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  gradeForm: {
    padding: 14,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  gradeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
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
  feedbackInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  saveBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
})

export default TeacherAssignmentReviews;
