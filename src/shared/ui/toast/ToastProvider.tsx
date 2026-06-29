import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type ToastTone = 'info' | 'success' | 'error';

type ToastPayload = {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Required<ToastPayload> | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    Animated.timing(translateY, {
      toValue: -120,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [clearTimer, translateY]);

  const showToast = useCallback(
    ({ message, tone = 'info', durationMs = 4500 }: ToastPayload) => {
      clearTimer();

      setToast({ message, tone, durationMs });
      translateY.setValue(-120);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        timerRef.current = setTimeout(() => {
          hideToast();
        }, durationMs);
      });
    },
    [clearTimer, hideToast, translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy < 0) {
            translateY.setValue(Math.max(gestureState.dy, -120));
          } else if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy / 2);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dy) > 28) {
            hideToast();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        },
      }),
    [hideToast, translateY],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  const toneStyle =
    toast?.tone === 'success' ? styles.toastSuccess : toast?.tone === 'error' ? styles.toastError : styles.toastInfo;

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.toastWrap, { paddingTop: insets.top + spacing[8], transform: [{ translateY }] }]}
          >
            <Pressable onPress={hideToast} style={[styles.toastCard, toneStyle]}>
              <Text style={styles.toastText}>{toast.message}</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  toastWrap: {
    paddingHorizontal: spacing[12],
  },
  toastCard: {
    borderRadius: spacing[12],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[12],
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: spacing[8],
    shadowOffset: { width: 0, height: spacing[4] },
    elevation: 6,
  },
  toastInfo: {
    backgroundColor: '#111827',
  },
  toastSuccess: {
    backgroundColor: '#0A7A46',
  },
  toastError: {
    backgroundColor: '#B42318',
  },
  toastText: {
    color: colors.semantic.white,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
});
