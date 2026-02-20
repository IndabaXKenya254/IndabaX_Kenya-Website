'use client'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET PDF COMPONENT (PHASE 8)
// ═══════════════════════════════════════════════════════════════════════════
// PDF ticket generation using @react-pdf/renderer

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TicketData {
  ticketNumber: string
  qrCodeDataUrl: string
  attendee: {
    name: string
    email: string
    organization?: string
  }
  event: {
    title: string
    date: string
    time?: string
    location: string
    venue?: string
  }
  ticketType: string
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

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
    marginBottom: 15,
  },
  label: {
    fontSize: 9,
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
    color: '#333333',
    fontWeight: 'bold',
  },
  attendeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006700',
    marginBottom: 2,
  },
  attendeeEmail: {
    fontSize: 10,
    color: '#666666',
  },
  qrCode: {
    width: 120,
    height: 120,
  },
  ticketNumber: {
    fontSize: 10,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #EEEEEE',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 8,
    color: '#999999',
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 10,
    color: '#333333',
    marginTop: 2,
  },
  instructions: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 5,
    border: '1px solid #FFE082',
  },
  instructionsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  divider: {
    borderBottom: '1px dashed #CCCCCC',
    marginVertical: 15,
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TicketPDF({ data }: { data: TicketData }) {
  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.logo}>IndabaX Kenya</Text>
              <Text style={styles.eventTitle}>{data.event.title}</Text>
            </View>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>{data.ticketType} Ticket</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Main Info */}
            <View style={styles.mainInfo}>
              {/* Attendee */}
              <View style={styles.section}>
                <Text style={styles.label}>Attendee</Text>
                <Text style={styles.attendeeName}>{data.attendee.name}</Text>
                <Text style={styles.attendeeEmail}>{data.attendee.email}</Text>
                {data.attendee.organization && (
                  <Text style={styles.attendeeEmail}>{data.attendee.organization}</Text>
                )}
              </View>

              {/* Event Details */}
              <View style={styles.section}>
                <Text style={styles.label}>Date & Time</Text>
                <Text style={styles.value}>{data.event.date}</Text>
                {data.event.time && (
                  <Text style={styles.footerValue}>{data.event.time}</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Venue</Text>
                <Text style={styles.value}>{data.event.venue || data.event.location}</Text>
                {data.event.venue && (
                  <Text style={styles.footerValue}>{data.event.location}</Text>
                )}
              </View>
            </View>

            {/* QR Code */}
            <View style={styles.qrSection}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={styles.qrCode} src={data.qrCodeDataUrl} />
              <Text style={styles.ticketNumber}>{data.ticketNumber}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Ticket ID</Text>
              <Text style={styles.footerValue}>{data.ticketNumber}</Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Type</Text>
              <Text style={styles.footerValue}>{data.ticketType}</Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Status</Text>
              <Text style={styles.footerValue}>VALID</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Important Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Please bring this ticket (printed or on your phone) to the event.{'\n'}
            2. Present the QR code at the registration desk for check-in.{'\n'}
            3. This ticket is non-transferable and valid for one person only.{'\n'}
            4. For any queries, contact: accounts@deeplearningindabaxkenya.com
          </Text>
        </View>
      </Page>
    </Document>
  )
}
