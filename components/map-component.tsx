"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Define the type for survey data
interface SurveyData {
  id: string
  location: [number, number]
  donkeyCount: number
  healthStatus: string
  ownerName: string | null
  timestamp: string
}

export function MapComponent() {
  const [surveyData, setSurveyData] = useState<SurveyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Custom donkey icon
  const donkeyIcon = new L.Icon({
    iconUrl: "/donkey-icon.svg", // This would be a custom SVG
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })

  // Fetch survey data
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setIsLoading(true)

        // In production, this would be replaced with:
        // const response = await fetch('/api/surveys/approved');
        // const data = await response.json();
        // setSurveyData(data);

        // For now, use empty state until connected to backend
        setSurveyData([])
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching survey data:", error)
        setSurveyData([])
        setIsLoading(false)
      }
    }

    fetchSurveyData()
  }, [])

  // Fallback for when Leaflet is not available (SSR)
  if (typeof window === "undefined") {
    return <div className="h-full w-full bg-muted flex items-center justify-center">Loading map...</div>
  }

  return (
    <>
      {isLoading ? (
        <div className="h-full w-full bg-muted flex items-center justify-center">Loading map data...</div>
      ) : (
        <MapContainer
          center={[-3.3984, 38.5618]} // Center on Taita Taveta County
          zoom={10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {surveyData.map((data) => (
            <Marker
              key={data.id}
              position={data.location}
              icon={donkeyIcon}
              // Add animation effect
              eventHandlers={{
                add: (e) => {
                  const marker = e.target
                  // Simple bounce animation
                  const bounceAnimation = () => {
                    marker._icon.style.transform = `${marker._icon.style.transform} translateY(-10px)`
                    setTimeout(() => {
                      if (marker._icon) {
                        marker._icon.style.transform = marker._icon.style.transform.replace(" translateY(-10px)", "")
                      }
                    }, 500)
                  }
                  bounceAnimation()
                  // Repeat animation every 3 seconds
                  const interval = setInterval(bounceAnimation, 3000)
                  marker._bouncingInterval = interval
                },
                remove: (e) => {
                  clearInterval(e.target._bouncingInterval)
                },
              }}
            >
              <Popup>
                <Card className="border-none shadow-none">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-lg text-[#1A4314]">Donkey Information</CardTitle>
                    <CardDescription>Recorded on {new Date(data.timestamp).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-1">
                      <p>
                        <strong>Number of Donkeys:</strong> {data.donkeyCount}
                      </p>
                      <p>
                        <strong>Health Status:</strong> {data.healthStatus}
                      </p>
                      {data.ownerName && (
                        <p>
                          <strong>Owner:</strong> {data.ownerName}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </>
  )
}

