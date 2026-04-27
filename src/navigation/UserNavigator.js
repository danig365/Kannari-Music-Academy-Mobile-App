/**
 * UserNavigator — Student screens
 * Mapped from React Router /student/* routes in Main.jsx
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Layout
import UserLayout from '../components/User/UserLayout';

// Auth screens
import Login from '../components/User/Login';
import Register from '../components/User/Register';
import ForgotPassword from '../components/User/ForgotPassword';

// Dashboard & Profile
import EnhancedDashboard from '../components/User/EnhancedDashboard';
import ProfileSetting from '../components/User/ProfileSetting';
import ChangePassword from '../components/User/ChangePassword';
import UserLogout from '../components/User/UserLogout';

// Courses
import MyCourses from '../components/User/MyCourses';
import AllCourses from '../components/User/AllCourses';
import CourseDetail from '../components/User/CourseDetail';
import StudentCoursePlayer from '../components/User/StudentCoursePlayer';

// Progress & Achievements
import MyProgress from '../components/User/MyProgress';
import MyAchievements from '../components/User/MyAchievements';

// Subscriptions
import StudentSubscriptions from '../components/User/StudentSubscriptions';

// Sessions & Groups
import StudentSessions from '../components/User/StudentSessions';
import StudentGroups from '../components/User/StudentGroups';
import StudentGroupDetail from '../components/User/StudentGroupDetail';
import GroupChat from '../components/User/GroupChat';

// Messaging
import TextMessages from '../components/User/TextMessages';
import AudioMessages from '../components/User/AudioMessages';

// Assignments
import StudentAssignments from '../components/User/StudentAssignments';

// Teachers
import MyTeachers from '../components/User/MyTeachers';
import TeacherDetail from '../components/User/TeacherDetail';

// Study Material
import StudyStudentMaterial from '../components/User/StudyStudentMaterial';

// Games
import StudentGamesHub from '../components/User/StudentGamesHub';
import NoteNinjaGame from '../components/User/NoteNinjaGame';
// import RhythmRushGame from '../components/User/RhythmRushGame';
import MusicChallengeGame from '../components/User/MusicChallengeGame';

// Recent Bookings
import RecentBookings from '../components/User/RecentBookings';

const Stack = createStackNavigator();

const withUserLayout = (Component) => {
  const WrappedScreen = (props) => (
    <UserLayout>
      <Component {...props} />
    </UserLayout>
  );
  return WrappedScreen;
};

const StudentDashboardScreen = withUserLayout(EnhancedDashboard);
const MyCoursesScreen = withUserLayout(MyCourses);
const AllCoursesScreen = withUserLayout(AllCourses);
const CourseDetailScreen = withUserLayout(CourseDetail);
const StudentCoursePlayerScreen = withUserLayout(StudentCoursePlayer);
const StudyStudentMaterialScreen = withUserLayout(StudyStudentMaterial);
const MyProgressScreen = withUserLayout(MyProgress);
const MyAchievementsScreen = withUserLayout(MyAchievements);
const StudentSubscriptionsScreen = withUserLayout(StudentSubscriptions);
const StudentSessionsScreen = withUserLayout(StudentSessions);
const StudentGroupsScreen = withUserLayout(StudentGroups);
const StudentGroupDetailScreen = withUserLayout(StudentGroupDetail);
const GroupChatScreen = withUserLayout(GroupChat);
const TextMessagesScreen = withUserLayout(TextMessages);
const AudioMessagesScreen = withUserLayout(AudioMessages);
const StudentAssignmentsScreen = withUserLayout(StudentAssignments);
const MyTeachersScreen = withUserLayout(MyTeachers);
const TeacherDetailScreen = withUserLayout(TeacherDetail);
const ProfileSettingScreen = withUserLayout(ProfileSetting);
const ChangePasswordScreen = withUserLayout(ChangePassword);
const UserLogoutScreen = withUserLayout(UserLogout);
const StudentGamesHubScreen = withUserLayout(StudentGamesHub);
const NoteNinjaGameScreen = withUserLayout(NoteNinjaGame);
// const RhythmRushGameScreen = withUserLayout(RhythmRushGame);
const MusicChallengeGameScreen = withUserLayout(MusicChallengeGame);
const RecentBookingsScreen = withUserLayout(RecentBookings);

const UserNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Dashboard */}
      <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />

      {/* Courses */}
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
      <Stack.Screen name="AllCourses" component={AllCoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="StudentCoursePlayer" component={StudentCoursePlayerScreen} />
      <Stack.Screen name="StudyStudentMaterial" component={StudyStudentMaterialScreen} />

      {/* Progress & Achievements */}
      <Stack.Screen name="MyProgress" component={MyProgressScreen} />
      <Stack.Screen name="MyAchievements" component={MyAchievementsScreen} />

      {/* Subscriptions */}
      <Stack.Screen name="StudentSubscriptions" component={StudentSubscriptionsScreen} />

      {/* Sessions */}
      <Stack.Screen name="StudentSessions" component={StudentSessionsScreen} />

      {/* Groups */}
      <Stack.Screen name="StudentGroups" component={StudentGroupsScreen} />
      <Stack.Screen name="StudentGroupDetail" component={StudentGroupDetailScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />

      {/* Messaging */}
      <Stack.Screen name="TextMessages" component={TextMessagesScreen} />
      <Stack.Screen name="AudioMessages" component={AudioMessagesScreen} />

      {/* Assignments */}
      <Stack.Screen name="StudentAssignments" component={StudentAssignmentsScreen} />

      {/* Teachers */}
      <Stack.Screen name="MyTeachers" component={MyTeachersScreen} />
      <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} />

      {/* Profile */}
      <Stack.Screen name="ProfileSetting" component={ProfileSettingScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="UserLogout" component={UserLogoutScreen} />

      {/* Games */}
      <Stack.Screen name="StudentGamesHub" component={StudentGamesHubScreen} />
      <Stack.Screen name="NoteNinjaGame" component={NoteNinjaGameScreen} />
      {/* <Stack.Screen name="RhythmRushGame" component={RhythmRushGameScreen} /> */}
      <Stack.Screen name="MusicChallengeGame" component={MusicChallengeGameScreen} />

      {/* Bookings */}
      <Stack.Screen name="RecentBookings" component={RecentBookingsScreen} />
    </Stack.Navigator>
  );
};

export default UserNavigator;
