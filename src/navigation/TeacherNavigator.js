/**
 * TeacherNavigator — Teacher dashboard screens
 * Mapped from React Router /teacher/* routes in Main.jsx
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TeacherLayout from '../components/Teacher/TeacherLayout';

// Auth screens
import TeacherLogin from '../components/Teacher/TeacherLogin';
import TeacherRegister from '../components/Teacher/TeacherRegister';
import TeacherForgotPassword from '../components/Teacher/TeacherForgotPassword';

// Dashboard & Overview
import TeacherOverview from '../components/Teacher/TeacherOverview';

// Courses
import TeacherMyCourses from '../components/Teacher/TeacherMyCourses';
import TeacherCourseManagement from '../components/Teacher/TeacherCourseManagement';
import AddCourses from '../components/Teacher/AddCourses';

// Students
import TeacherStudents from '../components/Teacher/TeacherStudents';
import EnrolledStudents from '../components/Teacher/EnrolledStudents';
import MyUsers from '../components/Teacher/MyUsers';

// Messaging
import TeacherMessages from '../components/Teacher/TeacherMessages';
import TeacherAudioMessages from '../components/Teacher/TeacherAudioMessages';

// Community
import TeacherCommunity from '../components/Teacher/TeacherCommunity';

// Assignments
import TeacherAssignmentCreate from '../components/Teacher/TeacherAssignmentCreate';
import TeacherAssignmentReviews from '../components/Teacher/TeacherAssignmentReviews';

// Sessions & Office Hours
import TeacherSessions from '../components/Teacher/TeacherSessions';
import TeacherOfficeHours from '../components/Teacher/TeacherOfficeHours';

// Progress & Games
import TeacherProgress from '../components/Teacher/TeacherProgress';
import TeacherGamesPerformance from '../components/Teacher/TeacherGamesPerformance';

// Profile
import TeacherProfileSetting from '../components/Teacher/TeacherProfileSetting';
import TeacherLogout from '../components/Teacher/TeacherLogout';

// Study Material
import StudyMaterial from '../components/Teacher/StudyMaterial';

const Stack = createStackNavigator();

const withTeacherLayout = (Component) => {
  const WrappedScreen = (props) => (
    <TeacherLayout>
      <Component {...props} />
    </TeacherLayout>
  );
  return WrappedScreen;
};

// Wrap dashboard screens with TeacherLayout
const TeacherDashboardScreen = withTeacherLayout(TeacherOverview);
const TeacherOverviewScreen = withTeacherLayout(TeacherOverview);
const TeacherMyCoursesScreen = withTeacherLayout(TeacherMyCourses);
const TeacherCourseManagementScreen = withTeacherLayout(TeacherCourseManagement);
const AddCoursesScreen = withTeacherLayout(AddCourses);
const TeacherStudentsScreen = withTeacherLayout(TeacherStudents);
const EnrolledStudentsScreen = withTeacherLayout(EnrolledStudents);
const MyUsersScreen = withTeacherLayout(MyUsers);
const TeacherMessagesScreen = withTeacherLayout(TeacherMessages);
const TeacherAudioMessagesScreen = withTeacherLayout(TeacherAudioMessages);
const TeacherCommunityScreen = withTeacherLayout(TeacherCommunity);
const TeacherAssignmentCreateScreen = withTeacherLayout(TeacherAssignmentCreate);
const TeacherAssignmentReviewsScreen = withTeacherLayout(TeacherAssignmentReviews);
const TeacherSessionsScreen = withTeacherLayout(TeacherSessions);
const TeacherOfficeHoursScreen = withTeacherLayout(TeacherOfficeHours);
const TeacherProgressScreen = withTeacherLayout(TeacherProgress);
const TeacherGamesPerformanceScreen = withTeacherLayout(TeacherGamesPerformance);
const TeacherProfileSettingScreen = withTeacherLayout(TeacherProfileSetting);
const StudyMaterialScreen = withTeacherLayout(StudyMaterial);

const TeacherNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Dashboard & Overview */}
      <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
      <Stack.Screen name="TeacherOverview" component={TeacherOverviewScreen} />

      {/* Auth screens (no layout wrapper) */}
      <Stack.Screen name="TeacherLogin" component={TeacherLogin} />
      <Stack.Screen name="TeacherRegister" component={TeacherRegister} />
      <Stack.Screen name="TeacherForgotPassword" component={TeacherForgotPassword} />

      {/* Courses */}
      <Stack.Screen name="TeacherMyCourses" component={TeacherMyCoursesScreen} />
      <Stack.Screen name="TeacherCourseManagement" component={TeacherCourseManagementScreen} />
      <Stack.Screen name="AddCourses" component={AddCoursesScreen} />

      {/* Students */}
      <Stack.Screen name="TeacherStudents" component={TeacherStudentsScreen} />
      <Stack.Screen name="EnrolledStudents" component={EnrolledStudentsScreen} />
      <Stack.Screen name="MyUsers" component={MyUsersScreen} />

      {/* Messaging */}
      <Stack.Screen name="TeacherMessages" component={TeacherMessagesScreen} />
      <Stack.Screen name="TeacherAudioMessages" component={TeacherAudioMessagesScreen} />

      {/* Community */}
      <Stack.Screen name="TeacherCommunity" component={TeacherCommunityScreen} />

      {/* Assignments */}
      <Stack.Screen name="TeacherAssignmentCreate" component={TeacherAssignmentCreateScreen} />
      <Stack.Screen name="TeacherAssignmentReviews" component={TeacherAssignmentReviewsScreen} />

      {/* Sessions & Office Hours */}
      <Stack.Screen name="TeacherSessions" component={TeacherSessionsScreen} />
      <Stack.Screen name="TeacherOfficeHours" component={TeacherOfficeHoursScreen} />

      {/* Progress & Games */}
      <Stack.Screen name="TeacherProgress" component={TeacherProgressScreen} />
      <Stack.Screen name="TeacherGamesPerformance" component={TeacherGamesPerformanceScreen} />

      {/* Profile */}
      <Stack.Screen name="TeacherProfileSetting" component={TeacherProfileSettingScreen} />
      <Stack.Screen name="TeacherLogout" component={TeacherLogout} />

      {/* Study Material */}
      <Stack.Screen name="StudyMaterial" component={StudyMaterialScreen} />
    </Stack.Navigator>
  );
};

export default TeacherNavigator;
