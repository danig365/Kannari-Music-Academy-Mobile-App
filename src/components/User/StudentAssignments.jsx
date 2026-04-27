import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../shared/LoadingSpinner';

const baseUrl = API_BASE_URL;

const STATUS_BADGES = {
  assigned: { label: 'Assigned', bg: '#dbeafe', color: '#1d4ed8', icon: 'clipboard' },
  submitted: { label: 'Submitted', bg: '#fef3c7', color: '#92400e', icon: 'check-circle' },
  late: { label: 'Late', bg: '#fee2e2', color: '#991b1b', icon: 'clock-history' },
  graded: { label: 'Graded', bg: '#dcfce7', color: '#166534', icon: 'award' },
};

const TYPE_META = {
  audio: { label: 'Audio', icon: 'mic-fill', color: '#8b5cf6' },
  video: { label: 'Video', icon: 'camera-video-fill', color: '#ec4899' },
  file_upload: { label: 'File Upload', icon: 'file-earmark-arrow-up-fill', color: '#f59e0b' },
  discussion: { label: 'Discussion', icon: 'chat-left-text-fill', color: '#06b6d4' },
  multiple_choice: { label: 'Multiple Choice', icon: 'list-check', color: '#3b82f6' },
};

const getTypeMeta = (type) => TYPE_META[type] || TYPE_META.audio;

const MC_OPTIONS = [
  { key: 'option_a', letter: 'a', label: 'A' },
  { key: 'option_b', letter: 'b', label: 'B' },
  { key: 'option_c', letter: 'c', label: 'C' },
  { key: 'option_d', letter: 'd', label: 'D' },
];

