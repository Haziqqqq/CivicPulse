import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import axios from 'axios'

const API_URL = 'http://192.168.68.100:4000'

interface Report {
  id: string
  issue_type: string
  severity: string
  status: string
  description: string
  address: string
  department: string
  sla_deadline: string
  created_at: string
}

const severityColor = (s: string) => s === 'critical' ? '#dc2626' : s === 'high' ? '#ea580c' : s === 'medium' ? '#d97706' : '#16a34a'

export default function HomeScreen() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports`)
      setReports(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  return (
    <View style={styles.container}>
      {/* Header stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{reports.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#dc2626' }]}>{reports.filter(r => r.status === 'open').length}</Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#16a34a' }]}>{reports.filter(r => r.status === 'resolved').length}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#ea580c' }]}>
            {reports.filter(r => r.status === 'open' && new Date() > new Date(r.sla_deadline)).length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Report list */}
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports() }} />}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<Text style={styles.muted}>No reports yet.</Text>}
          renderItem={({ item: r }) => (
            <View style={[styles.card, r.status === 'resolved' && styles.cardResolved]}>
              <View style={styles.cardTop}>
                <View style={[styles.sevDot, { backgroundColor: severityColor(r.severity) }]} />
                <Text style={styles.cardType}>{r.issue_type.charAt(0).toUpperCase() + r.issue_type.slice(1)}</Text>
                <View style={[styles.statusPill, { backgroundColor: r.status === 'resolved' ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={[styles.statusText, { color: r.status === 'resolved' ? '#16a34a' : '#dc2626' }]}>
                    {r.status === 'resolved' ? '✓ Resolved' : '● Open'}
                  </Text>
                </View>
              </View>
              {r.description ? <Text style={styles.cardDesc} numberOfLines={2}>{r.description}</Text> : null}
              <View style={styles.cardBottom}>
                <Text style={styles.cardMeta}>📍 {r.address}</Text>
                <Text style={styles.cardMeta}>{r.department}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f4' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2ddd6', padding: 16, gap: 8 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '300', color: '#111827' },
  statLabel: { fontSize: 10, color: '#9a9486', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#9a9486', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#e2ddd6' },
  cardResolved: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  cardType: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 10 },
  cardBottom: { gap: 2 },
  cardMeta: { fontSize: 11, color: '#9a9486' },
})