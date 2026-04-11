import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import LoadingSpinner from '../shared/LoadingSpinner'
import SchoolGroupDetail from './SchoolGroupDetail'

import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const SchoolGroupClasses = () => {
    const [schoolId, setSchoolId] = useState(null)
    const [groups, setGroups] = useState([])
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState({ name: '', description: '', schedule: '', max_students: 20 })
    const [message, setMessage] = useState('')
    const [expandedGroup, setExpandedGroup] = useState(null)
    const [groupMembers, setGroupMembers] = useState({ teachers: [], students: [] })
    const [assignTeacher, setAssignTeacher] = useState('')
    const [assignStudent, setAssignStudent] = useState('')
    const [detailGroupId, setDetailGroupId] = useState(null)

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

    const fetchData = async (currentSchoolId = schoolId) => {
        if (!currentSchoolId) return
        try {
            const [groupsRes, teachersRes, studentsRes] = await Promise.all([
                axios.get(`${baseUrl}/school/groups/${currentSchoolId}/`),
                axios.get(`${baseUrl}/school/teachers/${currentSchoolId}/`),
                axios.get(`${baseUrl}/school/students/${currentSchoolId}/`),
            ])
            setGroups(groupsRes.data)
            setTeachers(teachersRes.data)
            setStudents(studentsRes.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!formData.name.trim() || !schoolId) {
            Alert.alert('Validation', 'Group name is required.')
            return
        }
        try {
            const data = { ...formData, school: schoolId }
            await axios.post(`${baseUrl}/school/groups/${schoolId}/`, data)
            setMessage('Group class created successfully!')
            setShowCreateForm(false)
            setFormData({ name: '', description: '', schedule: '', max_students: 20 })
            fetchData()
            setTimeout(() => setMessage(''), 3000)
        } catch (error) {
            setMessage('Error creating group class')
        }
    }

    const handleDeleteGroup = async (groupId) => {
        Alert.alert('Delete Group', 'Are you sure you want to delete this group class?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${baseUrl}/school/group/${groupId}/`)
                        setMessage('Group class deleted')
                        fetchData()
                        setTimeout(() => setMessage(''), 3000)
                    } catch (error) {
                        setMessage('Error deleting group')
                    }
                },
            },
        ])
    }

    const fetchGroupMembers = async (groupId) => {
        try {
            const [teacherRes, studentRes] = await Promise.all([
                axios.get(`${baseUrl}/school/group/${groupId}/teachers/`),
                axios.get(`${baseUrl}/school/group/${groupId}/students/`),
            ])
            setGroupMembers({ teachers: teacherRes.data, students: studentRes.data })
        } catch (error) {
            console.error('Error fetching group members:', error)
        }
    }

    const toggleGroupDetails = async (groupId) => {
        if (expandedGroup === groupId) {
            setExpandedGroup(null)
            return
        }
        setExpandedGroup(groupId)
        fetchGroupMembers(groupId)
    }

    const handleAssignTeacherToGroup = async (groupId) => {
        if (!assignTeacher) return
        const fd = new FormData()
        fd.append('teacher_id', assignTeacher)
        try {
            await axios.post(`${baseUrl}/school/group/${groupId}/assign-teacher/`, fd)
            setAssignTeacher('')
            fetchGroupMembers(groupId)
            fetchData()
        } catch (error) {
            console.error('Error assigning teacher:', error)
        }
    }

    const handleAssignStudentToGroup = async (groupId) => {
        if (!assignStudent) return
        const fd = new FormData()
        fd.append('student_id', assignStudent)
        try {
            await axios.post(`${baseUrl}/school/group/${groupId}/assign-student/`, fd)
            setAssignStudent('')
            fetchGroupMembers(groupId)
            fetchData()
        } catch (error) {
            console.error('Error assigning student:', error)
        }
    }

    const handleRemoveTeacher = async (groupId, teacherId) => {
        try {
            await axios.delete(`${baseUrl}/school/group/${groupId}/remove-teacher/${teacherId}/`)
            fetchGroupMembers(groupId)
            fetchData()
        } catch (error) {
            console.error('Error removing teacher:', error)
        }
    }

    const handleRemoveStudent = async (groupId, studentId) => {
        try {
            await axios.delete(`${baseUrl}/school/group/${groupId}/remove-student/${studentId}/`)
            fetchGroupMembers(groupId)
            fetchData()
        } catch (error) {
            console.error('Error removing student:', error)
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingSpinner size="lg" text="Loading groups..." />
            </View>
        )
    }

    if (detailGroupId) {
        return <SchoolGroupDetail groupId={detailGroupId} onBack={() => setDetailGroupId(null)} />
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>🧩 Group Classes</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreateForm(!showCreateForm)}>
                    <Text style={styles.primaryBtnText}>Create Group</Text>
                </TouchableOpacity>
            </View>

            {!!message && <Text style={styles.infoMsg}>{message}</Text>}

            {showCreateForm ? (
                <View style={[styles.card, styles.createCard]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>➕ Create New Group Class</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.inputLabel}>Group Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(value) => setFormData({ ...formData, name: value })}
                        />

                        <Text style={styles.inputLabel}>Schedule</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.schedule}
                            placeholder='e.g. Mon/Wed 4:00 PM'
                            onChangeText={(value) => setFormData({ ...formData, schedule: value })}
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            multiline
                            value={formData.description}
                            onChangeText={(value) => setFormData({ ...formData, description: value })}
                        />

                        <Text style={styles.inputLabel}>Max Students</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType='numeric'
                            value={String(formData.max_students)}
                            onChangeText={(value) =>
                                setFormData({
                                    ...formData,
                                    max_students: Number.isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10),
                                })
                            }
                        />

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateGroup}>
                                <Text style={styles.primaryBtnText}>Create</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowCreateForm(false)}>
                                <Text style={styles.secondaryBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : null}

            {groups.length > 0 ? (
                groups.map((group) => (
                    <View key={group.id} style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.groupHeaderLeft}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                <Text style={group.is_active ? styles.badgeActive : styles.badgeInactive}>
                                    {group.is_active ? 'Active' : 'Inactive'}
                                </Text>
                                <Text style={styles.groupMeta}>
                                    {group.total_teachers} teachers • {group.total_students}{' '}
                                    {group.total_students === 1 ? 'student' : 'students'}
                                </Text>
                            </View>

                            <View style={styles.groupActions}>
                                <TouchableOpacity style={styles.actionBtnInfo} onPress={() => setDetailGroupId(group.id)}>
                                    <Text style={styles.actionBtnInfoText}>Manage</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => toggleGroupDetails(group.id)}>
                                    <Text style={styles.actionBtnPrimaryText}>{expandedGroup === group.id ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteGroup(group.id)}>
                                    <Text style={styles.actionBtnDangerText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {(group.description || group.schedule) && (
                            <View style={styles.cardBodyCompact}>
                                {!!group.description && <Text style={styles.groupDescription}>{group.description}</Text>}
                                {!!group.schedule && <Text style={styles.groupSchedule}>🕒 {group.schedule}</Text>}
                            </View>
                        )}

                        {expandedGroup === group.id ? (
                            <View style={styles.expandedBody}>
                                <View style={styles.memberBlock}>
                                    <Text style={styles.memberTitle}>👩‍🏫 Teachers</Text>
                                    {groupMembers.teachers.length > 0 ? (
                                        groupMembers.teachers.map((groupTeacher) => (
                                            <View key={groupTeacher.id} style={styles.memberRow}>
                                                <Text style={styles.memberName}>{groupTeacher.teacher?.full_name || 'Teacher'}</Text>
                                                <TouchableOpacity
                                                    style={styles.removeBtn}
                                                    onPress={() => handleRemoveTeacher(group.id, groupTeacher.teacher?.id)}
                                                >
                                                    <Text style={styles.removeBtnText}>Remove</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptySubText}>No teachers assigned</Text>
                                    )}

                                    <View style={styles.assignRow}>
                                        <View style={styles.pickerWrap}>
                                            <Picker selectedValue={assignTeacher} onValueChange={setAssignTeacher}>
                                                <Picker.Item label='Add teacher...' value='' />
                                                {teachers.map((teacherItem) => (
                                                    <Picker.Item
                                                        key={teacherItem.id}
                                                        label={teacherItem.teacher?.full_name || 'Teacher'}
                                                        value={String(teacherItem.teacher?.id || '')}
                                                    />
                                                ))}
                                            </Picker>
                                        </View>
                                        <TouchableOpacity style={styles.assignBtn} onPress={() => handleAssignTeacherToGroup(group.id)}>
                                            <Text style={styles.assignBtnText}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.memberBlock}>
                                    <Text style={styles.memberTitle}>👥 Students</Text>
                                    {groupMembers.students.length > 0 ? (
                                        groupMembers.students.map((groupStudent) => (
                                            <View key={groupStudent.id} style={styles.memberRow}>
                                                <Text style={styles.memberName}>{groupStudent.student?.fullname || 'Student'}</Text>
                                                <TouchableOpacity
                                                    style={styles.removeBtn}
                                                    onPress={() => handleRemoveStudent(group.id, groupStudent.student?.id)}
                                                >
                                                    <Text style={styles.removeBtnText}>Remove</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptySubText}>No students assigned</Text>
                                    )}

                                    <View style={styles.assignRow}>
                                        <View style={styles.pickerWrap}>
                                            <Picker selectedValue={assignStudent} onValueChange={setAssignStudent}>
                                                <Picker.Item label='Add student...' value='' />
                                                {students.map((studentItem) => (
                                                    <Picker.Item
                                                        key={studentItem.id}
                                                        label={studentItem.student?.fullname || 'Student'}
                                                        value={String(studentItem.student?.id || '')}
                                                    />
                                                ))}
                                            </Picker>
                                        </View>
                                        <TouchableOpacity style={styles.assignBtn} onPress={() => handleAssignStudentToGroup(group.id)}>
                                            <Text style={styles.assignBtnText}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : null}
                    </View>
                ))
            ) : (
                <View style={styles.card}>
                    <View style={styles.cardBody}>
                        <Text style={styles.emptyText}>No group classes yet. Click "Create Group" to get started.</Text>
                    </View>
                </View>
            )}
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
    infoMsg: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    createCard: {
        marginBottom: 14,
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
        paddingVertical: 12,
    },
    cardHeaderRow: {
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 8,
    },
    groupHeaderLeft: {
        gap: 6,
    },
    groupName: {
        color: '#1a2332',
        fontSize: 17,
        fontWeight: '700',
    },
    groupMeta: {
        color: '#64748b',
        fontSize: 12,
    },
    badgeActive: {
        alignSelf: 'flex-start',
        backgroundColor: '#34c759',
        color: '#fff',
        fontSize: 11,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    badgeInactive: {
        alignSelf: 'flex-start',
        backgroundColor: '#6b7280',
        color: '#fff',
        fontSize: 11,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    groupActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionBtnInfo: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0ea5e9',
    },
    actionBtnInfoText: {
        color: '#0ea5e9',
        fontSize: 12,
        fontWeight: '600',
    },
    actionBtnPrimary: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2563eb',
    },
    actionBtnPrimaryText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '600',
    },
    actionBtnDanger: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    actionBtnDangerText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
    },
    cardBodyCompact: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    groupDescription: {
        color: '#475569',
        fontSize: 12,
    },
    groupSchedule: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 4,
    },
    expandedBody: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 14,
    },
    memberBlock: {
        gap: 8,
    },
    memberTitle: {
        color: '#1e293b',
        fontSize: 14,
        fontWeight: '700',
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    memberName: {
        color: '#334155',
        fontSize: 13,
        flex: 1,
    },
    removeBtn: {
        borderWidth: 1,
        borderColor: '#ef4444',
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    removeBtnText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '600',
    },
    emptySubText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    assignRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pickerWrap: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    assignBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    assignBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    inputLabel: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        color: '#1e293b',
        fontSize: 13,
        marginBottom: 4,
    },
    inputMultiline: {
        minHeight: 72,
        textAlignVertical: 'top',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
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
    secondaryBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#94a3b8',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 24,
    },
})

export default SchoolGroupClasses
