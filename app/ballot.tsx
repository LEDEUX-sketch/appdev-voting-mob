import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassPanel } from '@/components/GlassPanel';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { StatusModal } from '@/components/StatusModal';
import { Colors, Spacing } from '@/constants/theme';
import api from '@/services/api';
import { CircleCheck, Circle, Send, ArrowLeft, Info } from 'lucide-react-native';

export default function BallotScreen() {
  const { id, title } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'error' as any, title: '', message: '' });
  const router = useRouter();

  useEffect(() => {
    fetchBallot();
  }, [id]);

  const fetchBallot = async () => {
    try {
      const response = await api.get(`/api/active-elections/${id}/ballot/`);
      setPositions(response.data);
    } catch (error) {
      console.error('Failed to fetch ballot:', error);
      Alert.alert('Error', 'Unable to load ballot details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (positionId: number, candidateId: number, maxAllowed: number) => {
    const currentSelected = selections[positionId] || [];
    
    if (currentSelected.includes(candidateId)) {
      // Remove selection
      setSelections({
        ...selections,
        [positionId]: currentSelected.filter(cid => cid !== candidateId)
      });
    } else {
      // Add selection if under limit
      if (currentSelected.length < maxAllowed) {
        setSelections({
          ...selections,
          [positionId]: [...currentSelected, candidateId]
        });
      } else if (maxAllowed === 1) {
        // Swap if only 1 allowed
        setSelections({
          ...selections,
          [positionId]: [candidateId]
        });
      } else {
        Alert.alert('Limit Reached', `You can only select up to ${maxAllowed} candidates for this position.`);
      }
    }
  };

  const handleSubmit = async () => {
    // Validate that at least some votes are cast (optional: validate all positions)
    const selectedCandidateIds = Object.values(selections).flat();
    
    if (selectedCandidateIds.length === 0) {
      Alert.alert('Empty Ballot', 'Please select at least one candidate before submitting.');
      return;
    }

    setShowConfirmModal(true);
  };

  const processSubmission = async () => {
    setSubmitting(true);
    try {
      const voterDataStr = await AsyncStorage.getItem('voter_data');
      if (!voterDataStr) throw new Error('No voter data found');
      
      const voterData = JSON.parse(voterDataStr);
      
      await api.post('/api/voter/submit-vote/', {
        student_id: voterData.student_id,
        token: voterData.token,
        election_id: id,
        selections: Object.values(selections).flat(),
      });

      // Automatically log out after voting
      await AsyncStorage.removeItem('voter_data');

      router.replace('/success');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to submit ballot.';
      setStatusModal({ 
        visible: true, 
        type: 'error', 
        title: 'Submission Failed', 
        message: msg 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Preparing digital ballot...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.electionHeader}>
          <Text style={styles.electionTitleLabel}>ELECTION BALLOT</Text>
          <Text style={styles.electionTitle}>{title}</Text>
          <View style={styles.instructionBox}>
            <Info size={16} color={Colors.success} />
            <Text style={styles.instructionText}>Select your preferred candidates for each position.</Text>
          </View>
        </View>

        {positions.map((position) => (
          <View key={position.id} style={styles.positionSection}>
            <View style={styles.positionHeader}>
              <Text style={styles.positionName}>{position.name}</Text>
              <Text style={styles.voteLimitText}>
                {position.max_votes_allowed > 1 
                  ? `Select up to ${position.max_votes_allowed}` 
                  : 'Select 1 candidate'}
              </Text>
            </View>

            {position.candidates.map((candidate: any) => {
              const isSelected = (selections[position.id] || []).includes(candidate.id);
              return (
                <TouchableOpacity
                  key={candidate.id}
                  activeOpacity={0.7}
                  onPress={() => toggleSelection(position.id, candidate.id, position.max_votes_allowed)}
                >
                  <GlassPanel 
                    style={[
                      styles.candidateCard, 
                      isSelected && styles.candidateCardSelected
                    ]}
                    intensity={isSelected ? 30 : 20}
                  >
                    <View style={styles.candidateRow}>
                      <View style={styles.candidateInfo}>
                        <Text style={styles.candidateName}>{candidate.name}</Text>
                        <Text style={styles.partylistText}>
                          {candidate.partylist_name || 'Independent'}
                        </Text>
                      </View>
                      {isSelected ? (
                        <CircleCheck size={28} color={Colors.success} fill="rgba(16, 185, 129, 0.2)" />
                      ) : (
                        <Circle size={28} color={Colors.surfaceBorder} />
                      )}
                    </View>
                  </GlassPanel>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Cast Final Ballot</Text>
              <Send size={20} color="#fff" style={{marginLeft: 10}} />
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.footerSpacer} />
      </ScrollView>

      <ConfirmationModal 
        visible={showConfirmModal}
        title="Confirm Your Vote"
        message="Are you sure you want to cast your final ballot? This action is permanent and cannot be reversed."
        confirmText="Submit Vote"
        onConfirm={() => {
          setShowConfirmModal(false);
          processSubmission();
        }}
        onCancel={() => setShowConfirmModal(false)}
      />

      <StatusModal 
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  electionHeader: {
    marginBottom: 30,
  },
  electionTitleLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  electionTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  instructionText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '500',
  },
  positionSection: {
    marginBottom: 30,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  positionName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  voteLimitText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  candidateCard: {
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  candidateCardSelected: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  partylistText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: Colors.success,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 15,
  },
  footerSpacer: {
    height: 60,
  }
});
