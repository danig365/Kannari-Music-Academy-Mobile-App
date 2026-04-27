import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
import { WebView } from 'react-native-webview'
import axios from 'axios';
import { API_BASE_URL, JITSI_BASE_URL } from '../../config';

const TeacherSessions = () => {
  const baseUrl = API_BASE_URL;

  const [teacherId, setTeacherId] = useState(null)
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showVideoRoom, setShowVideoRoom] = useState(null);

  const [formData, setFormData] = useState({
    student: '',
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    session_type: 'video_call',
    status: 'confirmed'
  });

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId')
        setTeacherId(id)
      } catch (error) {
        console.log(error)
      }
    }

    getTeacherId()
  }, [])

  useEffect(() => {
    if (!teacherId) return
    fetchSessions();
    fetchStudents();
  }, [teacherId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/sessions/${teacherId}/`);
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`);
      setStudents(res.data);
    } catch {
      try {
        const res = await axios.get(`${baseUrl}/teacher/students-from-enrollments/${teacherId}/`);
        if (res.data?.students) setStudents(res.data.students);
      } catch {}
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post(`${baseUrl}/teacher/sessions/${teacherId}/`, {
        ...formData,
        teacher: teacherId
      });
      setShowModal(false);
      setFormData({ student: '', title: '', description: '', scheduled_date: '', scheduled_time: '', duration_minutes: 60, session_type: 'video_call', status: 'confirmed' });
      fetchSessions();
      Alert.alert('Success', 'Session Scheduled');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create session');
    }
  };

  const handleGoLive = async (session) => {
    try {
      const res = await axios.post(`${baseUrl}/session/${session.id}/go-live/`);
      if (res.data.bool) {
        setShowVideoRoom({ ...session, room_name: res.data.room_name, meeting_link: res.data.meeting_link });
        fetchSessions();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.response?.data?.message || 'Failed to start session');
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await axios.post(`${baseUrl}/session/${sessionId}/end/`);
      setShowVideoRoom(null);
      fetchSessions();
      Alert.alert('Success', 'Session Ended');
    } catch {
      Alert.alert('Error', 'Failed to end session');
    }
  };

  const handleCancel = async (session) => {
    Alert.alert('Cancel Session?', 'This will notify the student.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel it',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.put(`${baseUrl}/teacher/session/${session.id}/`, { ...session, student: session.student?.id || session.student, teacher: teacherId, status: 'cancelled' });
            fetchSessions();
          } catch {}
        },
      },
    ])
  };

  const handleUpdateRecording = async (session, recordingEnabled) => {
    try {
      const payload = new FormData();
      payload.append('requester_teacher_id', teacherId);
      payload.append('recording_enabled', recordingEnabled ? 'true' : 'false');
      await axios.post(`${baseUrl}/session/${session.id}/recording/update/`, payload);
      fetchSessions();
      Alert.alert('Success', recordingEnabled ? 'Recording enabled' : 'Recording disabled');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update recording settings.');
    }
  };

  const handleReportSession = async (session) => {
    Alert.prompt(
      'Report Session Safety Issue',
      'Describe the issue',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (value) => {
            if (!value) {
              Alert.alert('Error', 'Description is required')
              return
            }

            try {
              const payload = new FormData();
              payload.append('reporter_type', 'teacher');
              payload.append('reporter_id', teacherId);
              payload.append('description', value);
              await axios.post(`${baseUrl}/session/${session.id}/report/`, payload);
              Alert.alert('Success', 'Safety report submitted');
            } catch (error) {
              Alert.alert('Failed', error.response?.data?.message || 'Could not submit safety report.');
            }
          }
        }
      ],
      'plain-text'
    )
  };

  const now = new Date();
  const upcoming = sessions.filter(s => s.status !== 'cancelled' && s.status !== 'completed' && new Date(s.scheduled_date + 'T' + s.scheduled_time) >= now);
  const past = sessions.filter(s => s.status === 'completed' || new Date(s.scheduled_date + 'T' + s.scheduled_time) < now);
  const cancelled = sessions.filter(s => s.status === 'cancelled');

  const displayed = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled;

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (showVideoRoom) {
    return (
      <View style={styles.liveRoot}>
        <View style={styles.liveHeader}>
          <View style={styles.liveLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
            <Text style={styles.liveTitle}>— {showVideoRoom.title}</Text>
          </View>
          <View style={styles.liveRight}>
            <Text style={styles.liveWith}>with {showVideoRoom.student_name || 'Student'}</Text>
            <TouchableOpacity onPress={() => handleEndSession(showVideoRoom.id)} style={styles.endBtn}>
              <Text style={styles.endBtnText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </View>

        <WebView
          source={{ uri: `${JITSI_BASE_URL}/${showVideoRoom.room_name}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.enableLobbyMode=false&config.requireDisplayName=false` }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sessions</Text>
          <Text style={styles.subtitle}>Schedule and manage live video sessions with your students</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.scheduleBtn}>
          <Text style={styles.scheduleBtnText}>+ Schedule Session</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrap}>
        {[
          { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { key: 'past', label: 'Past', count: past.length },
          { key: 'cancelled', label: 'Cancelled', count: cancelled.length }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabBtn, activeTab === tab.key ? styles.tabActive : styles.tabInactive]}
          >
            <Text style={activeTab === tab.key ? styles.tabTextActive : styles.tabTextInactive}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color='#64748b' />
          <Text style={styles.centerText}>Loading sessions...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📹</Text>
          <Text style={styles.emptyTitle}>No {activeTab} sessions</Text>
          <Text style={styles.emptyText}>{activeTab === 'upcoming' ? 'Schedule a new session to get started' : 'Sessions will appear here once completed'}</Text>
        </View>
      ) : (
        <View style={styles.sessionsList}>
          {displayed.map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionLeft}>
                <View style={[styles.sessionIconWrap,
                  session.is_live ? styles.iconLiveBg : session.session_type === 'video_call' ? styles.iconVideoBg : styles.iconOtherBg
                ]}>
                  <Text style={[styles.sessionIcon,
                    session.is_live ? styles.iconLiveColor : session.session_type === 'video_call' ? styles.iconVideoColor : styles.iconOtherColor
                  ]}>
                    {session.is_live ? '📡' : session.session_type === 'video_call' ? '📹' : session.session_type === 'audio_call' ? '📞' : '👤'}
                  </Text>
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    {session.is_live && <Text style={styles.liveBadge}>LIVE</Text>}
                  </View>
                  <Text style={styles.sessionMeta}>
                    with {session.student_name || 'Student'} • {formatDate(session.scheduled_date)} at {session.formatted_time || session.scheduled_time} • {session.duration_minutes} min
                  </Text>
                </View>
              </View>

              <View style={styles.sessionActions}>
                {session.is_live ? (
                  <>
                    <TouchableOpacity onPress={() => setShowVideoRoom(session)} style={styles.rejoinBtn}><Text style={styles.rejoinBtnText}>Rejoin</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEndSession(session.id)} style={styles.endSmallBtn}><Text style={styles.endSmallBtnText}>End</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReportSession(session)} style={styles.flagBtn}><Text style={styles.flagBtnText}>🚩</Text></TouchableOpacity>
                  </>
                ) : session.status === 'confirmed' || session.status === 'pending' ? (
                  <>
                    <TouchableOpacity onPress={() => handleGoLive(session)} style={styles.goLiveBtn}><Text style={styles.goLiveBtnText}>Go Live</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCancel(session)} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleUpdateRecording(session, !session.recording_enabled)} style={styles.recordingBtn}><Text style={session.recording_enabled ? styles.recordingOffText : styles.recordingOnText}>{session.recording_enabled ? '⏹' : '⏺'}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReportSession(session)} style={styles.flagBtn}><Text style={styles.flagBtnText}>🚩</Text></TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.statusPill, session.status === 'completed' ? styles.completedPill : styles.cancelledPill]}>
                    {session.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={showModal} transparent animationType='fade' onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Session</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.modalClose}>×</Text></TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Student</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={formData.student} onValueChange={(value) => setFormData({ ...formData, student: value })}>
                  <Picker.Item label='Select student...' value='' />
                  {students.map(s => (
                    <Picker.Item key={s.id || s.student?.id} value={s.student?.id || s.id} label={s.student?.fullname || s.fullname || s.student_name} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} placeholder='e.g., Piano Lesson #5' />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} placeholder='Session notes or agenda...' multiline={true} />

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput style={styles.input} value={formData.scheduled_date} onChangeText={(text) => setFormData({ ...formData, scheduled_date: text })} placeholder='YYYY-MM-DD' />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput style={styles.input} value={formData.scheduled_time} onChangeText={(text) => setFormData({ ...formData, scheduled_time: text })} placeholder='HH:mm' />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={styles.label}>Duration (minutes)</Text>
                  <View style={styles.pickerWrap}>
                    <Picker selectedValue={formData.duration_minutes} onValueChange={(value) => setFormData({ ...formData, duration_minutes: value })}>
                      {[15, 30, 45, 60, 90, 120].map(m => <Picker.Item key={m} label={`${m} min`} value={m} />)}
                    </Picker>
                  </View>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Type</Text>
                  <View style={styles.pickerWrap}>
                    <Picker selectedValue={formData.session_type} onValueChange={(value) => setFormData({ ...formData, session_type: value })}>
                      <Picker.Item label='Video Call' value='video_call' />
                      <Picker.Item label='Audio Call' value='audio_call' />
                      <Picker.Item label='In Person' value='in_person' />
                    </Picker>
                  </View>
                </View>
              </View>

              <TouchableOpacity onPress={handleCreate} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Schedule Session</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    alignContent: 'space-between',
    flexWrap: 'wrap',
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
  scheduleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    flexShrink: 0,
    minWidth: 160,
  },
  scheduleBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsWrap: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabTextActive: {
    color: '#1e293b',
    fontWeight: '500',
    fontSize: 14,
  },
  tabTextInactive: {
    color: '#64748b',
    fontWeight: '500',
    fontSize: 14,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  centerText: {
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
    fontSize: 48,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 18,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sessionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLiveBg: {
    backgroundColor: '#fef2f2',
  },
  iconVideoBg: {
    backgroundColor: '#eff6ff',
  },
  iconOtherBg: {
    backgroundColor: '#f0fdf4',
  },
  sessionIcon: {
    fontSize: 20,
  },
  iconLiveColor: {
    color: '#ef4444',
  },
  iconVideoColor: {
    color: '#3b82f6',
  },
  iconOtherColor: {
    color: '#22c55e',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sessionTitle: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 15,
  },
  liveBadge: {
    fontSize: 11,
    backgroundColor: '#ef4444',
    color: '#fff',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    fontWeight: '600',
    overflow: 'hidden',
  },
  sessionMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sessionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  rejoinBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  rejoinBtnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
  endSmallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  endSmallBtnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
  goLiveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#22c55e',
    borderRadius: 8,
  },
  goLiveBtnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '500',
    fontSize: 13,
  },
  recordingBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recordingOnText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  recordingOffText: {
    color: '#d97706',
    fontWeight: '600',
  },
  flagBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  flagBtnText: {
    color: '#ef4444',
    fontSize: 13,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  completedPill: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
  },
  cancelledPill: {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    margin: 0,
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 20,
  },
  modalClose: {
    fontSize: 28,
    color: '#94a3b8',
  },
  label: {
    marginBottom: 6,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  liveRoot: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    backgroundColor: '#ef4444',
    borderRadius: 5,
  },
  liveText: {
    color: '#fff',
    fontWeight: '600',
  },
  liveTitle: {
    color: '#94a3b8',
  },
  liveRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveWith: {
    color: '#94a3b8',
    fontSize: 14,
  },
  endBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  endBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
})

export default TeacherSessions;
