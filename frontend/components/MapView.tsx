'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

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
  latitude: number
  longitude: number
  duplicate_count: number
  original_report_id: string | null
}

function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap()
  useEffect(() => {
    if (reports.length > 0) {
      const valid = reports.filter(r => r.latitude && r.longitude)
      if (valid.length > 0) {
        map.setView([valid[0].latitude, valid[0].longitude], 13)
      }
    }
  }, [reports, map])
  return null
}

export default function MapView({ reports, onSelect, severityColor }: {
  reports: Report[]
  onSelect: (r: Report) => void
  severityColor: (sev: string) => string
}) {
  const valid = reports.filter(r => r.latitude && r.longitude)

  return (
    <MapContainer
      center={[4.9400, 114.9480]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {valid.length > 0 && <FitBounds reports={valid} />}
      {valid.map(report => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={report.severity === 'critical' ? 14 : report.severity === 'high' ? 11 : 8}
          fillColor={severityColor(report.severity)}
          color="white"
          weight={2}
          opacity={1}
          fillOpacity={report.status === 'resolved' ? 0.4 : 0.9}
          eventHandlers={{ click: () => onSelect(report) }}
        />
      ))}
    </MapContainer>
  )
}