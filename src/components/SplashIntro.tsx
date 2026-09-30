import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { THEME } from '../constants/theme';

interface SplashIntroProps {
  onFinish: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onFinish }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const sparklesScale = useRef(new Animated.Value(0)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const sloganTranslateY = useRef(new Animated.Value(15)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Choreographed animation sequence
    Animated.sequence([
      // 1. Logo springs in on white background
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(logoTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(sparklesScale, {
          toValue: 1,
          friction: 4,
          tension: 30,
          useNativeDriver: true,
        }),
      ]),

      // 2. Slogan and badge gently appear
      Animated.parallel([
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(sloganTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // 3. Brief appreciation hold
      Animated.delay(1600),

      // 4. Smooth fade out into main app
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background Soft Pastel Blobs */}
      <View style={[styles.glowBlob, styles.blobCoral]} />
      <View style={[styles.glowBlob, styles.blobBlue]} />
      <View style={[styles.glowBlob, styles.blobYellow]} />
      <View style={[styles.glowBlob, styles.blobMint]} />

      {/* Floating Confetti / Sparkle Accents */}
      <Animated.View style={[styles.sparklesContainer, { transform: [{ scale: sparklesScale }] }]}>
        <View style={[styles.sparkleDot, { top: '22%', left: '16%', backgroundColor: '#2A97EE', width: 12, height: 12 }]} />
        <View style={[styles.sparkleDot, { top: '28%', right: '15%', backgroundColor: '#FECB64', width: 16, height: 16 }]} />
        <View style={[styles.sparkleDot, { bottom: '26%', left: '18%', backgroundColor: '#81D6D1', width: 14, height: 14 }]} />
        <View style={[styles.sparkleDot, { bottom: '24%', right: '18%', backgroundColor: '#FA4340', width: 10, height: 10 }]} />
        <Text style={[styles.floatingEmoji, { top: '18%', right: '24%' }]}>⭐</Text>
        <Text style={[styles.floatingEmoji, { bottom: '28%', left: '12%' }]}>✨</Text>
      </Animated.View>

      {/* Main Official 3D Logo on White Backdrop */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { translateY: logoTranslateY },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Slogan and Mission Statement */}
      <Animated.View
        style={[
          styles.sloganContainer,
          {
            opacity: sloganOpacity,
            transform: [{ translateY: sloganTranslateY }],
          },
        ]}
      >
        <View style={styles.kidsBadge}>
          <Text style={styles.kidsBadgeText}>KIDS & FAMÍLIA</Text>
        </View>

        <Text style={styles.sloganText}>Vídeos escolhidos pelos pais</Text>
        <Text style={styles.sloganSubText}>Liberdade segura e educativa para os filhos</Text>
      </Animated.View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onFinish} activeOpacity={0.7}>
        <Text style={styles.skipButtonText}>Entrar no PuerFlix ›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');
const logoSize = Math.min(width * 0.78, 360);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF', // Pure White Background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  glowBlob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  blobCoral: {
    top: '10%',
    left: '10%',
    width: 220,
    height: 220,
    backgroundColor: '#FA4340',
  },
  blobBlue: {
    bottom: '12%',
    right: '8%',
    width: 260,
    height: 260,
    backgroundColor: '#2A97EE',
  },
  blobYellow: {
    top: '18%',
    right: '12%',
    width: 180,
    height: 180,
    backgroundColor: '#FECB64',
  },
  blobMint: {
    bottom: '18%',
    left: '14%',
    width: 200,
    height: 200,
    backgroundColor: '#81D6D1',
  },
  sparklesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkleDot: {
    position: 'absolute',
    borderRadius: 99,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: logoSize,
    height: logoSize * 0.88,
  },
  sloganContainer: {
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  kidsBadge: {
    backgroundColor: '#2A97EE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#2A97EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  kidsBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sloganText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sloganSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  skipButton: {
    position: 'absolute',
    bottom: 36,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  skipButtonText: {
    color: '#2A97EE',
    fontSize: 13,
    fontWeight: '800',
  },
});
