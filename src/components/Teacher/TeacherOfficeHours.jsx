import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
import { API_BASE_URL } from '../../config';
import {
  getTeacherOfficeHours,
  createTeacherOfficeHours,
  updateTeacherOfficeHours,
  deleteTeacherOfficeHours
} from '../../services/messagingService';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOUR_OPTIONS = [];
for (let h = 0; h <= 23; h++) {
  for (let m = 0; m < 60; m += 30) {
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    HOUR_OPTIONS.push({ value: time, label });
  }
}

const TZ_OFFSET = -(new Date().getTimezoneOffset());

const localToUtc = (localDay, localTime) => {
  const [h, m] = localTime.split(':').map(Number);
  const totalMinutesLocal = h * 60 + m;
  const totalMinutesUtc = totalMinutesLocal - TZ_OFFSET;
  let utcDay = localDay;
  let utcMinutes = totalMinutesUtc;
  if (utcMinutes < 0) {
    utcMinutes += 1440;
    utcDay = (utcDay - 1 + 7) % 7;
  } else if (utcMinutes >= 1440) {
    utcMinutes -= 1440;
    utcDay = (utcDay + 1) % 7;
  }
  const utcH = Math.floor(utcMinutes / 60);
  const utcM = utcMinutes % 60;
  return {
    day: utcDay,
    time: `${String(utcH).padStart(2, '0')}:${String(utcM).padStart(2, '0')}`
  };
};

const utcToLocal = (utcDay, utcTime) => {
  const [h, m] = utcTime.split(':').map(Number);
  const totalMinutesUtc = h * 60 + m;
  const totalMinutesLocal = totalMinutesUtc + TZ_OFFSET;
  let localDay = utcDay;
  let localMinutes = totalMinutesLocal;
  if (localMinutes < 0) {
    localMinutes += 1440;
    localDay = (localDay - 1 + 7) % 7;
  } else if (localMinutes >= 1440) {
    localMinutes -= 1440;
    localDay = (localDay + 1) % 7;
  }
  const localH = Math.floor(localMinutes / 60);
  const localM = localMinutes % 60;
  return {
    day: localDay,
    time: `${String(localH).padStart(2, '0')}:${String(localM).padStart(2, '0')}`
  };
};

