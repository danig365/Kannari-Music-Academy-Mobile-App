import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import LoadingSpinner from '../shared/LoadingSpinner'

import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const SchoolDashboard = () => {
    const navigation = useNavigation()
    const [schoolId, setSchoolId] = useState(null)
    const [schoolName, setSchoolName] = useState('')
    const [stats, setStats] = useState({
        total_teachers: 0,
        total_students: 0,
        total_courses: 0,
        total_groups: 0,
        total_lesson_assignments: 0,
        school_name: '',
        school_status: '',
        recent_assignments: [],
        group_classes: [],
        teachers: [],
        students: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const bootstrap = async () => {
            const storedSchoolId = await AsyncStorage.getItem('schoolId')
            const storedSchoolName = await AsyncStorage.getItem('schoolName')
            setSchoolId(storedSchoolId)
            setSchoolName(storedSchoolName || '')

            if (!storedSchoolId) {
                setLoading(false)
                return
            }

            fetchStats(storedSchoolId)
        }

        bootstrap()
    }, [])

    const fetchStats = async (currentSchoolId) => {
        try {
            const response = await axios.get(`${baseUrl}/school/dashboard/${currentSchoolId}/`)
            setStats(response.data)
        } catch (error) {
            console.error('Error fetching school stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.headerTitle}>🏫 {schoolName || 'School'} Dashboard</Text>

            <View style={styles.statsWrap}>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>👩‍🏫</Text>
                    <Text style={styles.statValue}>{stats.total_teachers}</Text>
                    <Text style={styles.statLabel}>Teachers</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>👥</Text>
                    <Text style={styles.statValue}>{stats.total_students}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>📘</Text>
                    <Text style={styles.statValue}>{stats.total_courses}</Text>
                    <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🧩</Text>
                    <Text style={styles.statValue}>{stats.total_groups}</Text>
                    <Text style={styles.statLabel}>Groups</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>📚</Text>
                    <Text style={styles.statValue}>{stats.total_lesson_assignments}</Text>
                    <Text style={styles.statLabel}>Assignments</Text>
                </View>
            </View>

            <View style={styles.contentGrid}>
                <View style={styles.contentCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>👩‍🏫 Teachers</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SchoolTeachers')} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cardBody}>
                        {stats.teachers?.length > 0 ? (
                            stats.teachers.map((teacher, index) => (
                                <View key={index} style={styles.listItem}>
                                    <View style={styles.listLeft}>
                                        <Text style={styles.itemName}>{teacher.name}</Text>
                                        <Text style={styles.itemSub}>{teacher.email}</Text>
                                    </View>
                                    <View style={styles.badgeWrap}>
                                        <Text style={styles.badgePrimary}>{teacher.courses} courses</Text>
                                        <Text style={styles.badgeSuccess}>
                                            {teacher.students} {teacher.students === 1 ? 'student' : 'students'}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No teachers assigned yet</Text>
                        )}
                    </View>
                </View>

                <View style={styles.contentCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>👥 Students</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SchoolStudents')} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cardBody}>
                        {stats.students?.length > 0 ? (
                            stats.students.map((student, index) => (
                                <View key={index} style={styles.listItem}>
                                    <View style={styles.listLeft}>
                                        <Text style={styles.itemName}>{student.name}</Text>
                                        <Text style={styles.itemSub}>{student.email}</Text>
                                    </View>
                                    <Text style={styles.badgeInfo}>{student.enrolled_courses} courses</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No students enrolled yet</Text>
                        )}
                    </View>
                </View>

                <View style={styles.contentCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>🧩 Group Classes</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SchoolGroupClasses')} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>Manage</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cardBody}>
                        {stats.group_classes?.length > 0 ? (
                            stats.group_classes.map((group, index) => (
                                <View key={index} style={styles.listItem}>
                                    <View style={styles.listLeft}>
                                        <Text style={styles.itemName}>{group.name}</Text>
                                        <Text style={styles.itemSub}>
                                            {group.teachers} teachers • {group.students} {group.students === 1 ? 'student' : 'students'}
                                        </Text>
                                    </View>
                                    <Text style={group.is_active ? styles.badgeSuccess : styles.badgeMuted}>
                                        {group.is_active ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No group classes created yet</Text>
                        )}
                    </View>
                </View>

                <View style={styles.contentCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>📒 Recent Assignments</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SchoolLessonAssignments')} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cardBody}>
                        {stats.recent_assignments?.length > 0 ? (
                            stats.recent_assignments.map((assignment, index) => (
                                <View key={index} style={styles.assignmentRow}>
                                    <Text style={styles.assignmentTitle} numberOfLines={1}>{assignment.lesson_title}</Text>
                                    <Text style={styles.assignmentSub}>{assignment.target}</Text>
                                    <View style={styles.assignmentMeta}>
                                        <Text style={assignment.assignment_type === 'group' ? styles.badgeWarning : styles.badgeInfo}>
                                            {assignment.assignment_type}
                                        </Text>
                                        <Text style={styles.assignmentDate}>{assignment.assigned_at}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No lesson assignments yet</Text>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
    },
    headerTitle: {
        color: '#1a2332',
        fontWeight: '700',
        fontSize: 26,
        marginBottom: 16,
    },
    statsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        minHeight: 120,
        flexBasis: '48%',
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIcon: {
        fontSize: 26,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
    },
    statLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#6b7280',
    },
    contentGrid: {
        gap: 12,
    },
    contentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 16,
        flex: 1,
    },
    headerBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#0d6efd',
        borderRadius: 8,
    },
    headerBtnText: {
        color: '#0d6efd',
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    listItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    listLeft: {
        flex: 1,
    },
    itemName: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 14,
    },
    itemSub: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },
    badgeWrap: {
        alignItems: 'flex-end',
        gap: 4,
    },
    badgePrimary: {
        backgroundColor: '#0d6efd',
        color: '#fff',
        fontSize: 11,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    badgeSuccess: {
        backgroundColor: '#34c759',
        color: '#fff',
        fontSize: 11,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    badgeInfo: {
        backgroundColor: '#00bcd4',
        color: '#fff',
        fontSize: 11,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    badgeWarning: {
        backgroundColor: '#ff9800',
        color: '#fff',
        fontSize: 11,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    badgeMuted: {
        backgroundColor: '#6b7280',
        color: '#fff',
        fontSize: 11,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    assignmentRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 4,
    },
    assignmentTitle: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 14,
    },
    assignmentSub: {
        color: '#475569',
        fontSize: 12,
    },
    assignmentMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    assignmentDate: {
        color: '#6b7280',
        fontSize: 11,
    },
})

export default SchoolDashboard
