import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';
import LoadingSpinner from '../shared/LoadingSpinner';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_schools: 0,
        total_teachers: 0,
        total_students: 0,
        total_courses: 0,
        total_enrollments: 0,
        recent_enrollments: [],
        popular_courses: [],
        monthly_stats: { labels: [], enrollments: [] },
        category_stats: [],
        top_teachers: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${baseUrl}/admin/stats/`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingWrapper}>
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>📊 Admin Dashboard</Text>

            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🏫</Text>
                    <Text style={styles.statValue}>{stats.total_schools}</Text>
                    <Text style={styles.statLabel}>Schools</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>👨‍🏫</Text>
                    <Text style={styles.statValue}>{stats.total_teachers}</Text>
                    <Text style={styles.statLabel}>Teachers</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🎓</Text>
                    <Text style={styles.statValue}>{stats.total_students}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>📚</Text>
                    <Text style={styles.statValue}>{stats.total_courses}</Text>
                    <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>✅</Text>
                    <Text style={styles.statValue}>{stats.total_enrollments}</Text>
                    <Text style={styles.statLabel}>Enrollments</Text>
                </View>
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🕒 Recent Enrollments</Text>
                {stats.recent_enrollments.length > 0 ? (
                    stats.recent_enrollments.map((enrollment, index) => (
                        <View key={`${enrollment.student_name}-${index}`} style={styles.listRow}>
                            <View style={styles.listRowMain}>
                                <Text style={styles.listPrimary}>{enrollment.student_name}</Text>
                                <Text style={styles.listSecondary} numberOfLines={1}>
                                    {enrollment.course_title}
                                </Text>
                            </View>
                            <Text style={styles.listMeta}>{enrollment.enrolled_time}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No recent enrollments</Text>
                )}
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>⭐ Popular Courses</Text>
                {stats.popular_courses.length > 0 ? (
                    stats.popular_courses.map((course, index) => (
                        <View key={`${course.title}-${index}`} style={styles.listRow}>
                            <View style={styles.listRowMain}>
                                <Text style={styles.listPrimary}>{course.title}</Text>
                                <Text style={styles.listSecondary}>
                                    {course.enrollments} {course.enrollments === 1 ? 'student' : 'students'}
                                </Text>
                            </View>
                            <View style={[styles.badge, styles.badgeWarning]}>
                                <Text style={styles.badgeTextDark}>{course.rating?.toFixed(1) || 'New'}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Your musical journey starts here.</Text>
                )}
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🏆 Top Teachers</Text>
                {stats.top_teachers?.length > 0 ? (
                    stats.top_teachers.map((teacher, index) => (
                        <View key={`${teacher.name}-${index}`} style={styles.listRow}>
                            <View style={styles.listRowMain}>
                                <Text style={styles.listPrimary}>{teacher.name}</Text>
                                <Text style={styles.listSecondary}>{teacher.courses} courses</Text>
                            </View>
                            <View style={[styles.badge, styles.badgeSuccess]}>
                                <Text style={styles.badgeText}>
                                    {teacher.students} {teacher.students === 1 ? 'student' : 'students'}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No teachers yet</Text>
                )}
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🏷️ Courses by Category</Text>
                {stats.category_stats?.length > 0 ? (
                    stats.category_stats.map((category, index) => (
                        <View key={`${category.title}-${index}`} style={styles.listRow}>
                            <Text style={styles.listPrimary}>{category.title}</Text>
                            <View style={[styles.badge, styles.badgePrimary]}>
                                <Text style={styles.badgeText}>{category.course_count}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No categories yet</Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa'
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 24
    },
    loadingWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
        marginBottom: 14
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    statCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 10,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eef1f5'
    },
    statIcon: {
        fontSize: 22,
        marginBottom: 6
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a2332'
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 3
    },
    sectionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#eef1f5'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2332',
        marginBottom: 8
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f6'
    },
    listRowMain: {
        flex: 1,
        marginRight: 8
    },
    listPrimary: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a2332'
    },
    listSecondary: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2
    },
    listMeta: {
        fontSize: 11,
        color: '#6b7280',
        marginLeft: 8
    },
    emptyText: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 14,
        paddingVertical: 14
    },
    badge: {
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8
    },
    badgePrimary: {
        backgroundColor: '#4285f4'
    },
    badgeSuccess: {
        backgroundColor: '#34c759'
    },
    badgeWarning: {
        backgroundColor: '#ffcd38'
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700'
    },
    badgeTextDark: {
        color: '#1a2332',
        fontSize: 11,
        fontWeight: '700'
    }
});

export default AdminDashboard;
