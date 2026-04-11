import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import { API_BASE_URL } from '../../config';
import GroupChat from './GroupChat';
import GroupSessions from './GroupSessions';
import GroupAnnouncements from './GroupAnnouncements';

const baseUrl = API_BASE_URL;

const StudentGroupDetail = ({ group, onBack }) => {
  const [studentId, setStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [groupDetail, setGroupDetail] = useState(group);
  useEffect(() => {
    const loadStudentId = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        setStudentId(storedStudentId);
      } catch (error) {
        console.log('Error loading studentId:', error);
      }
    };

    loadStudentId();
  }, []);

  useEffect(() => {
    fetchGroupDetail();
  }, [group.id]);

  const fetchGroupDetail = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group-class/${group.id}/`);
      setGroupDetail(prev => ({ ...prev, ...res.data }));
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { key: 'chat', icon: 'bi-chat-dots', label: 'Chat', count: groupDetail.message_count },
    { key: 'sessions', icon: 'bi-camera-video', label: 'Sessions', count: groupDetail.session_count, live: groupDetail.live_sessions > 0 },
    { key: 'announcements', icon: 'bi-megaphone', label: 'Announcements', count: groupDetail.announcement_count },
  ];

  return (
    <>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.topIconBtn}>
            <Bootstrap name="arrow-left" size={20} color="#64748b" />
          </TouchableOpacity>

          <View style={styles.topMeta}>
            <Text style={styles.topTitle}>{groupDetail.name || group.name}</Text>
            <Text style={styles.topSubTitle}>
              {groupDetail.student_count || group.student_count} students
              {groupDetail.teacher_name ? ` • ${groupDetail.teacher_name}` : ''}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          <View style={styles.tabBar}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                onPress={() => setActiveTab(t.key)}
                style={[styles.tabBtn, activeTab === t.key ? styles.tabBtnActive : null]}
              >
                <View style={styles.tabLabelWrap}>
                  <Bootstrap
                    name={
                      t.key === 'chat'
                        ? 'chat-dots'
                        : t.key === 'sessions'
                        ? 'camera-video'
                        : 'megaphone'
                    }
                    size={13}
                    color={activeTab === t.key ? '#1e293b' : '#64748b'}
                  />
                  <Text style={[styles.tabBtnText, activeTab === t.key ? styles.tabBtnTextActive : null]}>
                    {t.label}
                  </Text>
                  {typeof t.count === 'number' ? (
                    <Text style={[styles.tabCount, activeTab === t.key ? styles.tabCountActive : null]}>
                      {t.count}
                    </Text>
                  ) : null}
                </View>
                {t.live && (
                  <View style={styles.liveDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContentWrap}>
          {activeTab === 'chat' && <GroupChat groupId={group.id} studentId={studentId} />}
          {activeTab === 'sessions' && <GroupSessions groupId={group.id} studentId={studentId} />}
          {activeTab === 'announcements' && <GroupAnnouncements groupId={group.id} />}
          </View>
        </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  topIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topMeta: {
    flex: 1,
  },
  topTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
  },
  topSubTitle: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
  },
  tabLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#1e293b',
  },
  tabCount: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabCountActive: {
    color: '#475569',
  },
  liveDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  tabContentWrap: {
    width: '100%',
  },
});

export default StudentGroupDetail;
