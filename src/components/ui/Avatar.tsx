import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUser } from '../../contexts/UserContext';

interface AvatarProps {
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  initials?: string;
  imageUri?: string;
}

function Avatar({ onPress, size = 'medium', initials = '', imageUri }: AvatarProps): React.ReactElement {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { cachedAvatarUri } = useUser();

  // Use cached avatar if available, otherwise use passed imageUri
  const avatarUri = cachedAvatarUri || imageUri;

  // Memoize image source to prevent unnecessary re-renders
  const imageSource = useMemo(() => {
    if (!avatarUri) return null;
    return {
      uri: avatarUri,
      cache: 'force-cache' as const // Force caching to prevent reloads
    };
  }, [avatarUri]);

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const avatarStyle = [
    styles.avatar,
    size === 'small' && styles.avatarSmall,
    size === 'large' && styles.avatarLarge
  ];

  const textStyle = [
    styles.initialsText,
    size === 'small' && styles.initialsTextSmall,
    size === 'large' && styles.initialsTextLarge
  ];

  const AvatarContent = () => (
    <View style={avatarStyle}>
      {avatarUri && !imageError && imageSource ? (
        <Image
          key={`avatar-${avatarUri}`} // Unique key prevents unnecessary re-renders
          source={imageSource}
          style={[
            styles.avatarImage,
            size === 'small' && styles.avatarImageSmall,
            size === 'large' && styles.avatarImageLarge
          ]}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={textStyle}>{initials}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <AvatarContent />
      </TouchableOpacity>
    );
  }

  return <AvatarContent />;
}

export default React.memo(Avatar);

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3AB75C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative'
  },

  initialsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff'
  },
  initialsTextSmall: {
    fontSize: 12
  },
  initialsTextLarge: {
    fontSize: 32
  },

  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'absolute',
    top: -4,
    left: -4
  },
  avatarImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'absolute',
    top: -4,
    left: -4
  },
  avatarImageLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    position: 'absolute',
    top: -4,
    left: -4
  }
});