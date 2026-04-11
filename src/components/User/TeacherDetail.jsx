import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Linking,
    Alert,
} from 'react-native';
import { Bootstrap } from '../shared/BootstrapIcon';
import LoadingSpinner from '../shared/LoadingSpinner';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherDetail = () => {
    const route = useRoute();
    const navigation = useNavigation();

    const teacherId =
        route?.params?.teacher_id ||
        route?.params?.teacherId ||
        route?.params?.id ||
        null;

    const [studentLoginStatus, setStudentLoginStatus] = useState(null);
    const [teacherData, setTeacherData] = useState(null);
    const [courseData, setCourseData] = useState([]);
    const [skillList, setSkillList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const status = await AsyncStorage.getItem('studentLoginStatus');
                setStudentLoginStatus(status);
            } catch (error) {
                console.log('Error loading auth status:', error);
                setLoading(false);
            }
        };

        loadAuth();
    }, []);

    useEffect(() => {
        if (studentLoginStatus === null) return;
        if (studentLoginStatus !== 'true') {
            navigation.navigate('/student/login');
        }
    }, [studentLoginStatus]);

    useEffect(() => {
        const fetchTeacherData = async () => {
            if (!teacherId || studentLoginStatus !== 'true') {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${baseUrl}/teacher/${teacherId}`);
                setTeacherData(response.data);
                setCourseData(response.data?.teacher_courses || []);
                setSkillList(response.data?.skill_list || []);
            } catch (error) {
                console.log('Error fetching teacher data:', error);
            }
            setLoading(false);
        };

        fetchTeacherData();
    }, [teacherId, studentLoginStatus]);

    const openExternal = async (url) => {
        if (!url) return;
        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert('Unable to open link', 'Please try again later.');
        }
    };

    if (loading && studentLoginStatus === 'true') {
        return <LoadingSpinner fullScreen size="xl" text="Loading teacher profile..." />;
    }

    if (studentLoginStatus !== 'true') {
        return null;
    }

    if (!teacherData) {
        return (
            <View style={styles.notFoundWrap}>
                <Text style={styles.notFoundText}>Teacher not found</Text>
            </View>
        );
    }

    const socialLinks = [
        { key: 'facebook', icon: 'facebook', color: '#1877f2', url: teacherData.face_url },
        { key: 'instagram', icon: 'instagram', color: '#dc2743', url: teacherData.insta_url },
        { key: 'twitter', icon: 'twitter', color: '#1DA1F2', url: teacherData.twit_url },
        { key: 'youtube', icon: 'youtube', color: '#FF0000', url: teacherData.you_url },
        { key: 'website', icon: 'globe2', color: '#4285f4', url: teacherData.web_url },
    ].filter((item) => !!item.url);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <View style={styles.profileImageWrap}>
                        {teacherData.profile_img ? (
                            <Image source={{ uri: teacherData.profile_img }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImageFallback}>
                                <Text style={styles.profileInitials}>
                                    {teacherData.full_name?.substring(0, 2).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.heroInfo}>
                        <Text style={styles.teacherName}>{teacherData.full_name}</Text>
                        <Text style={styles.teacherDetail}>{teacherData.detail}</Text>

                        <View style={styles.statsWrap}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>TOTAL COURSES</Text>
                                <Text style={styles.statValue}>{teacherData.total_teacher_course || 0}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>EMAIL</Text>
                                <Text style={styles.statEmail}>{teacherData.email}</Text>
                            </View>
                        </View>

                        {skillList.length > 0 && (
                            <View style={styles.skillsBlock}>
                                <Text style={styles.skillsTitle}>SKILLS</Text>
                                <View style={styles.skillsWrap}>
                                    {skillList.map((skill, index) => (
                                        <View key={index} style={styles.skillChip}>
                                            <Text style={styles.skillChipText}>{skill.trim()}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                    <Bootstrap name="info-circle" size={18} color="#4285f4" />
                    <Text style={styles.sectionTitle}>About</Text>
                </View>

                <Text style={styles.sectionBody}>{teacherData.detail}</Text>

                {!!teacherData.qualification && (
                    <View style={styles.qualificationBlock}>
                        <Text style={styles.subTitle}>Qualifications</Text>
                        <Text style={styles.sectionBody}>{teacherData.qualification}</Text>
                    </View>
                )}

                <View>
                    <Text style={styles.subTitle}>Follow</Text>
                    <View style={styles.socialWrap}>
                        {socialLinks.map((social) => (
                            <TouchableOpacity
                                key={social.key}
                                style={[styles.socialBtn, { backgroundColor: social.color }]}
                                onPress={() => openExternal(social.url)}
                            >
                                <Bootstrap name={social.icon} size={18} color="#ffffff" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {courseData.length > 0 && (
                <View style={styles.coursesSection}>
                    <View style={styles.sectionTitleRow}>
                        <Bootstrap name="book" size={18} color="#4285f4" />
                        <Text style={styles.sectionTitle}>Courses by {teacherData.full_name}</Text>
                    </View>

                    <View style={styles.coursesList}>
                        {courseData.map((course, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.courseCard}
                                onPress={() => navigation.navigate(`/detail/${course.id}`)}
                            >
                                <View style={styles.courseCover}>
                                    <Bootstrap name="book" size={34} color="#ffffff" />
                                </View>

                                <View style={styles.courseContent}>
                                    <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                                    <Text style={styles.courseDescription} numberOfLines={2}>
                                        {course.description}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    contentContainer: {
        paddingVertical: 18,
        paddingHorizontal: 16,
        gap: 16,
    },
    notFoundWrap: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notFoundText: {
        color: '#1f2937',
        fontSize: 22,
        fontWeight: '600',
    },
    heroCard: {
        borderRadius: 14,
        padding: 16,
        backgroundColor: '#4285f4',
    },
    heroTopRow: {
        flexDirection: 'column',
        gap: 14,
    },
    profileImageWrap: {
        width: 160,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#ffffff',
        backgroundColor: '#d1d5db',
        alignSelf: 'center',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    profileImageFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitials: {
        color: '#ffffff',
        fontSize: 56,
        fontWeight: '600',
    },
    heroInfo: {
        gap: 10,
    },
    teacherName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
    },
    teacherDetail: {
        color: 'rgba(255,255,255,0.92)',
        fontSize: 15,
        lineHeight: 22,
    },
    statsWrap: {
        flexDirection: 'row',
        gap: 18,
        flexWrap: 'wrap',
        marginTop: 4,
    },
    statItem: {
        minWidth: 130,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    statValue: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '700',
    },
    statEmail: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    skillsBlock: {
        marginTop: 6,
    },
    skillsTitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
    },
    skillsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    skillChipText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '500',
    },
    sectionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#1f2937',
        fontWeight: '700',
        fontSize: 22,
    },
    sectionBody: {
        color: '#6b7280',
        lineHeight: 22,
        fontSize: 14,
    },
    qualificationBlock: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    subTitle: {
        color: '#374151',
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
        fontSize: 16,
    },
    socialWrap: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        marginTop: 4,
    },
    socialBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coursesSection: {
        gap: 10,
    },
    coursesList: {
        gap: 12,
    },
    courseCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    courseCover: {
        width: '100%',
        height: 140,
        backgroundColor: '#4285f4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    courseContent: {
        padding: 14,
    },
    courseTitle: {
        color: '#1f2937',
        fontWeight: '600',
        marginBottom: 6,
        fontSize: 15,
    },
    courseDescription: {
        color: '#6b7280',
        fontSize: 13,
        lineHeight: 18,
    },
});

export default TeacherDetail;
