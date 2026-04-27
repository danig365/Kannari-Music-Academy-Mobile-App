import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bootstrap } from '../shared/BootstrapIcon';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../config';

const AudioMessages = () => {
  const navigation = useNavigation();
  const baseUrl = API_BASE_URL;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  const [studentId, setStudentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [minorBlocked, setMinorBlocked] = useState(false);
  const [reportModal, setReportModal] = useState({ visible: false, message: null, text: '', submitting: false });

  const soundRef = useRef(null);

  useEffect(() => {
    const loadStudentId = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        setStudentId(storedStudentId);
      } catch (error) {
        console.log('Error loading student id:', error);
        setLoading(false);
      }
    };

    loadStudentId();
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      if (!studentId) return;

      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/minor-access-status/`);
        if (res.data?.is_minor && !res.data?.can_send_messages) {
          setMinorBlocked(true);
        }
      } catch {
        // silent fail
      }
    };

    checkAccess();
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchMessages(studentId);
    } else {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const fetchMessages = async (currentStudentId = studentId) => {
    if (!currentStudentId) return;

    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/student/${currentStudentId}/audio-messages/`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('Error fetching audio messages:', err);
    }
    setLoading(false);
  };

  const markAsRead = async (msgId) => {
    try {
      await axios.patch(`${baseUrl}/audio-message/${msgId}/read/`);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, is_read: true } : m)));
    } catch {
      // silent fail
    }
  };

  const handlePlayPause = async (msg) => {
    if (!msg?.audio_file) {
      Alert.alert('Unavailable', 'Audio file not available.');
      return;
    }

    try {
      if (playingId === msg.id && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setPlayingId(null);
          return;
        }
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: msg.audio_file },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            setPlayingId(null);
          }
        }
      );

      soundRef.current = sound;
      setPlayingId(msg.id);

      if (!msg.is_read) {
        markAsRead(msg.id);
      }
    } catch (error) {
      console.log('Audio playback error:', error);
      Alert.alert('Playback Error', 'Could not play this audio message.');
      setPlayingId(null);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const openReportModal = (message) => {
    setReportModal({ visible: true, message, text: '', submitting: false });
  };

  const closeReportModal = () => {
    if (reportModal.submitting) return;
    setReportModal({ visible: false, message: null, text: '', submitting: false });
  };

  const submitReport = async () => {
    if (!reportModal.text.trim() || !reportModal.message || !studentId) {
      Alert.alert('Required', 'Description is required');
      return;
    }

    setReportModal((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = new FormData();
      payload.append('reporter_type', 'student');
      payload.append('reporter_id', studentId);
      payload.append('description', reportModal.text.trim());

      await axios.post(`${baseUrl}/audio-message/${reportModal.message.id}/report/`, payload);
      closeReportModal();
      Alert.alert('Success', 'Report submitted');
    } catch (error) {
      setReportModal((prev) => ({ ...prev, submitting: false }));
      Alert.alert('Failed', error.response?.data?.message || 'Could not submit report.');
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
        <ScrollView style={styles.mainScroll} contentContainerStyle={[styles.mainContent, { paddingBottom: 28 + bottomInset }]} keyboardShouldPersistTaps="handled">
          {minorBlocked && (
            <View style={styles.minorBlockedBanner}>
              <View style={styles.minorBlockedIconWrap}>
                <Bootstrap name="shield-lock-fill" size={20} color="#ffffff" />
              </View>
              <View style={styles.minorBlockedTextWrap}>
                <Text style={styles.minorBlockedTitle}>Parent Approval Required</Text>
                <Text style={styles.minorBlockedText}>
                  Messaging features are restricted for students under 18 until a parent or guardian approves your account.
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('ParentLogin')}>
                  <Text style={styles.parentPortalLink}>Parent Portal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.heading}>Messages</Text>
              <Text style={styles.subHeading}>Audio messages from your teachers</Text>
            </View>

            {unreadCount > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Bootstrap name="envelope-open" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Your teachers will send you audio feedback here</Text>
            </View>
          ) : (
            <View style={styles.messageList}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.messageCard, msg.is_read ? styles.messageCardRead : styles.messageCardUnread]}
                >
                  <View style={styles.messageTopRow}>
                    <View style={styles.messageTeacherRow}>
                      {msg.teacher_profile_img ? (
                        <Image source={{ uri: msg.teacher_profile_img }} style={styles.teacherAvatar} />
                      ) : (
                        <View style={styles.teacherFallbackAvatar}>
                          <Text style={styles.teacherFallbackText}>
                            {(msg.teacher_name || 'T').substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View>
                        <View style={styles.teacherNameRow}>
                          <Text style={styles.teacherName}>{msg.teacher_name || 'Teacher'}</Text>
                          {!msg.is_read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.messageTimeText}>{timeAgo(msg.created_at)}</Text>
                      </View>
                    </View>

                    <Text style={styles.messageMetaText}>
                      {msg.duration_formatted} • {msg.file_size_formatted}
                    </Text>
                  </View>

                  <Text style={styles.messageTitle}>{msg.title}</Text>

                  {!!msg.course_title && (
                    <View style={styles.courseRow}>
                      <Bootstrap name="book" size={12} color="#64748b" />
                      <Text style={styles.courseText}>{msg.course_title}</Text>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.playBtn} onPress={() => handlePlayPause(msg)}>
                      <Bootstrap
                        name={playingId === msg.id ? 'pause-fill' : 'play-fill'}
                        size={14}
                        color="#ffffff"
                      />
                      <Text style={styles.playBtnText}>
                        {playingId === msg.id ? 'Pause audio' : 'Play audio'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reportBtn} onPress={() => openReportModal(msg)}>
                      <Bootstrap name="flag" size={13} color="#ef4444" />
                      <Text style={styles.reportBtnText}>Report</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

      <Modal visible={reportModal.visible} transparent animationType="fade" onRequestClose={closeReportModal}>
        <KeyboardAvoidingView
          style={styles.modalKeyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View style={[styles.modalOverlay, { paddingBottom: bottomInset }]}>
            <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Audio Message</Text>
            <Text style={styles.modalHint}>Describe the issue</Text>

            <TextInput
              value={reportModal.text}
              onChangeText={(value) => setReportModal((prev) => ({ ...prev, text: value }))}
              placeholder="Enter details..."
              multiline
              style={styles.modalInput}
              textAlignVertical="top"
              editable={!reportModal.submitting}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeReportModal} disabled={reportModal.submitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitReport} disabled={reportModal.submitting}>
                {reportModal.submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  modalKeyboardWrap: {
    flex: 1,
  },
  minorBlockedBanner: {
    padding: 16,
    marginBottom: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    gap: 12,
  },
  minorBlockedIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minorBlockedTextWrap: {
    flex: 1,
  },
  minorBlockedTitle: {
    color: '#92400e',
    fontSize: 15,
    fontWeight: '700',
  },
  minorBlockedText: {
    marginTop: 4,
    color: '#78350f',
    fontSize: 13,
    lineHeight: 19,
  },
  parentPortalLink: {
    marginTop: 8,
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  heading: {
    margin: 0,
    color: '#1e293b',
    fontSize: 30,
    fontWeight: '700',
  },
  subHeading: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  unreadPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#fef3c7',
  },
  unreadPillText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
  },
  emptyTitle: {
    marginTop: 14,
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 14,
  },
  messageList: {
    gap: 12,
  },
  messageCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  messageCardRead: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  messageCardUnread: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  messageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  messageTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  teacherFallbackAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherFallbackText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  teacherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teacherName: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  messageTimeText: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  messageMetaText: {
    color: '#94a3b8',
    fontSize: 12,
    flexShrink: 0,
  },
  messageTitle: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  courseText: {
    color: '#64748b',
    fontSize: 12,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    flex: 1,
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#ffffff',
  },
  reportBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalHint: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 13,
  },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    minHeight: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  modalCancelText: {
    color: '#334155',
    fontWeight: '600',
  },
  modalSubmitBtn: {
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default AudioMessages;
