import { View } from 'react-native';

import { AVATAR_SIZE, avatarFor } from '@/domain';

export function PixelAvatar({ name, size = 40, color }: { name: string; size?: number; color?: string }) {
  const avatar = avatarFor(name);
  const cell = size / AVATAR_SIZE;
  const fill = color ?? avatar.color;
  return (
    <View style={{ width: size, height: size }} aria-hidden>
      {Array.from({ length: AVATAR_SIZE }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: AVATAR_SIZE }, (_, col) => (
            <View
              key={col}
              style={{
                width: cell,
                height: cell,
                backgroundColor: avatar.cells[row * AVATAR_SIZE + col] ? fill : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
