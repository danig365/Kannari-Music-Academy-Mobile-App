import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { API_BASE_URL } from '../../config'

const SchoolChatLock = () => {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const [unlockDuration, setUnlockDuration] = useState(24)
  const [unlockNotes, setUnlockNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchPolicies = useCallback(async () => {
    try {
      let url = `${API_BASE_URL}/chat-lock-policies/`
      if (filter === 'locked') url += '?locked=true'
      else if (filter === 'unlocked') url += '?locked=false'

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch chat lock policies')
      const data = await response.json()

      setPolicies(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchPolicies()
  }, [fetchPolicies])

  useEffect(() => {
    const interval = setInterval(fetchPolicies, 30000)
    return () => clearInterval(interval)
  }, [fetchPolicies])

  const handleToggle = async () => {
    if (!actionModal) return

    setActionLoading(true)
    try {
      const { policy, action } = actionModal
      const body = { action }

      if (action === 'unlock') {
        body.duration_hours = unlockDuration
        body.notes = unlockNotes

        const schoolId = await AsyncStorage.getItem('schoolId')
        if (schoolId) body.school_id = schoolId
      }

      const response = await fetch(`${API_BASE_URL}/admin/chat-lock/${policy.parent_link}/toggle/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (data.bool) {
        setSuccessMsg(data.message)
        setActionModal(null)
        setUnlockDuration(24)
        setUnlockNotes('')
        fetchPolicies()
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setError(data.error || 'Action failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        (policy.student_name || '').toLowerCase().includes(term) ||
        (policy.parent_name || '').toLowerCase().includes(term) ||
        (policy.student_email || '').toLowerCase().includes(term) ||
        (policy.parent_email || '').toLowerCase().includes(term) ||
        (policy.teacher_names || []).some((teacher) => teacher.toLowerCase().includes(term))
      )
    })
  }, [policies, searchTerm])

  const getAgeTierBadge = (tier) => {
    switch (tier) {
      case '18_plus':
        return { label: '18+', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
      case '13_17':
        return { label: '13-17', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
      case '4_12':
        return { label: '4-12', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
      default:
        return { label: 'Unknown', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' }
    }
  }

  const getLockReasonLabel = (reason) => {
    switch (reason) {
      case 'age_default':
        return 'Age Default'
      case 'admin_lock':
        return 'Admin Lock'
      case 'policy':
        return 'Policy Violation'
      default:
        return reason || '—'
    }
  }

  const getStatusInfo = (policy) => {
    const allowed = policy.chat_allowed?.allowed
    if (allowed) return { label: 'Chat Open', color: '#10b981' }
    return { label: 'Chat Locked', color: '#ef4444' }
  }

  const stats = useMemo(
    () => ({
      total: policies.length,
      locked: policies.filter((policy) => !policy.chat_allowed?.allowed).length,
      unlocked: policies.filter((policy) => policy.chat_allowed?.allowed).length,
      minors: policies.filter((policy) => policy.age_tier === '4_12').length,
      teens: policies.filter((policy) => policy.age_tier === '13_17').length,
    }),
    [policies]
  )

  if (loading && policies.length === 0) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size='large' color='#2563eb' />
        <Text style={styles.loaderText}>Loading chat lock policies...</Text>
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>🛡️ Chat Lock Management</Text>
            <Text style={styles.subtitle}>Control parent-teacher messaging based on student age and safety policies</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              setLoading(true)
              fetchPolicies()
            }}
          >
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {!!successMsg && (
          <View style={styles.successAlert}>
            <Text style={styles.successText}>✅ {successMsg}</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorAlert}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Text style={styles.errorClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsWrap}>
          {[
            { label: 'Total Pairs', value: stats.total, color: '#6366f1' },
            { label: 'Currently Locked', value: stats.locked, color: '#ef4444' },
            { label: 'Currently Open', value: stats.unlocked, color: '#10b981' },
            { label: 'Ages 4-12', value: stats.minors, color: '#f59e0b' },
            { label: 'Ages 13-17', value: stats.teens, color: '#3b82f6' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterChipsWrap}>
            {[
              { key: 'all', label: 'All' },
              { key: 'locked', label: 'Locked' },
              { key: 'unlocked', label: 'Unlocked' },
            ].map((item) => {
              const selected = filter === item.key
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.filterChip, selected ? styles.filterChipActive : null]}
                  onPress={() => setFilter(item.key)}
                >
                  <Text style={[styles.filterChipText, selected ? styles.filterChipTextActive : null]}>{item.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder='Search student, parent, teacher...'
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {!!searchTerm && (
              <TouchableOpacity style={styles.searchClearBtn} onPress={() => setSearchTerm('')}>
                <Text style={styles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {filteredPolicies.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyText}>{searchTerm ? 'No matching records found' : 'No chat lock policies found'}</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filteredPolicies.map((policy) => {
              const statusInfo = getStatusInfo(policy)
              const tierBadge = getAgeTierBadge(policy.age_tier)
              return (
                <View key={policy.id} style={styles.policyCard}>
                  <View style={styles.policyTop}>
                    <View style={styles.policyMain}>
                      <Text style={styles.policyStudent}>{policy.student_name || '—'}</Text>
                      <Text style={styles.policyMeta}>{policy.student_email || ''}</Text>
                      <Text style={styles.policyMeta}>
                        Parent: {policy.parent_name || '—'} {policy.relationship ? `(${policy.relationship})` : ''}
                      </Text>
                      <Text style={styles.policyMeta}>{policy.parent_email || ''}</Text>
                    </View>

                    <View style={styles.badgesCol}>
                      <Text style={[styles.tierBadge, { color: tierBadge.color, backgroundColor: tierBadge.bg }]}>
                        {tierBadge.label}
                      </Text>
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                  </View>

                  <View style={styles.policyBody}>
                    <Text style={styles.policyLine}>Teachers: {(policy.teacher_names || []).join(', ') || 'No teacher assigned'}</Text>
                    <Text style={styles.policyLine}>Reason: {policy.chat_allowed?.reason || getLockReasonLabel(policy.lock_reason)}</Text>
                    <Text style={styles.policyLine}>
                      Unlock Expires:{' '}
                      {policy.unlock_expires_at ? new Date(policy.unlock_expires_at).toLocaleString() : '—'}
                    </Text>
                  </View>

                  <View style={styles.policyActions}>
                    {policy.age_tier === '18_plus' ? (
                      <Text style={styles.naText}>N/A (Adult)</Text>
                    ) : policy.chat_allowed?.allowed ? (
                      <TouchableOpacity
                        style={styles.lockBtn}
                        onPress={() => setActionModal({ policy, action: 'lock' })}
                      >
                        <Text style={styles.lockBtnText}>Lock</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.unlockBtn}
                        onPress={() => setActionModal({ policy, action: 'unlock' })}
                      >
                        <Text style={styles.unlockBtnText}>Unlock</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View style={styles.legendWrap}>
          <Text style={styles.legendTitle}>ℹ️ Chat Lock Rules</Text>
          <Text style={styles.legendLine}>• Ages 4-12: Chat locked by default. Only unlocked during live sessions or by admin.</Text>
          <Text style={styles.legendLine}>• Ages 13-17: Allowed during teacher office hours and live sessions.</Text>
          <Text style={styles.legendLine}>• Ages 18+: Chat always available. No restrictions.</Text>
        </View>
      </ScrollView>

      <Modal visible={!!actionModal} transparent animationType='fade' onRequestClose={() => setActionModal(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActionModal(null)}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{actionModal?.action === 'lock' ? '🔒 Lock Chat' : '🔓 Unlock Chat'}</Text>
              <TouchableOpacity onPress={() => setActionModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfoBox}>
              <Text style={styles.modalInfoLine}>Student: {actionModal?.policy?.student_name}</Text>
              <Text style={styles.modalInfoLine}>Parent: {actionModal?.policy?.parent_name}</Text>
              <Text style={styles.modalInfoLine}>Age Tier: {actionModal ? getAgeTierBadge(actionModal.policy.age_tier).label : ''}</Text>
            </View>

            {actionModal?.action === 'lock' ? (
              <Text style={styles.modalWarnText}>
                This will immediately lock chat for this parent-student pair until unlocked.
              </Text>
            ) : (
              <>
                <Text style={styles.modalLabel}>Unlock Duration</Text>
                <View style={styles.durationWrap}>
                  {[
                    { val: 1, label: '1h' },
                    { val: 4, label: '4h' },
                    { val: 24, label: '24h' },
                    { val: 72, label: '3d' },
                    { val: 168, label: '1w' },
                    { val: 720, label: '30d' },
                  ].map((opt) => {
                    const selected = unlockDuration === opt.val
                    return (
                      <TouchableOpacity
                        key={opt.val}
                        style={[styles.durationBtn, selected ? styles.durationBtnActive : null]}
                        onPress={() => setUnlockDuration(opt.val)}
                      >
                        <Text style={[styles.durationBtnText, selected ? styles.durationBtnTextActive : null]}>{opt.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <Text style={styles.modalLabel}>Custom hours</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType='numeric'
                  value={String(unlockDuration)}
                  onChangeText={(value) => setUnlockDuration(Math.max(1, parseInt(value, 10) || 1))}
                />

                <Text style={styles.modalLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  multiline
                  value={unlockNotes}
                  onChangeText={setUnlockNotes}
                  placeholder='Reason for unlock...'
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, actionModal?.action === 'lock' ? styles.confirmLock : styles.confirmUnlock]}
                onPress={handleToggle}
                disabled={actionLoading}
              >
                <Text style={styles.confirmBtnText}>
                  {actionLoading
                    ? 'Processing...'
                    : actionModal?.action === 'lock'
                    ? 'Confirm Lock'
                    : `Confirm Unlock (${unlockDuration}h)`}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
  },
  loaderWrap: {
    flex: 1,
    minHeight: 320,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: '#64748b',
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  refreshBtn: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  refreshBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  successAlert: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  successText: {
    color: '#166534',
    fontSize: 12,
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
    flex: 1,
  },
  errorClose: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 14,
  },
  statsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: '31%',
    flexGrow: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  filtersRow: {
    gap: 8,
    marginBottom: 12,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
  },
  searchClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  searchClearText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
  listWrap: {
    gap: 10,
  },
  policyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  policyTop: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  policyMain: {
    flex: 1,
  },
  policyStudent: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
  },
  policyMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 1,
  },
  badgesCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tierBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  policyBody: {
    gap: 2,
  },
  policyLine: {
    color: '#475569',
    fontSize: 12,
  },
  policyActions: {
    alignItems: 'flex-end',
  },
  naText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  lockBtn: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  lockBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 12,
  },
  unlockBtn: {
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unlockBtnText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 12,
  },
  legendWrap: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  legendTitle: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  legendLine: {
    color: '#64748b',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  modalInfoBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  modalInfoLine: {
    color: '#475569',
    fontSize: 12,
  },
  modalWarnText: {
    color: '#92400e',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
  },
  modalLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  durationWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  durationBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  durationBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  durationBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  durationBtnTextActive: {
    color: '#fff',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  modalTextArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confirmLock: {
    backgroundColor: '#dc2626',
  },
  confirmUnlock: {
    backgroundColor: '#16a34a',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
})

export default SchoolChatLock
