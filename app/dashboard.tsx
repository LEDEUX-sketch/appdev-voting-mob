import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassPanel } from '@/components/GlassPanel';
import { Colors } from '@/constants/theme';
import api from '@/services/api';
import { Vote, Calendar, ChevronRight, LogOut, Info, RefreshCw } from 'lucide-react-native';

export default function DashboardScreen() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voterName, setVoterName] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const studentDataStr = await AsyncStorage.getItem('voter_data');
      if (studentDataStr) {
        const data = JSON.parse(studentDataStr);
        setVoterName(data.name);
      } else {
        router.replace('/login');
        return;
      }

      const response = await api.get('/api/active-elections/');
      setElections(response.data);
    } catch (error) {
      console.error('Failed to fetch elections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('voter_data');
    router.replace('/login');
  };

  const renderElectionItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/ballot', params: { id: item.id, title: item.title } })}
    >
      <GlassPanel style={styles.electionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Vote size={24} color={Colors.primary} />
          </View>
          <View style={styles.cardTitleArea}>
            <Text style={styles.electionTitle}>{item.title}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={Colors.textMuted} />
              <Text style={styles.dateText}>
                Ends: {new Date(item.end_date).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </View>
      </GlassPanel>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.voterName}>{voterName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerBtn, { marginRight: 10 }]} 
            onPress={onRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw 
              size={20} 
              color={Colors.primary} 
              style={refreshing ? { transform: [{ rotate: '45deg' }] } : {}} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, styles.logoutBtn]} onPress={handleLogout}>
            <LogOut size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active Elections</Text>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching available ballots...</Text>
        </View>
      ) : elections.length > 0 ? (
        <FlatList
          data={elections}
          renderItem={renderElectionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <GlassPanel style={styles.emptyCard}>
            <Info size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Active Elections</Text>
            <Text style={styles.emptyText}>
              There are currently no elections accepting votes. Please check back later.
            </Text>
          </GlassPanel>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  welcomeText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  voterName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 1,
  },
  list: {
    gap: 15,
    paddingBottom: 40,
  },
  electionCard: {
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleArea: {
    flex: 1,
  },
  electionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  }
});
