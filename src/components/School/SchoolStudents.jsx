import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import LoadingSpinner from '../shared/LoadingSpinner'

import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const SchoolStudents = () => {
    const [schoolId, setSchoolId] = useState(null)
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const bootstrap = async () => {
            const storedSchoolId = await AsyncStorage.getItem('schoolId')
            setSchoolId(storedSchoolId)
            if (!storedSchoolId) {
                setLoading(false)
                return
            }
            fetchStudents(storedSchoolId)
        }
        bootstrap()
    }, [])

    const fetchStudents = async (currentSchoolId) => {
        try {
            const response = await axios.get(`${baseUrl}/school/students/${currentSchoolId}/`)
            setStudents(response.data)
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading students..." />
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.headerTitle}>👥 Students</Text>

            <View style={styles.contentCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderText}>📋 School Students ({students.length})</Text>
                </View>

                <View style={styles.cardBody}>
                    {students.length > 0 ? (
                        students.map((studentRecord, index) => {
                            const student = studentRecord.student || {}
                            return (
                                <View key={studentRecord.id || index} style={styles.studentRow}>
                                    <View style={styles.indexWrap}>
                                        <Text style={styles.indexText}>{index + 1}</Text>
                                    </View>

                                    <View style={styles.studentInfoWrap}>
                                        <Text style={styles.studentName}>{student.fullname || 'N/A'}</Text>
                                        <Text style={styles.studentMeta}>Email: {student.email || 'N/A'}</Text>
                                        <Text style={styles.studentMeta}>Username: {student.username || 'N/A'}</Text>
                                    </View>

                                    <View style={styles.rightWrap}>
                                        <Text style={studentRecord.is_active ? styles.statusActive : styles.statusInactive}>
                                            {studentRecord.is_active ? 'Active' : 'Inactive'}
                                        </Text>
                                        <Text style={styles.joinedText}>
                                            {studentRecord.joined_at
                                                ? new Date(studentRecord.joined_at).toLocaleDateString()
                                                : 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            )
                        })
                    ) : (
                        <Text style={styles.emptyText}>
                            No students enrolled in this school yet. Contact your administrator.
                        </Text>
                    )}
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
        fontSize: 24,
        marginBottom: 16,
    },
    contentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    cardHeaderText: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 16,
    },
    cardBody: {
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    indexWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    indexText: {
        color: '#3730a3',
        fontWeight: '700',
        fontSize: 12,
    },
    studentInfoWrap: {
        flex: 1,
    },
    studentName: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 2,
    },
    studentMeta: {
        color: '#6b7280',
        fontSize: 12,
    },
    rightWrap: {
        alignItems: 'flex-end',
        gap: 6,
    },
    statusActive: {
        backgroundColor: '#34c759',
        color: '#fff',
        fontSize: 11,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
    },
    statusInactive: {
        backgroundColor: '#6b7280',
        color: '#fff',
        fontSize: 11,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
    },
    joinedText: {
        color: '#64748b',
        fontSize: 11,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 24,
    },
})

export default SchoolStudents
