import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useMemo } from 'react'
import axios from 'axios'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, TextInput, FlatList } from 'react-native'
import { useNavigation, useNavigationState } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Dimensions } from 'react-native'
import { Bootstrap } from '../shared/BootstrapIcon'
import { API_BASE_URL } from '../../config';
import { getStudentSonaraCoins } from '../../services/gameService';

const Sidebar = ({ isOpen: externalIsOpen, setIsOpen: externalSetIsOpen, isMobile: externalIsMobile }) => {
  const navigation = useNavigation();
  const currentRouteName = useNavigationState((state) => state?.routes?.[state.index]?.name || '');

  // Self-managed mobile state when parent doesn't provide props
  const [internalIsMobile, setInternalIsMobile] = useState(Dimensions.get('window').width < 768);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isMobile = externalIsMobile !== undefined ? externalIsMobile : internalIsMobile;
  const isOpen = externalSetIsOpen ? (externalIsOpen || false) : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  const routeMap = useMemo(
    () => ({
      '/student/dashboard': 'StudentDashboard',
      '/student/my-courses': 'MyCourses',
      '/all-courses': 'AllCourses',
      '/student/my-progress': 'MyProgress',
      '/student/my-achievements': 'MyAchievements',
      '/student/my-sessions': 'StudentSessions',
      '/student/my-messages': 'AudioMessages',
      '/student/text-messages': 'TextMessages',
      '/student/my-assignments': 'StudentAssignments',
      '/student/my-groups': 'StudentGroups',
      '/student/games': 'StudentGamesHub',
      '/student/subscriptions': 'StudentSubscriptions',
      '/student/profile-setting': 'ProfileSetting',
      '/student/change-password': 'ChangePassword',
      '/student/logout': 'UserLogout',
    }),
    []
  );

  // Track resize for self-managed mobile detection
  useEffect(() => {
    if (externalIsMobile !== undefined) return; // parent manages it
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setInternalIsMobile(window.width < 768);
    });
    return () => subscription?.remove();
  }, [externalIsMobile]);

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [currentRouteName]);

  const [studentData, setStudentData] = useState({
    fullname: '',
    email: '',
    profile_img: ''
  });
  const [groups, setGroups] = useState([]);
  const [minorStatus, setMinorStatus] = useState(null); // { is_minor, can_send_messages, has_parent_approval }
  const [sonaraCoins, setSonaraCoins] = useState(null);
  const [hasGameSubscription, setHasGameSubscription] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const baseUrl = API_BASE_URL;

  useEffect(() => {
    const fetchStudentId = async () => {
      try {
        const storedStudentId = await AsyncStorage.getItem('studentId');
        setStudentId(storedStudentId);
      } catch (error) {
        console.log('Error reading studentId:', error);
      }
    };
    fetchStudentId();
  }, [])

  // Fetch student data from API to get the latest profile image
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`${baseUrl}/student/${studentId}`);
        setStudentData({
          fullname: response.data.fullname || '',
          email: response.data.email || '',
          profile_img: response.data.profile_img || ''
        });
      } catch (error) {
        console.log('Error fetching student data:', error);
      }
    };
    if (studentId) {
      fetchStudentData();
      // Refresh data every 30 seconds to catch updates from settings page
      const interval = setInterval(fetchStudentData, 30000);
      return () => clearInterval(interval);
    }
  }, [studentId]);

  // Fetch student's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/my-groups/`);
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log('No groups or error:', err);
      }
    };
    if (studentId) {
      fetchGroups();
    }
  }, [studentId]);

  // Fetch minor access status
  useEffect(() => {
    const fetchMinorStatus = async () => {
      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/minor-access-status/`);
        setMinorStatus(res.data);
      } catch (err) {
        console.log('Minor status check error:', err);
      }
    };
    if (studentId) {
      fetchMinorStatus();
    }
  }, [studentId]);

  // Fetch Sonara Coins
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await getStudentSonaraCoins(studentId);
        setSonaraCoins(res.data.sonara_coins_total || 0);
        setHasGameSubscription(res.data.has_subscription !== false);
      } catch (err) {
        console.log('Sonara coins fetch error:', err);
      }
    };
    if (studentId) {
      fetchCoins();
      const interval = setInterval(fetchCoins, 60000); // refresh every 60s
      return () => clearInterval(interval);
    }
  }, [studentId]);

  const isActive = (path) => {
    const routeName = routeMap[path] || path;
    return currentRouteName === routeName;
  };

  const navigateTo = (path) => {
    const routeName = routeMap[path] || path;

    // Close drawer first on mobile so navigation feels smooth.
    handleNavClick();

    // Avoid re-triggering the same screen and causing unnecessary refresh effects.
    if (routeName === currentRouteName) {
      return;
    }

    navigation.navigate(routeName);
  };

  const handleNavClick = () => {
    if (isMobile && setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <View
      style={[
        styles.sidebar,
        isMobile ? styles.sidebarMobile : null,
        isMobile && !isOpen ? styles.sidebarHidden : null,
        isMobile && isOpen ? styles.sidebarMobileOpen : null,
      ]}
    >
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View style={styles.logoBox}>
            <Bootstrap name="music-note-beamed" size={20} color="white" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>Kannari Music Academy</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Student Portal</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={styles.navContent}>
        <TouchableOpacity onPress={() => navigateTo('/student/dashboard')} style={[styles.navLink, isActive('/student/dashboard') ? styles.navLinkActive : null]}>
          <Bootstrap name="speedometer2" size={18} color={isActive('/student/dashboard') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/dashboard') ? styles.navTextActive : null]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/student/my-courses')} style={[styles.navLink, styles.navLinkRelative, isActive('/student/my-courses') ? styles.navLinkActive : null]}>
          <Bootstrap name="book" size={18} color={isActive('/student/my-courses') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/my-courses') ? styles.navTextActive : null]}>My Courses</Text>
          {isActive('/student/my-courses') && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/all-courses')} style={[styles.navLink, isActive('/all-courses') ? styles.navLinkActive : null]}>
          <Bootstrap name="collection" size={18} color={isActive('/all-courses') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/all-courses') ? styles.navTextActive : null]}>All Courses</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/student/my-progress')} style={[styles.navLink, isActive('/student/my-progress') ? styles.navLinkActive : null]}>
          <Bootstrap name="bar-chart-line" size={18} color={isActive('/student/my-progress') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/my-progress') ? styles.navTextActive : null]}>My Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/student/my-achievements')} style={[styles.navLink, isActive('/student/my-achievements') ? styles.navLinkActive : null]}>
          <Bootstrap name="trophy" size={18} color={isActive('/student/my-achievements') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/my-achievements') ? styles.navTextActive : null]}>Achievements</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/student/my-sessions')} style={[styles.navLink, isActive('/student/my-sessions') ? styles.navLinkActive : null]}>
          <Bootstrap name="camera-video" size={18} color={isActive('/student/my-sessions') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/my-sessions') ? styles.navTextActive : null]}>Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateTo('/student/my-messages')}
          disabled={minorStatus?.is_minor && !minorStatus?.can_send_messages}
          style={[
            styles.navLink,
            isActive('/student/my-messages') ? styles.navLinkActive : null,
            minorStatus?.is_minor && !minorStatus?.can_send_messages ? styles.navLinkDisabled : null,
          ]}
        >
          <Bootstrap name="mic" size={18} color={(minorStatus?.is_minor && !minorStatus?.can_send_messages) ? '#475569' : (isActive('/student/my-messages') ? 'white' : '#94a3b8')} />
          <Text style={[styles.navText, (minorStatus?.is_minor && !minorStatus?.can_send_messages) ? styles.navTextDisabled : null, isActive('/student/my-messages') ? styles.navTextActive : null]}>Messages</Text>
          {minorStatus?.is_minor && !minorStatus?.can_send_messages && (
            <Bootstrap name="lock-fill" size={12} color="#f59e0b" style={styles.rightIcon} />
          )}
        </TouchableOpacity>

        {minorStatus?.is_minor && !minorStatus?.can_send_messages && (
          <View style={styles.minorBanner}>
            <View style={styles.minorBannerHeader}>
              <Bootstrap name="shield-exclamation" size={12} color="#f59e0b" />
              <Text style={styles.minorBannerTitle}>Parent Approval Required</Text>
            </View>
            <Text style={styles.minorBannerText}>
              Messaging is locked until your parent/guardian approves your account.
            </Text>
          </View>
        )}

        {minorStatus && !minorStatus.is_minor && (
          <TouchableOpacity onPress={() => navigateTo('/student/text-messages')} style={[styles.navLink, isActive('/student/text-messages') ? styles.navLinkActive : null]}>
            <Bootstrap name="chat-dots" size={18} color={isActive('/student/text-messages') ? 'white' : '#94a3b8'} />
            <Text style={[styles.navText, isActive('/student/text-messages') ? styles.navTextActive : null]}>Text Messages</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigateTo('/student/my-assignments')} style={[styles.navLink, isActive('/student/my-assignments') ? styles.navLinkActive : null]}>
          <Bootstrap name="journal-check" size={18} color={isActive('/student/my-assignments') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/my-assignments') ? styles.navTextActive : null]}>Assignments</Text>
        </TouchableOpacity>

        {groups.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>My Groups</Text>
            <TouchableOpacity onPress={() => navigateTo('/student/my-groups')} style={[styles.navLink, isActive('/student/my-groups') ? styles.navLinkActive : null]}>
              <Bootstrap name="diagram-3" size={18} color={isActive('/student/my-groups') ? 'white' : '#94a3b8'} />
              <Text style={[styles.navText, isActive('/student/my-groups') ? styles.navTextActive : null]}>All Groups</Text>
              {groups.some((g) => g.live_now) && <View style={styles.liveDot} />}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigateTo('/student/games')} style={[styles.navLink, isActive('/student/games') ? styles.navLinkActive : null]}>
          <Bootstrap name="controller" size={18} color={isActive('/student/games') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/games') ? styles.navTextActive : null]}>Games</Text>
          {hasGameSubscription === false ? (
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>🔒</Text>
            </View>
          ) : sonaraCoins !== null && sonaraCoins > 0 && (
            <View style={styles.coinBadge}>
              <Text style={styles.coinBadgeText}>💰 {sonaraCoins}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigateTo('/student/subscriptions')} style={[styles.navLink, isActive('/student/subscriptions') ? styles.navLinkActive : null]}>
          <Bootstrap name="credit-card-2-front" size={18} color={isActive('/student/subscriptions') ? 'white' : '#94a3b8'} />
          <Text style={[styles.navText, isActive('/student/subscriptions') ? styles.navTextActive : null]}>Subscriptions</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.userProfile}>
          {studentData.profile_img ? (
            <Image source={{ uri: studentData.profile_img }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileFallback}>
              <Text style={styles.profileFallbackText}>{studentData.fullname ? studentData.fullname.substring(0, 2).toUpperCase() : 'ST'}</Text>
            </View>
          )}
          <View style={styles.userMeta}>
            <Text style={styles.userName} numberOfLines={1}>{studentData.fullname || 'Student'}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{studentData.email || 'student@example.com'}</Text>
          </View>
        </View>

        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity onPress={() => navigateTo('/student/profile-setting')} style={styles.bottomButton}>
            <Bootstrap name="gear" size={14} color="#94a3b8" />
            <Text style={styles.bottomButtonText} numberOfLines={1}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('/student/logout')} style={styles.bottomButton}>
            <Bootstrap name="box-arrow-right" size={14} color="#94a3b8" />
            <Text style={styles.bottomButtonText} numberOfLines={1}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hiddenLink}>
          <TouchableOpacity onPress={() => navigateTo('/student/change-password')}>
            <Text>Change Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#0f1624',
    bottom: 0,
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    left: 0,
    width: 260,
    zIndex: 1000,
  },
  sidebarMobile: {
    width: '84%',
    maxWidth: 320,
  },
  sidebarHidden: {
    left: -360,
  },
  sidebarMobileOpen: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  headerSection: {
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextWrap: {
    minWidth: 0,
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  nav: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    marginBottom: 4,
  },
  navLinkRelative: {
    position: 'relative',
  },
  navLinkActive: {
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    borderLeftColor: '#4285f4',
  },
  navLinkDisabled: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  navTextActive: {
    color: 'white',
  },
  navTextDisabled: {
    color: '#475569',
  },
  activeDot: {
    marginLeft: 'auto',
    width: 6,
    height: 6,
    backgroundColor: '#60a5fa',
    borderRadius: 3,
  },
  rightIcon: {
    marginLeft: 'auto',
  },
  minorBanner: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  minorBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minorBannerTitle: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '600',
  },
  minorBannerText: {
    marginTop: 4,
    fontSize: 10,
    color: '#92400e',
    lineHeight: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
  },
  sectionTitle: {
    paddingTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveDot: {
    marginLeft: 'auto',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  lockBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 10,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  coinBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 10,
  },
  coinBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  bottomSection: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
  },
  profileFallback: {
    width: 40,
    height: 40,
    backgroundColor: '#a855f7',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profileFallbackText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  userEmail: {
    color: '#64748b',
    fontSize: 12,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  bottomButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  hiddenLink: {
    display: 'none',
  },
});

export default Sidebar