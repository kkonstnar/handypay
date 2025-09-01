import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AvatarProps {
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  initials?: string;
  imageUri?: string;
}

function Avatar({ onPress, size = 'medium', initials = 'KC', imageUri }: AvatarProps): React.ReactElement {
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
      {imageUri ? (
        <Image
          key={imageUri} // Add key to prevent unnecessary re-renders
          source={{ uri: imageUri }}
          style={[
            styles.avatarImage,
            size === 'small' && styles.avatarImageSmall,
            size === 'large' && styles.avatarImageLarge
          ]}
          resizeMode="cover"
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
    justifyContent: 'center'
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40
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
    width: 44,
    height: 44,
    borderRadius: 22
  },
  avatarImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  avatarImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40
  }
});