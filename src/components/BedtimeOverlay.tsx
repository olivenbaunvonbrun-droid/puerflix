import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Moon } from 'lucide-react-native';

interface Props {
  active: boolean;
}

export const BedtimeOverlay: React.FC<Props> = ({ active }) => {
  if (!active) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.banner}>
        <Moon size={13} color="#FBBF24" />
        <Text style={styles.bannerText}>Modo Pré-Sono: Luz Noturna Ativa</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(180, 100, 20, 0.08)', // Gentle warm amber tint to block blue light
    zIndex: 9999,
  },

  banner: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(24, 18, 12, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  bannerText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
  },
});
