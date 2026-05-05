// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CERTIFICATE OF ATTENDANCE PDF GENERATOR
// ═══════════════════════════════════════════════════════════════════════
// Issue #36 FIX: Auto-issue certificates on check-in

import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface CertificateData {
  attendeeName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  certificateNumber: string
  issuedAt: string
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    padding: 0,
  },
  // Outer border decoration
  outerBorder: {
    margin: 20,
    border: '3px solid #006700',
    padding: 4,
    flex: 1,
  },
  innerBorder: {
    border: '1px solid #006700',
    flex: 1,
    padding: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Header
  headerBadge: {
    backgroundColor: '#006700',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 20,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // Organization
  orgName: {
    fontSize: 22,
    color: '#006700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  orgSub: {
    fontSize: 11,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Certificate text
  certText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 12,
  },
  attendeeName: {
    fontSize: 30,
    color: '#006700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    borderBottom: '2px solid #006700',
    paddingBottom: 8,
  },
  certBody: {
    fontSize: 12,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 1.6,
  },
  eventTitle: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #CCCCCC',
  },
  sigBlock: {
    alignItems: 'center',
    flex: 1,
  },
  sigLine: {
    borderBottom: '1px solid #444444',
    width: 140,
    marginBottom: 6,
  },
  sigLabel: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
  },
  certNumber: {
    fontSize: 8,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 20,
  },
})

function CertificateDocument({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Header badge */}
            <View style={styles.headerBadge}>
              <Text style={styles.headerText}>Certificate of Attendance</Text>
            </View>

            {/* Org name */}
            <Text style={styles.orgName}>IndabaX Kenya</Text>
            <Text style={styles.orgSub}>Deep Learning Indaba — Kenya Chapter</Text>

            {/* Certificate body */}
            <Text style={styles.certText}>This is to certify that</Text>
            <Text style={styles.attendeeName}>{data.attendeeName}</Text>
            <Text style={styles.certBody}>attended and successfully participated in</Text>
            <Text style={styles.eventTitle}>{data.eventTitle}</Text>
            <Text style={styles.eventDetails}>
              {data.eventDate}
              {data.eventLocation ? `  ·  ${data.eventLocation}` : ''}
            </Text>

            {/* Signature row */}
            <View style={styles.footerRow}>
              <View style={styles.sigBlock}>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>IndabaX Kenya Organising Committee</Text>
              </View>
              <View style={styles.sigBlock}>
                <Text style={[styles.sigLabel, { marginBottom: 4 }]}>Issued: {data.issuedAt}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Date of Issue</Text>
              </View>
            </View>

            <Text style={styles.certNumber}>Certificate No: {data.certificateNumber}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const buffer = await renderToBuffer(<CertificateDocument data={data} />)
  return buffer as Buffer
}
