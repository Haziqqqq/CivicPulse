import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import axios from 'axios'

const API_URL = 'http://192.168.68.100:4000'

export default function ReportScreen() {
  const [photo, setPhoto] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<any>(null)
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<'idle' | 'locating' | 'submitting' | 'success'>('idle')

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })
    if (!result.canceled) setPhoto(result.assets[0])
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access'); return }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!result.canceled) setPhoto(result.assets[0])
  }

  const getLocation = async () => {
    setStatus('locating')
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setLocation({ latitude: 4.9400, longitude: 114.9480 })
      setAddress('Bandar Seri Begawan, Brunei')
      setStatus('idle')
      return
    }
    const loc = await Location.getCurrentPositionAsync({})
    setLocation(loc.coords)
    const geo = await Location.reverseGeocodeAsync(loc.coords)
    if (geo[0]) {
      setAddress(`${geo[0].street || ''} ${geo[0].city || ''}, ${geo[0].country || ''}`.trim())
    }
    setStatus('idle')
  }

  const submit = async () => {
    if (!photo) { Alert.alert('Photo required', 'Please take or upload a photo'); return }
    if (!location) { Alert.alert('Location required', 'Please get your location first'); return }
    setStatus('submitting')
    try {
      const form = new FormData()
      form.append('photo', { uri: photo.uri, type: 'image/jpeg', name: 'report.jpg' } as any)
      form.append('description', description)
      form.append('latitude', String(location.latitude))
      form.append('longitude', String(location.longitude))
      form.append('address', address)
      await axios.post(`${API_URL}/reports`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setStatus('success')
    } catch (e) {
      Alert.alert('Error', 'Failed to submit. Make sure backend is running.')
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>✅</Text>
        <Text style={styles.successTitle}>Report Filed!</Text>
        <Text style={styles.successSub}>Your report has been submitted and routed to the right department.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => { setStatus('idle'); setPhoto(null); setDescription(''); setLocation(null) }}>
          <Text style={styles.btnPrimaryText}>Report Another</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text style={styles.heading}>Report an Issue</Text>
      <Text style={styles.subheading}>Snap a photo and our AI will classify and route it automatically.</Text>

      {/* Photo */}
      <View>
        <Text style={styles.label}>Photo *</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnIcon}>📷</Text>
            <Text style={styles.photoBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
            <Text style={styles.photoBtnIcon}>🖼️</Text>
            <Text style={styles.photoBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        {photo && (
          <View style={styles.photoPreview}>
            <Text style={styles.photoSelected}>✓ Photo selected</Text>
            <TouchableOpacity onPress={() => setPhoto(null)}>
              <Text style={{ color: '#e63329', fontSize: 12 }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Description */}
      <View>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Describe the issue..."
          placeholderTextColor="#9a9486"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Location */}
      <View>
        <Text style={styles.label}>Location *</Text>
        <TouchableOpacity
          style={[styles.locBtn, location && styles.locBtnGot]}
          onPress={getLocation}
          disabled={status === 'locating'}
        >
          <Text style={styles.locBtnText}>
            {status === 'locating' ? '⏳ Getting location...' : location ? `✓ ${address.slice(0, 50)}` : '📍 Use my current location'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.btnPrimary, (!photo || !location) && styles.btnDisabled]}
        onPress={submit}
        disabled={status === 'submitting' || !photo || !location}
      >
        {status === 'submitting' ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnPrimaryText}>📨 Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f4' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  heading: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subheading: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2ddd6', borderRadius: 10, padding: 20, alignItems: 'center', gap: 8 },
  photoBtnIcon: { fontSize: 28 },
  photoBtnText: { fontSize: 13, fontWeight: '500', color: '#111827' },
  photoPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8 },
  photoSelected: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  textarea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2ddd6', borderRadius: 10, padding: 14, fontSize: 14, color: '#111827', minHeight: 100, textAlignVertical: 'top' },
  locBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2ddd6', borderRadius: 10, padding: 16 },
  locBtnGot: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  locBtnText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  btnPrimary: { backgroundColor: '#e63329', borderRadius: 10, padding: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: 'white', fontSize: 15, fontWeight: '600' },
  successTitle: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 12 },
  successSub: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
})