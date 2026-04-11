import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
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

const SchoolTeachers = () => {
    const [schoolId, setSchoolId] = useState(null)
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [selectedStudent, setSelectedStudent] = useState('')
    const [assignMsg, setAssignMsg] = useState('')

    useEffect(() => {
        const bootstrap = async () => {
            const storedSchoolId = await AsyncStorage.getItem('schoolId')
            setSchoolId(storedSchoolId)

            if (!storedSchoolId) {
                setLoading(false)
                return
            }

            fetchData(storedSchoolId)
        }

        bootstrap()
    }, [])

    const fetchData = async (currentSchoolId) => {
        try {
            const [teacherRes, studentRes] = await Promise.all([
                axios.get(`${baseUrl}/school/teachers/${currentSchoolId}/`),
                axios.get(`${baseUrl}/school/students/${currentSchoolId}/`),
            ])
            setTeachers(teacherRes.data)
            setStudents(studentRes.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAssignTeacher = async () => {
        if (!selectedTeacher || !selectedStudent || !schoolId) return

        const formData = new FormData()
        formData.append('teacher_id', selectedTeacher)
        formData.append('student_id', selectedStudent)

        try {
            const response = await axios.post(`${baseUrl}/school/assign-teacher-to-student/${schoolId}/`, formData)
            if (response.data.bool) {
                setAssignMsg(response.data.message)
                setSelectedTeacher('')
                setSelectedStudent('')
                setTimeout(() => setAssignMsg(''), 3000)
            } else {
                setAssignMsg(response.data.message || 'Failed to assign')
            }
        } catch (error) {
            setAssignMsg('Error assigning teacher')
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading teachers..." />
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>👩‍🏫 Teachers</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAssignModal(!showAssignModal)}>
                    <Text style={styles.primaryBtnText}>Assign Teacher to Student</Text>
                </TouchableOpacity>
            </View>

            {showAssignModal ? (
                <View style={[styles.card, styles.assignCard]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>🔗 Assign Teacher to Student</Text>
                    </View>
                    <View style={styles.cardBody}>
                        {!!assignMsg && <Text style={styles.infoMsg}>{assignMsg}</Text>}

                        <Text style={styles.inputLabel}>Teacher</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={selectedTeacher} onValueChange={setSelectedTeacher}>
                                <Picker.Item label='Select Teacher' value='' />
                                {teachers.map((teacherItem) => (
                                    <Picker.Item
                                        key={teacherItem.id}
                                        value={String(teacherItem.teacher?.id || teacherItem.id)}
                                        label={teacherItem.teacher?.full_name || 'Teacher'}
                                    />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.inputLabel}>Student</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={selectedStudent} onValueChange={setSelectedStudent}>
                                <Picker.Item label='Select Student' value='' />
                                {students.map((studentItem) => (
                                    <Picker.Item
                                        key={studentItem.id}
                                        value={String(studentItem.student?.id || studentItem.id)}
                                        label={studentItem.student?.fullname || 'Student'}
                                    />
                                ))}
                            </Picker>
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleAssignTeacher}>
                            <Text style={styles.primaryBtnText}>Assign</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderTitle}>📋 School Teachers ({teachers.length})</Text>
                </View>
                <View style={styles.cardBody}>
                    {teachers.length > 0 ? (
                        teachers.map((teacherRecord, index) => {
                            const teacher = teacherRecord.teacher || {}
                            return (
                                <View key={teacherRecord.id || index} style={styles.teacherRow}>
                                    <View style={styles.indexWrap}>
                                        <Text style={styles.indexText}>{index + 1}</Text>
                                    </View>

                                    <View style={styles.teacherInfoWrap}>
                                        <Text style={styles.teacherName}>{teacher.full_name || 'N/A'}</Text>
                                        <Text style={styles.teacherMeta}>Email: {teacher.email || 'N/A'}</Text>
                                        <Text style={styles.teacherMeta}>Qualification: {teacher.qualification || 'N/A'}</Text>
                                    </View>

                                    <View style={styles.rightWrap}>
                                        <Text style={teacherRecord.is_active ? styles.statusActive : styles.statusInactive}>
                                            {teacherRecord.is_active ? 'Active' : 'Inactive'}
                                        </Text>
                                        <Text style={styles.joinedText}>
                                            {teacherRecord.joined_at
                                                ? new Date(teacherRecord.joined_at).toLocaleDateString()
                                                : 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            )
                        })
                    ) : (
                        <Text style={styles.emptyText}>
                            No teachers assigned to this school yet. Contact your administrator.
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        gap: 10,
    },
    headerTitle: {
        color: '#1a2332',
        fontWeight: '700',
        fontSize: 24,
        flex: 1,
    },
    primaryBtn: {
        backgroundColor: '#0d6efd',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    assignCard: {
        marginBottom: 14,
    },
    card: {
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
    cardHeaderTitle: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 16,
    },
    cardBody: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    infoMsg: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 12,
    },
    inputLabel: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 6,
    },
    pickerWrap: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    teacherRow: {
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
    teacherInfoWrap: {
        flex: 1,
    },
    teacherName: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 2,
    },
    teacherMeta: {
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

export default SchoolTeachers
