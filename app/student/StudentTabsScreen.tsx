// app/student/StudentTabsScreen.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';
import { RootStackParamList } from '../../App';
import { useUnreadNotices } from '../../hooks/useUnreadNotices';

import TimelineTab from './TimelineTab';
import ExamTab from './ExamTab';
import BusTab from './BusTab';
import NoticesTab from './NoticesTab';
import SettingsTab from './SettingsTab';
import { useUnreadExams } from'../../hooks/useUnreadExams';

type Props = {
  route: RouteProp<RootStackParamList, 'StudentTabs'>;
};

const Tab = createBottomTabNavigator();

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_ICONS: Record<string, MaterialIconName> = {
  Courses: 'book',
  Exams: 'edit-note',
  Bus: 'directions-bus',
  Notices: 'campaign',
  More: 'menu',
};

export default function StudentTabsScreen({ route }: Props) {
  const { session } = route.params;
  const { hasUnread,recheckUnread } = useUnreadNotices(session.section_id);
  const { hasUnread: hasUnreadExams, markSeen: markExamsSeen } = useUnreadExams(session.section_id);
  return (
    <Tab.Navigator
      screenOptions={({ route: tabRoute }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <View>
            <MaterialIcons
              name={TAB_ICONS[tabRoute.name]}
              size={focused ? 26 : 22}
              color={color}
            />
            {!focused && ((tabRoute.name === 'Notices' && hasUnread ) || (tabRoute.name === 'Exams' && hasUnreadExams)) && (
              <View style={styles.unreadDot} />
            )}
          </View>
        ),
        tabBarLabel: ({ focused, color }) => (
          <Text style={{
            fontSize: FONTS.sizes.xs,
            color: focused ? COLORS.primary : COLORS.textMuted,
            fontWeight: focused ? '500' : '400',
            marginBottom: 5,
          }}>
            {tabRoute.name}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: '#fafdff',
          borderTopColor: COLORS.border,
          height: 80,
          paddingTop: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      })}
    >
      <Tab.Screen name="Courses" children={() => <TimelineTab session={session} />} />
      <Tab.Screen name="Exams" children={() => <ExamTab session={session} onSeen={markExamsSeen} />} />
      <Tab.Screen name="Bus" children={() => <BusTab />} />
      <Tab.Screen name="Notices" children={() => <NoticesTab session={session} onSeen={recheckUnread} />} />
      <Tab.Screen name="More" children={() => <SettingsTab session={session} />} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  unreadDot: {
    position: 'absolute',
    top: -3,
    right: -8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.warning,
    borderWidth: 2,
    borderColor: '#fafdff',
  },
});
