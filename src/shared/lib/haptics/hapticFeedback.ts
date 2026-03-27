import { Platform, Vibration } from 'react-native';

/**
 * Lightweight tap feedback for clickable controls.
 */
export function triggerTapHaptic() {
  if (Platform.OS === 'ios') {
    Vibration.vibrate(10);
    return;
  }

  Vibration.vibrate(8);
}