const StudentAssignments = () => {
  const navigation = useNavigation();
  const navigateToStudentLogin = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Auth', { screen: 'StudentLogin' });
      return;
    }
    navigation.navigate('StudentLogin');
  };
  const [studentId, setStudentId] = useState(null);
  const [studentLoginStatus, setStudentLoginStatus] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [message, setMessage] = useState('');
  const [forms, setForms] = useState({});
  const [mcAnswers, setMcAnswers] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        const storedLoginStatus = await AsyncStorage.getItem('studentLoginStatus');
        setStudentId(storedStudentId);
        setStudentLoginStatus(storedLoginStatus);
      } catch (error) {
        console.log('Error loading auth data:', error);
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  useEffect(() => {
    if (studentLoginStatus === null) return;
    if (studentLoginStatus !== 'true') {
      navigateToStudentLogin();
    }
  }, [studentLoginStatus]);

  const fetchAssignments = async () => {
    if (!studentId) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/student/${studentId}/lesson-assignments/`);
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log('Failed to load assignments:', error);
      setMessage('Failed to load assignments.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (studentLoginStatus === 'true' && studentId) {
      fetchAssignments();
    }
  }, [studentLoginStatus, studentId]);

  const handleInputChange = (assignmentId, field, value) => {
    setForms((prev) => ({
      ...prev,
      [assignmentId]: { ...(prev[assignmentId] || {}), [field]: value },
    }));
  };

  const handleMcAnswer = (assignmentId, questionId, letter) => {
    setMcAnswers((prev) => ({
      ...prev,
      [assignmentId]: { ...(prev[assignmentId] || {}), [questionId]: letter },
    }));
  };

  const pickFile = async (assignmentId, type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      handleInputChange(assignmentId, 'selected_file', result.assets[0]);
    } catch (error) {
      Alert.alert('Error', 'Unable to pick file.');
    }
  };

  const submitAssignment = async (assignment) => {
    const form = forms[assignment.id] || {};
    const subType = assignment.submission_type || 'audio';

    if (subType === 'multiple_choice') {
      const answers = mcAnswers[assignment.id] || {};
      const questions = assignment.mc_questions || [];

      if (questions.length > 0 && Object.keys(answers).length < questions.length) {
        setMessage('Please answer all questions.');
        return;
      }

      setSubmittingId(assignment.id);
      try {
        const answerList = Object.entries(answers).map(([qId, letter]) => ({
          question_id: parseInt(qId, 10),
          selected_option: letter,
        }));

        const res = await axios.post(
          `${baseUrl}/assignment/${assignment.id}/mc-submit/${studentId}/`,
          { answers: answerList },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const data = res.data;
        Alert.alert('Submitted!', `Score: ${data.earned_points || 0}/${data.total_points || 0}`);
        setForms((prev) => ({ ...prev, [assignment.id]: {} }));
        setMcAnswers((prev) => ({ ...prev, [assignment.id]: {} }));
        await fetchAssignments();
      } catch (error) {
        setMessage(error?.response?.data?.error || 'Failed to submit answers.');
      }
      setSubmittingId(null);
      return;
    }

    const payload = new FormData();
    payload.append('submission_notes', form.submission_notes || '');

    if (subType === 'discussion') {
      if (!form.text_content?.trim()) {
        setMessage('Please enter your response.');
        return;
      }
      payload.append('text_content', form.text_content);
    } else {
      const selectedFile = form.selected_file;
      if (!selectedFile) {
        setMessage('Please choose a file.');
        return;
      }

      const filePart = {
        uri: selectedFile.uri,
        name: selectedFile.name || 'upload.file',
        type: selectedFile.mimeType || 'application/octet-stream',
      };

      if (subType === 'audio') {
        payload.append('audio_file', filePart);
      } else if (subType === 'video') {
        payload.append('video_file', filePart);
      } else if (subType === 'file_upload') {
        payload.append('file', filePart);
      }
    }

    setSubmittingId(assignment.id);
    try {
      await axios.post(
        `${baseUrl}/student/${studentId}/lesson-assignment/${assignment.id}/submit/`,
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      Alert.alert('Submitted!', 'Your assignment has been submitted.');
      setForms((prev) => ({ ...prev, [assignment.id]: {} }));
      await fetchAssignments();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to submit assignment.');
    }
    setSubmittingId(null);
  };

  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'No due date');

  const StatusBadge = ({ assignment }) => {
    const status =
      assignment.computed_status ||
      (assignment.submission
        ? assignment.submission.points_awarded != null
          ? 'graded'
          : 'submitted'
        : 'assigned');
    const badge = STATUS_BADGES[status] || STATUS_BADGES.assigned;

    return (
      <View style={[styles.pill, { backgroundColor: badge.bg, borderColor: `${badge.color}55` }]}>
        <Bootstrap name={badge.icon} size={10} color={badge.color} />
        <Text style={[styles.pillText, { color: badge.color }]}>{badge.label}</Text>
      </View>
    );
  };

  const renderMcQuiz = (assignment) => {
    const questions = assignment.mc_questions || [];
    const answers = mcAnswers[assignment.id] || {};
    const hasStudentAnswers = questions.some((q) => q.student_answer);

    if (questions.length === 0) {
      return <Text style={styles.noQuestionsText}>No questions available yet.</Text>;
    }

    return (
      <View style={styles.mcWrap}>
        {questions.map((q, idx) => {
          const studentAnswer = q.student_answer;
          const alreadyAnswered = !!studentAnswer;

          return (
            <View key={q.id} style={styles.mcQuestionCard}>
              <Text style={styles.mcQuestionTitle}>
                Q{idx + 1}. {q.question_text}
                {q.points > 1 ? ` (${q.points} pts)` : ''}
              </Text>

              <View style={styles.mcOptionsWrap}>
                {MC_OPTIONS.map((opt) => {
                  const text = q[opt.key];
                  if (!text) return null;

                  const isSelected = alreadyAnswered
                    ? studentAnswer?.selected_option === opt.letter
                    : answers[q.id] === opt.letter;
                  const isCorrect =
                    alreadyAnswered &&
                    studentAnswer?.is_correct !== undefined &&
                    q.correct_option === opt.letter;
                  const wasWrong =
                    alreadyAnswered &&
                    studentAnswer?.selected_option === opt.letter &&
                    !studentAnswer?.is_correct;

                  return (
                    <TouchableOpacity
                      key={opt.letter}
                      style={[
                        styles.mcOption,
                        isSelected ? styles.mcOptionSelected : null,
                        isCorrect ? styles.mcOptionCorrect : null,
                        wasWrong ? styles.mcOptionWrong : null,
                      ]}
                      disabled={alreadyAnswered}
                      onPress={() => handleMcAnswer(assignment.id, q.id, opt.letter)}
                    >
                      <Text style={styles.mcOptionLetter}>{opt.label}.</Text>
                      <Text style={styles.mcOptionText}>{text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {alreadyAnswered && (
                <Text style={[styles.mcResultText, { color: studentAnswer?.is_correct ? '#166534' : '#991b1b' }]}>
                  {studentAnswer?.is_correct ? 'Correct!' : 'Incorrect'}
                </Text>
              )}
            </View>
          );
        })}

        {!hasStudentAnswers && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => submitAssignment(assignment)}
            disabled={submittingId === assignment.id}
          >
            <Text style={styles.primaryBtnText}>
              {submittingId === assignment.id ? 'Saving...' : 'Submit Answers'}
            </Text>
          </TouchableOpacity>
        )}

        {hasStudentAnswers && (
          <View style={styles.successBox}>
            <Bootstrap name="check-circle" size={14} color="#166534" />
            <Text style={styles.successBoxText}>Answers submitted and auto-graded.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSubmissionPreview = (submission, assignment) => {
    const subType = assignment.submission_type || 'audio';
    const isGraded = submission.points_awarded !== null && submission.points_awarded !== undefined;

    const openSubmissionLink = async (url) => {
      if (!url) return;
      try {
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert('Error', 'Unable to open submission file.');
      }
    };

    return (
      <View style={styles.previewCard}>
        <Text style={styles.previewSubmittedAt}>
          Submitted: {new Date(submission.submitted_at).toLocaleString()}
        </Text>

        {(subType === 'audio' && submission.audio_file) ||
        (subType === 'video' && submission.video_file) ||
        (subType === 'file_upload' && submission.file) ? (
          <TouchableOpacity
            style={styles.fileButton}
            onPress={() => openSubmissionLink(submission.audio_file || submission.video_file || submission.file)}
          >
            <Bootstrap name="box-arrow-up-right" size={14} color="#2563eb" />
            <Text style={styles.fileButtonText}>Open submitted file</Text>
          </TouchableOpacity>
        ) : null}

        {subType === 'discussion' && submission.text_content ? (
          <View style={styles.discussionPreview}>
            <Text style={styles.discussionPreviewText}>{submission.text_content}</Text>
          </View>
        ) : null}

        {isGraded ? (
          <View style={styles.gradeWrap}>
            <Text style={styles.scoreText}>Score: {submission.points_awarded} / {assignment.max_points}</Text>
            {submission.teacher_feedback ? (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{submission.teacher_feedback}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  const renderSubmissionForm = (assignment) => {
    const form = forms[assignment.id] || {};
    const subType = assignment.submission_type || 'audio';

    const pickerType =
      subType === 'audio' ? 'audio/*' : subType === 'video' ? 'video/*' : '*/*';

    return (
      <View style={styles.formWrap}>
        {subType === 'discussion' ? (
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            placeholder="Share your thoughts..."
            value={form.text_content || ''}
            onChangeText={(text) => handleInputChange(assignment.id, 'text_content', text)}
          />
        ) : (
          <View>
            <TouchableOpacity
              style={styles.filePickBtn}
              onPress={() => pickFile(assignment.id, pickerType)}
            >
              <Bootstrap name="paperclip" size={14} color="#1d4ed8" />
              <Text style={styles.filePickBtnText}>Choose file</Text>
            </TouchableOpacity>
            {!!form.selected_file?.name && (
              <Text style={styles.selectedFileText}>Selected: {form.selected_file.name}</Text>
            )}
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Submission notes (optional)"
          value={form.submission_notes || ''}
          onChangeText={(text) => handleInputChange(assignment.id, 'submission_notes', text)}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => submitAssignment(assignment)}
          disabled={submittingId === assignment.id}
        >
          <Text style={styles.primaryBtnText}>
            {submittingId === assignment.id
              ? 'Saving...'
              : assignment.submission
              ? 'Resubmit'
              : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (studentLoginStatus === null) {
    return (
      <LoadingSpinner size="md" text="Loading assignments..." />
    );
  }

  if (studentLoginStatus !== 'true') {
    return null;
  }

  return (

        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          <View style={styles.pageHeadingWrap}>
            <Text style={styles.pageTitle}>My Assignments</Text>
            <Text style={styles.pageSubTitle}>
              Submit assignments in multiple formats and view teacher scores.
            </Text>
          </View>

          {!!message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
              <TouchableOpacity onPress={() => setMessage('')}>
                <Bootstrap name="x-lg" size={14} color="#0f172a" />
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <LoadingSpinner size="md" text="Loading assignments..." />
          ) : assignments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Bootstrap name="journal-text" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No assignments yet.</Text>
            </View>
          ) : (
            <View style={styles.assignmentsList}>
              {assignments.map((assignment) => {
                const submission = assignment.submission;
                const subType = assignment.submission_type || 'audio';
                const meta = getTypeMeta(subType);
                const isExpanded = expandedId === assignment.id;

                return (
                  <View
                    key={assignment.id}
                    style={[styles.assignmentCard, { borderLeftColor: meta.color }]}
                  >
                    <TouchableOpacity
                      style={styles.assignmentHeader}
                      onPress={() => setExpandedId(isExpanded ? null : assignment.id)}
                    >
                      <View style={styles.assignmentHeaderTop}>
                        <View style={styles.assignmentHeaderLeft}>
                          <View style={styles.assignmentTitleRow}>
                            <Bootstrap name={meta.icon} size={14} color={meta.color} />
                            <Text style={styles.assignmentTitle}>
                              {assignment.display_title || assignment.lesson_title}
                            </Text>
                            <Bootstrap
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={12}
                              color="#94a3b8"
                            />
                          </View>

                          <Text style={styles.assignmentMetaLine}>
                            {assignment.teacher_name ? `${assignment.teacher_name} • ` : ''}
                            {assignment.school_name ? `${assignment.school_name} • ` : ''}
                            Due: {formatDate(assignment.due_date)}
                          </Text>
                        </View>

                        <View style={styles.assignmentBadgesWrap}>
                          <View
                            style={[
                              styles.pill,
                              { backgroundColor: `${meta.color}20`, borderColor: `${meta.color}55` },
                            ]}
                          >
                            <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                          </View>
                          <StatusBadge assignment={assignment} />
                          <View style={[styles.pill, styles.maxPointsPill]}>
                            <Text style={styles.maxPointsText}>Max {assignment.max_points}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.assignmentBody}>
                        {(assignment.description || assignment.notes) && (
                          <View style={styles.descriptionBox}>
                            <Text style={styles.descriptionText}>
                              {assignment.description || assignment.notes}
                            </Text>
                          </View>
                        )}

                        {submission && subType !== 'multiple_choice'
                          ? renderSubmissionPreview(submission, assignment)
                          : null}

                        {subType === 'multiple_choice'
                          ? renderMcQuiz(assignment)
                          : renderSubmissionForm(assignment)}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  contentWrap: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  sidebarToggle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.08)',
    marginRight: 10,
  },
  logoMini: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
    paddingBottom: 28,
  },
  pageHeadingWrap: {
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 26,
    color: '#1e293b',
    fontWeight: '700',
  },
  pageSubTitle: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 14,
  },
  messageBox: {
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    gap: 10,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  assignmentsList: {
    gap: 14,
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  assignmentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  assignmentHeaderTop: {
    gap: 10,
  },
  assignmentHeaderLeft: {
    gap: 4,
  },
  assignmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentTitle: {
    flex: 1,
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
  },
  assignmentMetaLine: {
    fontSize: 12,
    color: '#64748b',
  },
  assignmentBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  maxPointsPill: {
    backgroundColor: '#f1f5f9',
    borderColor: '#f1f5f9',
  },
  maxPointsText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  assignmentBody: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  descriptionBox: {
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  descriptionText: {
    color: '#475569',
    fontSize: 13,
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  previewSubmittedAt: {
    fontSize: 12,
    color: '#64748b',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fileButtonText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '500',
  },
  discussionPreview: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  discussionPreviewText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  gradeWrap: {
    gap: 6,
  },
  scoreText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  feedbackText: {
    color: '#334155',
    fontSize: 13,
  },
  formWrap: {
    gap: 10,
  },
  filePickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  filePickBtnText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedFileText: {
    marginTop: 6,
    fontSize: 12,
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    minWidth: 140,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  noQuestionsText: {
    color: '#64748b',
    fontSize: 13,
  },
  mcWrap: {
    marginTop: 12,
    gap: 12,
  },
  mcQuestionCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 14,
    gap: 10,
  },
  mcQuestionTitle: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  mcOptionsWrap: {
    gap: 6,
  },
  mcOption: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mcOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  mcOptionCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  mcOptionWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  mcOptionLetter: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  mcOptionText: {
    color: '#0f172a',
    flex: 1,
    fontSize: 13,
  },
  mcResultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successBoxText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default StudentAssignments;
