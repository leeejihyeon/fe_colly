import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Linking, Modal, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommunityScreen } from '../../features/community/screens/CommunityScreen';
import { ExperienceScreen } from '../../features/experience/screens/ExperienceScreen';
import { MyPageScreen } from '../../features/mypage/screens/MyPageScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { verifyMagicLink } from '../../features/auth/api/authApi';
import { colors } from '../../shared/theme/colors';
import { AuthGateProvider, useAuthGate } from '../../shared/lib/auth/authGate';
import { useToast } from '../../shared/ui/toast/ToastProvider';

export type RootTabParamList = {
  Community: undefined;
  Experience: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function RootTabs() {
  const { isHydrating, loginOpen, openLogin, closeLogin, completeLogin } = useAuthGate();
  const { showToast } = useToast();
  const handledTokenRef = React.useRef(new Set<string>());

  const handleDeepLink = useCallback(
    async (url: string) => {
      try {
        const parsed = new URL(url);
        const token =
          parsed.protocol === 'collyapp:' && parsed.hostname === 'auth' && parsed.pathname === '/magic-link'
            ? parsed.searchParams.get('token')
            : parsed.pathname === '/api/auth/magic-link/verify'
              ? parsed.searchParams.get('token')
              : null;

        if (!token) {
          showToast({ message: 'No valid token found in link.', tone: 'error' });
          return;
        }

        if (handledTokenRef.current.has(token)) {
          return;
        }

        handledTokenRef.current.add(token);
        try {
          const session = await verifyMagicLink(token);
          completeLogin(session);
          showToast({ message: 'Signed in successfully.', tone: 'success' });
        } catch (error) {
          showToast({ message: error instanceof Error ? error.message : 'Unable to sign in from magic link.', tone: 'error' });
          openLogin();
        }
      } catch (error) {
        openLogin();
        showToast({ message: error instanceof Error ? error.message : 'Unable to parse magic link.', tone: 'error' });
      }
    },
    [completeLogin, openLogin, showToast, handledTokenRef],
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', event => {
      handleDeepLink(event.url).catch(() => {});
    });

    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) {
        handleDeepLink(initialUrl).catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [handleDeepLink]);

  if (isHydrating) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
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
          <Tab.Screen
            name="MyPage"
            component={MyPageScreen}
            options={{ title: 'My Page', tabBarLabel: 'My Page' }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      <Modal visible={loginOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeLogin}>
        <LoginScreen onLoginSuccess={completeLogin} onClose={closeLogin} />
      </Modal>
    </>
  );
}

/**
 * 앱 루트 네비게이션 진입점.
 */
export function RootNavigator() {
  return (
    <AuthGateProvider>
      <RootTabs />
    </AuthGateProvider>
  );
}

const styles = {
  loadingWrap: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background,
  },
};
