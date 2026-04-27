import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyUsers = () => {
            const [studentData, setStudentData]=useState([]);
            const [teacherId, setTeacherId] = useState(null)

            useEffect(() => {
                const getTeacherId = async () => {
                    try {
                        const id = await AsyncStorage.getItem('teacherId')
                        setTeacherId(id)
                    } catch (error) {
                        console.log(error)
                    }
                }

                getTeacherId()
            }, [])

            useEffect(()=>{
                if (!teacherId) return

                try{
                        axios.get(baseUrl+'/fetch-all-enrolled-students/'+teacherId)
                        .then((res)=>{
                                setStudentData(res.data)
                        });
                }catch(error){
                        console.log(error)
                }
            },[teacherId]);

  return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardHeader}>👥 All Enrolled List</Text>
                    <TouchableOpacity
                        onPress={() => Alert.alert('Info', 'Send Messages action not connected yet.')}
                        style={styles.sendButton}
                    >
                        <Text style={styles.sendButtonText}>Send Messages</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={styles.tableHeader}>Profile</Text>
                        <Text style={styles.tableHeader}>Name</Text>
                        <Text style={styles.tableHeader}>Enrolled In</Text>
                        <Text style={styles.tableHeader}>Action</Text>
                    </View>

                    {studentData.map((row, index) => (
                        <View key={index} style={styles.rowCard}>
                            {row.student?.profile_img ? (
                                <Image source={{ uri: row.student.profile_img }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {(row.student?.username || '?').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.studentName}>{row.student?.username}</Text>
                            <Text style={styles.courseTitle}>{row.course?.title}</Text>

                            <TouchableOpacity
                                onPress={() => Alert.alert('User', row.student?.username || 'Student')}
                                style={styles.actionButton}
                            >
                                <Text style={styles.actionButtonText}>👤</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
  )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
    },
    cardHeaderRow: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    cardHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    sendButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        padding: 12,
    },
    tableHeaderRow: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#f9fafb',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    tableHeader: {
        textAlign: 'center',
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rowCard: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarPlaceholderText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#4b5563',
    },
    studentName: {
        textAlign: 'center',
        fontSize: 15,
        color: '#111827',
        fontWeight: '600',
        marginBottom: 4,
    },
    courseTitle: {
        textAlign: 'center',
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
    },
    actionButton: {
        backgroundColor: '#6b7280',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
})

export default MyUsers
