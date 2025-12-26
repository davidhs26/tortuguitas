import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { Theme } from '@/constants/Theme';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
  style?: ViewStyle;
}

export function Avatar({
  name,
  imageUrl,
  size = 'medium',
  color,
  style,
}: AvatarProps) {
  const sizeConfig = getSizeConfig(size);
  const backgroundColor = color || getColorFromName(name || '');
  const initials = getInitials(name || '');

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.avatar,
          {
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: sizeConfig.size / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: sizeConfig.size,
          height: sizeConfig.size,
          borderRadius: sizeConfig.size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: sizeConfig.fontSize }]}>
        {initials}
      </Text>
    </View>
  );
}

// Avatar group for showing multiple avatars
interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ names, max = 4, size = 'small' }: AvatarGroupProps) {
  const displayNames = names.slice(0, max);
  const remaining = names.length - max;
  const sizeConfig = getSizeConfig(size);

  return (
    <View style={styles.group}>
      {displayNames.map((name, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            { marginLeft: index > 0 ? -sizeConfig.size / 3 : 0, zIndex: displayNames.length - index },
          ]}
        >
          <Avatar name={name} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.avatar,
            styles.remaining,
            {
              width: sizeConfig.size,
              height: sizeConfig.size,
              borderRadius: sizeConfig.size / 2,
              marginLeft: -sizeConfig.size / 3,
            },
          ]}
        >
          <Text style={[styles.remainingText, { fontSize: sizeConfig.fontSize * 0.8 }]}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

function getSizeConfig(size: AvatarProps['size']) {
  const configs = {
    small: { size: 32, fontSize: 12 },
    medium: { size: 44, fontSize: 16 },
    large: { size: 64, fontSize: 22 },
    xlarge: { size: 88, fontSize: 32 },
  };
  return configs[size || 'medium'];
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    Theme.colors.primary,
    Theme.colors.secondary,
    Theme.colors.success,
    Theme.colors.warning,
    Theme.colors.sectorDavid,
    Theme.colors.sectorMumi,
    Theme.colors.sectorTuni,
    Theme.colors.sectorQuincho,
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.white,
  },
  initials: {
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.bold,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    borderWidth: 2,
    borderColor: Theme.colors.white,
    borderRadius: 100,
  },
  remaining: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Theme.colors.white,
  },
  remainingText: {
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeight.semibold,
  },
});
