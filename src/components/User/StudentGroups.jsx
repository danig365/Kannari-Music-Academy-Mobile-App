import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';
import StudentGroupDetail from './StudentGroupDetail';

const baseUrl = API_BASE_URL;

const StudentGroups = () => {
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
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);

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

  const fetchGroups = async (currentStudentId = studentId) => {
    try {
      const res = await axios.get(`${baseUrl}/student/${currentStudentId}/my-groups/`);
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log('Failed to load groups:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (studentLoginStatus === 'true' && studentId) {
      fetchGroups(studentId);
    }
  }, [studentLoginStatus, studentId]);

  if (selectedGroup) {
    return <StudentGroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
  }

  if (studentLoginStatus !== 'true') {
    return null;
  }

  return (

        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          <View style={styles.headingWrap}>
            <View style={styles.headingRow}>
              <Bootstrap name="diagram-3" size={20} color="#1e293b" />
              <Text style={styles.heading}>My Groups</Text>
            </View>
            <Text style={styles.subHeading}>
              View your group classes, chat with members, and join sessions.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Bootstrap name="diagram-3" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>You're not part of any group classes yet.</Text>
            </View>
          ) : (
            <View style={styles.groupList}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setSelectedGroup(group)}
                  style={[
                    styles.groupCard,
                    { borderLeftColor: group.live_now ? '#10b981' : '#6366f1' },
                  ]}
                >
                  <View style={styles.groupTopRow}>
                    <View style={styles.groupMainInfo}>
                      <View style={styles.groupNameRow}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        {group.live_now && (
                          <View style={styles.liveBadge}>
                            <View style={styles.liveBadgeDot} />
                            <Text style={styles.liveBadgeText}>LIVE</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.groupSecondaryLine}>
                        {group.school_name}
                        {group.teacher_name ? ` • ${group.teacher_name}` : ''}
                      </Text>

                      {group.schedule && <Text style={styles.groupSchedule}>🕒 {group.schedule}</Text>}
                    </View>

                    <View style={styles.tagsWrap}>
                      <View style={[styles.smallTag, styles.tagStudents]}>
                        <Text style={styles.tagStudentsText}>{group.student_count} students</Text>
                      </View>

                      {group.upcoming_sessions > 0 && (
                        <View style={[styles.smallTag, styles.tagUpcoming]}>
                          <Text style={styles.tagUpcomingText}>{group.upcoming_sessions} upcoming</Text>
                        </View>
                      )}

                      {group.announcement_count > 0 && (
                        <View style={[styles.smallTag, styles.tagAnnouncement]}>
                          <Text style={styles.tagAnnouncementText}>{group.announcement_count}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {group.description && (
                    <Text style={styles.groupDescription}>
                      {group.description.length > 150
                        ? `${group.description.substring(0, 150)}...`
                        : group.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
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
  headingWrap: {
    marginBottom: 18,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    color: '#1e293b',
    fontSize: 30,
    fontWeight: '700',
  },
  subHeading: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 14,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  emptyText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  groupList: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  groupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  groupMainInfo: {
    flex: 1,
    minWidth: 180,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  groupName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
  },
  groupSecondaryLine: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  groupSchedule: {
    marginTop: 2,
    color: '#94a3b8',
    fontSize: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  smallTag: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagStudents: {
    backgroundColor: '#e0e7ff',
  },
  tagStudentsText: {
    color: '#4338ca',
    fontSize: 11,
    fontWeight: '700',
  },
  tagUpcoming: {
    backgroundColor: '#dbeafe',
  },
  tagUpcomingText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
  },
  tagAnnouncement: {
    backgroundColor: '#fef3c7',
  },
  tagAnnouncementText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '700',
  },
  groupDescription: {
    marginTop: 10,
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
  },
});

export default StudentGroups;
