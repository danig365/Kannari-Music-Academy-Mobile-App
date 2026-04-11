import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
import * as DocumentPicker from 'expo-document-picker'
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { API_BASE_URL } from '../../config'

const SchoolGroupDetail = ({ groupId, onBack }) => {
  const baseUrl = API_BASE_URL

  const [schoolId, setSchoolId] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const chatScrollRef = useRef(null)

  const [announcements, setAnnouncements] = useState([])
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'normal' })

  const [resources, setResources] = useState([])
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', file: null, link_url: '' })

  const [sessions, setSessions] = useState([])
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    session_type: 'practice',
    scheduled_start: '',
    scheduled_end: '',
    max_participants: 20,
  })

  const [groupAssignments, setGroupAssignments] = useState([])

  useEffect(() => {
    const init = async () => {
      const id = await AsyncStorage.getItem('schoolId')
      setSchoolId(id)
    }
    init()
  }, [])

  useEffect(() => {
    if (groupId) fetchGroupDetail()
  }, [groupId])

  useEffect(() => {
    if (!groupId) return
    if (activeTab === 'chat') fetchMessages()
    if (activeTab === 'announcements') fetchAnnouncements()
    if (activeTab === 'resources') fetchResources()
    if (activeTab === 'sessions') fetchSessions()
    if (activeTab === 'assignments') fetchGroupAssignments()
  }, [activeTab, groupId])

  const fetchGroupDetail = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${baseUrl}/group-class/${groupId}/`)
      setGroup(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/messages/`)
      setMessages(Array.isArray(res.data) ? res.data : [])
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (err) {
      console.error(err)
    }
  }

  const sendGroupMessage = async () => {
    if (!newMsg.trim() || !schoolId) return
    setSendingMsg(true)
    try {
      await axios.post(`${baseUrl}/group/${groupId}/messages/`, {
        sender_type: 'school',
        sender_id: schoolId,
        content: newMsg.trim(),
      })
      setNewMsg('')
      await fetchMessages()
    } catch (err) {
      Alert.alert('Error', 'Failed to send message')
    }
    setSendingMsg(false)
  }

  const togglePin = async (msgId) => {
    try {
      await axios.post(`${baseUrl}/group-message/${msgId}/toggle-pin/`)
      await fetchMessages()
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/announcements/`)
      setAnnouncements(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    }
  }

  const saveAnnouncement = async () => {
    if (!announcementForm.title.trim() || !schoolId) return
    try {
      await axios.post(`${baseUrl}/group/${groupId}/announcements/`, {
        ...announcementForm,
        author_type: 'school',
        author_id: schoolId,
      })
      Alert.alert('Success', 'Announcement posted!')
      setShowAnnouncementForm(false)
      setAnnouncementForm({ title: '', content: '', priority: 'normal' })
      await fetchAnnouncements()
    } catch (err) {
      Alert.alert('Error', 'Failed to post announcement')
    }
  }

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/resources/`)
      setResources(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    }
  }

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: false,
      copyToCacheDirectory: true,
    })
    if (result.canceled) return null
    const file = result.assets?.[0]
    if (!file) return null
    return {
      uri: file.uri,
      name: file.name || 'resource_file',
      type: file.mimeType || 'application/octet-stream',
    }
  }

  const saveResource = async () => {
    if (!resourceForm.title.trim() || !schoolId) return

    const formData = new FormData()
    formData.append('title', resourceForm.title)
    formData.append('description', resourceForm.description)
    if (resourceForm.file) formData.append('file', resourceForm.file)
    if (resourceForm.link_url) formData.append('link_url', resourceForm.link_url)
    formData.append('uploaded_by_type', 'school')
    formData.append('uploaded_by_id', schoolId)

    try {
      await axios.post(`${baseUrl}/group/${groupId}/resources/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      Alert.alert('Success', 'Resource added!')
      setShowResourceForm(false)
      setResourceForm({ title: '', description: '', file: null, link_url: '' })
      await fetchResources()
    } catch (err) {
      Alert.alert('Error', 'Failed to add resource')
    }
  }

  const openResource = async (resource) => {
    const target = resource.file || resource.link_url
    if (!target) return
    try {
      await Linking.openURL(target)
    } catch {
      Alert.alert('Error', 'Unable to open resource')
    }
  }

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/sessions/`)
      setSessions(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    }
  }

  const saveSession = async () => {
    if (!sessionForm.title.trim() || !sessionForm.scheduled_start || !schoolId) return
    try {
      await axios.post(`${baseUrl}/group/${groupId}/sessions/`, {
        ...sessionForm,
        created_by_type: 'school',
        created_by_id: schoolId,
      })
      Alert.alert('Success', 'Session scheduled!')
      setShowSessionForm(false)
      setSessionForm({
        title: '',
        description: '',
        session_type: 'practice',
        scheduled_start: '',
        scheduled_end: '',
        max_participants: 20,
      })
      await fetchSessions()
    } catch (err) {
      Alert.alert('Error', 'Failed to create session')
    }
  }

  const goLiveSession = async (sessionId) => {
    try {
      await axios.post(`${baseUrl}/group-session/${sessionId}/go-live/`)
      Alert.alert('Success', 'Session is now live!')
      await fetchSessions()
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed')
    }
  }

  const endSession = async (sessionId) => {
    try {
      await axios.post(`${baseUrl}/group-session/${sessionId}/end/`)
      await fetchSessions()
    } catch (err) {
      console.error(err)
    }
  }

  const fetchGroupAssignments = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/assignments/`)
      setGroupAssignments(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    }
  }

  const tabs = [
    { key: 'chat', label: 'Chat' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'resources', label: 'Resources' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'assignments', label: 'Assignments' },
  ]

  const priorityColors = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#6b7280' }

  const timeAgo = (dateInput) => {
    const diff = Math.floor((Date.now() - new Date(dateInput)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateInput).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.groupTitle}>{group?.title || 'Group'}</Text>
          <Text style={styles.groupSubtitle}>
            {group?.student_count || 0} students • {group?.teacher_name || 'Teacher'}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, active ? styles.tabBtnActive : null]}
            >
              <Text style={[styles.tabBtnText, active ? styles.tabBtnTextActive : null]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {activeTab === 'chat' && (
        <View style={styles.panelCard}>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages yet</Text>
            ) : (
              messages.map((msg) => (
                <View key={msg.id} style={[styles.messageItem, msg.is_pinned ? styles.pinnedMessage : null]}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor:
                          msg.sender_type === 'teacher'
                            ? '#6366f1'
                            : msg.sender_type === 'student'
                            ? '#3b82f6'
                            : msg.sender_type === 'parent'
                            ? '#f59e0b'
                            : '#ef4444',
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {(msg.sender_name_display || msg.sender_name || 'U').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.messageBody}>
                    <View style={styles.messageMetaRow}>
                      <Text style={styles.messageSender}>{msg.sender_name_display || msg.sender_name}</Text>
                      <Text style={styles.messageType}>{msg.sender_type}</Text>
                      <Text style={styles.messageTime}>{timeAgo(msg.created_at)}</Text>
                      {msg.is_pinned ? <Text style={styles.pin}>📌</Text> : null}
                    </View>
                    <Text style={styles.messageText}>{msg.content}</Text>
                  </View>
                  <TouchableOpacity onPress={() => togglePin(msg.id)}>
                    <Text style={styles.pinToggle}>{msg.is_pinned ? 'Unpin' : 'Pin'}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              value={newMsg}
              onChangeText={setNewMsg}
              placeholder='Type a message...'
              style={styles.chatInput}
            />
            <TouchableOpacity
              onPress={sendGroupMessage}
              disabled={!newMsg.trim() || sendingMsg}
              style={[styles.sendBtn, !newMsg.trim() || sendingMsg ? styles.sendBtnDisabled : null]}
            >
              <Text style={styles.sendBtnText}>{sendingMsg ? '...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'announcements' && (
        <ScrollView style={styles.tabScroll}>
          <View style={styles.tabTopAction}>
            <TouchableOpacity
              onPress={() => setShowAnnouncementForm(!showAnnouncementForm)}
              style={[styles.toggleBtn, showAnnouncementForm ? styles.toggleBtnDanger : styles.toggleBtnPrimary]}
            >
              <Text style={styles.toggleBtnText}>{showAnnouncementForm ? 'Cancel' : 'New'}</Text>
            </TouchableOpacity>
          </View>

          {showAnnouncementForm ? (
            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder='Announcement title'
                value={announcementForm.title}
                onChangeText={(text) => setAnnouncementForm((prev) => ({ ...prev, title: text }))}
              />
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={announcementForm.priority}
                  onValueChange={(value) => setAnnouncementForm((prev) => ({ ...prev, priority: value }))}
                >
                  <Picker.Item label='Low Priority' value='low' />
                  <Picker.Item label='Normal' value='normal' />
                  <Picker.Item label='High' value='high' />
                  <Picker.Item label='Urgent' value='urgent' />
                </Picker>
              </View>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder='Announcement content...'
                value={announcementForm.content}
                onChangeText={(text) => setAnnouncementForm((prev) => ({ ...prev, content: text }))}
              />
              <TouchableOpacity onPress={saveAnnouncement} style={styles.primarySmallBtn}>
                <Text style={styles.primarySmallBtnText}>Post Announcement</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {announcements.length === 0 ? (
            <Text style={styles.emptyBoxText}>No announcements yet</Text>
          ) : (
            announcements.map((announcement) => (
              <View
                key={announcement.id}
                style={[
                  styles.itemCard,
                  { borderLeftColor: priorityColors[announcement.priority] || '#3b82f6' },
                ]}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle}>{announcement.title}</Text>
                  <Text
                    style={[
                      styles.priorityText,
                      { color: priorityColors[announcement.priority] || '#3b82f6' },
                    ]}
                  >
                    {announcement.priority}
                  </Text>
                </View>
                <Text style={styles.itemContent}>{announcement.content}</Text>
                <Text style={styles.itemFooter}>
                  {announcement.author_name || 'School'} • {timeAgo(announcement.created_at)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'resources' && (
        <ScrollView style={styles.tabScroll}>
          <View style={styles.tabTopAction}>
            <TouchableOpacity
              onPress={() => setShowResourceForm(!showResourceForm)}
              style={[styles.toggleBtn, showResourceForm ? styles.toggleBtnDanger : styles.toggleBtnPrimary]}
            >
              <Text style={styles.toggleBtnText}>{showResourceForm ? 'Cancel' : 'Add Resource'}</Text>
            </TouchableOpacity>
          </View>

          {showResourceForm ? (
            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder='Title'
                value={resourceForm.title}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, title: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder='Link URL (optional)'
                value={resourceForm.link_url}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, link_url: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder='Description'
                value={resourceForm.description}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, description: text }))}
              />
              <TouchableOpacity
                style={styles.secondaryUploadBtn}
                onPress={async () => {
                  const file = await pickFile()
                  if (file) setResourceForm((prev) => ({ ...prev, file }))
                }}
              >
                <Text style={styles.secondaryUploadBtnText}>{resourceForm.file?.name || 'Pick file (optional)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveResource} style={styles.primarySmallBtn}>
                <Text style={styles.primarySmallBtnText}>Upload Resource</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {resources.length === 0 ? (
            <Text style={styles.emptyBoxText}>No resources yet</Text>
          ) : (
            resources.map((resource) => (
              <View key={resource.id} style={styles.itemCardPlain}>
                <View style={styles.rowBetween}>
                  <View style={styles.resourceMain}>
                    <Text style={styles.itemTitle}>{resource.title}</Text>
                    {!!resource.description && <Text style={styles.itemContent}>{resource.description}</Text>}
                    <Text style={styles.itemFooter}>
                      {resource.teacher_name || 'School'} • {timeAgo(resource.created_at)}
                    </Text>
                  </View>
                  {resource.file || resource.link_url ? (
                    <TouchableOpacity style={styles.openBtn} onPress={() => openResource(resource)}>
                      <Text style={styles.openBtnText}>{resource.file ? 'Download' : 'Open'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'sessions' && (
        <ScrollView style={styles.tabScroll}>
          <View style={styles.tabTopAction}>
            <TouchableOpacity
              onPress={() => setShowSessionForm(!showSessionForm)}
              style={[styles.toggleBtn, showSessionForm ? styles.toggleBtnDanger : styles.toggleBtnPrimary]}
            >
              <Text style={styles.toggleBtnText}>{showSessionForm ? 'Cancel' : 'Schedule Session'}</Text>
            </TouchableOpacity>
          </View>

          {showSessionForm ? (
            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder='Session title'
                value={sessionForm.title}
                onChangeText={(text) => setSessionForm((prev) => ({ ...prev, title: text }))}
              />
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={sessionForm.session_type}
                  onValueChange={(value) => setSessionForm((prev) => ({ ...prev, session_type: value }))}
                >
                  <Picker.Item label='Practice' value='practice' />
                  <Picker.Item label='Masterclass' value='masterclass' />
                  <Picker.Item label='Recital' value='recital' />
                  <Picker.Item label='Workshop' value='workshop' />
                  <Picker.Item label='Other' value='other' />
                </Picker>
              </View>
              <TextInput
                style={styles.input}
                keyboardType='numeric'
                placeholder='Max participants'
                value={String(sessionForm.max_participants)}
                onChangeText={(text) => setSessionForm((prev) => ({ ...prev, max_participants: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder='Start (e.g. 2026-03-31T16:00)'
                value={sessionForm.scheduled_start}
                onChangeText={(text) => setSessionForm((prev) => ({ ...prev, scheduled_start: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder='End (optional)'
                value={sessionForm.scheduled_end}
                onChangeText={(text) => setSessionForm((prev) => ({ ...prev, scheduled_end: text }))}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder='Description'
                value={sessionForm.description}
                onChangeText={(text) => setSessionForm((prev) => ({ ...prev, description: text }))}
              />
              <TouchableOpacity onPress={saveSession} style={styles.primarySmallBtn}>
                <Text style={styles.primarySmallBtnText}>Create Session</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {sessions.length === 0 ? (
            <Text style={styles.emptyBoxText}>No sessions scheduled</Text>
          ) : (
            sessions.map((session) => (
              <View key={session.id} style={styles.itemCardPlain}>
                <View style={styles.rowBetweenWrap}>
                  <View style={styles.sessionMain}>
                    <Text style={styles.itemTitle}>{session.title}</Text>
                    <Text style={styles.itemFooter}>
                      {session.session_type} • {session.scheduled_date || ''} {session.formatted_time || session.scheduled_time || ''}
                    </Text>
                    {session.description ? <Text style={styles.itemContent}>{session.description}</Text> : null}
                  </View>
                  <View style={styles.sessionActions}>
                    <Text style={styles.sessionStatus}>{session.status}</Text>
                    {session.status === 'scheduled' ? (
                      <TouchableOpacity style={styles.liveBtn} onPress={() => goLiveSession(session.id)}>
                        <Text style={styles.liveBtnText}>Go Live</Text>
                      </TouchableOpacity>
                    ) : null}
                    {session.status === 'live' ? (
                      <TouchableOpacity style={styles.endBtn} onPress={() => endSession(session.id)}>
                        <Text style={styles.endBtnText}>End</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'assignments' && (
        <ScrollView style={styles.tabScroll}>
          {groupAssignments.length === 0 ? (
            <Text style={styles.emptyBoxText}>No group assignments yet. Create assignments from the main Assignments page.</Text>
          ) : (
            groupAssignments.map((assignment) => (
              <View key={assignment.id} style={styles.itemCardPlain}>
                <View style={styles.rowBetweenWrap}>
                  <View style={styles.assignmentMain}>
                    <Text style={styles.itemTitle}>
                      {assignment.display_title || assignment.title || assignment.lesson_title || 'Assignment'}
                    </Text>
                    <Text style={styles.itemFooter}>
                      {assignment.submission_type_display || assignment.submission_type} • Due: {assignment.due_date || 'No due date'} • Max: {assignment.max_points} pts
                    </Text>
                    {assignment.description ? <Text style={styles.itemContent}>{assignment.description}</Text> : null}
                  </View>
                  <View style={styles.assignmentBadges}>
                    <Text style={styles.statusPill}>{assignment.status || 'assigned'}</Text>
                    {assignment.submission_count !== undefined ? (
                      <Text style={styles.countPill}>{assignment.submission_count} submissions</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loaderText: {
    color: '#64748b',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  backBtnText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '700',
  },
  groupTitle: {
    margin: 0,
    fontWeight: '700',
    fontSize: 18,
    color: '#1e293b',
  },
  groupSubtitle: {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
  },
  tabBar: {
    gap: 8,
    marginBottom: 12,
    paddingVertical: 2,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  tabBtnActive: {
    backgroundColor: '#1e293b',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  panelCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    minHeight: 420,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 12,
    gap: 8,
  },
  messageItem: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  pinnedMessage: {
    backgroundColor: '#fefce8',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  messageBody: {
    flex: 1,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  messageSender: {
    fontWeight: '600',
    fontSize: 13,
    color: '#1e293b',
  },
  messageType: {
    fontSize: 10,
    color: '#94a3b8',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    textTransform: 'capitalize',
  },
  messageTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  pin: {
    fontSize: 11,
  },
  messageText: {
    fontSize: 14,
    color: '#334155',
    marginTop: 2,
  },
  pinToggle: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
    alignSelf: 'center',
  },
  chatInputRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  sendBtn: {
    minWidth: 56,
    height: 38,
    borderRadius: 19,
    borderWidth: 0,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabScroll: {
    flex: 1,
  },
  tabTopAction: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  toggleBtnPrimary: {
    backgroundColor: '#6366f1',
  },
  toggleBtnDanger: {
    backgroundColor: '#ef4444',
  },
  toggleBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  primarySmallBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  primarySmallBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryUploadBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryUploadBtnText: {
    fontSize: 12,
    color: '#475569',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    paddingVertical: 24,
    fontSize: 14,
  },
  emptyBoxText: {
    textAlign: 'center',
    padding: 28,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    color: '#64748b',
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  itemCardPlain: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowBetweenWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemTitle: {
    margin: 0,
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
    flexShrink: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemContent: {
    marginTop: 8,
    fontSize: 13,
    color: '#475569',
  },
  itemFooter: {
    marginTop: 8,
    fontSize: 11,
    color: '#94a3b8',
  },
  resourceMain: {
    flex: 1,
  },
  openBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  openBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionMain: {
    flex: 1,
    minWidth: 180,
  },
  sessionActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  sessionStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  liveBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  liveBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  endBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  endBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  assignmentMain: {
    flex: 1,
    minWidth: 180,
  },
  assignmentBadges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    overflow: 'hidden',
  },
  countPill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    overflow: 'hidden',
  },
})

export default SchoolGroupDetail
