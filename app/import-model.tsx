import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/utils/colors';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { LlamaCpp } from '../../modules/llama-cpp/src/index';
import { useSettingsStore } from '../../src/stores/settingsStore';

const MODEL_DIR = `${FileSystem.documentDirectory}models`;

export default function ImportModelScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { setModelDownloaded } = useSettingsStore();

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);

  const ensureModelDir = async () => {
    const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
    }
  };

  const handleImportModel = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/octet-stream',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      if (!file.name.endsWith('.gguf')) {
        Alert.alert(
          'Invalid File',
          'Please select a GGUF model file (.gguf extension)',
          [{ text: 'OK' }]
        );
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
      
      setSelectedFile({
        name: file.name,
        size: fileInfo.size,
        uri: file.uri,
      });

      Alert.alert(
        'Import Model',
        `File: ${file.name}\nSize: ${fileSizeMB} MB\n\nDo you want to import this model?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: () => copyModel(file),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
      console.error(error);
    }
  }, []);

  const copyModel = async (file: { name: string; uri: string }) => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      await ensureModelDir();

      const destPath = `${MODEL_DIR}/${file.name}`;
      
      const existingInfo = await FileSystem.getInfoAsync(destPath);
      if (existingInfo.exists) {
        await FileSystem.deleteAsync(destPath);
      }

      setImportProgress(30);

      const copyResult = await FileSystem.copyAsync({
        from: file.uri,
        to: destPath,
      });

      setImportProgress(70);

      // Try to load the model with LlamaCpp
      try {
        const loaded = await LlamaCpp.loadModel(destPath);
        if (loaded) {
          setImportProgress(100);
          // Update settings to mark model as downloaded
          setModelDownloaded(destPath);
          
          setTimeout(() => {
            setIsImporting(false);
            setImportProgress(0);
            setSelectedFile(null);
            
            Alert.alert(
              'Success!',
              `Model "${file.name}" has been imported and loaded successfully.\n\nThe model is ready to use with the offline AI agent.`,
              [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]
            );
          }, 500);
          return;
        }
      } catch (loadError) {
        console.warn('Model loaded in mock mode:', loadError);
        // Even if native load fails (mock mode), still save the path
        setModelDownloaded(destPath);
      }

      setImportProgress(100);
      
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        setSelectedFile(null);
        
        Alert.alert(
          'Success!',
          `Model "${file.name}" has been imported successfully.\n\nModel path: ${destPath}`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }, 500);
    } catch (error) {
      setIsImporting(false);
      setImportProgress(0);
      Alert.alert(
        'Import Failed',
        `Failed to import model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error(error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }]} entering={FadeIn}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Import GGUF Model</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Import a GGUF model file from your device storage
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Supported Formats</Text>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              GGUF format (Quantized models)
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Q4_K_M, Q5_K_M, Q6_K, Q8_0 quantizations
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Recommended: 1.5B - 7B parameter models
            </Text>
          </View>
        </Animated.View>

        {selectedFile && (
          <Animated.View entering={FadeInDown.delay(300)} style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Selected File</Text>
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <View style={styles.fileDetails}>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={[styles.fileSize, { color: colors.textTertiary }]}>
                  {formatFileSize(selectedFile.size)}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {isImporting && (
          <Animated.View entering={FadeInDown} style={[styles.card, styles.progressCard]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Importing...</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${importProgress}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                {importProgress}%
              </Text>
            </View>
            <Text style={[styles.progressHint, { color: colors.textTertiary }]}>
              Large files may take several minutes to copy
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(400)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.importButton,
              {
                backgroundColor: isImporting ? colors.borderLight : colors.primary,
              },
            ]}
            onPress={handleImportModel}
            disabled={isImporting}
            activeOpacity={0.8}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="folder-open-outline" size={24} color="#fff" />
                <Text style={styles.importButtonText}>Select GGUF File</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.hintCard}>
          <Ionicons name="lightbulb-outline" size={20} color={colors.warning} />
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Tip: Download models from Hugging Face or use models converted to GGUF format for best performance on mobile devices.
          </Text>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
  },
  progressCard: {
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  progressHint: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});