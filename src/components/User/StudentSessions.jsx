import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL, JITSI_BASE_URL } from '../../config';
import LoadingSpinner from '../shared/LoadingSpinner';

const StudentSessions = () => {
  const navigation = useNavigation();
  const baseUrl = API_BASE_URL;

  const navigateToStudentLogin = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Auth', { screen: 'StudentLogin' });
      return;
    }
    navigation.navigate('StudentLogin');
  };

  const navigateToSubscriptions = () => {
    navigation.navigate('StudentSubscriptions');
  };

  const [studentId, setStudentId] = useState(null);
  const [studentLoginStatus, setStudentLoginStatus] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVideoRoom, setShowVideoRoom] = useState(null);
  const [reportModal, setReportModal] = useState({ visible: false, session: null, text: '', submitting: false });

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

  const fetchUpcoming = async (currentStudentId) => {
    try {
      const res = await axios.get(`${baseUrl}/student/${currentStudentId}/upcoming-sessions/`);
      setUpcomingSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('Error fetching upcoming sessions:', err);
    }
  };

  const fetchLiveSessions = async (currentStudentId = studentId) => {
    if (!currentStudentId) return;

    try {
      const res = await axios.get(`${baseUrl}/student/${currentStudentId}/live-sessions/`);
      setLiveSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('Error fetching live sessions:', err);
    }
  };

  const fetchSessions = async (currentStudentId = studentId) => {
    if (!currentStudentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([fetchUpcoming(currentStudentId), fetchLiveSessions(currentStudentId)]);
    setLoading(false);
  };

  useEffect(() => {
    if (studentLoginStatus === 'true' && studentId) {
      fetchSessions(studentId);
      const interval = setInterval(() => fetchLiveSessions(studentId), 15000);
      return () => clearInterval(interval);
    }
  }, [studentLoginStatus, studentId]);

  const openMeetingLink = async (roomData) => {
    const meetingLink = roomData?.meeting_link || `${JITSI_BASE_URL}/${roomData?.room_name}`;
    if (!meetingLink) return;

    try {
      await Linking.openURL(meetingLink);
    } catch (err) {
      Alert.alert('Error', 'Unable to open meeting link.');
    }
  };

  const handleJoin = async (session) => {
    try {
      const res = await axios.post(`${baseUrl}/student/${studentId}/join-session/${session.id}/`);
      if (res.data.bool) {
        const room = {
          ...session,
          room_name: res.data.room_name,
          meeting_link: res.data.meeting_link,
          teacher_name: res.data.teacher_name,
        };
        setShowVideoRoom(room);
        await openMeetingLink(room);
      } else {
        if (res.data.requires_upgrade) {
          Alert.alert('Upgrade Required', res.data.message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Plans', onPress: navigateToSubscriptions },
          ]);
        } else {
          Alert.alert('Cannot Join', res.data.message || 'Cannot join this session right now.');
        }
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.requires_upgrade) {
        Alert.alert(
          'Subscription Required',
          data.message || 'Active subscription required for live sessions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Plans', onPress: navigateToSubscriptions },
          ]
        );
      } else if (data?.requires_parental_consent) {
        Alert.alert(
          'Parental Consent Required',
          data.message || 'Parent authorization is required before joining live sessions.'
        );
      } else if (data?.teacher_verification_status) {
        Alert.alert(
          'Teacher Not Verified',
          data.message || data.error || 'This teacher is not cleared to teach minor students.'
        );
      } else {
        Alert.alert(
          'Cannot Join Session',
          data?.message || data?.error || 'Failed to join session. Please try again.'
        );
      }
    }
  };

  const openReportModal = (session) => {
    setReportModal({ visible: true, session, text: '', submitting: false });
  };

  const closeReportModal = () => {
    if (reportModal.submitting) return;
    setReportModal({ visible: false, session: null, text: '', submitting: false });
  };

  const submitReport = async () => {
    if (!reportModal.text.trim() || !reportModal.session) {
      Alert.alert('Required', 'Description is required');
      return;
    }

    setReportModal((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = new FormData();
      payload.append('reporter_type', 'student');
      payload.append('reporter_id', studentId);
      payload.append('description', reportModal.text.trim());
      await axios.post(`${baseUrl}/session/${reportModal.session.id}/report/`, payload);
      closeReportModal();
      Alert.alert('Success', 'Safety report submitted');
    } catch (err) {
      setReportModal((prev) => ({ ...prev, submitting: false }));
      Alert.alert('Failed', err.response?.data?.message || 'Could not submit report.');
    }
  };

  const formatDate = (dateValue) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeUntil = (date, time) => {
    const sessionDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = sessionDate - now;
    if (diff < 0) return 'Now';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (studentLoginStatus === null || (loading && !showVideoRoom)) {
    return (
      <LoadingSpinner size="lg" text="Loading sessions..." />
    );
  }

  if (studentLoginStatus !== 'true') {
    return null;
  }

  if (showVideoRoom) {
    return (
      <View style={styles.videoRoomWrap}>
        <View style={styles.videoRoomHeader}>
          <View style={styles.videoRoomHeaderLeft}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedText}>CONNECTED</Text>
            <Text style={styles.videoRoomTitle}>— {showVideoRoom.title}</Text>
          </View>
          <View style={styles.videoRoomHeaderRight}>
            <Text style={styles.videoRoomTeacher}>with {showVideoRoom.teacher_name || 'Teacher'}</Text>
            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={() => {
                setShowVideoRoom(null);
                fetchSessions(studentId);
              }}
            >
              <Text style={styles.leaveBtnText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.videoRoomBody}>
          <Bootstrap name="camera-video-fill" size={52} color="#94a3b8" />
          <Text style={styles.videoRoomHint}>Live meeting opens externally for best mobile experience.</Text>
          <TouchableOpacity style={styles.openMeetingBtn} onPress={() => openMeetingLink(showVideoRoom)}>
            <Text style={styles.openMeetingBtnText}>Open Meeting Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          <View style={styles.headingWrap}>
            <Text style={styles.heading}>My Sessions</Text>
            <Text style={styles.subHeading}>Join live video sessions with your teachers</Text>
          </View>

          {liveSessions.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.liveTitleRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTitle}>Live Now</Text>
              </View>

              {liveSessions.map((session) => (
                <View key={session.id} style={styles.liveSessionCard}>
                  <View style={styles.liveSessionInfoRow}>
                    <View style={styles.liveIconBox}>
                      <Bootstrap name="broadcast" size={22} color="#ffffff" />
                    </View>
                    <View style={styles.liveSessionMeta}>
                      <Text style={styles.liveSessionTitle}>{session.title}</Text>
                      <Text style={styles.liveSessionSub}>
                        with {session.teacher_name || 'Teacher'} • {session.duration_minutes} min session
                      </Text>
                    </View>
                  </View>

                  <View style={styles.liveActionsRow}>
                    <TouchableOpacity style={styles.joinNowBtn} onPress={() => handleJoin(session)}>
                      <Bootstrap name="camera-video-fill" size={14} color="#ffffff" />
                      <Text style={styles.joinNowBtnText}>Join Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reportBtn} onPress={() => openReportModal(session)}>
                      <Bootstrap name="flag" size={13} color="#ef4444" />
                      <Text style={styles.reportBtnText}>Report</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            {upcomingSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Bootstrap name="calendar-event" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No upcoming sessions</Text>
                <Text style={styles.emptyText}>Your teacher will schedule sessions for you</Text>
              </View>
            ) : (
              <View style={styles.upcomingList}>
                {upcomingSessions.map((session) => (
                  <View key={session.id} style={styles.upcomingCard}>
                    <View style={styles.upcomingTopRow}>
                      <View
                        style={[
                          styles.sessionTypeIcon,
                          session.session_type === 'video_call'
                            ? styles.videoTypeIcon
                            : styles.phoneTypeIcon,
                        ]}
                      >
                        <Bootstrap
                          name={session.session_type === 'video_call' ? 'camera-video' : 'telephone'}
                          size={18}
                          color={session.session_type === 'video_call' ? '#3b82f6' : '#22c55e'}
                        />
                      </View>

                      <View style={styles.upcomingMeta}>
                        <Text style={styles.upcomingTitle}>{session.title}</Text>
                        <Text style={styles.upcomingSub}>
                          with {session.teacher_name || 'Teacher'} • {formatDate(session.scheduled_date)} at{' '}
                          {session.formatted_time || session.scheduled_time} • {session.duration_minutes} min
                        </Text>
                      </View>
                    </View>

                    <View style={styles.upcomingBottomRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          session.status === 'confirmed'
                            ? styles.statusConfirmed
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            session.status === 'confirmed'
                              ? styles.statusConfirmedText
                              : styles.statusPendingText,
                          ]}
                        >
                          {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.upcomingReportBtn}
                        onPress={() => openReportModal(session)}
                      >
                        <Bootstrap name="flag" size={12} color="#ef4444" />
                      </TouchableOpacity>

                      <Text style={styles.timeUntilText}>
                        in {getTimeUntil(session.scheduled_date, session.scheduled_time || session.formatted_time)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

      <Modal
        visible={reportModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalCard}>
            <Text style={styles.reportModalTitle}>Report Session Safety Issue</Text>
            <TextInput
              style={styles.reportInput}
              value={reportModal.text}
              onChangeText={(text) => setReportModal((prev) => ({ ...prev, text }))}
              placeholder="Describe the issue"
              multiline
              textAlignVertical="top"
            />

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.reportCancelBtn}
                onPress={closeReportModal}
                disabled={reportModal.submitting}
              >
                <Text style={styles.reportCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportSubmitBtn}
                onPress={submitReport}
                disabled={reportModal.submitting}
              >
                <Text style={styles.reportSubmitBtnText}>
                  {reportModal.submitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
  },
  screenContent: {
    flex: 1,
  },
  sidebarOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
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
  headingWrap: {
    marginBottom: 22,
  },
  heading: {
    color: '#1e293b',
    fontSize: 30,
    fontWeight: '700',
  },
  subHeading: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  liveTitle: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '700',
  },
  liveSessionCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  liveSessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSessionMeta: {
    flex: 1,
  },
  liveSessionTitle: {
    color: '#1e293b',
    fontSize: 17,
    fontWeight: '700',
  },
  liveSessionSub: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 13,
  },
  liveActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  joinNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  joinNowBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  reportBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#1e293b',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  emptyTitle: {
    marginTop: 14,
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 14,
  },
  upcomingList: {
    gap: 10,
  },
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  upcomingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTypeIcon: {
    backgroundColor: '#eff6ff',
  },
  phoneTypeIcon: {
    backgroundColor: '#f0fdf4',
  },
  upcomingMeta: {
    flex: 1,
  },
  upcomingTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
  },
  upcomingSub: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  upcomingBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusConfirmed: {
    backgroundColor: '#f0fdf4',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusConfirmedText: {
    color: '#16a34a',
  },
  statusPendingText: {
    color: '#d97706',
  },
  upcomingReportBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeUntilText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  reportModalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  reportModalTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  reportInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1e293b',
    fontSize: 14,
    backgroundColor: '#f8fafc',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  reportCancelBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reportCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  reportSubmitBtn: {
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reportSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  videoRoomWrap: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  videoRoomHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  videoRoomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  connectedText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '700',
  },
  videoRoomTitle: {
    color: '#94a3b8',
    fontSize: 13,
    maxWidth: 240,
  },
  videoRoomHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoRoomTeacher: {
    color: '#94a3b8',
    fontSize: 13,
  },
  leaveBtn: {
    borderRadius: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  leaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  videoRoomBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 12,
  },
  videoRoomHint: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  openMeetingBtn: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  openMeetingBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default StudentSessions;
