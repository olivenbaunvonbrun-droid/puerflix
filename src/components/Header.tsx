import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Search, Lock, Award, Coins } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { KidProfile } from '../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenParental: () => void;
  onOpenProfileSelector?: () => void;
  onOpenMindGym?: () => void;
  activeProfile?: KidProfile;
  learningEconomyEnabled?: boolean;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenParental,
  onOpenProfileSelector,
  onOpenMindGym,
  activeProfile,
  learningEconomyEnabled = true,
  showSearch = true,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      {/* Brand Logo & Icon */}
      <View style={styles.brandContainer}>
        <Image
          source={require('../../assets/header_icon.png')}
          style={[styles.logoImage, isTablet && styles.logoImageTablet]}
          resizeMode="cover"
        />
        <View>
          <View style={styles.brandTitleRow}>
            <Text style={[styles.brandTextPuer, isTablet && { fontSize: 24 }]}>Puer</Text>
            <Text style={[styles.brandTextFlix, isTablet && { fontSize: 24 }]}>Flix</Text>
            <View style={styles.kidsBadge}>
              <Text style={styles.kidsBadgeText}>KIDS</Text>
            </View>
          </View>
          <Text style={[styles.slogan, isTablet && { fontSize: 12 }]} numberOfLines={1}>
            Vídeos escolhidos pelos pais
          </Text>
        </View>
      </View>



      {/* Actions */}
      <View style={styles.actionsContainer}>
        {/* Mind Gym ("Ginásio da Mente" - Earn Screen Time) */}
        {onOpenMindGym && learningEconomyEnabled && (
          <TouchableOpacity
            style={styles.gymBtn}
            onPress={onOpenMindGym}
            accessibilityLabel="Abrir Ginásio da Mente"
            activeOpacity={0.7}
          >
            <Award size={15} color="#FFD700" />
            <Text style={styles.gymBtnText}>Ginásio</Text>
          </TouchableOpacity>
        )}

        {/* Active Kid Profile Card (Switch Profile) */}
        {activeProfile && onOpenProfileSelector && (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onOpenProfileSelector}
            accessibilityLabel="Trocar Perfil Infantil"
            activeOpacity={0.7}
          >
            <Text style={styles.profileEmoji}>{activeProfile.avatarEmoji}</Text>
            <View style={styles.profileInfoBox}>
              <Text style={styles.profileNameText} numberOfLines={1}>
                {activeProfile.name}
              </Text>
              {learningEconomyEnabled && (
                <View style={styles.coinsMiniRow}>
                  <Coins size={10} color="#F59E0B" />
                  <Text style={styles.coinsMiniText}>
                    {activeProfile.screenTimeBalanceMinutes ?? 30}m
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {showSearch && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenSearch}
            accessibilityLabel="Buscar vídeos autorizados"
            activeOpacity={0.7}
          >
            <Search size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.parentalButton}
          onPress={onOpenParental}
          accessibilityLabel="Área dos Pais (com senha)"
          activeOpacity={0.8}
        >
          <Lock size={14} color="#FFFFFF" />
          <Text style={styles.parentalButtonText}>Pais</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  containerTablet: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  logoImageTablet: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },

  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTextPuer: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTextFlix: {
    fontSize: 21,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: -0.5,
  },
  kidsBadge: {
    backgroundColor: THEME.colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  kidsBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  slogan: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: -1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#26262B',
    borderWidth: 1,
    borderColor: '#424248',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.parental,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    elevation: 2,
  },
  parentalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  gymBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2E2208',
    borderWidth: 1,
    borderColor: '#B45309',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  gymBtnText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E2238',
    borderWidth: 1,
    borderColor: '#4338CA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  profileEmoji: {
    fontSize: 18,
  },
  profileInfoBox: {
    justifyContent: 'center',
  },
  profileNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 60,
  },
  coinsMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  coinsMiniText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
  },
});
