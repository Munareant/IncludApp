import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface RatingModalProps {
    visible: boolean;
    requestId: string | number;
    reviewerId: string | number;
    reviewedUserId: string | number;
    reviewedUserName?: string;
    onClose: () => void;
    onSubmitSuccess: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
    visible,
    requestId,
    reviewerId,
    reviewedUserId,
    reviewedUserName = 'utilizator',
    onClose,
    onSubmitSuccess,
}) => {
    const [rating, setRating] = useState<number>(5);
    const [feedback, setFeedback] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    if (!visible) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Atentie', 'Te rugam sa selectezi cel putin o stea.');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${API_BASE_URL}/api/users/rate`, {
                requestId,
                reviewerId,
                reviewedUserId,
                score: rating,
                comment: feedback.trim(),
            });

            Alert.alert('Multumim!', 'Recenzia ta a fost salvata cu succes.');
            onSubmitSuccess();
            onClose();
        } catch (error: any) {
            Alert.alert(
                'Eroare',
                error.response?.data?.error || 'Nu am putut trimite recenzia. Incearca din nou.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Evaluare Experiență</Text>
          <Text style={styles.subtitle}>
            Cum a decurs colaborarea cu <Text style={styles.userName}>{reviewedUserName}</Text>?
          </Text>

          {/* Stele de rating */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starTouch}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={34}
                  color={star <= rating ? '#f59e0b' : '#475569'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Câmp feedback opțional */}
          <TextInput
            style={styles.input}
            placeholder="Lasă o scurtă impresie despre misiune..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
            value={feedback}
            onChangeText={setFeedback}
          />

          {/* Butoane acțiune */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.skipBtnText}>Mai târziu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Trimite Recenzia</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  userName: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
  },
  starTouch: {
    padding: 2,
    marginHorizontal: 4,
  },
  input: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 13,
    padding: 12,
    minHeight: 75,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  skipBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});