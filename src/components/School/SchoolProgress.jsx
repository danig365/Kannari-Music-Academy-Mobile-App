import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import LoadingSpinner from '../shared/LoadingSpinner'

import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const SchoolProgress = () => {
    const [schoolId, setSchoolId] = useState(null)
    const [progress, setProgress] = useState({
        total_enrollments: 0,
        total_students: 0,
        student_progress: [],
        group_progress: [],
        recent_completions: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const bootstrap = async () => {
            const storedSchoolId = await AsyncStorage.getItem('schoolId')
            setSchoolId(storedSchoolId)
            if (!storedSchoolId) {
                setLoading(false)
                return
            }
            fetchProgress(storedSchoolId)
        }

        bootstrap()
    }, [])

    const fetchProgress = async (currentSchoolId) => {
        try {
            const response = await axios.get(`${baseUrl}/school/progress/${currentSchoolId}/`)
            setProgress(response.data)
        } catch (error) {
            console.error('Error fetching progress:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading progress..." />
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.pageTitle}>📈 Progress Overview</Text>

            <View style={styles.summaryWrap}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryIcon}>👥</Text>
                    <Text style={styles.summaryValue}>{progress.total_students}</Text>
                    <Text style={styles.summaryLabel}>Total Students</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryIcon}>✅</Text>
                    <Text style={styles.summaryValue}>{progress.total_enrollments}</Text>
                    <Text style={styles.summaryLabel}>Total Enrollments</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderText}>👤 Student Progress</Text>
                </View>
                <View style={styles.cardBody}>
                    {progress.student_progress?.length > 0 ? (
                        progress.student_progress.map((studentProgress, index) => (
                            <View key={index} style={styles.rowItem}>
                                <View style={styles.rowTop}>
                                    <View style={styles.flexOne}>
                                        <Text style={styles.itemTitle}>{studentProgress.name}</Text>
                                        <Text style={styles.itemSub}>{studentProgress.email}</Text>
                                    </View>
                                    <Text style={styles.metricText}>{studentProgress.total_courses} courses</Text>
                                </View>
                                <View style={styles.progressRow}>
                                    <View style={styles.progressTrack}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${studentProgress.avg_progress}%`, backgroundColor: '#2563eb' },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressPct}>{studentProgress.avg_progress}%</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No student progress data yet</Text>
                    )}
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderText}>🧩 Group Class Progress</Text>
                </View>
                <View style={styles.cardBody}>
                    {progress.group_progress?.length > 0 ? (
                        progress.group_progress.map((groupProgress, index) => (
                            <View key={index} style={styles.rowItem}>
                                <View style={styles.rowTop}>
                                    <View style={styles.flexOne}>
                                        <Text style={styles.itemTitle}>{groupProgress.name}</Text>
                                        <Text style={styles.itemSub}>
                                            {groupProgress.total_students} students • {groupProgress.total_teachers} teachers
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.progressRow}>
                                    <View style={styles.progressTrack}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${groupProgress.avg_progress}%`, backgroundColor: '#16a34a' },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressPct}>{groupProgress.avg_progress}%</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No group classes yet</Text>
                    )}
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderText}>🎯 Recent Lesson Completions</Text>
                </View>
                <View style={styles.cardBody}>
                    {progress.recent_completions?.length > 0 ? (
                        progress.recent_completions.map((completion, index) => (
                            <View key={index} style={styles.completionRow}>
                                <Text style={styles.itemTitle}>{completion.student_name}</Text>
                                <Text style={styles.itemSub}>{completion.lesson_title}</Text>
                                <Text style={styles.dateText}>{completion.completed_at || '—'}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No lesson completions recorded yet</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    page: {
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
        marginBottom: 12,
    },
    summaryWrap: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        minHeight: 120,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
    },
    summaryIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    cardHeader: {
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    cardHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a2332',
    },
    cardBody: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    rowItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 10,
        gap: 6,
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    flexOne: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    itemSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 1,
    },
    metricText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '600',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressTrack: {
        flex: 1,
        height: 8,
        borderRadius: 999,
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    progressPct: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e293b',
        minWidth: 40,
        textAlign: 'right',
    },
    completionRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 10,
    },
    dateText: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
})

export default SchoolProgress
