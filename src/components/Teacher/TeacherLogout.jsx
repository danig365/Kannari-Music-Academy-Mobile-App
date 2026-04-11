import React, { useEffect } from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'

const TeacherLogout = () => {
    const { setRole } = useAuth();

    useEffect(() => {
        const logout = async () => {
            await AsyncStorage.removeItem('teacherLoginStatus');
            await AsyncStorage.removeItem('teacherId');
            await AsyncStorage.removeItem('teacherName');
            await AsyncStorage.removeItem('teacherEmail');
            await AsyncStorage.removeItem('teacherQualification');
            await AsyncStorage.removeItem('teacherMobile');
            await AsyncStorage.removeItem('teacherProfileImg');
            setRole(null);
        };
        logout();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.text}>Logging out...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    text: { marginTop: 12, fontSize: 16, color: '#666' },
});

export default TeacherLogout
