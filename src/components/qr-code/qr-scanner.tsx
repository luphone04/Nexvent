'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (error: string) => void
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameras, setCameras] = useState<string[]>([])

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices.map(d => d.id))
      }
    }).catch(err => {
      console.error('Error getting cameras:', err)
      setError('Unable to access cameras')
    })

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError('')
      const scannerId = 'qr-scanner-' + Math.random()
      scannerRef.current = new Html5Qrcode(scannerId)

      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Success callback
          onScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Error callback (fires continuously, so we don't show these)
          // Only log critical errors
        }
      )

      setIsScanning(true)
    } catch (err) {
      const errorMsg = 'Failed to start camera. Please allow camera access.'
      setError(errorMsg)
      if (onScanError) onScanError(errorMsg)
      console.error('Scanner error:', err)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div
        id={`qr-scanner-${Math.random()}`}
        className="w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-gray-300"
        style={{ minHeight: isScanning ? '300px' : '0' }}
      />

      <div className="flex justify-center gap-3">
        {!isScanning ? (
          <Button onClick={startScanning} size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Scanner
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="outline" size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop Scanner
          </Button>
        )}
      </div>

      {isScanning && (
        <div className="text-center text-sm text-gray-600">
          <p>Position the QR code within the frame</p>
          <p className="text-xs text-gray-500 mt-1">Scanning will happen automatically</p>
        </div>
      )}
    </div>
  )
}
