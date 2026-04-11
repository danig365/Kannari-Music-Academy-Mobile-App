import React, { useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../shared/LoadingSpinner'

const SchoolLogout = () => {
    const { setRole } = useAuth()

    useEffect(() => {
        const logout = async () => {
            await AsyncStorage.multiRemove([
                'schoolLoginStatus',
                'schoolUserId',
                'schoolId',
                'schoolName',
                'schoolEmail',
            ])
            setRole(null)
        }

        logout()
    }, [])

    return <LoadingSpinner fullScreen size='lg' text='Logging out...' />
}

export default SchoolLogout
