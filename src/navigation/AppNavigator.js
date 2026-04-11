/**
 * AppNavigator — Root navigation
 * Reads role from AsyncStorage on launch to decide which navigator to show.
 * Mapped from Main.jsx route structure:
 *   Unauthenticated → Auth screens (login/register per role)
 *   Role = student  → UserNavigator
 *   Role = teacher  → TeacherNavigator
 *   Role = school   → SchoolNavigator
 *   Role = admin    → AdminNavigator
 *   Role = parent   → ParentNavigator
 */

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../context/AuthContext';

// Auth screens (unauthenticated)
import Login from '../components/User/Login';
import Register from '../components/User/Register';
import ForgotPassword from '../components/User/ForgotPassword';
import TeacherLogin from '../components/Teacher/TeacherLogin';
import TeacherRegister from '../components/Teacher/TeacherRegister';
import TeacherForgotPassword from '../components/Teacher/TeacherForgotPassword';
import SchoolLogin from '../components/School/SchoolLogin';
import AdminLogin from '../components/Admin/AdminLogin';
import ParentLogin from '../components/ParentLogin';
import Faq from '../components/Faq';
import Policy from '../components/Policy';
import AllCourses from '../components/User/AllCourses';

// Public / shared screens
import Home from '../components/shared/Home';
import About from '../components/shared/About';
import Search from '../components/shared/Search';
import ParentalConsent from '../components/shared/ParentalConsent';

const Stack = createStackNavigator();

/**
 * Auth stack — shown when no one is logged in
 */
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Public */}
    <Stack.Screen name="Home" component={Home} />
    <Stack.Screen name="About" component={About} />
    <Stack.Screen name="Search" component={Search} />
    <Stack.Screen name="Faq" component={Faq} />
    <Stack.Screen name="Policy" component={Policy} />
    <Stack.Screen name="AllCourses" component={AllCourses} />

    {/* Student auth */}
    <Stack.Screen name="StudentLogin" component={Login} />
    <Stack.Screen name="StudentRegister" component={Register} />
    <Stack.Screen name="StudentForgotPassword" component={ForgotPassword} />

    {/* Teacher auth */}
    <Stack.Screen name="TeacherLogin" component={TeacherLogin} />
    <Stack.Screen name="TeacherRegister" component={TeacherRegister} />
    <Stack.Screen name="TeacherForgotPassword" component={TeacherForgotPassword} />

    {/* School auth */}
    <Stack.Screen name="SchoolLogin" component={SchoolLogin} />

    {/* Admin auth */}
    <Stack.Screen name="AdminLogin" component={AdminLogin} />

    {/* Parent auth */}
    <Stack.Screen name="ParentLogin" component={ParentLogin} />
    <Stack.Screen name="ParentalConsent" component={ParentalConsent} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check each role's login status — mirrors localStorage checks in Main.jsx
      const studentLoginStatus = await AsyncStorage.getItem('studentLoginStatus');
      const teacherLoginStatus = await AsyncStorage.getItem('teacherLoginStatus');
      const schoolLoginStatus = await AsyncStorage.getItem('schoolLoginStatus');
      const adminLoginStatus = await AsyncStorage.getItem('adminLoginStatus');
      const parentLoginStatus = await AsyncStorage.getItem('parentLoginStatus');

      if (studentLoginStatus === 'true') {
        setRole('student');
      } else if (teacherLoginStatus === 'true') {
        setRole('teacher');
      } else if (schoolLoginStatus === 'true') {
        setRole('school');
      } else if (adminLoginStatus === 'true') {
        setRole('admin');
      } else if (parentLoginStatus === 'true') {
        setRole('parent');
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <AuthProvider value={{ role, setRole }}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === null && (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
      {role === 'student' && (
        <Stack.Screen name="StudentApp" getComponent={() => require('./UserNavigator').default} />
      )}
      {role === 'teacher' && (
        <Stack.Screen name="TeacherApp" getComponent={() => require('./TeacherNavigator').default} />
      )}
      {role === 'school' && (
        <Stack.Screen name="SchoolApp" getComponent={() => require('./SchoolNavigator').default} />
      )}
      {role === 'admin' && (
        <Stack.Screen name="AdminApp" getComponent={() => require('./AdminNavigator').default} />
      )}
      {role === 'parent' && (
        <Stack.Screen name="ParentApp" getComponent={() => require('./ParentNavigator').default} />
      )}
    </Stack.Navigator>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;
