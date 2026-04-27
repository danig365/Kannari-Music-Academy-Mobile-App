import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyTeachers = () => {
    const navigation = useNavigation();
    const navigateToStudentLogin = () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
            parentNav.navigate('Auth', { screen: 'StudentLogin' });
            return;
        }
        navigation.navigate('StudentLogin');
    };

    const openTeacherDetail = (teacherId) => {
        if (!teacherId) return;
        navigation.navigate('TeacherDetail', { teacher_id: teacherId });
    };
    const [studentId, setStudentId] = useState(null);
    const [studentLoginStatus, setStudentLoginStatus] = useState(null);
    const [teacherData, setTeacherData] = useState([]);
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
            const fetchTeachers = async () => {
                try {
                    const response = await axios.get(`${baseUrl}/fetch-my-teachers/${studentId}`);
                    setTeacherData(Array.isArray(response.data) ? response.data : []);
                } catch (error) {
                    console.log('Error fetching teachers:', error);
                }
                setLoading(false);
            };

            if (studentId) {
                fetchTeachers();
            } else {
                setLoading(false);
            }
        } else if (studentLoginStatus !== null) {
            setLoading(false);
        }
    }, [studentId, studentLoginStatus]);

    if (loading) {
        return (
                    <View style={styles.loadingMain}>
                        <LoadingSpinner size="lg" text="Loading teachers..." />
                    </View>
        );
    }

    if (studentLoginStatus !== 'true') {
        return null;
    }

    return (

                <ScrollView style={styles.dashboardMain} contentContainerStyle={styles.dashboardMainContent}>
                    <View style={styles.headerWrap}>
                        <View style={styles.headerTitleRow}>
                            <Bootstrap name="people" size={22} color="#4285f4" />
                            <Text style={styles.headerTitle}>My Teachers</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>
                            {teacherData.length} teacher{teacherData.length !== 1 ? 's' : ''}
                        </Text>
                    </View>

                    {teacherData.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Bootstrap name="person-fill-x" size={48} color="#d1d5db" />
                            <Text style={styles.emptyTitle}>No Teachers Yet</Text>
                            <Text style={styles.emptyText}>Enroll in courses to connect with teachers</Text>
                            <TouchableOpacity
                                style={styles.browseBtn}
                                onPress={() => navigation.navigate('AllCourses')}
                            >
                                <Text style={styles.browseBtnText}>Browse Courses</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.grid}>
                            {teacherData.map((enrollment, index) => {
                                const teacher = enrollment?.teacher || {};
                                const teacherName = teacher.full_name || 'Teacher';

                                return (
                                    <View key={index} style={styles.teacherCard}>
                                        <TouchableOpacity
                                            onPress={() => openTeacherDetail(teacher.id)}
                                            style={styles.avatarTouch}
                                        >
                                            <View style={styles.avatarWrap}>
                                                {teacher.profile_img ? (
                                                    <Image source={{ uri: teacher.profile_img }} style={styles.avatarImg} />
                                                ) : (
                                                    <Text style={styles.avatarFallbackText}>
                                                        {teacherName.substring(0, 2).toUpperCase()}
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => openTeacherDetail(teacher.id)}>
                                            <Text style={styles.teacherName}>{teacherName}</Text>
                                        </TouchableOpacity>

                                        <View style={styles.infoRow}>
                                            <Bootstrap name="envelope" size={13} color="#6b7280" />
                                            <Text style={styles.infoText} numberOfLines={1}>{teacher.email}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Bootstrap name="book" size={13} color="#9ca3af" />
                                            <Text style={styles.courseText} numberOfLines={2}>{enrollment?.course?.title}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.profileBtn}
                                            onPress={() => openTeacherDetail(teacher.id)}
                                        >
                                            <Bootstrap name="person" size={13} color="#ffffff" />
                                            <Text style={styles.profileBtnText}>View Profile</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
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
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 4,
    },
    loadingMain: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dashboardMain: {
        flex: 1,
    },
    dashboardMainContent: {
        padding: 16,
        paddingBottom: 24,
    },
    headerWrap: {
        marginBottom: 18,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: '#1f2937',
        fontSize: 30,
        fontWeight: '700',
    },
    headerSubtitle: {
        marginTop: 6,
        color: '#6b7280',
        fontSize: 14,
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 36,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: 12,
        color: '#6b7280',
        fontSize: 18,
        fontWeight: '600',
    },
    emptyText: {
        marginTop: 6,
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
    },
    browseBtn: {
        marginTop: 16,
        backgroundColor: '#4285f4',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    browseBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    teacherCard: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    avatarTouch: {
        marginBottom: 12,
    },
    avatarWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#4285f4',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#e5e7eb',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarFallbackText: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '600',
    },
    teacherName: {
        color: '#1f2937',
        fontWeight: '600',
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
    },
    infoRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    infoText: {
        flex: 1,
        color: '#6b7280',
        fontSize: 13,
    },
    courseText: {
        flex: 1,
        color: '#9ca3af',
        fontSize: 13,
    },
    profileBtn: {
        marginTop: 4,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#4285f4',
        borderRadius: 8,
        paddingVertical: 10,
    },
    profileBtnText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 13,
    },
});

export default MyTeachers;
