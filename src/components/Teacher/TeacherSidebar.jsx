import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useRoute } from '@react-navigation/native'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { API_BASE_URL } from '../../config'
import { Bootstrap } from '../shared/BootstrapIcon'

const TeacherSidebar = ({ isOpen = false, setIsOpen = null, isMobile = false, onNavigate = null }) => {
  const navigation = useNavigation()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const footerBottomInset = Math.max(insets.bottom, 10)

  const [teacherName, setTeacherName] = useState(null)
  const [teacherEmail, setTeacherEmail] = useState(null)
  const [teacherQualification, setTeacherQualification] = useState(null)
  const [teacherProfileImg, setTeacherProfileImg] = useState(null)
  const [teacherId, setTeacherId] = useState(null)

  useEffect(() => {
    const loadStoredData = async () => {
      const storedTeacherId = await AsyncStorage.getItem('teacherId')
      const storedTeacherName = await AsyncStorage.getItem('teacherName')
      const storedTeacherEmail = await AsyncStorage.getItem('teacherEmail')
      const storedTeacherQualification = await AsyncStorage.getItem('teacherQualification')
      const storedTeacherProfileImg = await AsyncStorage.getItem('teacherProfileImg')

      setTeacherId(storedTeacherId)
      setTeacherName(storedTeacherName)
      setTeacherEmail(storedTeacherEmail)
      setTeacherQualification(storedTeacherQualification)
      setTeacherProfileImg(storedTeacherProfileImg)
    }

    loadStoredData()
  }, [])

  useEffect(() => {
    if (teacherId) {
      const fetchTeacherData = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/teacher/${teacherId}`)
          setTeacherName(response.data.full_name)
          setTeacherEmail(response.data.email)
          setTeacherQualification(response.data.qualification)
          if (response.data.profile_img) {
            setTeacherProfileImg(response.data.profile_img)
            await AsyncStorage.setItem('teacherProfileImg', response.data.profile_img)
          }

          if (response.data.full_name) await AsyncStorage.setItem('teacherName', response.data.full_name)
          if (response.data.email) await AsyncStorage.setItem('teacherEmail', response.data.email)
          if (response.data.qualification) await AsyncStorage.setItem('teacherQualification', response.data.qualification)
        } catch (error) {
          console.log('Error fetching teacher data:', error)
        }
      }
      fetchTeacherData()
    }
  }, [teacherId])

  const currentPath = useMemo(() => {
    return route?.params?.path || route?.name || ''
  }, [route])

  const isActive = (path) => {
    if (!currentPath) return false
    return currentPath === path
  }

  const startsWithPath = (pathPrefix) => {
    if (!currentPath) return false
    return typeof currentPath === 'string' && currentPath.startsWith(pathPrefix)
  }

  const handleNavClick = (path) => {
    if (isMobile) {
      if (setIsOpen) {
        setIsOpen(false)
      }

      if (onNavigate) {
        onNavigate(path)
      } else {
        navigation.navigate(path)
      }
      return
    }

    if (onNavigate) {
      onNavigate(path)
    } else {
      navigation.navigate(path)
    }
  }

  const navItems = [
    { key: 'overview', label: 'Overview', icon: 'speedometer2', path: '/teacher/overview', altPath: '/teacher/dashboard' },
    { key: 'students', label: 'Students', icon: 'people', path: '/teacher/students' },
    { key: 'course', label: 'Course Management', icon: 'book', path: '/teacher/course-management', startsWith: '/teacher/course-management/' },
    { key: 'audio', label: 'Audio Messages', icon: 'mic', path: '/teacher/audio-messages' },
    { key: 'text', label: 'Text Messages', icon: 'chat-dots', path: '/teacher/text-messages' },
    // { key: 'assignments', label: 'Create Assignments', icon: 'clipboard-plus', path: '/teacher/create-assignments' },
    { key: 'reviews', label: 'Assignment Reviews', icon: 'check-circle', path: '/teacher/assignment-reviews' },
    { key: 'profile', label: 'Profile Settings', icon: 'person-circle', path: '/teacher/profile-setting' },
  ]

  return (
    <View style={[styles.sidebar, { width: isMobile ? '100%' : 260 }]}> 
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoWrap}>
            <Bootstrap name="music-note-beamed" size={22} color="white" />
          </View>
          <View>
            <Text style={styles.brandTitle}>Kannari Music Academy</Text>
            <Text style={styles.brandSubtitle}>Teacher Portal</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContent}>
        {navItems.map((item) => {
          const active = isActive(item.path) || isActive(item.altPath) || (item.startsWith ? startsWithPath(item.startsWith) : false)
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => handleNavClick(item.path)}
              style={[styles.navItem, active ? styles.navItemActive : null]}
            >
              <Bootstrap name={item.icon} size={16} color={active ? '#fff' : '#8b92a7'} />
              <Text style={[styles.navLabel, active ? styles.navTextActive : null]}>{item.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 + footerBottomInset }]}>
        <View style={styles.teacherRow}>
          {teacherProfileImg ? (
            <Image source={{ uri: teacherProfileImg }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{teacherName ? teacherName.substring(0, 2).toUpperCase() : 'TC'}</Text>
            </View>
          )}

          <View style={styles.teacherMeta}>
            <Text numberOfLines={1} style={styles.teacherName}>
              {teacherName || teacherEmail?.split('@')[0] || 'Teacher'}
            </Text>
            <Text numberOfLines={1} style={styles.teacherEmail}>
              {teacherEmail || 'educator@email.com'}
            </Text>
            {!!teacherQualification && (
              <Text numberOfLines={1} style={styles.teacherQualification}>
                {teacherQualification}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => handleNavClick('/teacher/profile-setting')}>
            <Text style={styles.footerBtnText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerBtn} onPress={() => handleNavClick('/teacher/logout')}>
            <Text style={styles.footerLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#0f1624',
    height: '100%',
    maxHeight: '100%',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285f4',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingVertical: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    gap: 10,
  },
  navItemActive: {
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    borderLeftColor: '#4285f4',
  },
  navItemPurpleActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderLeftColor: '#8b5cf6',
  },
  navItemGreenActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderLeftColor: '#22c55e',
  },
  navLabel: {
    fontSize: 14,
    color: '#8b92a7',
    flex: 1,
  },
  navTextActive: {
    color: '#fff',
  },
  chatTag: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.2)',
    color: '#a78bfa',
    fontWeight: '600',
  },
  divider: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  teacherMeta: {
    flex: 1,
  },
  teacherName: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  teacherEmail: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 1,
  },
  teacherQualification: {
    color: '#8b92a7',
    fontSize: 10,
    marginTop: 1,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  footerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footerBtnText: {
    color: '#8b92a7',
    fontSize: 13,
  },
  footerLogoutText: {
    color: '#ef4444',
    fontSize: 13,
  },
})

export default TeacherSidebar
