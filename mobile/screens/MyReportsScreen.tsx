import { View, Text, StyleSheet } from 'react-native'

export default function MyReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📋</Text>
      <Text style={styles.title}>My Reports</Text>
      <Text style={styles.sub}>Reports you submit will appear here so you can track their status.</Text>
      <Text style={styles.coming}>Coming soon — submit a report first!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f4', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  coming: { fontSize: 12, color: '#9a9486', fontStyle: 'italic' },
})