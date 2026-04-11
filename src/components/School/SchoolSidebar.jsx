import React, { useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useNavigationState } from '@react-navigation/native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Bootstrap } from '../shared/BootstrapIcon'

const SchoolSidebar = ({ isOpen = false, setIsOpen = null, isMobile = false, onNavigate = null }) => {
    const navigation = useNavigation()
    const currentRouteName = useNavigationState((state) => state?.routes?.[state.index]?.name || '')
    const [schoolName, setSchoolName] = useState('')

    useEffect(() => {
        const loadSchoolData = async () => {
            const storedSchoolName = await AsyncStorage.getItem('schoolName')
            setSchoolName(storedSchoolName || '')
        }

        loadSchoolData()
    }, [])

    const pathToScreenMap = useMemo(() => ({
        '/school/dashboard': 'SchoolDashboard',
        '/school/teachers': 'SchoolTeachers',
        '/school/students': 'SchoolStudents',
        '/school/group-classes': 'SchoolGroupClasses',
        '/school/lesson-assignments': 'SchoolLessonAssignments',
        '/school/progress': 'SchoolProgress',
        '/school/chat-locks': 'SchoolChatLock',
        '/school/settings': 'SchoolSettings',
        '/school/logout': 'SchoolLogout',
    }), [])

    const isActive = (path) => {
        const routeName = pathToScreenMap[path] || path
        return currentRouteName === routeName
    }

    const handleNavClick = (path) => {
        const routeName = pathToScreenMap[path]

        if (isMobile && setIsOpen) {
            setIsOpen(false)
        }

        if (routeName && routeName !== currentRouteName) {
            navigation.navigate(routeName)
        }

        if (onNavigate) {
            onNavigate(path)
        }

        if (isMobile) {
            return
        }
    }

    const navItems = [
        { path: '/school/dashboard', icon: 'speedometer2', label: 'Dashboard' },
        { path: '/school/teachers', icon: 'person-badge', label: 'Teachers' },
        { path: '/school/students', icon: 'people', label: 'Students' },
        { path: '/school/group-classes', icon: 'diagram-3', label: 'Group Classes' },
        { path: '/school/lesson-assignments', icon: 'journal-check', label: 'Lesson Assignments' },
        { path: '/school/progress', icon: 'bar-chart-line', label: 'Progress Overview' },
        { path: '/school/chat-locks', icon: 'shield-lock', label: 'Chat Lock Management' },
    ]

    return (
        <View style={[styles.sidebar, { width: isMobile ? '100%' : 260 }]}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={styles.logoWrap}>
                        <Bootstrap name="music-note-beamed" size={22} color="white" />
                    </View>
                    <View>
                        <Text style={styles.brandTitle}>Kannari Music Academy</Text>
                        <Text style={styles.brandSubtitle}>School Portal</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContent}>
                {navItems.map((item) => {
                    const active = isActive(item.path)
                    return (
                        <TouchableOpacity
                            key={item.path}
                            style={[styles.navItem, active ? styles.navItemActive : null]}
                            onPress={() => handleNavClick(item.path)}
                        >
                            <Bootstrap name={item.icon} size={16} color={active ? '#ffffff' : '#93a4c5'} />
                            <Text style={[styles.navLabel, active ? styles.navTextActive : null]}>{item.label}</Text>
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.profileRow}>
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>{schoolName ? schoolName.substring(0, 2).toUpperCase() : 'SC'}</Text>
                    </View>
                    <View style={styles.profileMeta}>
                        <Text numberOfLines={1} style={styles.profileName}>{schoolName || 'School'}</Text>
                        <Text style={styles.profileRole}>School Admin</Text>
                    </View>
                </View>

                <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.footerBtn} onPress={() => handleNavClick('/school/settings')}>
                        <Text style={styles.footerBtnText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerBtn} onPress={() => handleNavClick('/school/logout')}>
                        <Text style={styles.footerLogoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    sidebar: {
        backgroundColor: '#0f1624',
        height: '100%',
        maxHeight: '100%',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoWrap: {
        width: 52,
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
    },
    brandTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    brandSubtitle: {
        color: '#8fa0c0',
        fontSize: 14,
    },
    navScroll: {
        flex: 1,
    },
    navContent: {
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderLeftWidth: 3,
        borderLeftColor: 'transparent',
        gap: 10,
    },
    navItemActive: {
        backgroundColor: 'rgba(66, 133, 244, 0.15)',
        borderLeftColor: '#4285f4',
    },
    navLabel: {
        color: '#9aa8c0',
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    navTextActive: {
        color: '#fff',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 18,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    profileAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
    },
    profileAvatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    profileMeta: {
        flex: 1,
    },
    profileName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    profileRole: {
        color: '#8fa0c0',
        fontSize: 12,
        marginTop: 1,
    },
    footerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    footerBtn: {
        flex: 1,
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    footerBtnText: {
        color: '#d2d9e8',
        fontSize: 13,
        fontWeight: '600',
    },
    footerLogoutText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '700',
    },
})

export default SchoolSidebar
