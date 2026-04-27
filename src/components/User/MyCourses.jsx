import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyCourses = () => {
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
    const [courseData, setCourseData] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        if (studentLoginStatus === 'true') {
            const fetchCourses = async () => {
                try {
                    const response = await axios.get(`${baseUrl}/fetch-enrolled-courses/${studentId}`);
                    setCourseData(response.data);
                    setLoading(false);
                } catch (error) {
                    console.log('Error fetching courses:', error);
                    setLoading(false);
                }
            };
            if (studentId) {
                fetchCourses();
            } else {
                setLoading(false);
            }
        } else if (studentLoginStatus !== null) {
            setLoading(false);
        }
    }, [studentId, studentLoginStatus]);

    if (loading) {
        return (
            <View style={styles.dashboardMainLoading}>
                <LoadingSpinner size="lg" text="Loading your courses..." />
            </View>
        );
    }

    return (
                <ScrollView style={styles.dashboardMain} contentContainerStyle={styles.dashboardMainContent}>
                    <View style={styles.pageHeader}>
                        <View style={styles.pageHeaderTitleRow}>
                            <Bootstrap name="music-note-list" size={22} color="#3b82f6" />
                            <Text style={styles.pageHeaderTitle}>My Courses</Text>
                        </View>
                        <Text style={styles.pageHeaderSubtitle}>
                            {courseData.length} course{courseData.length !== 1 ? 's' : ''} enrolled
                        </Text>
                    </View>

                    {courseData.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Bootstrap name="music-note-beamed" size={56} color="#3b82f6" />
                            <Text style={styles.emptyTitle}>Your musical journey starts here.</Text>
                            <Text style={styles.emptyText}>Start your musical journey by enrolling in a course</Text>
                            <TouchableOpacity
                                style={styles.emptyPrimaryButton}
                                onPress={() => navigation.navigate('AllCourses')}
                            >
                                <Text style={styles.emptyPrimaryButtonText}>Browse Courses</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.coursesGrid}>
                            {courseData.map((enrollment, index) => (
                                <View key={index} style={styles.courseCard}>
                                    <TouchableOpacity
                                        style={styles.courseImageLink}
                                        onPress={() => openCourseDetail(enrollment.course.id)}
                                    >
                                        <View style={styles.courseImage}>
                                            {enrollment.course.featured_img ? (
                                                <Image
                                                    source={{ uri: enrollment.course.featured_img }}
                                                    style={styles.courseImg}
                                                />
                                            ) : (
                                                <Bootstrap name="music-note-beamed" size={40} color="rgba(255, 255, 255, 0.7)" />
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.courseContent}>
                                        <TouchableOpacity
                                            style={styles.courseTitleLink}
                                            onPress={() => openCourseDetail(enrollment.course.id)}
                                        >
                                            <Text style={styles.courseTitle}>{enrollment.course.title}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.instructorLink}
                                            onPress={() => navigation.navigate('TeacherDetail', { teacher_id: enrollment.course.teacher.id })}
                                        >
                                            <View style={styles.instructorAvatar}>
                                                {enrollment.course.teacher.profile_img ? (
                                                    <Image
                                                        source={{ uri: enrollment.course.teacher.profile_img }}
                                                        style={styles.avatarImg}
                                                    />
                                                ) : (
                                                    <Text style={styles.avatarInitials}>
                                                        {enrollment.course.teacher.full_name?.substring(0, 2).toUpperCase()}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.instructorInfo}>
                                                <Text style={styles.instructorName} numberOfLines={1}>
                                                    {enrollment.course.teacher.full_name}
                                                </Text>
                                                <Text style={styles.instructorRole}>Instructor</Text>
                                            </View>
                                        </TouchableOpacity>

                                        {enrollment.course.category && (
                                            <View style={styles.categoryTags}>
                                                <View style={styles.categoryBadge}>
                                                    <Text style={styles.categoryBadgeText}>{enrollment.course.category.title}</Text>
                                                </View>
                                            </View>
                                        )}

                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={styles.btnContinue}
                                                onPress={() => openCourseDetail(enrollment.course.id)}
                                            >
                                                <Bootstrap name="play-circle-fill" size={14} color="#ffffff" />
                                                <Text style={styles.btnContinueText}>Continue</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
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
    },
    mobileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        zIndex: 5,
    },
    sidebarToggle: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        marginRight: 10,
    },
    logoMini: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
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
    },
    pageHeader: {
        marginBottom: 32,
    },
    pageHeaderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    pageHeaderTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        letterSpacing: -0.5,
        lineHeight: 38,
    },
    pageHeaderSubtitle: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '400',
    },
    emptyState: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingVertical: 60,
        paddingHorizontal: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        maxWidth: 480,
        alignSelf: 'center',
        marginTop: 40,
    },
    emptyTitle: {
        color: '#1a1a1a',
        marginTop: 20,
        marginBottom: 8,
        fontWeight: '700',
        fontSize: 20,
        textAlign: 'center',
    },
    emptyText: {
        color: '#6b7280',
        marginBottom: 24,
        fontSize: 15,
        textAlign: 'center',
    },
    emptyPrimaryButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 10,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 3,
    },
    emptyPrimaryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 15,
    },
    coursesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    courseCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.08)',
        minWidth: 290,
        flexGrow: 1,
        flexBasis: 300,
    },
    courseImageLink: {
        height: 180,
        width: '100%',
    },
    courseImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    courseImg: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    courseContent: {
        padding: 20,
        flex: 1,
    },
    courseTitleLink: {
        marginBottom: 12,
    },
    courseTitle: {
        color: '#1a1a1a',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 22,
    },
    instructorLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginLeft: -10,
        marginRight: -10,
    },
    instructorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarInitials: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 13,
    },
    instructorInfo: {
        minWidth: 0,
        flex: 1,
    },
    instructorName: {
        color: '#1a1a1a',
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 17,
    },
    instructorRole: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: '400',
    },
    categoryTags: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    categoryBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.15)',
    },
    categoryBadgeText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 'auto',
        paddingTop: 4,
    },
    btnContinue: {
        flex: 1,
        minHeight: 44,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    btnContinueText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default MyCourses;
