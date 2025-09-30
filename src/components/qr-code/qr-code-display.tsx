'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

interface QRCodeDisplayProps {
  data: string | object
  size?: number
  filename?: string
  showDownload?: boolean
}

export function QRCodeDisplay({
  data,
  size = 300,
  filename = 'qr-code.png',
  showDownload = true
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    generateQRCode()
  }, [data, size])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError('')

      // Convert object to JSON string if needed
      const qrData = typeof data === 'string' ? data : JSON.stringify(data)

      const url = await QRCode.toDataURL(qrData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      setQrCodeUrl(url)
    } catch (err) {
      setError('Failed to generate QR code')
      console.error('QR code generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    if (!qrCodeUrl) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            <img src="${qrCodeUrl}" alt="QR Code" />
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-500">Generating QR code...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <img
          src={qrCodeUrl}
          alt="QR Code"
          className="border-2 border-gray-200 rounded-lg"
        />
      </div>

      {showDownload && (
        <div className="flex gap-3 justify-center">
          <Button onClick={handleDownload} variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
        </div>
      )}
    </div>
  )
}
