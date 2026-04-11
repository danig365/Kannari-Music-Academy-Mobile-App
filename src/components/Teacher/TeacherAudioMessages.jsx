import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios';
import { Audio } from 'expo-av'
import AudioRecorder from './AudioRecorder';
import { API_BASE_URL } from '../../config';

const TeacherAudioMessages = () => {
  const baseUrl = API_BASE_URL;

  const [teacherId, setTeacherId] = useState(null)
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [filter, setFilter] = useState('all');
  const [reportTarget, setReportTarget] = useState(null)
  const [reportText, setReportText] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const [audioLoadingId, setAudioLoadingId] = useState(null)
  const soundRef = useRef(null)

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

  useEffect(() => {
    if (!teacherId) return
    fetchMessages();
    fetchStudents();
  }, [teacherId]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {})
      }
    }
  }, [])

  const fetchMessages = async () => {
    if (!teacherId) return

    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/audio-messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    if (!teacherId) return

    try {
      const res = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`);
      setStudents(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      try {
        const enrollRes = await axios.get(`${baseUrl}/fetch-all-enrolled-students/${teacherId}`);
        const enrolled = Array.isArray(enrollRes.data) ? enrollRes.data : enrollRes.data.results || [];
        const unique = [];
        const seen = new Set();
        enrolled.forEach(e => {
          const s = e.student || e;
          if (s.id && !seen.has(s.id)) { seen.add(s.id); unique.push(s); }
        });
        setStudents(unique);
      } catch {
        setStudents([]);
      }
    }
  };

  const deleteMessage = async (msgId) => {
    Alert.alert('Confirm', 'Delete this audio message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${baseUrl}/audio-message/${msgId}/`);
            setMessages(prev => prev.filter(m => m.id !== msgId));
          } catch (err) {
            console.error('Error deleting message:', err);
          }
        },
      },
    ])
  };

  const openReport = (msg) => {
    setReportTarget(msg)
    setReportText('')
  }

  const submitReport = async () => {
    if (!reportTarget) return
    if (!reportText.trim()) {
      Alert.alert('Error', 'Description is required')
      return
    }

    setReportSubmitting(true)
    try {
      const payload = new FormData();
      payload.append('reporter_type', 'teacher');
      payload.append('reporter_id', teacherId);
      payload.append('description', reportText.trim());
      await axios.post(`${baseUrl}/audio-message/${reportTarget.id}/report/`, payload);
      Alert.alert('Success', 'Safety report submitted')
      setReportTarget(null)
      setReportText('')
    } catch (error) {
      Alert.alert('Failed', error.response?.data?.message || 'Could not submit safety report.')
    }
    setReportSubmitting(false)
  }

  const handlePlayPause = async (msg) => {
    try {
      if (playingId === msg.id && soundRef.current) {
        await soundRef.current.pauseAsync()
        setPlayingId(null)
        return
      }

      setAudioLoadingId(msg.id)

      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: msg.audio_file },
        { shouldPlay: true }
      )

      soundRef.current = sound
      setPlayingId(msg.id)

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingId(null)
          sound.unloadAsync().catch(() => {})
          soundRef.current = null
        }
      })
    } catch (err) {
      console.log(err)
      Alert.alert('Error', 'Unable to play audio')
    }
    setAudioLoadingId(null)
  }

  const filteredMessages = messages.filter(m => {
    if (filter === 'read') return m.is_read;
    if (filter === 'unread') return !m.is_read;
    return true;
  });

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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.flexOne}>
          <Text style={styles.title}>Audio Messages</Text>
          <Text style={styles.subtitle}>Record and send audio feedback to your students</Text>
        </View>
        <TouchableOpacity onPress={() => setShowRecorder(!showRecorder)} style={[styles.newBtn, showRecorder ? styles.newBtnMuted : styles.newBtnActive]}>
          <Text style={[styles.newBtnText, showRecorder ? styles.newBtnTextMuted : styles.newBtnTextActive]}>{showRecorder ? 'Close Recorder' : 'New Message'}</Text>
        </TouchableOpacity>
      </View>

      {showRecorder && (
        <View style={styles.recorderPanel}>
          <AudioRecorder
            teacherId={teacherId}
            students={students}
            onMessageSent={() => { fetchMessages(); setShowRecorder(false); }}
          />
        </View>
      )}

      {reportTarget && (
        <View style={styles.reportPanel}>
          <Text style={styles.reportTitle}>Report Audio Message</Text>
          <Text style={styles.reportSubtitle}>Describe the issue for “{reportTarget.title || 'Untitled'}”</Text>
          <TextInput
            value={reportText}
            onChangeText={setReportText}
            multiline={true}
            style={styles.reportInput}
            placeholder='Enter details...'
          />
          <View style={styles.reportButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setReportTarget(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={submitReport}>
              <Text style={styles.submitBtnText}>{reportSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All', count: messages.length },
          { key: 'unread', label: 'Unread', count: messages.filter(m => !m.is_read).length },
          { key: 'read', label: 'Read', count: messages.filter(m => m.is_read).length }
        ].map(tab => (
          <TouchableOpacity key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.filterBtn, filter === tab.key ? styles.filterBtnActive : styles.filterBtnInactive]}>
            <Text style={[styles.filterBtnText, filter === tab.key ? styles.filterBtnTextActive : styles.filterBtnTextInactive]}>{tab.label} ({tab.count})</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator color='#64748b' /><Text style={styles.loadingText}>Loading messages...</Text></View>
      ) : filteredMessages.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🎙️</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>Click “New Message” to record your first audio message</Text>
        </View>
      ) : (
        <View style={styles.messagesWrap}>
          {filteredMessages.map(msg => (
            <View key={msg.id} style={styles.messageCard}>
              <View style={styles.messageTop}>
                <View style={styles.messageUserRow}>
                  {msg.student_profile_img ? (
                    <Image source={{ uri: msg.student_profile_img }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{(msg.student_name || 'S').substring(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.toText}>To: {msg.student_name || 'Student'}</Text>
                    <Text style={styles.timeText}>{timeAgo(msg.created_at)}</Text>
                  </View>
                </View>

                <View style={styles.badgesRow}>
                  <Text style={[styles.readBadge, msg.is_read ? styles.readBadgeRead : styles.readBadgeUnread]}>{msg.is_read ? 'Read' : 'Unread'}</Text>
                  <Text style={styles.durationText}>{msg.duration_formatted}</Text>
                  <TouchableOpacity onPress={() => deleteMessage(msg.id)} style={styles.iconBtn}><Text style={styles.iconBtnDelete}>🗑️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => openReport(msg)} style={styles.iconBtn}><Text style={styles.iconBtnReport}>🚩</Text></TouchableOpacity>
                </View>
              </View>

              <Text style={styles.msgTitle}>{msg.title}</Text>
              {!!msg.course_title && <Text style={styles.courseText}>📘 {msg.course_title}</Text>}

              <View style={styles.audioRow}>
                <TouchableOpacity onPress={() => handlePlayPause(msg)} style={styles.playBtn}>
                  <Text style={styles.playBtnText}>
                    {audioLoadingId === msg.id ? 'Loading...' : playingId === msg.id ? 'Pause' : 'Play'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  flexOne: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    margin: 0,
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 24,
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  newBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  newBtnActive: {
    backgroundColor: '#3b82f6',
  },
  newBtnMuted: {
    backgroundColor: '#f1f5f9',
  },
  newBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  newBtnTextActive: {
    color: '#fff',
  },
  newBtnTextMuted: {
    color: '#64748b',
  },
  recorderPanel: {
    marginBottom: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
  },
  reportPanel: {
    marginBottom: 20,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 12,
    padding: 14,
  },
  reportTitle: {
    color: '#9a3412',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  reportSubtitle: {
    color: '#7c2d12',
    fontSize: 13,
    marginBottom: 10,
  },
  reportInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  reportButtons: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#dc2626',
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: '#1e293b',
  },
  filterBtnInactive: {
    backgroundColor: '#f1f5f9',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  filterBtnTextInactive: {
    color: '#64748b',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 4,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  messagesWrap: {
    gap: 10,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  messageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  messageUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    backgroundColor: '#8b5cf6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  toText: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  readBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '500',
  },
  readBadgeRead: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  readBadgeUnread: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  durationText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  iconBtn: {
    padding: 4,
  },
  iconBtnDelete: {
    color: '#94a3b8',
    fontSize: 16,
  },
  iconBtnReport: {
    color: '#ef4444',
    fontSize: 16,
  },
  msgTitle: {
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
    fontSize: 14,
  },
  courseText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  playBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
})

export default TeacherAudioMessages;
