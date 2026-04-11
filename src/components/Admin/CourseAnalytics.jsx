import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const CourseAnalytics = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const course_id = route.params?.course_id;

    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [progressData, setProgressData] = useState({});
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentProgress, setStudentProgress] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('progress');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        if (course_id) {
            fetchCourseData();
            fetchEnrolledStudents();
        }
    }, [course_id]);

    const fetchCourseData = async () => {
        try {
            const response = await axios.get(`${baseUrl}/course/${course_id}/`);
            setCourseData(response.data);
        } catch (error) {
            setCourseData(null);
        }
    };

    const fetchEnrolledStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseUrl}/enrolled-students/${course_id}/`);
            const students = response.data || [];
            setEnrolledStudents(Array.isArray(students) ? students : []);

            const progressPromises = students.map(async (enrollment) => {
                try {
                    const progressRes = await axios.get(
                        `${baseUrl}/student/${enrollment.student?.id}/course/${course_id}/progress-enhanced/`
                    );
                    return { studentId: enrollment.student?.id, progress: progressRes.data };
                } catch (err) {
                    return { studentId: enrollment.student?.id, progress: null };
                }
            });

            const progressResults = await Promise.all(progressPromises);
            const progressMap = {};
            progressResults.forEach(({ studentId, progress }) => {
                if (studentId) {
                    progressMap[studentId] = progress;
                }
            });
            setProgressData(progressMap);
        } catch (error) {
            setEnrolledStudents([]);
            setProgressData({});
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentProgress = async (student) => {
        setSelectedStudent(student);
        try {
            const response = await axios.get(
                `${baseUrl}/student/${student.id}/course/${course_id}/progress-enhanced/`
            );
            setStudentProgress(response.data);
        } catch (error) {
            setStudentProgress(null);
        }
    };

    const getProgressPercentage = (studentId) => {
        const progress = progressData[studentId];
        if (!progress) return 0;
        return progress.overall_progress || 0;
    };

    const getCompletedLessons = (studentId) => {
        const progress = progressData[studentId];
        if (!progress) return 0;
        return progress.completed_lessons || 0;
    };

    const getTotalLessons = (studentId) => {
        const progress = progressData[studentId];
        if (!progress) return 0;
        return progress.total_lessons || 0;
    };

    const filteredStudents = useMemo(() => {
        return enrolledStudents
            .filter((enrollment) => {
                const student = enrollment.student;
                if (!student) return false;
                const searchLower = searchTerm.toLowerCase();
                return (
                    student.fullname?.toLowerCase().includes(searchLower) ||
                    student.email?.toLowerCase().includes(searchLower)
                );
            })
            .sort((a, b) => {
                if (sortBy === 'progress') {
                    const progressA = getProgressPercentage(a.student?.id);
                    const progressB = getProgressPercentage(b.student?.id);
                    return sortOrder === 'desc' ? progressB - progressA : progressA - progressB;
                }
                if (sortBy === 'name') {
                    const nameA = a.student?.fullname || '';
                    const nameB = b.student?.fullname || '';
                    return sortOrder === 'desc'
                        ? nameB.localeCompare(nameA)
                        : nameA.localeCompare(nameB);
                }
                if (sortBy === 'enrolled') {
                    const dateA = new Date(a.enrolled_time);
                    const dateB = new Date(b.enrolled_time);
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                }
                return 0;
            });
    }, [enrolledStudents, searchTerm, sortBy, sortOrder, progressData]);

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return '#22c55e';
        if (percentage >= 50) return '#f59e0b';
        if (percentage >= 25) return '#3b82f6';
        return '#ef4444';
    };

    const averageProgress =
        enrolledStudents.length > 0
            ? Math.round(
                  enrolledStudents.reduce((sum, e) => sum + getProgressPercentage(e.student?.id), 0) /
                      enrolledStudents.length
              )
            : 0;

    const completedStudents = enrolledStudents.filter(
        (e) => getProgressPercentage(e.student?.id) === 100
    ).length;

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading analytics..." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>←</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Course Analytics</Text>
                        <Text style={styles.subtitle}>{courseData?.title || 'Course'}</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard value={enrolledStudents.length} label="Total Enrolled" color="#2563eb" />
                    <StatCard value={completedStudents} label="Completed" color="#16a34a" />
                    <StatCard value={`${averageProgress}%`} label="Average Progress" color="#d97706" />
                    <StatCard value={courseData?.total_modules || 0} label="Modules" color="#7c3aed" />
                </View>

                <View style={styles.filterSection}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        <View style={styles.filterRow}>
                            {['progress', 'name', 'enrolled'].map((value) => (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.filterChip, sortBy === value && styles.filterChipActive]}
                                    onPress={() => setSortBy(value)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            sortBy === value && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {value}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={styles.orderBtn}
                                onPress={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                            >
                                <Text style={styles.orderBtnText}>
                                    {sortOrder === 'desc' ? '↓' : '↑'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.studentsGrid}>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((enrollment) => {
                            const student = enrollment.student;
                            if (!student) return null;

                            const progress = getProgressPercentage(student.id);
                            const completed = getCompletedLessons(student.id);
                            const total = getTotalLessons(student.id);

                            return (
                                <TouchableOpacity
                                    key={enrollment.id}
                                    style={[
                                        styles.studentCard,
                                        selectedStudent?.id === student.id && styles.studentCardSelected,
                                    ]}
                                    onPress={() => fetchStudentProgress(student)}
                                >
                                    <View style={styles.studentHeader}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {student.fullname?.charAt(0) || 'S'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.studentName}>{student.fullname || 'Unknown Student'}</Text>
                                            <Text style={styles.studentEmail}>{student.email}</Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.progressBadge,
                                                {
                                                    backgroundColor: `${getProgressColor(progress)}20`,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.progressBadgeText,
                                                    { color: getProgressColor(progress) },
                                                ]}
                                            >
                                                {progress}%
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressTrack}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: `${progress}%`,
                                                    backgroundColor: getProgressColor(progress),
                                                },
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.progressMetaRow}>
                                        <Text style={styles.progressMeta}>{completed} / {total} lessons</Text>
                                        <Text style={styles.progressMeta}>
                                            {new Date(enrollment.enrolled_time).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No Students Found</Text>
                            <Text style={styles.emptyText}>No students match your search criteria</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={!!selectedStudent && !!studentProgress}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    setSelectedStudent(null);
                    setStudentProgress(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIdentity}>
                                <View style={[styles.avatar, styles.largeAvatar]}>
                                    <Text style={styles.avatarText}>
                                        {selectedStudent?.fullname?.charAt(0) || 'S'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.modalName}>{selectedStudent?.fullname}</Text>
                                    <Text style={styles.modalEmail}>{selectedStudent?.email}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => {
                                    setSelectedStudent(null);
                                    setStudentProgress(null);
                                }}
                            >
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.overallCard}>
                                <Text style={styles.overallValue}>{studentProgress?.overall_progress || 0}%</Text>
                                <Text style={styles.overallLabel}>Overall Progress</Text>
                                <View style={styles.overallStatsRow}>
                                    <View style={styles.overallStatItem}>
                                        <Text style={styles.overallStatValue}>
                                            {studentProgress?.completed_lessons || 0}
                                        </Text>
                                        <Text style={styles.overallStatLabel}>Completed</Text>
                                    </View>
                                    <View style={styles.overallStatItem}>
                                        <Text style={styles.overallStatValue}>
                                            {studentProgress?.total_lessons || 0}
                                        </Text>
                                        <Text style={styles.overallStatLabel}>Total</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.modulesTitle}>Module Progress</Text>
                            {(studentProgress?.modules || []).map((module, index) => {
                                const moduleProgress = module.progress || 0;
                                return (
                                    <View key={module.id || index} style={styles.moduleItem}>
                                        <View style={styles.moduleTopRow}>
                                            <View style={styles.moduleNum}>
                                                <Text style={styles.moduleNumText}>{index + 1}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.moduleName}>{module.title}</Text>
                                                <Text style={styles.moduleSub}>
                                                    {module.completed_lessons || 0} / {module.total_lessons || 0} lessons
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.modulePercent,
                                                    { color: getProgressColor(moduleProgress) },
                                                ]}
                                            >
                                                {moduleProgress}%
                                            </Text>
                                        </View>
                                        <View style={styles.progressTrackSmall}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${moduleProgress}%`,
                                                        backgroundColor: getProgressColor(moduleProgress),
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const StatCard = ({ value, label, color }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: color }]} />
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        padding: 16,
        paddingBottom: 28,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        fontSize: 18,
        color: '#374151',
        fontWeight: '700',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a2332',
    },
    subtitle: {
        marginTop: 2,
        color: '#6b7280',
        fontSize: 13,
    },
    statsGrid: {
        gap: 10,
        marginBottom: 18,
    },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
    },
    statLabel: {
        marginTop: 2,
        fontSize: 12,
        color: '#6b7280',
    },
    filterSection: {
        marginBottom: 14,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#374151',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterChip: {
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        paddingVertical: 7,
        paddingHorizontal: 12,
    },
    filterChipActive: {
        backgroundColor: '#4285f4',
    },
    filterChipText: {
        fontSize: 12,
        color: '#374151',
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    orderBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderBtnText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '700',
    },
    studentsGrid: {
        gap: 12,
    },
    studentCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#eef2f7',
    },
    studentCardSelected: {
        borderColor: '#4285f4',
        backgroundColor: '#f0f7ff',
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
    },
    largeAvatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
    },
    avatarText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 18,
    },
    studentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a2332',
    },
    studentEmail: {
        marginTop: 2,
        fontSize: 12,
        color: '#6b7280',
    },
    progressBadge: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 16,
    },
    progressBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    progressTrack: {
        height: 8,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        overflow: 'hidden',
    },
    progressTrackSmall: {
        marginTop: 10,
        height: 6,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 10,
    },
    progressMetaRow: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressMeta: {
        fontSize: 11,
        color: '#9ca3af',
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 12,
    },
    emptyTitle: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '700',
    },
    emptyText: {
        marginTop: 6,
        fontSize: 13,
        color: '#6b7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: 14,
    },
    modalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        maxHeight: '92%',
    },
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    modalName: {
        fontSize: 16,
        color: '#1a2332',
        fontWeight: '700',
    },
    modalEmail: {
        marginTop: 2,
        fontSize: 12,
        color: '#6b7280',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
    },
    closeBtnText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '700',
    },
    modalBody: {
        padding: 16,
    },
    overallCard: {
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#f3f8ff',
        marginBottom: 16,
        alignItems: 'center',
    },
    overallValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a2332',
    },
    overallLabel: {
        marginTop: 2,
        fontSize: 12,
        color: '#6b7280',
    },
    overallStatsRow: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 30,
    },
    overallStatItem: {
        alignItems: 'center',
    },
    overallStatValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a2332',
    },
    overallStatLabel: {
        marginTop: 2,
        fontSize: 11,
        color: '#6b7280',
    },
    modulesTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a2332',
        marginBottom: 10,
    },
    moduleItem: {
        borderWidth: 1,
        borderColor: '#f3f4f6',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        backgroundColor: '#f9fafb',
    },
    moduleTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    moduleNum: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#4285f4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moduleNumText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    moduleName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a2332',
    },
    moduleSub: {
        marginTop: 2,
        fontSize: 11,
        color: '#6b7280',
    },
    modulePercent: {
        fontSize: 13,
        fontWeight: '700',
    },
});

export default CourseAnalytics;
