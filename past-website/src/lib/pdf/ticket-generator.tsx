// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SERVER-SIDE TICKET PDF GENERATOR
// ═══════════════════════════════════════════════════════════════════════
// Generate ticket PDFs on the server for email attachments

import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import QRCode from 'qrcode'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface TicketPDFData {
  ticketNumber: string
  qrCodeData: string
  attendeeName: string
  attendeeEmail: string
  attendeeOrganization?: string
  eventTitle: string
  eventDate: string
  eventTime?: string
  eventLocation: string
  eventVenue?: string
  ticketType: string
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  container: {
    border: '2px solid #006700',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#006700',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  ticketBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#006700',
    textTransform: 'uppercase',
  },
  body: {
    padding: 20,
    flexDirection: 'row',
  },
  mainInfo: {
    flex: 2,
  },
  qrSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
    borderLeft: '1px dashed #CCCCCC',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
  },
  qrCode: {
    width: 140,
    height: 140,
  },
  qrLabel: {
    fontSize: 8,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  ticketNumberLabel: {
    fontSize: 8,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
  ticketNumberValue: {
    fontSize: 10,
    color: '#000000',
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderTop: '1px solid #CCCCCC',
  },
  footerText: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 7,
    color: '#CC0000',
    textAlign: 'center',
    marginTop: 4,
  },
})

// ═══════════════════════════════════════════════════════════════════════
// PDF GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate ticket PDF as a buffer for email attachment
 * @param data - Ticket data
 * @returns PDF buffer
 */
export async function generateTicketPDF(data: TicketPDFData): Promise<Buffer> {
  try {
    // Generate QR code with high error correction for better scanning
    const qrCodeDataUrl = await QRCode.toDataURL(data.qrCodeData, {
      width: 400,  // Increased from 300 for better quality
      margin: 4,   // Increased margin for better scanning
      errorCorrectionLevel: 'H',  // Highest error correction (30% recovery)
      type: 'image/png',
      color: {
        dark: '#000000',  // Pure black for better contrast
        light: '#FFFFFF'
      }
    })

    // Create PDF document using JSX
    const ticketDocument = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.logo}>IndabaX Kenya</Text>
                <Text style={styles.eventTitle}>{data.eventTitle}</Text>
              </View>
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeText}>{data.ticketType} Ticket</Text>
              </View>
            </View>

            {/* Body */}
            <View style={styles.body}>
              {/* Main Info */}
              <View style={styles.mainInfo}>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Attendee Name</Text>
                  <Text style={styles.sectionValue}>{data.attendeeName}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Email</Text>
                  <Text style={styles.sectionValue}>{data.attendeeEmail}</Text>
                </View>

                {data.attendeeOrganization && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Organization</Text>
                    <Text style={styles.sectionValue}>{data.attendeeOrganization}</Text>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Event Date</Text>
                  <Text style={styles.sectionValue}>
                    {data.eventDate}{data.eventTime ? ` • ${data.eventTime}` : ''}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Location</Text>
                  <Text style={styles.sectionValue}>
                    {data.eventLocation}{data.eventVenue ? ` • ${data.eventVenue}` : ''}
                  </Text>
                </View>
              </View>

              {/* QR Code Section */}
              <View style={styles.qrSection}>
                <Image src={qrCodeDataUrl} style={styles.qrCode} />
                <Text style={styles.qrLabel}>Scan at event entrance</Text>
                <Text style={styles.ticketNumberLabel}>Ticket Number</Text>
                <Text style={styles.ticketNumberValue}>{data.ticketNumber}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Please present this ticket (digital or printed) at the event entrance
              </Text>
              <Text style={styles.warningText}>
                ⚠ This ticket is non-transferable and valid for one person only
              </Text>
            </View>
          </View>
        </Page>
      </Document>
    )

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(ticketDocument)

    return pdfBuffer
  } catch (error) {
    console.error('Error generating ticket PDF:', error)
    throw new Error('Failed to generate ticket PDF')
  }
}

/**
 * Generate filename for ticket PDF
 * @param ticketNumber - Ticket number
 * @param eventTitle - Event title
 * @returns Sanitized filename
 */
export function generateTicketFilename(ticketNumber: string, eventTitle: string): string {
  const sanitizedEvent = eventTitle.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
  return `IndabaX-Kenya-Ticket-${sanitizedEvent}-${ticketNumber}.pdf`
}