const TeacherOfficeHours = () => {
  const [teacherId, setTeacherId] = useState(null)
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_active: true, notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const getTeacherId = async () => {
      try {
        const id = await AsyncStorage.getItem('teacherId')
        setTeacherId(id)
      } catch (e) {
        console.log(e)
      }
    }

    getTeacherId()
  }, [])

  useEffect(() => {
    if (!teacherId) return
    fetchHours();
  }, [teacherId]);

  const seedDefaultHours = async () => {
    const defaults = [0, 1, 2, 3, 4].map(day => {
      const utcStart = localToUtc(day, '09:00');
      const utcEnd = localToUtc(day, '17:00');
      return {
        day_of_week: utcStart.day,
        start_time: utcStart.time,
        end_time: utcEnd.time,
        is_active: true,
        notes: 'Available for lessons & parent messaging'
      };
    });
    for (const payload of defaults) {
      try {
        await createTeacherOfficeHours(teacherId, payload);
      } catch (e) { }
    }
  };

  const fetchHours = async () => {
    setLoading(true);
    try {
      const res = await getTeacherOfficeHours(teacherId);
      let data = Array.isArray(res.data) ? res.data : [];

      if (data.length === 0) {
        await seedDefaultHours();
        const res2 = await getTeacherOfficeHours(teacherId);
        data = Array.isArray(res2.data) ? res2.data : [];
      }

      const localHours = data.map(h => {
        const localStart = utcToLocal(h.day_of_week, h.start_time?.slice(0, 5) || '00:00');
        const localEnd = utcToLocal(h.day_of_week, h.end_time?.slice(0, 5) || '00:00');
        return {
          ...h,
          _utc_day: h.day_of_week,
          _utc_start: h.start_time,
          _utc_end: h.end_time,
          day_of_week: localStart.day,
          start_time: localStart.time,
          end_time: localEnd.time
        };
      });
      setHours(localHours);
    } catch (err) {
      console.error('Error fetching office hours:', err);
    }
    setLoading(false);
  };

  const openAddForm = () => {
    setEditItem(null);
    setForm({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_active: true, notes: '' });
    setShowForm(true);
    setError('');
  };

  const openEditForm = (item) => {
    setEditItem(item);
    setForm({
      day_of_week: item.day_of_week,
      start_time: item.start_time?.slice(0, 5) || '09:00',
      end_time: item.end_time?.slice(0, 5) || '10:00',
      is_active: item.is_active !== false,
      notes: item.notes || ''
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (form.start_time >= form.end_time) {
      setError('End time must be after start time');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const utcStart = localToUtc(form.day_of_week, form.start_time);
      const utcEnd = localToUtc(form.day_of_week, form.end_time);
      const payload = {
        day_of_week: utcStart.day,
        start_time: utcStart.time,
        end_time: utcEnd.time,
        is_active: form.is_active,
        notes: form.notes
      };
      if (editItem) {
        await updateTeacherOfficeHours(editItem.id, payload);
      } else {
        await createTeacherOfficeHours(teacherId, payload);
      }
      await fetchHours();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Slot?', 'Delete this office hour slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeacherOfficeHours(id);
            await fetchHours();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete')
          }
        }
      }
    ])
  };

  const toggleActive = async (item) => {
    try {
      await updateTeacherOfficeHours(item.id, {
        day_of_week: item._utc_day,
        start_time: item._utc_start,
        end_time: item._utc_end,
        is_active: !item.is_active,
        notes: item.notes || ''
      });
      await fetchHours();
    } catch (err) {
      Alert.alert('Error', 'Failed to update')
    }
  };

  const grouped = DAYS_OF_WEEK.reduce((acc, day, idx) => {
    acc[day] = hours.filter(h => h.day_of_week === idx).sort((a, b) => a.start_time?.localeCompare(b.start_time));
    return acc;
  }, {});

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    return new Date(`2000-01-01T${h}:${m}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const dayColors = {
    Monday: '#3b82f6', Tuesday: '#8b5cf6', Wednesday: '#10b981',
    Thursday: '#f59e0b', Friday: '#ef4444', Saturday: '#06b6d4', Sunday: '#ec4899'
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>🕒 Office Hours</Text>
          <Text style={styles.subtitle}>Set your weekly availability for parent/student messaging</Text>
        </View>
        <TouchableOpacity onPress={openAddForm} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Hours</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCardBlue}>
          <Text style={styles.summaryNumberBlue}>{hours.length}</Text>
          <Text style={styles.summaryLabel}>Total Slots</Text>
        </View>
        <View style={styles.summaryCardGreen}>
          <Text style={styles.summaryNumberGreen}>{hours.filter(h => h.is_active).length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryCardRed}>
          <Text style={styles.summaryNumberRed}>{hours.filter(h => !h.is_active).length}</Text>
          <Text style={styles.summaryLabel}>Inactive</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formPanel}>
          <Text style={styles.formTitle}>{editItem ? 'Edit Office Hours' : 'Add Office Hours'}</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.fieldLabel}>Day</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.day_of_week} onValueChange={(value) => setForm({ ...form, day_of_week: value })}>
              {DAYS_OF_WEEK.map((d, idx) => <Picker.Item key={d} label={d} value={idx} />)}
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>Start Time</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.start_time} onValueChange={(value) => setForm({ ...form, start_time: value })}>
              {HOUR_OPTIONS.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>End Time</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.end_time} onValueChange={(value) => setForm({ ...form, end_time: value })}>
              {HOUR_OPTIONS.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={form.notes}
            onChangeText={(text) => setForm({ ...form, notes: text })}
            placeholder='e.g., Available for voice lessons only'
            maxLength={200}
            style={styles.input}
          />

          <TouchableOpacity onPress={() => setForm({ ...form, is_active: !form.is_active })} style={styles.activeRow}>
            <Text style={styles.checkbox}>{form.is_active ? '☑' : '☐'}</Text>
            <Text style={styles.activeLabel}>Active</Text>
          </TouchableOpacity>

          <View style={styles.formButtons}>
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : (editItem ? 'Update' : 'Create')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color='#6366f1' />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : hours.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No office hours set</Text>
          <Text style={styles.emptyText}>Add your weekly availability so parents know when you're available for messaging.</Text>
          <TouchableOpacity onPress={openAddForm} style={styles.firstSlotButton}>
            <Text style={styles.firstSlotButtonText}>+ Add Your First Slot</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.daysWrap}>
          {DAYS_OF_WEEK.map(day => {
            const slots = grouped[day];
            if (slots.length === 0) return null;
            return (
              <View key={day} style={styles.dayCard}>
                <View style={[styles.dayHeader, { backgroundColor: `${dayColors[day]}20` }]}> 
                  <View style={[styles.dayDot, { backgroundColor: dayColors[day] }]} />
                  <Text style={styles.dayTitle}>{day}</Text>
                  <Text style={styles.dayCount}>({slots.length} slot{slots.length > 1 ? 's' : ''})</Text>
                </View>

                {slots.map(slot => (
                  <View key={slot.id} style={styles.slotRow}>
                    <View style={styles.slotLeft}>
                      <View style={[styles.timeBadge, slot.is_active ? styles.timeBadgeActive : styles.timeBadgeInactive]}>
                        <Text style={[styles.timeBadgeText, slot.is_active ? styles.timeTextActive : styles.timeTextInactive]}>
                          {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                        </Text>
                      </View>
                      {!!slot.notes && <Text style={styles.slotNotes}>{slot.notes}</Text>}
                      {!slot.is_active && <Text style={styles.inactiveText}>INACTIVE</Text>}
                    </View>

                    <View style={styles.slotActions}>
                      <TouchableOpacity onPress={() => toggleActive(slot)} style={styles.iconButton}>
                        <Text style={[styles.iconText, slot.is_active ? styles.iconActive : styles.iconInactive]}>{slot.is_active ? '⏽' : '⭘'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditForm(slot)} style={styles.iconButton}>
                        <Text style={styles.iconEdit}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(slot.id)} style={styles.iconButton}>
                        <Text style={styles.iconDelete}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: 22,
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 14,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCardBlue: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  summaryCardGreen: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  summaryCardRed: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  summaryNumberBlue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  summaryNumberGreen: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  summaryNumberRed: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  formPanel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    fontSize: 18,
  },
  errorText: {
    padding: 10,
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    marginTop: 10,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  input: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  checkbox: {
    fontSize: 18,
    color: '#1e293b',
  },
  activeLabel: {
    fontSize: 14,
    color: '#1e293b',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 13,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    color: '#64748b',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#cbd5e1',
  },
  emptyTitle: {
    color: '#64748b',
    marginTop: 16,
    fontWeight: '600',
    fontSize: 18,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  firstSlotButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    marginTop: 10,
  },
  firstSlotButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  daysWrap: {
    gap: 8,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dayHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayTitle: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
  },
  dayCount: {
    fontSize: 12,
    color: '#64748b',
  },
  slotRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  slotLeft: {
    flex: 1,
  },
  timeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timeBadgeActive: {
    backgroundColor: '#d1fae5',
  },
  timeBadgeInactive: {
    backgroundColor: '#fee2e2',
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeTextActive: {
    color: '#065f46',
  },
  timeTextInactive: {
    color: '#991b1b',
  },
  slotNotes: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
  },
  inactiveText: {
    marginTop: 4,
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  slotActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  iconActive: {
    color: '#10b981',
  },
  iconInactive: {
    color: '#ef4444',
  },
  iconEdit: {
    color: '#6366f1',
    fontSize: 14,
  },
  iconDelete: {
    color: '#ef4444',
    fontSize: 14,
  },
})

export default TeacherOfficeHours;
