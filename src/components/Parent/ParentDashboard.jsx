import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const ParentDashboard = () => {
  const navigation = useNavigation();
  const { setRole } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const baseUrl = API_BASE_URL;

  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('Parent');
  const [activeTab, setActiveTab] = useState('overview');
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivity, setChildActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    initAuthAndData();
  }, []);

  const initAuthAndData = async () => {
    const [id, name, loginStatus] = await Promise.all([
      AsyncStorage.getItem('parentId'),
      AsyncStorage.getItem('parentName'),
      AsyncStorage.getItem('parentLoginStatus'),
    ]);

    if (!id || loginStatus !== 'true') {
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'ParentLogin' }] });
      }
      return;
    }

    setParentId(id);
    setParentName(name || 'Parent');
    fetchChildren(id);
  };

  const fetchChildren = async (id = parentId) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/parent/${id}/children/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.children || [];
        setChildren(list);
        if (list.length > 0) {
          const first = selectedChild && list.some((c) => c.student_id === selectedChild.student_id)
            ? list.find((c) => c.student_id === selectedChild.student_id)
            : list[0];
          setSelectedChild(first);
          fetchChildActivity(first.student_id);
        } else {
          setSelectedChild(null);
          setChildActivity(null);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch children');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildActivity = async (studentId) => {
    if (!studentId) return;
    setActivityLoading(true);
    try {
      const [enrollRes, accessRes] = await Promise.all([
        fetch(`${baseUrl}/fetch-enrolled-courses/${studentId}/`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${baseUrl}/student/${studentId}/minor-access-status/`).then((r) => (r.ok ? r.json() : {})),
      ]);
      setChildActivity({
        enrolledCourses: Array.isArray(enrollRes) ? enrollRes : [],
        accessStatus: accessRes,
      });
    } catch (err) {
      setChildActivity({ enrolledCourses: [], accessStatus: {} });
    } finally {
      setActivityLoading(false);
    }
  };

  const selectChild = (child) => {
    setSelectedChild(child);
    fetchChildActivity(child.student_id);
  };

  const handleAuthorize = async (child) => {
    try {
      const res = await fetch(`${baseUrl}/parent/${parentId}/student/${child.student_id}/authorize/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (res.ok) {
        fetchChildren();
      }
    } catch (err) {
      Alert.alert('Error', 'Authorization update failed');
    }
  };

  const handleConsentToggle = async (child, consentType, action) => {
    try {
      const url =
        consentType === 'live_sessions'
          ? `${baseUrl}/parent/${parentId}/student/${child.student_id}/live-consent/`
          : `${baseUrl}/parent/${parentId}/student/${child.student_id}/authorize/`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchChildren();
      }
    } catch (err) {
      Alert.alert('Error', 'Consent update failed');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['parentId', 'parentName', 'parentLoginStatus']);
    setRole(null);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'consent', label: 'Consent' },
    { id: 'messages', label: 'Messages' },
  ];

  const statusStyle = (status) => {
    if (status === 'approved') return { bg: '#d1fae5', color: '#065f46', label: 'Approved' };
    if (status === 'revoked') return { bg: '#fee2e2', color: '#991b1b', label: 'Revoked' };
    return { bg: '#fef3c7', color: '#92400e', label: 'Pending' };
  };

  const StatusBadge = ({ status }) => {
    const s = statusStyle(status);
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
      </View>
    );
  };

  const renderOverview = () => (
    <View>
      {children.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelectorWrap}>
          <View style={styles.childSelectorRow}>
            {children.map((child, i) => {
              const active = selectedChild?.student_id === child.student_id;
              return (
                <TouchableOpacity
                  key={child.student_id || i}
                  style={[styles.childChip, active && styles.childChipActive]}
                  onPress={() => selectChild(child)}
                >
                  <Text style={[styles.childChipText, active && styles.childChipTextActive]}>{child.student_name || 'Child'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {activityLoading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text style={styles.centerText}>Loading activity...</Text>
        </View>
      ) : selectedChild && childActivity ? (
        <View style={[styles.gridWrap, !isMobile && styles.gridDesktop]}>
          <View style={[styles.card, !isMobile && styles.fullSpanCard]}>
            <View style={styles.studentInfoRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(selectedChild.student_name || 'S').substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.studentName}>{selectedChild.student_name}</Text>
                <Text style={styles.studentEmail}>{selectedChild.student_email}</Text>
              </View>
              <StatusBadge status={selectedChild.link_status} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Access Status</Text>
            {[
              { label: 'Enroll in Courses', value: childActivity.accessStatus?.can_enroll },
              { label: 'Send Messages', value: childActivity.accessStatus?.can_send_messages },
              { label: 'Join Live Sessions', value: childActivity.accessStatus?.can_join_sessions },
              { label: 'Parent Approved', value: childActivity.accessStatus?.has_parent_approval },
            ].map((item, idx) => (
              <View key={idx} style={styles.statusRow}>
                <Text style={styles.statusLabel}>{item.label}</Text>
                <Text style={[styles.statusIcon, { color: item.value ? '#065f46' : '#991b1b' }]}>{item.value ? '✓' : '✕'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enrolled Courses ({childActivity.enrolledCourses.length})</Text>
            {childActivity.enrolledCourses.length === 0 ? (
              <Text style={styles.emptySmall}>No courses enrolled yet.</Text>
            ) : (
              <View style={styles.courseList}>
                {childActivity.enrolledCourses.slice(0, 5).map((enr, idx) => (
                  <View key={idx} style={styles.courseItem}>
                    <Text style={styles.courseTitle}>{enr.course?.title || enr.title || 'Course'}</Text>
                    <Text style={styles.courseMeta}>{enr.course?.techs || enr.teacher_name || ''}</Text>
                  </View>
                ))}
                {childActivity.enrolledCourses.length > 5 ? (
                  <Text style={styles.moreText}>+{childActivity.enrolledCourses.length - 5} more courses</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.centerBlock}>
          <Text style={styles.centerText}>Select a child to view their activity</Text>
        </View>
      )}
    </View>
  );

  const renderConsent = () => (
    <View style={styles.listCol}>
      {children.length === 0 ? (
        <View style={styles.centerBlock}>
          <Text style={styles.centerText}>No linked children found</Text>
        </View>
      ) : (
        children.map((child, idx) => (
          <View key={child.student_id || idx} style={styles.card}>
            <View style={styles.consentHeader}>
              <View style={styles.consentUserRow}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>{(child.student_name || 'S').substring(0, 2).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.consentName}>{child.student_name}</Text>
                  <Text style={styles.consentEmail}>{child.student_email}</Text>
                </View>
              </View>
              <StatusBadge status={child.link_status} />
            </View>

            <ConsentRow
              title="Account Authorization"
              subtitle="Allow this child to use the platform"
              actionLabel={child.link_status === 'approved' ? 'Revoke' : 'Approve'}
              danger={child.link_status === 'approved'}
              onPress={() =>
                child.link_status === 'approved'
                  ? handleConsentToggle(child, 'account', 'revoke')
                  : handleAuthorize(child)
              }
            />

            <ConsentRow
              title="Live Sessions"
              subtitle="Allow child to join live video/audio sessions"
              actionLabel={child.live_sessions_status === 'approved' ? 'Revoke' : 'Approve'}
              danger={child.live_sessions_status === 'approved'}
              onPress={() =>
                child.live_sessions_status === 'approved'
                  ? handleConsentToggle(child, 'live_sessions', 'revoke')
                  : handleConsentToggle(child, 'live_sessions', 'approve')
              }
            />

            <View style={styles.modeBox}>
              <Text style={styles.modeTitle}>Authorization Mode</Text>
              <Text style={styles.modeText}>
                {child.authorization_mode === 'pre_authorized'
                  ? '✓ Pre-authorized (child can join sessions without per-session approval)'
                  : '🔒 Per-session login (you must approve each session individually)'}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderMessages = () => (
    <View style={styles.centerBlock}>
      <Text style={styles.centerText}>Teacher conversations with your children</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('ParentMessages')}>
        <Text style={styles.primaryBtnText}>Open Messages</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>👪</Text>
          </View>
          <View>
            <Text style={styles.portalTitle}>Parent Portal</Text>
            <Text style={styles.portalSub}>Kannari Music Academy</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <Text style={styles.parentName}>{parentName}</Text>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabWrap}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentWrap}>
        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.centerText}>Loading...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'consent' && renderConsent()}
            {activeTab === 'messages' && renderMessages()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const ConsentRow = ({ title, subtitle, actionLabel, danger, onPress }) => (
  <View style={styles.consentRow}>
    <View style={styles.flex1}>
      <Text style={styles.consentRowTitle}>{title}</Text>
      <Text style={styles.consentRowSubtitle}>{subtitle}</Text>
    </View>
    <TouchableOpacity style={[styles.actionBtn, danger ? styles.actionBtnDanger : styles.actionBtnSuccess]} onPress={onPress}>
      <Text style={[styles.actionBtnText, danger ? styles.actionBtnTextDanger : styles.actionBtnTextSuccess]}>{actionLabel}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f0f4f8' },
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 16 },
  portalTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  portalSub: { fontSize: 11, color: '#94a3b8' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  parentName: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  signOutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  signOutText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  tabWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 10, alignItems: 'center' },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#7c3aed' },
  tabText: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  tabTextActive: { color: '#7c3aed' },
  contentWrap: { padding: 14, paddingBottom: 24 },
  childSelectorWrap: { marginBottom: 14 },
  childSelectorRow: { flexDirection: 'row', gap: 8 },
  childChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f1f5f9' },
  childChipActive: { backgroundColor: '#7c3aed' },
  childChipText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  childChipTextActive: { color: '#fff' },
  gridWrap: { gap: 12 },
  gridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  fullSpanCard: { width: '100%' },
  studentInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  flex1: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  studentEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusLabel: { fontSize: 12, color: '#475569' },
  statusIcon: { fontSize: 13, fontWeight: '700' },
  emptySmall: { fontSize: 12, color: '#94a3b8' },
  courseList: { gap: 8 },
  courseItem: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 10 },
  courseTitle: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  courseMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  moreText: { fontSize: 11, color: '#64748b', marginTop: 3 },
  centerBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  centerText: { fontSize: 13, color: '#64748b', marginTop: 10, textAlign: 'center' },
  listCol: { gap: 12 },
  consentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  consentUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  consentName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  consentEmail: { fontSize: 11, color: '#64748b', marginTop: 1 },
  consentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  consentRowTitle: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  consentRowSubtitle: { fontSize: 11, color: '#64748b', marginTop: 1 },
  actionBtn: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  actionBtnSuccess: { backgroundColor: '#d1fae5' },
  actionBtnDanger: { backgroundColor: '#fee2e2' },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  actionBtnTextSuccess: { color: '#065f46' },
  actionBtnTextDanger: { color: '#991b1b' },
  modeBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 10 },
  modeTitle: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  modeText: { fontSize: 11, color: '#64748b' },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

export default ParentDashboard;
