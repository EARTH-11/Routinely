// app/rep/RepTabsScreen.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';
import { RootStackParamList } from '../../App';

import RepTimelineScreen from './RepTimelineScreen';
import RepExamScreen from './RepExamScreen';
import RepNoticesScreen from './RepNoticesScreen';
import RepProfileScreen from './RepProfileScreen';

type Props = { route: RouteProp<RootStackParamList, 'RepTabs'> };
const Tab = createBottomTabNavigator();

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_ICONS: Record<string, MaterialIconName> = {
  Courses: 'book',
  Exams: 'edit-note',
  Notices: 'campaign',
 Logout: 'logout',
};

export default function RepTabsScreen({ route }: Props) {
  const { session } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route: tabRoute }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <MaterialIcons
            name={TAB_ICONS[tabRoute.name]}
            size={focused ? 25 : 22}
            color={color}
          />
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={{
            fontSize: FONTS.sizes.xs,
            color: focused ? COLORS.primary : COLORS.textMuted,
            fontWeight: focused ? '700' : '400',
            marginBottom: 2,
          }}>
            {tabRoute.name}
          </Text>
        ),
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: COLORS.border, height: 80, paddingTop: 6 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      })}
    >
      <Tab.Screen name="Courses" children={() => <RepTimelineScreen session={session} />} />
      <Tab.Screen name="Exams" children={() => <RepExamScreen session={session} />} />
      <Tab.Screen name="Notices" children={() => <RepNoticesScreen session={session} />} />
      <Tab.Screen name="Logout" children={() => <RepProfileScreen session={session} />} />
    </Tab.Navigator>
  );
}
