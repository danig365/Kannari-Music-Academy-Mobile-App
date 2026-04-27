import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Linking,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

import { API_BASE_URL } from '../../config'

const baseUrl = API_BASE_URL

const StudyMaterial = () => {
    const navigation = useNavigation()
    const route = useRoute()
    const course_id = route?.params?.course_id

    const [studyData, setStudyData] = useState([])
    const [totalResult, settotalResult] = useState(0)

    const fetchStudyMaterials = async () => {
        if (!course_id) return
        try {
            const res = await axios.get(baseUrl + '/study-material/' + course_id)
            settotalResult(res.data.length)
            setStudyData(res.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchStudyMaterials()
    }, [course_id])

    const handleDeleteClick = (study_id) => {
        Alert.alert('Confirm', 'Are you sure you want to delete data?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Continue',
                onPress: async () => {
                    try {
                        await axios.delete(baseUrl + '/study-materials/' + study_id)
                        Alert.alert('Success', 'Data has been deleted Successfully')
                        fetchStudyMaterials()
                    } catch (error) {
                        Alert.alert('Error', 'Data has not been deleted !!')
                    }
                },
            },
        ])
    }

    const downloadFile = async (file_url) => {
        try {
            const supported = await Linking.canOpenURL(file_url)
            if (supported) {
                await Linking.openURL(file_url)
            } else {
                Alert.alert('Error', 'Unable to open this file URL')
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to download/open file')
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>All Study Materials ({totalResult})</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddStudy', { course_id })}
                    >
                        <Text style={styles.addButtonText}>Add Study Material</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.tableHeader}>
                    <Text style={[styles.colText, styles.titleCol]}>Title</Text>
                    <Text style={[styles.colText, styles.uploadCol]}>Upload</Text>
                    <Text style={[styles.colText, styles.remarksCol]}>Remarks</Text>
                    <Text style={[styles.colText, styles.actionCol]}>Action</Text>
                </View>

                {studyData.map((row) => (
                    <View key={row.id} style={styles.tableRow}>
                        <Text style={[styles.cellText, styles.titleCol]}>{row.title}</Text>
                        <View style={[styles.uploadCol, styles.centerCell]}>
                            <TouchableOpacity style={styles.downloadBtn} onPress={() => downloadFile(row.upload)}>
                                <Text style={styles.downloadBtnText}>Download</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.cellText, styles.remarksCol]}>{row.remarks}</Text>
                        <View style={[styles.actionCol, styles.centerCell]}>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteClick(row.id)}>
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 1100,
        alignSelf: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    headerRow: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
    },
    addButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eef2f7',
        alignItems: 'stretch',
    },
    colText: {
        padding: 10,
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },
    cellText: {
        padding: 10,
        fontSize: 12,
        color: '#334155',
    },
    titleCol: {
        flex: 2,
    },
    uploadCol: {
        flex: 1.3,
    },
    remarksCol: {
        flex: 2,
    },
    actionCol: {
        flex: 1,
    },
    centerCell: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    downloadBtn: {
        borderWidth: 1,
        borderColor: '#16a34a',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    downloadBtnText: {
        color: '#15803d',
        fontSize: 11,
        fontWeight: '600',
    },
    deleteBtn: {
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    deleteBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
})

export default StudyMaterial
