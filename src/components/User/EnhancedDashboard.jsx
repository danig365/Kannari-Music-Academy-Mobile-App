import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WeeklyGoalCard from './WeeklyGoalCard';
import StreakCalendar from './StreakCalendar';
import AchievementBadges from './AchievementBadges';
import LoadingSpinner from '../shared/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const EnhancedDashboard = () => {
    const navigation = useNavigation();
    const navigateToStudentLogin = () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
            parentNav.navigate('Auth', { screen: 'StudentLogin' });
            return;
        }
        navigation.navigate('StudentLogin');
    };

    const openMyCourses = () => {
        navigation.navigate('MyCourses');
    };

    const openCourseDetail = (courseId) => {
        if (!courseId) return;
        navigation.navigate('CourseDetail', { course_id: courseId });
    };
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState(null);
    const [studentLoginStatus, setStudentLoginStatus] = useState(null);

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
        } else if (studentId) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [studentLoginStatus, studentId]);

    const fetchDashboardData = async () => {
        if (!studentId) {
            console.log('Student ID not available');
            setLoading(false);
            return;
        }
        try {
            console.log('Fetching data for student:', studentId);

            const progressResponse = await axios.get(`${baseUrl}/student/course-progress/${studentId}/`);
            const courseProgress = progressResponse.data;

            const stats = {
                total: courseProgress.length,
                completed: courseProgress.filter(cp => cp.is_completed).length,
                inProgress: courseProgress.filter(cp => !cp.is_completed && cp.progress_percentage > 0).length,
                totalTime: courseProgress.reduce((sum, cp) => sum + (cp.total_time_spent_seconds || 0), 0),
                avgProgress: courseProgress.length > 0
                    ? Math.round(courseProgress.reduce((sum, cp) => sum + (cp.progress_percentage || 0), 0) / courseProgress.length)
                    : 0
            };

            const hours = Math.floor(stats.totalTime / 3600);
            const minutes = Math.floor((stats.totalTime % 3600) / 60);
            const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            try {
                const enhancedResponse = await axios.get(`${baseUrl}/student/enhanced-dashboard/${studentId}/`);
                const enhancedData = enhancedResponse.data;

                setDashboardData({
                    ...enhancedData,
                    enrolled_courses: stats.total,
                    courses_completed: stats.completed,
                    courses_in_progress: stats.inProgress,
                    total_learning_time_formatted: timeFormatted,
                    overall_progress_percentage: stats.avgProgress
                });
            } catch (enhancedError) {
                console.warn('Enhanced dashboard not available, using basic stats:', enhancedError);
                setDashboardData({
                    enrolled_courses: stats.total,
                    courses_completed: stats.completed,
                    courses_in_progress: stats.inProgress,
                    total_learning_time_formatted: timeFormatted,
                    overall_progress_percentage: stats.avgProgress,
                    recent_courses: courseProgress.slice(0, 3).map(cp => ({
                        id: cp.course?.id || cp.id,
                        title: cp.course?.title || 'Unknown Course',
                        featured_img: cp.course?.featured_img || null,
                        teacher: cp.course?.teacher?.full_name || 'Unknown Teacher',
                        progress_percentage: cp.progress_percentage,
                        completed_chapters: cp.completed_chapters,
                        total_chapters: cp.total_chapters
                    })),
                    weekly_goal: null,
                    recent_achievements: []
                });
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const getFullImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return SITE_URL + imageUrl;
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    if (loading) {
        return (
            <View style={styles.dashboardMainLoading}>
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </View>
        );
    }

    return (
                <ScrollView style={styles.dashboardMain} contentContainerStyle={styles.dashboardMainContent}>
                    <View style={styles.welcomeHeader}>
                        <View style={styles.welcomeContent}>
                            <View style={styles.welcomeText}>
                                <Text style={styles.welcomeTitle}>Welcome Back, Musician! 🎵</Text>
                                <Text style={styles.welcomeSubtitle}>Keep the rhythm going — your musical journey continues!</Text>
                            </View>
                        </View>
                        <View style={styles.xpBarContainer}>
                            <View style={styles.xpInfo}>
                                <Text style={styles.xpInfoText}>Overall Progress</Text>
                                <Text style={styles.xpInfoText}>{dashboardData?.overall_progress_percentage || 0}%</Text>
                            </View>
                            <View style={styles.xpBar}>
                                <View
                                    style={[
                                        styles.xpFill,
                                        { width: `${dashboardData?.overall_progress_percentage || 0}%` }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, styles.statCardPrimary]}>
                            <View style={styles.statIconWrapper}>
                                <Bootstrap name="music-note-list" size={20} color="#fff" />
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statNumber}>{dashboardData?.enrolled_courses || 0}</Text>
                                <Text style={styles.statLabel}>Total Courses</Text>
                            </View>
                            <TouchableOpacity onPress={openMyCourses} style={styles.statLink}>
                                <Bootstrap name="arrow-right-circle-fill" size={18} color="#2563eb" />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.statCard, styles.statCardSuccess]}>
                            <View style={styles.statIconWrapper}>
                                <Bootstrap name="check-circle-fill" size={20} color="#fff" />
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statNumber}>{dashboardData?.courses_completed || 0}</Text>
                                <Text style={styles.statLabel}>Completed</Text>
                            </View>
                            {dashboardData?.courses_in_progress > 0 && (
                                <View style={styles.statBadge}>
                                    <Text style={styles.statBadgeText}>{dashboardData.courses_in_progress} in progress</Text>
                                </View>
                            )}
                        </View>

                        <View style={[styles.statCard, styles.statCardInfo]}>
                            <View style={styles.statIconWrapper}>
                                <Bootstrap name="trophy-fill" size={20} color="#fff" />
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statNumber}>{dashboardData?.overall_progress_percentage || 0}%</Text>
                                <Text style={styles.statLabel}>Avg Progress</Text>
                            </View>
                            <View style={styles.miniProgress}>
                                <View
                                    style={[
                                        styles.miniProgressFill,
                                        { width: `${dashboardData?.overall_progress_percentage || 0}%` }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionRow}>
                        <View style={styles.sectionWide}>
                            <StreakCalendar studentId={studentId} />
                        </View>
                        <View style={styles.sectionNarrow}>
                            <AchievementBadges studentId={studentId} compact={true} />
                        </View>
                    </View>

                    <View style={styles.sectionRow}>
                        <View style={styles.sectionHalf}>
                            <WeeklyGoalCard
                                weeklyGoal={dashboardData?.weekly_goal}
                                studentId={studentId}
                                onGoalUpdate={fetchDashboardData}
                            />
                        </View>

                        {dashboardData?.recent_courses && dashboardData.recent_courses.length > 0 && (
                            <View style={styles.sectionHalf}>
                                <View style={styles.continueCard}>
                                    <View style={styles.continueHeader}>
                                        <Text style={styles.continueHeaderText}>Continue Learning</Text>
                                    </View>
                                    <View style={styles.continueBody}>
                                        {dashboardData.recent_courses.slice(0, 1).map((course, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.courseProgressCard}
                                                onPress={() => openCourseDetail(course.id)}
                                            >
                                                <View style={styles.courseImgWrapper}>
                                                    {course.featured_img ? (
                                                        <Image
                                                            source={{ uri: getFullImageUrl(course.featured_img) }}
                                                            style={styles.courseImg}
                                                        />
                                                    ) : (
                                                        <View style={styles.courseImgPlaceholder}>
                                                            <Bootstrap name="book" size={20} color="#6b7280" />
                                                        </View>
                                                    )}
                                                    <View style={styles.courseProgressOverlay}>
                                                        <Text style={styles.courseProgressOverlayText}>{course.progress_percentage}%</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.courseInfo}>
                                                    <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                                                    <View style={styles.courseTeacherRow}>
                                                        <Bootstrap name="person" size={12} color="#6b7280" />
                                                        <Text style={styles.courseTeacher}>{course.teacher}</Text>
                                                    </View>
                                                    <View style={styles.progressTrack}>
                                                        <View
                                                            style={[
                                                                styles.progressFill,
                                                                { width: `${course.progress_percentage}%` }
                                                            ]}
                                                        />
                                                    </View>
                                                    <Text style={styles.courseMeta}>
                                                        {course.completed_chapters}/{course.total_chapters} chapters completed
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
    );
};

const styles = StyleSheet.create({
    dashboardContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
    },
    dashboardContent: {
        flex: 1,
        marginLeft: 0,
    },
    mobileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59, 130, 246, 0.1)',
        zIndex: 5,
    },
    sidebarToggle: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        marginRight: 10,
    },
    logoMini: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3b82f6',
        flex: 1,
        paddingRight: 8,
    },
    sidebarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 2,
    },
    dashboardMainLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dashboardMain: {
        flex: 1,
    },
    dashboardMainContent: {
        padding: 16,
        gap: 16,
    },
    welcomeHeader: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    welcomeContent: {
        marginBottom: 12,
    },
    welcomeText: {
        gap: 4,
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#475569',
    },
    xpBarContainer: {
        marginTop: 6,
    },
    xpInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    xpInfoText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    xpBar: {
        height: 10,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
    },
    xpFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 8,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flexGrow: 1,
        minWidth: 150,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        position: 'relative',
    },
    statCardPrimary: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
    },
    statCardSuccess: {
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    statCardInfo: {
        borderLeftWidth: 4,
        borderLeftColor: '#0ea5e9',
    },
    statIconWrapper: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statContent: {
        gap: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    statLink: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    statBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.25)',
    },
    statBadgeText: {
        fontSize: 11,
        color: '#047857',
        fontWeight: '600',
    },
    miniProgress: {
        marginTop: 10,
        height: 6,
        borderRadius: 6,
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
    },
    miniProgressFill: {
        height: '100%',
        backgroundColor: '#0ea5e9',
    },
    sectionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    sectionWide: {
        flex: 1.3,
        minWidth: 280,
    },
    sectionNarrow: {
        flex: 1,
        minWidth: 260,
    },
    sectionHalf: {
        flex: 1,
        minWidth: 280,
    },
    continueCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        minHeight: 240,
    },
    continueHeader: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    continueHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    continueBody: {
        padding: 14,
    },
    courseProgressCard: {
        flexDirection: 'row',
        gap: 12,
    },
    courseImgWrapper: {
        width: 92,
        height: 92,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f1f5f9',
    },
    courseImg: {
        width: '100%',
        height: '100%',
    },
    courseImgPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e5e7eb',
    },
    courseProgressOverlay: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(15,23,42,0.8)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    courseProgressOverlayText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    courseInfo: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 6,
    },
    courseTeacherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    courseTeacher: {
        fontSize: 12,
        color: '#6b7280',
    },
    progressTrack: {
        height: 8,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
    },
    courseMeta: {
        fontSize: 11,
        color: '#6b7280',
    },
});

export default EnhancedDashboard;
