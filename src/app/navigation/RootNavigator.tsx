import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommunityScreen } from '../../features/community/screens/CommunityScreen';
import { ExperienceScreen } from '../../features/experience/screens/ExperienceScreen';
import { MyPageScreen } from '../../features/mypage/screens/MyPageScreen';
import { colors } from '../../shared/theme/colors';

export type RootTabParamList = {
  Community: undefined;
  Experience: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * 앱 루트 네비게이션 진입점.
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Community"
        screenOptions={{
          headerTitleAlign: 'center',
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          },
        }}
      >
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{ title: 'Community', tabBarLabel: 'Community', headerShown: false }}
        />
        <Tab.Screen
          name="Experience"
          component={ExperienceScreen}
          options={{ title: 'Experience', tabBarLabel: 'Experience' }}
        />
        <Tab.Screen name="MyPage" component={MyPageScreen} options={{ title: 'My Page', tabBarLabel: 'My Page' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
