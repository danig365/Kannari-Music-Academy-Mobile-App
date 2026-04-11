import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const STATUS_META = {
  scheduled: { label: 'Scheduled', color: '#3b82f6', icon: 'calendar-event' },
  live: { label: 'Live Now', color: '#10b981', icon: 'broadcast' },
  completed: { label: 'Completed', color: '#6b7280', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: 'x-circle' },
};

const GroupSessions = ({ groupId, studentId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchSessions();
    const poll = setInterval(fetchSessions, 15000);
    return () => clearInterval(poll);
  }, [groupId]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/sessions/`);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const openUrl = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open link.');
    }
  };

  const joinSession = async (session) => {
    setJoining(session.id);
    try {
      const res = await axios.post(`${baseUrl}/student/${studentId}/join-group-session/${session.id}/`);
      const data = res.data;

      if (data.meeting_link || session.meeting_link) {
        await openUrl(data.meeting_link || session.meeting_link);
      } else {
        Alert.alert('Joined!', 'You have joined the session.');
      }

      await fetchSessions();
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.error || 'Failed to join session.');
    }
    setJoining(null);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '';
    const [h, m] = timeValue.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
  };

  const filteredSessions = filter ? sessions.filter((s) => s.status === filter) : sessions;
  const liveSessions = sessions.filter((s) => s.status === 'live');

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {liveSessions.length > 0 && (
        <View style={styles.liveBannerWrap}>
          <View style={styles.liveTitleRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTitle}>Live Sessions</Text>
          </View>

          {liveSessions.map((session) => (
            <View key={session.id} style={styles.liveSessionCard}>
              <View style={styles.liveSessionMeta}>
                <Text style={styles.liveSessionName}>{session.title}</Text>
                <Text style={styles.liveSessionSub}>
                  {session.teacher_name} • Started{' '}
                  {session.started_at ? new Date(session.started_at).toLocaleTimeString() : 'Now'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.joinNowBtn}
                onPress={() => joinSession(session)}
                disabled={joining === session.id}
              >
                <Text style={styles.joinNowBtnText}>{joining === session.id ? 'Joining...' : 'Join Now'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          <FilterChip
            label={`All (${sessions.length})`}
            active={filter === ''}
            onPress={() => setFilter('')}
            color="#6366f1"
          />

          {Object.entries(STATUS_META).map(([key, meta]) => {
            const count = sessions.filter((s) => s.status === key).length;
            if (count === 0) return null;
            return (
              <FilterChip
                key={key}
                label={`${meta.label} (${count})`}
                active={filter === key}
                onPress={() => setFilter(filter === key ? '' : key)}
                color={meta.color}
              />
            );
          })}
        </View>
      </ScrollView>

      {filteredSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Bootstrap name="camera-video" size={32} color="#94a3b8" />
          <Text style={styles.emptyText}>
            {sessions.length > 0 ? 'No sessions matching filter.' : 'No sessions scheduled yet.'}
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsList}>
          {filteredSessions.map((session) => {
            const meta = STATUS_META[session.status] || STATUS_META.scheduled;
            const isLive = session.status === 'live';
            const isScheduled = session.status === 'scheduled';
            const isPast = session.status === 'completed' || session.status === 'cancelled';

            return (
              <View
                key={session.id}
                style={[
                  styles.sessionCard,
                  {
                    borderColor: isLive ? '#bbf7d0' : '#e2e8f0',
                    borderLeftColor: meta.color,
                    opacity: isPast ? 0.7 : 1,
                  },
                ]}
              >
                <View style={styles.sessionTopRow}>
                  <View style={styles.sessionMainInfo}>
                    <View style={styles.sessionTitleRow}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${meta.color}20` }]}>
                        {isLive && <View style={[styles.statusLiveDot, { backgroundColor: meta.color }]} />}
                        <Bootstrap name={meta.icon} size={10} color={meta.color} />
                        <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </View>

                    <View style={styles.sessionMetaRow}>
                      <Text style={styles.sessionMetaText}>📅 {formatDate(session.scheduled_date)}</Text>
                      <Text style={styles.sessionMetaText}>
                        🕒 {formatTime(session.formatted_time || session.scheduled_time)}
                      </Text>
                      <Text style={styles.sessionMetaText}>⏳ {session.duration_minutes} min</Text>
                      {!!session.teacher_name && (
                        <Text style={styles.sessionMetaText}>👤 {session.teacher_name}</Text>
                      )}
                    </View>

                    {session.description && (
                      <Text style={styles.sessionDescription}>{session.description}</Text>
                    )}

                    {session.actual_duration_minutes > 0 && isPast && (
                      <Text style={styles.actualDurationText}>
                        Actual duration: {session.actual_duration_minutes} min
                      </Text>
                    )}
                  </View>

                  <View style={styles.sessionActionsCol}>
                    {isLive && (
                      <TouchableOpacity
                        style={styles.joinSessionBtn}
                        onPress={() => joinSession(session)}
                        disabled={joining === session.id}
                      >
                        <Text style={styles.joinSessionBtnText}>
                          {joining === session.id ? 'Joining...' : 'Join Session'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isScheduled && session.meeting_link && (
                      <TouchableOpacity
                        style={styles.linkBtnBlue}
                        onPress={() => openUrl(session.meeting_link)}
                      >
                        <Text style={styles.linkBtnBlueText}>Meeting Link</Text>
                      </TouchableOpacity>
                    )}

                    {isPast && session.recording_url && (
                      <TouchableOpacity
                        style={styles.linkBtnPurple}
                        onPress={() => openUrl(session.recording_url)}
                      >
                        <Text style={styles.linkBtnPurpleText}>Recording</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {session.has_minor_participants && (
                  <View style={styles.minorInfoBadge}>
                    <Bootstrap name="shield-check" size={11} color="#92400e" />
                    <Text style={styles.minorInfoBadgeText}>
                      Session includes minor participants — recording enabled
                    </Text>
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

const FilterChip = ({ label, active, onPress, color }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          borderColor: active ? color : '#e2e8f0',
          backgroundColor: active ? `${color}20` : '#ffffff',
          borderWidth: active ? 2 : 1,
        },
      ]}
    >
      <Text style={[styles.filterChipText, { color: active ? color : '#64748b' }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  liveBannerWrap: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveTitle: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '700',
  },
  liveSessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  liveSessionMeta: {
    flex: 1,
  },
  liveSessionName: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
  },
  liveSessionSub: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
  },
  joinNowBtn: {
    borderRadius: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  joinNowBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'nowrap',
    paddingRight: 8,
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  sessionMainInfo: {
    flex: 1,
    minWidth: 180,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  sessionTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sessionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sessionMetaText: {
    color: '#64748b',
    fontSize: 12,
  },
  sessionDescription: {
    marginTop: 8,
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  actualDurationText: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 12,
  },
  sessionActionsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  joinSessionBtn: {
    borderRadius: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  joinSessionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  linkBtnBlue: {
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkBtnBlueText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  linkBtnPurple: {
    borderRadius: 8,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkBtnPurpleText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
  },
  minorInfoBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minorInfoBadgeText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default GroupSessions;
