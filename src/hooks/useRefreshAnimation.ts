import { useRef } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

export const useRefreshAnimation = () => {
  const refreshRotation = useSharedValue(0);
  const isAnimationRunning = useRef(false);

  // Function to stop the refresh animation
  const stopRefreshAnimation = () => {
    isAnimationRunning.current = false;
    refreshRotation.value = 0;
  };

  // Animated style for refresh button
  const refreshAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${refreshRotation.value % 360}deg` }],
    };
  });

  // Start continuous spinning animation
  const startRefreshAnimation = () => {
    isAnimationRunning.current = true;

    const animateOnce = () => {
      "worklet";
      refreshRotation.value = withTiming(
        refreshRotation.value + 360,
        {
          duration: 1000,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            runOnJS(() => {
              if (isAnimationRunning.current) {
                // Continue spinning if still refreshing
                animateOnce();
              }
            })();
          }
        }
      );
    };

    // Start the animation
    runOnJS(() => {
      animateOnce();
    })();
  };

  return {
    refreshAnimatedStyle,
    startRefreshAnimation,
    stopRefreshAnimation,
  };
};
