import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Audio } from 'expo-av'
import { Picker } from '@react-native-picker/picker'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { API_BASE_URL } from '../../config'

const AudioRecorder = ({ teacherId, students = [], onMessageSent = null }) => {
  const baseUrl = API_BASE_URL
  const [isRecording, setIsRecording] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [duration, setDuration] = useState(0)
  const [sending, setSending] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [title, setTitle] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  const recordingRef = useRef(null)
  const timerRef = useRef(null)
  const soundRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {})
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {})
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Microphone Access', 'Please allow microphone access to record audio.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await recording.startAsync()

      recordingRef.current = recording
      setIsRecording(true)
      setDuration(0)
      setAudioFile(null)

      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      Alert.alert('Microphone Access', 'Unable to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = async () => {
    if (!recordingRef.current || !isRecording) return

    try {
      clearInterval(timerRef.current)
      await recordingRef.current.stopAndUnloadAsync()
      const uri = recordingRef.current.getURI()
      recordingRef.current = null
      setIsRecording(false)

      if (uri) {
        setAudioFile({
          uri,
          name: `audio_message_${Date.now()}.m4a`,
          type: 'audio/m4a',
        })
      }
    } catch (err) {
      setIsRecording(false)
      Alert.alert('Error', 'Unable to stop recording.')
    }
  }

  const playRecording = async () => {
    if (!audioFile?.uri) return
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioFile.uri },
        { shouldPlay: true }
      )
      soundRef.current = sound
      setIsPlaying(true)
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false)
          sound.unloadAsync().catch(() => {})
          soundRef.current = null
        }
      })
    } catch (err) {
      Alert.alert('Error', 'Unable to play recording.')
    }
  }

  const stopPlayback = async () => {
    if (!soundRef.current) return
    try {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
      setIsPlaying(false)
    } catch (err) {
      setIsPlaying(false)
    }
  }

  const discardRecording = async () => {
    await stopPlayback()
    setAudioFile(null)
    setDuration(0)
  }

  const sendMessage = async () => {
    if (!audioFile || !selectedStudent) {
      Alert.alert('Missing Info', 'Please select a student and record audio first.')
      return
    }

    setSending(true)
    const formData = new FormData()
    formData.append('teacher', String(teacherId))
    formData.append('student', String(selectedStudent))
    formData.append('title', title || `Audio Message - ${new Date().toLocaleDateString()}`)
    formData.append('audio_file', audioFile)
    formData.append('duration_seconds', String(duration))

    try {
      await axios.post(`${baseUrl}/teacher/${teacherId}/audio-messages/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      Alert.alert('Sent!', 'Audio message sent to student.')
      await discardRecording()
      setTitle('')
      setSelectedStudent('')
      if (onMessageSent) onMessageSent()
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send audio message'
      if (err.response?.data?.requires_upgrade) {
        Alert.alert('Limit Reached', msg)
      } else {
        Alert.alert('Error', msg)
      }
    }
    setSending(false)
  }

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`

  return (
    <View style={styles.card}>
      <View style={styles.headerWrap}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🎤</Text>
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Send Audio Message</Text>
          <Text style={styles.subtitle}>Record and send audio feedback to your students</Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedStudent} onValueChange={(value) => setSelectedStudent(value)}>
            <Picker.Item label='Select student...' value='' />
            {students.map((studentItem) => {
              const value = String(studentItem.student?.id || studentItem.id || '')
              const label =
                studentItem.student?.fullname || studentItem.fullname || studentItem.student_name || 'Student'
              return <Picker.Item key={value || Math.random().toString()} label={label} value={value} />
            })}
          </Picker>
        </View>

        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder='Message title (optional)'
        />
      </View>

      <View style={styles.recordingWrap}>
        <Text style={[styles.timerText, isRecording ? styles.timerRecording : null]}>{formatTime(duration)}</Text>
        {isRecording ? <Text style={styles.recordingText}>● Recording...</Text> : null}
        {!isRecording && audioFile ? (
          <Text style={styles.recordedText}>Recorded audio ready to preview and send</Text>
        ) : null}
      </View>

      <View style={styles.controlsWrap}>
        {!isRecording && !audioFile ? (
          <TouchableOpacity style={[styles.btn, styles.recordBtn]} onPress={startRecording}>
            <Text style={styles.btnText}>Start Recording</Text>
          </TouchableOpacity>
        ) : null}

        {isRecording ? (
          <TouchableOpacity style={[styles.btn, styles.stopBtn]} onPress={stopRecording}>
            <Text style={styles.btnText}>Stop</Text>
          </TouchableOpacity>
        ) : null}

        {audioFile && !isRecording ? (
          <>
            <TouchableOpacity style={[styles.btn, styles.discardBtn]} onPress={discardRecording}>
              <Text style={styles.discardBtnText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.rerecordBtn]} onPress={startRecording}>
              <Text style={styles.rerecordBtnText}>Re-record</Text>
            </TouchableOpacity>

            {!isPlaying ? (
              <TouchableOpacity style={[styles.btn, styles.previewBtn]} onPress={playRecording}>
                <Text style={styles.btnText}>Preview</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btn, styles.stopPreviewBtn]} onPress={stopPlayback}>
                <Text style={styles.btnText}>Stop Preview</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btn, styles.sendBtn, sending ? styles.sendBtnDisabled : null]}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? <ActivityIndicator color='#fff' size='small' /> : <Text style={styles.btnText}>Send</Text>}
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  inputRow: {
    gap: 10,
    marginBottom: 16,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  recordingWrap: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  timerRecording: {
    color: '#ef4444',
  },
  recordingText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
  recordedText: {
    color: '#64748b',
    fontSize: 13,
  },
  controlsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  recordBtn: {
    backgroundColor: '#ef4444',
  },
  stopBtn: {
    backgroundColor: '#64748b',
  },
  discardBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  discardBtnText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  rerecordBtn: {
    backgroundColor: '#fef3c7',
  },
  rerecordBtnText: {
    color: '#92400e',
    fontWeight: '600',
    fontSize: 14,
  },
  previewBtn: {
    backgroundColor: '#2563eb',
  },
  stopPreviewBtn: {
    backgroundColor: '#475569',
  },
  sendBtn: {
    backgroundColor: '#22c55e',
    minWidth: 90,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
})

export default AudioRecorder
