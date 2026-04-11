import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Bootstrap } from '../shared/BootstrapIcon';

const NAV_ITEMS = [
    { path: '/admin-panel/dashboard', screen: 'AdminDashboard', label: 'Dashboard', icon: 'speedometer2' },
    { path: '/admin-panel/users-management', screen: 'UsersManagement', label: 'User Management', icon: 'people' },
    { path: '/admin-panel/lesson-management', screen: 'AdminLessonManagement', label: 'Course Management', icon: 'book' },
    { path: '/admin-panel/activity-logs', screen: 'ActivityLogs', label: 'Activity Logs', icon: 'clock-history' },
    { path: '/admin-panel/subscriptions', screen: 'SubscriptionsManagement', label: 'Subscriptions', icon: 'credit-card-2-front' },
    { path: '/admin-panel/games-analytics', screen: 'AdminGamesAnalytics', label: 'Games Analytics', icon: 'controller' },
    { path: '/admin-panel/audit-logs', screen: 'AuditLogsDashboard', label: 'Audit Logs', icon: 'shield-check' },
];

const PATH_TO_SCREEN = {
    '/admin-panel/dashboard': 'AdminDashboard',
    '/admin-panel/users-management': 'UsersManagement',
    '/admin-panel/lesson-management': 'AdminLessonManagement',
    '/admin-panel/activity-logs': 'ActivityLogs',
    '/admin-panel/subscriptions': 'SubscriptionsManagement',
    '/admin-panel/games-analytics': 'AdminGamesAnalytics',
    '/admin-panel/audit-logs': 'AuditLogsDashboard',
    '/admin-panel/settings': 'AdminSettings',
};

const AdminSidebar = ({ isOpen = false, setIsOpen = null, isMobile = false, onNavigate = null }) => {
    const navigation = useNavigation();
    const { setRole } = useAuth();
    const currentRouteName = useNavigationState((state) => state?.routes?.[state.index]?.name || '');

    const [adminRole, setAdminRole] = useState('');
    const [adminName, setAdminName] = useState('');

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        const [role, name] = await Promise.all([
            AsyncStorage.getItem('adminRole'),
            AsyncStorage.getItem('adminName'),
        ]);
        setAdminRole(role || 'Super Admin');
        setAdminName(name || 'Admin User');
    };

    const currentPath = useMemo(() => {
        const match = Object.entries(PATH_TO_SCREEN).find(([, screen]) => screen === currentRouteName);
        return match ? match[0] : '/admin-panel/dashboard';
    }, [currentRouteName]);

    const isActive = (path) => {
        if (path === '/admin-panel/lesson-management') {
            return currentPath.startsWith('/admin-panel/lesson-management');
        }
        return currentPath === path;
    };

    const navigateToPath = async (path) => {
        if (setIsOpen && isMobile) {
            setIsOpen(false);
        }

        if (path === '/admin-panel/logout') {
            await AsyncStorage.multiRemove(['adminLoginStatus', 'adminId', 'adminRole', 'adminName']);
            setRole(null);
            return;
        }

        const screen = PATH_TO_SCREEN[path];
        if (screen) {
            navigation.navigate(screen);
        }

        if (onNavigate) {
            onNavigate(path);
        }
    };

    return (
        <View style={[styles.container, isMobile && styles.mobileContainer, !isOpen && isMobile && styles.hiddenMobile]}>
            <View style={styles.header}>
                <View style={styles.logoWrap}>
                    <Bootstrap name="music-note-beamed" size={20} color="white" />
                </View>
                <View>
                    <Text style={styles.brand}>Kannari Music Academy</Text>
                    <Text style={styles.portal}>Admin Portal</Text>
                </View>
            </View>

            <ScrollView style={styles.navWrap}>
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <TouchableOpacity
                            key={item.path}
                            onPress={() => navigateToPath(item.path)}
                            style={[styles.navItem, active && styles.navItemActive]}
                        >
                            <Bootstrap name={item.icon} size={16} color={active ? '#fff' : '#8b92a7'} />
                            <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.userRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{adminName ? adminName.substring(0, 2).toUpperCase() : 'AD'}</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{adminName}</Text>
                        <Text style={styles.userRole}>{(adminRole || '').replace('_', ' ')}</Text>
                    </View>
                </View>

                <View style={styles.footerButtons}>
                    <TouchableOpacity style={styles.footerBtn} onPress={() => navigateToPath('/admin-panel/settings')}>
                        <Text style={styles.footerBtnText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.footerBtn, styles.logoutBtn]} onPress={() => navigateToPath('/admin-panel/logout')}>
                        <Text style={[styles.footerBtnText, styles.logoutBtnText]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0f1624',
        width: 260,
        height: '100%',
    },
    mobileContainer: {
        width: '100%',
    },
    hiddenMobile: {
        display: 'none',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    logoWrap: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#4285f4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brand: { color: '#fff', fontSize: 15, fontWeight: '700' },
    portal: { color: '#6b7280', fontSize: 12 },
    navWrap: { flex: 1, paddingVertical: 8 },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderLeftWidth: 3,
        borderLeftColor: 'transparent',
        gap: 10,
    },
    navItemActive: {
        backgroundColor: 'rgba(66, 133, 244, 0.15)',
        borderLeftColor: '#4285f4',
    },
    navText: { color: '#8b92a7', fontSize: 14 },
    navTextActive: { color: '#fff' },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        padding: 16,
    },
    userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    userInfo: { flex: 1 },
    userName: { color: '#fff', fontSize: 13, fontWeight: '600' },
    userRole: { color: '#6b7280', fontSize: 11 },
    footerButtons: { flexDirection: 'row', gap: 8 },
    footerBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    footerBtnText: { color: '#8b92a7', fontSize: 12, fontWeight: '600' },
    logoutBtn: { backgroundColor: 'rgba(239,68,68,0.12)' },
    logoutBtnText: { color: '#ef4444' },
});

export default AdminSidebar;