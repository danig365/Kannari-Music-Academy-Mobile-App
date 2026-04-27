import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyProgress = () => {
    const navigation = useNavigation();
    const navigateToStudentLogin = () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
            parentNav.navigate('Auth', { screen: 'StudentLogin' });
            return;
        }
        navigation.navigate('StudentLogin');
    };

    const openCourseDetail = (courseId) => {
        if (!courseId) return;
        navigation.navigate('CourseDetail', { course_id: courseId });
    };
    const [studentId, setStudentId] = useState(null);
    const [studentLoginStatus, setStudentLoginStatus] = useState(null);
    const [courseProgress, setCourseProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);

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

    const fetchProgress = async () => {
        if (!studentId) return;

        try {
            setLoading(true);
            const response = await axios.get(`${baseUrl}/student/course-progress/${studentId}/`);
            setCourseProgress(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.log('Error fetching progress:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentLoginStatus === 'true' && studentId) {
            fetchProgress();
        }
    }, [studentLoginStatus, studentId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchProgress();
        setRefreshing(false);
    };

    const filteredProgress = courseProgress.filter((cp) => {
        if (filter === 'completed') return cp.is_completed;
        if (filter === 'in-progress') return !cp.is_completed && cp.progress_percentage > 0;
        if (filter === 'not-started') return cp.progress_percentage === 0;
        return true;
    });

    const stats = {
        total: courseProgress.length,
        completed: courseProgress.filter((cp) => cp.is_completed).length,
        inProgress: courseProgress.filter((cp) => !cp.is_completed && cp.progress_percentage > 0).length,
        notStarted: courseProgress.filter((cp) => cp.progress_percentage === 0).length,
        totalTime: courseProgress.reduce((sum, cp) => sum + (cp.total_time_spent_seconds || 0), 0),
        avgProgress:
            courseProgress.length > 0
                ? Math.round(
                      courseProgress.reduce((sum, cp) => sum + (cp.progress_percentage || 0), 0) /
                          courseProgress.length
                  )
                : 0,
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    if (studentLoginStatus === null) {
        return (
            <LoadingSpinner size="md" text="Loading progress..." />
        );
    }

    if (studentLoginStatus !== 'true') {
        return null;
    }

    const statCards = [
        {
            key: 'total',
            value: stats.total,
            label: 'Total Courses',
            icon: 'music-note-list',
            iconColor: '#3b82f6',
            iconBackground: '#eff6ff',
        },
        {
            key: 'completed',
            value: stats.completed,
            label: 'Completed',
            icon: 'check-circle-fill',
            iconColor: '#10b981',
            iconBackground: '#ecfdf5',
        },
        {
            key: 'time',
            value: formatTime(stats.totalTime),
            label: 'Practice Time',
            icon: 'clock-history',
            iconColor: '#f59e0b',
            iconBackground: '#fffbeb',
        },
        {
            key: 'avg',
            value: `${stats.avgProgress}%`,
            label: 'Avg Progress',
            icon: 'trophy',
            iconColor: '#06b6d4',
            iconBackground: '#f0f9ff',
        },
    ];

    return (

                <ScrollView style={styles.progressMain} contentContainerStyle={styles.progressMainContent}>
                    <View style={styles.progressHeader}>
                        <View>
                            <View style={styles.headerTitleRow}>
                                <Bootstrap name="music-note-beamed" size={22} color="#3b82f6" />
                                <Text style={styles.headerTitle}>My Learning Progress</Text>
                            </View>
                            <Text style={styles.headerSubtitle}>Track your course completion and practice time</Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleRefresh}
                            disabled={refreshing}
                            style={[styles.refreshButton, refreshing ? styles.refreshButtonDisabled : null]}
                        >
                            {refreshing ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Bootstrap name="arrow-clockwise" size={14} color="#ffffff" />
                            )}
                            <Text style={styles.refreshButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsGrid}>
                        {statCards.map((card) => (
                            <View key={card.key} style={[styles.statCard, !isMobile ? styles.statCardDesktop : null]}>
                                <View style={[styles.statIcon, { backgroundColor: card.iconBackground }]}>
                                    <Bootstrap name={card.icon} size={20} color={card.iconColor} />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{card.value}</Text>
                                    <Text style={styles.statLabel}>{card.label}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.filterPills}>
                        {[
                            { key: 'all', label: 'All', count: stats.total },
                            { key: 'in-progress', label: 'In Progress', count: stats.inProgress },
                            { key: 'completed', label: 'Completed', count: stats.completed },
                            { key: 'not-started', label: 'Not Started', count: stats.notStarted },
                        ].map((btn) => (
                            <TouchableOpacity
                                key={btn.key}
                                onPress={() => setFilter(btn.key)}
                                style={[styles.filterButton, filter === btn.key ? styles.filterButtonActive : null]}
                            >
                                <Text
                                    style={[
                                        styles.filterButtonText,
                                        filter === btn.key ? styles.filterButtonTextActive : null,
                                    ]}
                                >
                                    {btn.label} ({btn.count})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {loading ? (
                        <LoadingSpinner size="md" text="Loading progress..." />
                    ) : filteredProgress.length > 0 ? (
                        <View style={styles.progressList}>
                            {filteredProgress.map((cp, index) => {
                                const isCompleted = cp.is_completed;
                                const percentage = cp.progress_percentage || 0;

                                return (
                                    <View key={index} style={styles.progressItem}>
                                        <View
                                            style={[
                                                styles.progressItemGrid,
                                                isMobile ? styles.progressItemGridMobile : styles.progressItemGridDesktop,
                                            ]}
                                        >
                                            {cp.course?.featured_img ? (
                                                <Image source={{ uri: cp.course.featured_img }} style={styles.courseImage} />
                                            ) : (
                                                <View style={styles.coursePlaceholder}>
                                                    <Bootstrap name="music-note-beamed" size={22} color="#ffffff" />
                                                </View>
                                            )}

                                            <View style={styles.courseInfo}>
                                                <TouchableOpacity
                                                    onPress={() => openCourseDetail(cp.course?.id)}
                                                >
                                                    <Text style={styles.courseTitle}>{cp.course?.title}</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.courseTeacher}>
                                                    {cp.course?.teacher?.full_name || 'Unknown teacher'}
                                                </Text>
                                            </View>

                                            <View style={styles.progressSection}>
                                                <View style={styles.progressBar}>
                                                    <View
                                                        style={[
                                                            styles.progressBarFill,
                                                            isCompleted ? styles.progressBarFillCompleted : null,
                                                            { width: `${Math.min(100, Math.max(0, percentage))}%` },
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={styles.progressText}>
                                                    {cp.completed_chapters || 0}/{cp.total_chapters || 0} chapters • {percentage}%
                                                </Text>
                                            </View>

                                            <View style={styles.timeDisplay}>
                                                <Text style={styles.timeDisplayText}>
                                                    {cp.time_spent_formatted || formatTime(cp.total_time_spent_seconds)}
                                                </Text>
                                            </View>

                                            <View style={styles.actionButtonWrap}>
                                                {isCompleted ? (
                                                    <View style={[styles.actionButton, styles.actionButtonCompleted]}>
                                                        <Bootstrap name="check-lg" size={16} color="#ffffff" />
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.actionButtonContinue]}
                                                        onPress={() => openCourseDetail(cp.course?.id)}
                                                    >
                                                        <Bootstrap name="play-fill" size={16} color="#ffffff" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Bootstrap name="music-note-beamed" size={52} color="#3b82f6" />
                            <Text style={styles.emptyTitle}>No courses found</Text>
                            <Text style={styles.emptyText}>
                                {filter === 'all'
                                    ? 'Start your musical journey — enroll in a course today!'
                                    : `No courses match the "${filter}" filter.`}
                            </Text>
                            <TouchableOpacity
                                style={styles.browseButton}
                                onPress={() => navigation.navigate('AllCourses')}
                            >
                                <Bootstrap name="search" size={14} color="#ffffff" />
                                <Text style={styles.browseButtonText}>Explore Courses</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
    );
};

const styles = StyleSheet.create({
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f0f9ff',
    },
    progressContent: {
        flex: 1,
    },
    sidebarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 999,
    },
    mobileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59,130,246,0.1)',
        zIndex: 5,
    },
    sidebarToggle: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59,130,246,0.08)',
    },
    logoMini: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2563eb',
    },
    progressMain: {
        flex: 1,
    },
    progressMainContent: {
        padding: 16,
        paddingBottom: 32,
    },
    progressHeader: {
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 24,
        color: '#1a1a1a',
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    refreshButton: {
        minHeight: 44,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    refreshButtonDisabled: {
        opacity: 0.7,
    },
    refreshButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 18,
        gap: 10,
    },
    statCard: {
        width: '47.5%',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.1)',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    statCardDesktop: {
        width: '23%',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        color: '#1a1a1a',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 1,
    },
    statLabel: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '500',
    },
    filterPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 18,
    },
    filterButton: {
        minHeight: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.15)',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterButtonText: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: '#ffffff',
    },
    progressList: {
        gap: 10,
    },
    progressItem: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.08)',
        padding: 12,
    },
    progressItemGrid: {
        gap: 10,
    },
    progressItemGridDesktop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressItemGridMobile: {
        flexDirection: 'column',
    },
    courseImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
    },
    coursePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    courseInfo: {
        flex: 1,
        minWidth: 130,
    },
    courseTitle: {
        color: '#1a1a1a',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4,
    },
    courseTeacher: {
        color: '#6b7280',
        fontSize: 12,
    },
    progressSection: {
        flex: 1,
        minWidth: 140,
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 99,
        backgroundColor: 'rgba(59,130,246,0.08)',
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 99,
        backgroundColor: '#3b82f6',
    },
    progressBarFillCompleted: {
        backgroundColor: '#10b981',
    },
    progressText: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '500',
    },
    timeDisplay: {
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeDisplayText: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    actionButtonWrap: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonCompleted: {
        backgroundColor: '#10b981',
    },
    actionButtonContinue: {
        backgroundColor: '#3b82f6',
    },
    emptyState: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.08)',
        paddingHorizontal: 20,
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: 10,
        marginBottom: 6,
        color: '#1a1a1a',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 18,
    },
    browseButton: {
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    browseButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default MyProgress;
