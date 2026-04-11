import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StyleSheet, Text, View } from 'react-native'

const SchoolSettings = () => {
    const [schoolName, setSchoolName] = useState('')
    const [schoolEmail, setSchoolEmail] = useState('')

    useEffect(() => {
        const loadSettings = async () => {
            const storedSchoolName = await AsyncStorage.getItem('schoolName')
            const storedSchoolEmail = await AsyncStorage.getItem('schoolEmail')
            setSchoolName(storedSchoolName || '')
            setSchoolEmail(storedSchoolEmail || '')
        }

        loadSettings()
    }, [])

    return (
        <View style={styles.page}>
            <Text style={styles.pageTitle}>⚙️ Settings</Text>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderText}>School Information</Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>School Name</Text>
                        <Text style={styles.valueText}>{schoolName || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.valueText}>{schoolEmail || 'N/A'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.noteText}>ℹ️ Contact your administrator to update school settings.</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    page: {
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a2332',
        marginBottom: 12,
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
    cardHeaderText: {
        color: '#1a2332',
        fontWeight: '600',
        fontSize: 16,
    },
    cardBody: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    infoBlock: {
        marginBottom: 10,
    },
    label: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '700',
        marginBottom: 4,
    },
    valueText: {
        fontSize: 14,
        color: '#1e293b',
    },
    divider: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginVertical: 8,
    },
    noteText: {
        fontSize: 12,
        color: '#6b7280',
    },
})

export default SchoolSettings
