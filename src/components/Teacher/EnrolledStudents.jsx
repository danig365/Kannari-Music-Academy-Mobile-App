import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRoute } from '@react-navigation/native'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const EnrolledStudents = () => {
            const route = useRoute()
            const [studentData, setStudentData]=useState([]);
            const [courseData, setCourseData]=useState([]);
            const [teacherId, setTeacherId] = useState(null)
            const course_id = route.params?.course_id

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
                if (!course_id) return

                try{
                        axios.get(baseUrl+'/fetch-enrolled-students/'+course_id)
                        .then((res)=>{
                                setStudentData(res.data)
                        });
                }catch(error){
                        console.log(error)
                }
            },[course_id]);

            useEffect(()=>{
                if (!teacherId) return

                try{
                        axios.get(baseUrl+'/teacher-course/'+teacherId)
                        .then((res)=>{
                                setCourseData(res.data)
                        });
                }catch(error){
                        console.log(error)
                }
            },[teacherId]);

  return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.cardHeader}>👥 Enrolled List</Text>
                <View style={styles.cardBody}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={styles.tableHeader}>Profile</Text>
                        <Text style={styles.tableHeader}>Name</Text>
                        <Text style={styles.tableHeader}>Email</Text>
                        <Text style={styles.tableHeader}>Interest</Text>
                    </View>

                    {studentData.map((row, index) => (
                        <View key={index} style={styles.studentRow}>
                            {row.student?.profile_img ? (
                                <Image source={{ uri: row.student.profile_img }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {(row.student?.fullname || '?').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.studentName}>{row.student?.fullname}</Text>
                            <Text style={styles.studentEmail}>{row.student?.email}</Text>
                            <Text style={styles.studentInterest}>{row.student?.interseted_categories}</Text>
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
    cardHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
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
    studentRow: {
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
    studentEmail: {
        textAlign: 'center',
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
    },
    studentInterest: {
        textAlign: 'center',
        fontSize: 13,
        color: '#6b7280',
    },
})

export default EnrolledStudents
