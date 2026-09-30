import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { KidProfile, KidAgeGroup } from '../types';
import { X, Plus, Check, Shield } from 'lucide-react-native';

interface Props {
  visible: boolean;
  profiles: KidProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (profile: KidProfile) => void;
  onClose: () => void;
  onOpenParental: () => void;
}

const AVATAR_OPTIONS = ['🦁', '🐼', '🚀', '🦄', '🦖', '🐬', '🦊', '🐯', '🌟', '🌈', '🦉', '🎨'];

export const ProfileSelectorModal: React.FC<Props> = ({
  visible,
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onClose,
  onOpenParental,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐼');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<KidAgeGroup>('6-8');

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newProfile: KidProfile = {
      id: `profile_${Date.now()}`,
      name: newName.trim(),
      avatarEmoji: selectedAvatar,
      ageGroup: selectedAgeGroup,
      dailyTimeLimitMinutes: 0, // 0 = Sem limite pré-fixado
      allowedChannelIds: [], // all channels allowed
      screenTimeBalanceMinutes: 30,
      bedtimeModeEnabled: true,
      realWorldMissionsEnabled: true,
    };
    onAddProfile(newProfile);
    setIsCreating(false);
    setNewName('');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Quem está assistindo?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isCreating ? (
            /* Create Profile Form */
            <ScrollView style={styles.createForm}>
              <Text style={styles.formTitle}>Novo Perfil Infantil</Text>

              <Text style={styles.label}>Nome da criança:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Theo, Alice..."
                placeholderTextColor="#777"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.label}>Escolha um Mascote:</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarPickBtn,
                      selectedAvatar === emoji && styles.avatarPickBtnActive,
                    ]}
                    onPress={() => setSelectedAvatar(emoji)}
                  >
                    <Text style={styles.avatarEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Faixa Etária:</Text>
              <View style={styles.ageRow}>
                {[
                  { id: '3-5' as KidAgeGroup, label: '3-5 anos' },
                  { id: '6-8' as KidAgeGroup, label: '6-8 anos' },
                  { id: '9-11' as KidAgeGroup, label: '9-11 anos' },
                  { id: '12+' as KidAgeGroup, label: '12+ anos' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.ageBtn,
                      selectedAgeGroup === item.id && styles.ageBtnActive,
                    ]}
                    onPress={() => setSelectedAgeGroup(item.id)}
                  >
                    <Text
                      style={[
                        styles.ageBtnText,
                        selectedAgeGroup === item.id && styles.ageBtnTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                  <Text style={styles.saveBtnText}>Criar Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Profiles Grid */
            <ScrollView contentContainerStyle={styles.profilesGrid}>
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[styles.profileCard, isActive && styles.profileCardActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelectProfile(profile.id);
                      onClose();
                    }}
                  >
                    <View
                      style={[
                        styles.profileAvatarBox,
                        isActive && styles.profileAvatarBoxActive,
                      ]}
                    >
                      <Text style={styles.profileAvatarText}>{profile.avatarEmoji}</Text>
                      {isActive && (
                        <View style={styles.activeCheckBadge}>
                          <Check size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    <Text style={[styles.profileName, isActive && styles.profileNameActive]}>
                      {profile.name}
                    </Text>

                    <View style={styles.agePill}>
                      <Text style={styles.agePillText}>{profile.ageGroup} anos</Text>
                    </View>

                    <Text style={styles.timeBalanceSub}>
                      🪙 {profile.screenTimeBalanceMinutes ?? 30} min disponíveis
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Add Profile Card */}
              <TouchableOpacity
                style={styles.addProfileCard}
                activeOpacity={0.7}
                onPress={() => setIsCreating(true)}
              >
                <View style={styles.addIconCircle}>
                  <Plus size={32} color="#A0A0B0" />
                </View>
                <Text style={styles.addProfileText}>Adicionar Filho</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Footer with Parental Link */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.parentalLink}
              onPress={() => {
                onClose();
                onOpenParental();
              }}
            >
              <Shield size={16} color="#A0A0B0" />
              <Text style={styles.parentalLinkText}>Gerenciar Perfis & Regras na Área Parental</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#161620',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#2A2A3C',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
  },
  profilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 10,
  },
  profileCard: {
    width: 130,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#1E1E2C',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileCardActive: {
    borderColor: '#E50914',
    backgroundColor: '#262638',
  },
  profileAvatarBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2D2D42',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  profileAvatarBoxActive: {
    backgroundColor: '#3E1014',
    borderWidth: 2,
    borderColor: '#E50914',
  },
  profileAvatarText: {
    fontSize: 38,
  },
  activeCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#E50914',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 4,
  },
  profileNameActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  agePill: {
    backgroundColor: '#2E2E44',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  agePillText: {
    color: '#A0A0C0',
    fontSize: 11,
    fontWeight: '600',
  },
  timeBalanceSub: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '700',
    marginTop: 2,
  },
  addProfileCard: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3A3A52',
  },
  addIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E1E2C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0B0',
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#242436',
    paddingTop: 14,
    alignItems: 'center',
  },
  parentalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parentalLinkText: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  // Create Form
  createForm: {
    maxHeight: 400,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E50914',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0B0',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#222232',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333348',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  avatarPickBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222232',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#333348',
  },
  avatarPickBtnActive: {
    borderColor: '#E50914',
    backgroundColor: '#3E1014',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  ageRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  ageBtn: {
    backgroundColor: '#222232',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333348',
  },
  ageBtnActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  ageBtnText: {
    color: '#A0A0B0',
    fontSize: 12,
    fontWeight: '600',
  },
  ageBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#E50914',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#222232',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#A0A0B0',
    fontSize: 13,
  },
});
