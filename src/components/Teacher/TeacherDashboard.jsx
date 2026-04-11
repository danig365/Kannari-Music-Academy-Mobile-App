import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherDashboard = () => {
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [dashbarData, setDashbarData] = useState([])
  const [teacherId, setTeacherId] = useState(null)
  const isSmall = width < 420

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
      axios.get(baseUrl+'/teacher/dashboard/'+teacherId)
      .then((res)=>{
        setDashbarData(res.data)
      })
    }catch(error){
      console.log(error)
    }
  },[teacherId]);

  return (
    <ScrollView contentContainerStyle={styles.pageWrapper}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleBar} />
            <Text style={[styles.title, isSmall && styles.titleSmall]}>Dashboard</Text>
          </View>
          <Text style={styles.subtitle}>Your teaching snapshot at a glance</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconCourses]}>
              <Text style={styles.iconText}>📚</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Courses</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherMyCourses')}>
                <Text style={styles.statValue}>{dashbarData.total_teacher_course || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconStudents]}>
              <Text style={styles.iconText}>👥</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Students</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherMyUsers')}>
                <Text style={styles.statValue}>{dashbarData.total_teacher_students || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconChapters]}>
              <Text style={styles.iconText}>📝</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Chapters</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherMyCourses')}>
                <Text style={styles.statValue}>{dashbarData.total_teacher_chapters || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  pageWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 0,
  },
  header: {
    marginBottom: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleBar: {
    width: 4,
    height: 24,
    backgroundColor: '#4285f4',
    borderRadius: 2,
    marginRight: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1f2937',
  },
  titleSmall: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 16,
  },
  statsGrid: {
    gap: 18,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4285f4',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconCourses: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  statIconStudents: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statIconChapters: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  iconText: {
    fontSize: 30,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 44,
  },
})

export default TeacherDashboard
