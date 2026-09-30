import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Category } from '../types';
import { THEME } from '../constants/theme';
import { Layers } from 'lucide-react-native';

interface FolderTabsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const FolderTabs: React.FC<FolderTabsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Folders tab */}
        <TouchableOpacity
          style={[
            styles.tab,
            selectedCategoryId === null && styles.tabActive,
          ]}
          onPress={() => onSelectCategory(null)}
          activeOpacity={0.7}
        >
          <Layers size={14} color="#FFFFFF" />
          <Text
            style={[
              styles.tabText,
              selectedCategoryId === null && styles.tabTextActive,
            ]}
          >
            Tudo
          </Text>
        </TouchableOpacity>

        {/* Custom Category Folders */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tab,
                isSelected && styles.tabActive,
              ]}
              onPress={() => onSelectCategory(isSelected ? null : cat.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{cat.icon || '📁'}</Text>
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextActive,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#26262B',
    borderWidth: 1.5,
    borderColor: '#424248',
  },
  tabActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: '#F63C3C',
  },
  tabIcon: {
    fontSize: 13,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

});
