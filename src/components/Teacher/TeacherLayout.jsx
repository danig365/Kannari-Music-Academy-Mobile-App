import React, { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import TeacherSidebar from './TeacherSidebar'

const TeacherLayout = ({ children }) => {
    const navigation = useNavigation()
    const { width } = useWindowDimensions()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [teacherLoginStatus, setTeacherLoginStatus] = useState(null)

    const isMobile = width <= 768

    useEffect(() => {
        const checkAuth = async () => {
            const status = await AsyncStorage.getItem('teacherLoginStatus')
            setTeacherLoginStatus(status)
            if (status !== 'true') {
                navigation.navigate('TeacherLogin')
            }
        }

        checkAuth()
    }, [navigation])

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false)
        }
    }, [isMobile])

    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev)
    }, [])

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false)
    }, [])

    const handleSidebarNavigate = useCallback(
        (path) => {
            const routeMap = {
                '/teacher/overview': 'TeacherOverview',
                '/teacher/dashboard': 'TeacherDashboard',
                '/teacher/students': 'TeacherStudents',
                '/teacher/course-management': 'TeacherCourseManagement',
                '/teacher/sessions': 'TeacherSessions',
                '/teacher/audio-messages': 'TeacherAudioMessages',
                '/teacher/text-messages': 'TeacherMessages',
                '/teacher/create-assignments': 'TeacherAssignmentCreate',
                '/teacher/office-hours': 'TeacherOfficeHours',
                '/teacher/assignment-reviews': 'TeacherAssignmentReviews',
                '/teacher/progress': 'TeacherProgress',
                '/teacher/profile-setting': 'TeacherProfileSetting',
                '/teacher/community': 'TeacherCommunity',
                '/teacher/games-performance': 'TeacherGamesPerformance',
                '/teacher/logout': 'TeacherLogout',
                '/teacher/my-courses': 'TeacherMyCourses',
                '/teacher/my-users': 'MyUsers',
                '/teacher/study-material': 'StudyMaterial',
            }
            const routeName = routeMap[path]
            setSidebarOpen(false)
            if (routeName) {
                navigation.navigate(routeName, { path })
            }
        },
        [navigation]
    )

    if (teacherLoginStatus !== 'true') {
        return null
    }

    return (
        <View style={styles.layout}>
            {isMobile ? (
                <View style={styles.mobileHeader}>
                    <TouchableOpacity style={styles.sidebarToggle} onPress={toggleSidebar}>
                        <Text style={styles.sidebarToggleIcon}>{sidebarOpen ? '✕' : '☰'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.mobileTitle}>Teacher Panel</Text>
                </View>
            ) : null}

            {isMobile && sidebarOpen ? <Pressable style={styles.sidebarOverlay} onPress={closeSidebar} /> : null}

            <View
                style={[
                    styles.sidebar,
                    isMobile ? styles.sidebarMobile : styles.sidebarDesktop,
                    isMobile && !sidebarOpen ? styles.sidebarClosed : null,
                ]}
            >
                <TeacherSidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isMobile={isMobile}
                    onNavigate={handleSidebarNavigate}
                />
            </View>

            <View style={[styles.mainContent, isMobile ? styles.mainContentMobile : styles.mainContentDesktop]}>
                {children}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    layout: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
        minHeight: '100%',
        backgroundColor: '#f8f9fa',
    },
    sidebar: {
        zIndex: 1100,
        overflow: 'hidden',
    },
    sidebarDesktop: {
        width: 260,
    },
    sidebarMobile: {
        position: 'absolute',
        top: 60,
        left: 0,
        width: '84%',
        maxWidth: 320,
        bottom: 0,
    },
    sidebarClosed: {
        width: 0,
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    mainContentDesktop: {
        marginLeft: 0,
        paddingVertical: 24,
        paddingHorizontal: 24,
    },
    mainContentMobile: {
        marginTop: 60,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    mobileHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#ffffff',
        zIndex: 1200,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59, 130, 246, 0.1)',
    },
    sidebarToggle: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sidebarToggleIcon: {
        color: '#3b82f6',
        fontSize: 24,
    },
    mobileTitle: {
        color: '#1a2332',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    sidebarOverlay: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1099,
    },
})

export default TeacherLayout
