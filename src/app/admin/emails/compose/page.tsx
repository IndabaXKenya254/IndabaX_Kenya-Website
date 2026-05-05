'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL COMPOSER PAGE (PHASE 7 - DAY 3)
// ═══════════════════════════════════════════════════════════════════════
// Compose and send emails using templates with variable replacement
// Updated: Added form template selection for survey emails

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuillEditor } from '@/components/QuillEditor'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: string
  variables: string[]
}

interface FormTemplate {
  id: string
  name: string
  description: string
  usage_type: string
}

interface Event {
  id: string
  title: string
  slug: string
  start_date: string
  location: string
}

interface Recipient {
  email: string
  name: string
  variables?: Record<string, string>
}

type RecipientType = 'individual' | 'event' | 'csv' | 'manual'
type EmailPurpose = 'general' | 'survey' | 'acceptance' | 'rejection' | 'ticket'

export default function ComposeEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [events, setEvents] = useState<Event[]>([])

  // Form state
  const [emailPurpose, setEmailPurpose] = useState<EmailPurpose>('general')
  const [recipientType, setRecipientType] = useState<RecipientType>('individual')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [applicationStatuses, setApplicationStatuses] = useState<string[]>(['approved'])
  const [surveyDeadline, setSurveyDeadline] = useState<string>('')
  const [individualEmail, setIndividualEmail] = useState('')
  const [individualName, setIndividualName] = useState('')
  const [manualEmails, setManualEmails] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvColumns, setCsvColumns] = useState<string[]>([]) // Track CSV column headers
  const [csvSampleData, setCsvSampleData] = useState<Record<string, string>>({}) // First row sample data
  const [csvRowCount, setCsvRowCount] = useState(0) // Number of data rows
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ccEmails, setCcEmails] = useState('')
  const [bccEmails, setBccEmails] = useState('')
  const [showCsvHelp, setShowCsvHelp] = useState(false)

  // Preview state - uses current year dynamically
  const currentYear = new Date().getFullYear()
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, string>>({
    name: 'John Doe',
    email: 'john@example.com',
    event_title: `IndabaX Kenya ${currentYear}`,
    event_date: 'TBD (set in database)',
    event_location: 'Nairobi, Kenya',
    survey_link: 'https://example.com/survey/abc123',
    ticket_link: 'https://example.com/tickets/abc123',
    deadline: '7 days'
  })

  useEffect(() => {
    fetchTemplates()
    fetchFormTemplates()
    fetchEvents()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const fetchFormTemplates = async () => {
    try {
      const response = await fetch('/api/forms/templates')
      const result = await response.json()
      if (result.success) {
        setFormTemplates(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch form templates:', error)
    }
  }

  const downloadSampleCSV = () => {
    const csvContent = `email,name,phone,company,role,country,ticket_number,special_message
john.doe@example.com,John Doe,+254712345678,Acme Corp,Software Engineer,Kenya,TKT-2026-001,Welcome to IndabaX Kenya 2026!
jane.smith@example.com,Jane Smith,+254723456789,Tech Inc,Data Scientist,Uganda,TKT-2026-002,Excited to have you join us!
alex.johnson@example.com,Alex Johnson,+254734567890,StartupXYZ,ML Researcher,Tanzania,TKT-2026-003,Looking forward to your participation!`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'email_recipients_sample.csv')
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show success toast
    setShowCsvHelp(true)
    setTimeout(() => setShowCsvHelp(false), 5000)
  }

  // Parse CSV file when selected to extract column headers and sample data
  const handleCsvFileChange = async (file: File | null) => {
    setCsvFile(file)

    if (!file) {
      setCsvColumns([])
      setCsvSampleData({})
      setCsvRowCount(0)
      return
    }

    try {
      const csvText = await file.text()
      const lines = csvText.split('\n').filter(line => line.trim())

      if (lines.length < 1) {
        setCsvColumns([])
        setCsvSampleData({})
        setCsvRowCount(0)
        return
      }

      // Parse CSV line - support for quoted values with commas
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      }

      // Parse headers
      const rawHeaders = parseCSVLine(lines[0])
      const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
      setCsvColumns(headers.filter(h => h && h !== 'email'))

      // Parse first data row for sample preview
      if (lines.length > 1) {
        const firstRowValues = parseCSVLine(lines[1])
        const sampleData: Record<string, string> = {}

        headers.forEach((header, idx) => {
          if (firstRowValues[idx] !== undefined) {
            // Store both with csv_ prefix and without for preview
            sampleData[`csv_${header}`] = firstRowValues[idx] || ''
            sampleData[header] = firstRowValues[idx] || ''
          }
        })

        setCsvSampleData(sampleData)
        setCsvRowCount(lines.length - 1) // Exclude header row

        // Update preview data with CSV sample values
        setPreviewData(prev => ({
          ...prev,
          name: sampleData.name || sampleData.csv_name || prev.name,
          email: sampleData.email || sampleData.csv_email || prev.email,
          ...Object.fromEntries(
            Object.entries(sampleData).filter(([key]) => key.startsWith('csv_'))
          )
        }))

        console.log('CSV sample data:', sampleData)
      }

      console.log('CSV columns detected:', headers, 'Rows:', lines.length - 1)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      setCsvColumns([])
      setCsvSampleData({})
      setCsvRowCount(0)
    }
  }

  // Insert variable into email body at cursor or append
  const insertVariable = (variableKey: string) => {
    // Append variable to body (QuillEditor doesn't support cursor position easily)
    setBody(prev => prev + variableKey)
    // Copy to clipboard as backup
    navigator.clipboard.writeText(variableKey)
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
      const result = await response.json()
      if (result.success) {
        setEvents(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  // Update preview data when event is selected
  useEffect(() => {
    if (selectedEvent) {
      const event = events.find(e => e.id === selectedEvent)
      if (event) {
        setPreviewData(prev => ({
          ...prev,
          event_title: event.title,
          event_date: event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD',
          event_location: event.location || 'TBD'
        }))
      }
    }
  }, [selectedEvent, events])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
    }
  }

  const replaceVariables = (text: string, variables: Record<string, string>) => {
    let result = text
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  const getPreviewSubject = () => {
    return replaceVariables(subject, previewData)
  }

  const getPreviewBody = () => {
    return replaceVariables(body, previewData)
  }

  const handleSend = async () => {
    // Validation
    if (!subject || !body) {
      alert('Please enter subject and body')
      return
    }

    if (recipientType === 'individual' && !individualEmail) {
      alert('Please enter recipient email')
      return
    }

    if (recipientType === 'event' && !selectedEvent) {
      alert('Please select an event')
      return
    }

    if (recipientType === 'event' && applicationStatuses.length === 0) {
      alert('Please select at least one application status to send emails to')
      return
    }

    if (recipientType === 'manual' && !manualEmails) {
      alert('Please enter email addresses')
      return
    }

    if (recipientType === 'csv' && !csvFile) {
      alert('Please upload a CSV file')
      return
    }

    if (!confirm('Are you sure you want to send this email?')) {
      return
    }

    setLoading(true)

    try {
      // Prepare recipients based on type
      let recipients: Recipient[] = []

      if (recipientType === 'individual') {
        recipients = [{ email: individualEmail, name: individualEmail }]
      } else if (recipientType === 'manual') {
        const emails = manualEmails.split(',').map(e => e.trim()).filter(e => e)
        recipients = emails.map(email => ({ email, name: email }))
      } else if (recipientType === 'event') {
        // Event recipients will be handled on the server
        recipients = []
      } else if (recipientType === 'csv') {
        // Parse CSV file
        if (!csvFile) {
          alert('Please upload a CSV file')
          setLoading(false)
          return
        }

        try {
          const csvText = await csvFile.text()
          const lines = csvText.split('\n').filter(line => line.trim())

          if (lines.length < 2) {
            alert('CSV file is empty or invalid')
            setLoading(false)
            return
          }

          // Parse header row - support for quoted values with commas
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = []
            let current = ''
            let inQuotes = false

            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            result.push(current.trim())
            return result
          }

          const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
          const emailIndex = headers.indexOf('email')
          const nameIndex = headers.indexOf('name')

          if (emailIndex === -1) {
            alert('CSV must have an "email" column')
            setLoading(false)
            return
          }

          // Parse data rows - extract ALL columns as variables
          recipients = []
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            const email = values[emailIndex]
            const name = nameIndex !== -1 ? values[nameIndex] : email.split('@')[0]

            if (email && email.includes('@')) {
              // Build variables object with all CSV columns prefixed with csv_
              const csvVariables: Record<string, string> = {}
              headers.forEach((header, idx) => {
                if (values[idx] !== undefined) {
                  csvVariables[`csv_${header}`] = values[idx] || ''
                }
              })

              recipients.push({
                email,
                name: name || email.split('@')[0],
                variables: {
                  ...csvVariables,
                  // Keep legacy csvname for backwards compatibility
                  csvname: name || email.split('@')[0]
                }
              })
            }
          }

          if (recipients.length === 0) {
            alert('No valid email addresses found in CSV')
            setLoading(false)
            return
          }

          console.log(`Parsed ${recipients.length} recipients from CSV with columns:`, headers)
        } catch (error) {
          console.error('CSV parsing error:', error)
          alert('Failed to parse CSV file. Please check the format.')
          setLoading(false)
          return
        }
      }

      // Send email
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType,
          recipients,
          eventId: selectedEvent || null,
          applicationStatuses: recipientType === 'event' ? applicationStatuses : undefined,
          templateId: selectedTemplate || null,
          formTemplateId: selectedFormTemplate || null,
          subject,
          body,
          ccEmails: ccEmails.split(',').map(e => e.trim()).filter(e => e),
          bccEmails: bccEmails.split(',').map(e => e.trim()).filter(e => e)
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Email sent successfully to ${result.data.sent} recipient(s)!`)
        router.push('/admin/emails/logs')
      } else {
        alert(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      {/* Toast Notification for CSV Sample Download */}
      {showCsvHelp && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-3"
          style={{ zIndex: 9999 }}
        >
          <div className="toast show" role="alert">
            <div className="toast-header bg-success text-white">
              <i className="icofont-check-circled me-2"></i>
              <strong className="me-auto">Sample CSV Downloaded!</strong>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowCsvHelp(false)}
              ></button>
            </div>
            <div className="toast-body">
              <p className="mb-2">
                <strong>Check your downloads folder!</strong>
              </p>
              <p className="mb-2 small">Your CSV should have these columns:</p>
              <ul className="small mb-0">
                <li><code>email</code> - Required</li>
                <li><code>name</code> - Optional</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Compose Email</h2>
            <p className="text-muted mb-0">Send emails using templates with variable replacement</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => router.back()}>
            <i className="icofont-arrow-left me-2"></i>
            Back
          </button>
        </div>

      <div className="row">
        {/* Main Form */}
        <div className="col-lg-8">
          {/* Recipients */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Recipients</h5>
            </div>
            <div className="card-body">
              {/* Recipient Type Selection */}
              <div className="mb-3">
                <label className="form-label">Recipient Type</label>
                <div className="btn-group w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    id="type-individual"
                    checked={recipientType === 'individual'}
                    onChange={() => setRecipientType('individual')}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-individual">
                    <i className="icofont-user me-2"></i>
                    Individual
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    id="type-event"
                    checked={recipientType === 'event'}
                    onChange={() => setRecipientType('event')}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-event">
                    <i className="icofont-users me-2"></i>
                    Event Applicants
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    id="type-manual"
                    checked={recipientType === 'manual'}
                    onChange={() => setRecipientType('manual')}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-manual">
                    <i className="icofont-list me-2"></i>
                    Manual List
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    id="type-csv"
                    checked={recipientType === 'csv'}
                    onChange={() => setRecipientType('csv')}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-csv">
                    <i className="icofont-file-document me-2"></i>
                    CSV Upload
                  </label>
                </div>
              </div>

              {/* Individual Email */}
              {recipientType === 'individual' && (
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={individualEmail}
                    onChange={(e) => setIndividualEmail(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
              )}

              {/* Event Selection */}
              {recipientType === 'event' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Select Event</label>
                    <select
                      className="form-select"
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                    >
                      <option value="">Choose an event...</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Application Status Filter */}
                  <div className="mb-3">
                    <label className="form-label">Filter by Application Status</label>
                    <div className="border rounded p-3 bg-light">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="status-interested"
                          checked={applicationStatuses.includes('interested')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicationStatuses([...applicationStatuses, 'interested'])
                            } else {
                              setApplicationStatuses(applicationStatuses.filter(s => s !== 'interested'))
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="status-interested">
                          <span className="badge bg-secondary me-2">Interested</span>
                          Initial Interest
                        </label>
                      </div>

                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="status-pending"
                          checked={applicationStatuses.includes('pending')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicationStatuses([...applicationStatuses, 'pending'])
                            } else {
                              setApplicationStatuses(applicationStatuses.filter(s => s !== 'pending'))
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="status-pending">
                          <span className="badge bg-warning text-dark me-2">Pending</span>
                          Under Review
                        </label>
                      </div>

                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="status-shortlisted"
                          checked={applicationStatuses.includes('shortlisted')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicationStatuses([...applicationStatuses, 'shortlisted'])
                            } else {
                              setApplicationStatuses(applicationStatuses.filter(s => s !== 'shortlisted'))
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="status-shortlisted">
                          <span className="badge bg-info me-2">Shortlisted</span>
                          Shortlisted (Survey Sent)
                        </label>
                      </div>

                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="status-survey-completed"
                          checked={applicationStatuses.includes('survey_completed')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicationStatuses([...applicationStatuses, 'survey_completed'])
                            } else {
                              setApplicationStatuses(applicationStatuses.filter(s => s !== 'survey_completed'))
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="status-survey-completed">
                          <span className="badge bg-success me-2">Survey Completed</span>
                          Survey Completed
                        </label>
                      </div>

                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="status-approved"
                          checked={applicationStatuses.includes('approved')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicationStatuses([...applicationStatuses, 'approved'])
                            } else {
                              setApplicationStatuses(applicationStatuses.filter(s => s !== 'approved'))
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="status-approved">
                          <span className="badge bg-success me-2">Approved</span>
                          Approved ✓
                        </label>
                      </div>

                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="status-waitlisted"
                          checked={applicationStatuses.includes('waitlisted')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicationStatuses([...applicationStatuses, 'waitlisted'])
                            } else {
                              setApplicationStatuses(applicationStatuses.filter(s => s !== 'waitlisted'))
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="status-waitlisted">
                          <span className="badge bg-warning text-dark me-2">Waitlisted</span>
                          Waitlisted
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="status-rejected"
                          checked={applicationStatuses.includes('rejected')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicationStatuses([...applicationStatuses, 'rejected'])
                            } else {
                              setApplicationStatuses(applicationStatuses.filter(s => s !== 'rejected'))
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor="status-rejected">
                          <span className="badge bg-danger me-2">Rejected</span>
                          Rejected
                        </label>
                      </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      {applicationStatuses.length === 0 ? (
                        <span className="text-warning">
                          <i className="icofont-warning me-1"></i>
                          No statuses selected - no emails will be sent
                        </span>
                      ) : (
                        <>
                          Email will be sent to applicants with status: {' '}
                          <strong>{applicationStatuses.join(', ')}</strong>
                        </>
                      )}
                    </small>
                  </div>
                </>
              )}

              {/* Manual Email List */}
              {recipientType === 'manual' && (
                <div className="mb-3">
                  <label className="form-label">Email Addresses</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={manualEmails}
                    onChange={(e) => setManualEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com, email3@example.com"
                  />
                  <small className="text-muted">Comma-separated email addresses</small>
                </div>
              )}

              {/* CSV Upload */}
              {recipientType === 'csv' && (
                <>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label mb-0">CSV File</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        onClick={downloadSampleCSV}
                      >
                        <i className="icofont-download me-1"></i>
                        Download Sample CSV
                      </button>
                    </div>

                    <input
                      type="file"
                      className="form-control"
                      accept=".csv"
                      onChange={(e) => handleCsvFileChange(e.target.files?.[0] || null)}
                    />

                    {csvFile && (
                      <div className="alert alert-success mt-2 mb-0 py-2 px-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <i className="icofont-check-circled me-2"></i>
                            <strong>{csvFile.name}</strong>
                          </div>
                          <span className="badge bg-success">{csvRowCount} recipients</span>
                        </div>
                        {csvColumns.length > 0 && (
                          <>
                            <div className="mt-2 small">
                              <strong>Available variables (click to insert):</strong>
                            </div>
                            <div className="mt-1 d-flex flex-wrap gap-1">
                              {csvColumns.map((col) => (
                                <button
                                  key={col}
                                  type="button"
                                  className="btn btn-sm btn-outline-primary py-0 px-2"
                                  onClick={() => insertVariable(`{{csv_${col}}}`)}
                                  title={csvSampleData[`csv_${col}`] ? `Sample: ${csvSampleData[`csv_${col}`]}` : 'Click to insert'}
                                >
                                  <code style={{ fontSize: '11px' }}>{`{{csv_${col}}}`}</code>
                                  {csvSampleData[`csv_${col}`] && (
                                    <span className="ms-1 text-muted" style={{ fontSize: '10px' }}>
                                      ({csvSampleData[`csv_${col}`].substring(0, 15)}{csvSampleData[`csv_${col}`].length > 15 ? '...' : ''})
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="alert alert-info mt-2 mb-0">
                      <div className="d-flex align-items-start">
                        <i className="icofont-info-circle me-2 mt-1"></i>
                        <div>
                          <strong>CSV Format Required:</strong>
                          <ul className="mb-0 mt-2 ps-3">
                            <li><code>email</code> - Recipient email address (required)</li>
                            <li><code>name</code> - Recipient name (optional)</li>
                            <li><code>phone</code>, <code>company</code>, etc. - Any additional columns become variables</li>
                          </ul>
                          <div className="mt-2">
                            <strong>Example:</strong>
                            <pre className="bg-white border rounded p-2 mt-1 mb-0" style={{fontSize: '12px'}}>email,name,phone,company
john.doe@example.com,John Doe,+254712345678,Acme Corp
jane.smith@example.com,Jane Smith,+254723456789,Tech Inc</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Selection for CSV - Optional */}
                  <div className="mb-3">
                    <label className="form-label">Link to Event (Optional)</label>
                    <select
                      className="form-select"
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                    >
                      <option value="">No event selected</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Select an event to populate event-related variables (event title, date, location)
                    </small>
                  </div>
                </>
              )}

              {/* Event Selection for Individual/Manual - to populate event variables */}
              {(recipientType === 'individual' || recipientType === 'manual') && (
                <div className="mb-3">
                  <label className="form-label">Link to Event (Optional)</label>
                  <select
                    className="form-select"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                  >
                    <option value="">No event selected</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Select an event to populate event variables (title, date, location)
                  </small>
                </div>
              )}

              {/* Form Template Selection for Survey Links */}
              <div className="mb-3">
                <label className="form-label">Survey Form Template (Optional)</label>
                <select
                  className="form-select"
                  value={selectedFormTemplate}
                  onChange={(e) => setSelectedFormTemplate(e.target.value)}
                >
                  <option value="">No survey link</option>
                  {formTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.usage_type})
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Select a form template to generate {`{{survey_link}}`} for each recipient
                </small>
              </div>

              {/* CC/BCC */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">CC (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ccEmails}
                    onChange={(e) => setCcEmails(e.target.value)}
                    placeholder="cc@example.com, cc2@example.com"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">BCC (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bccEmails}
                    onChange={(e) => setBccEmails(e.target.value)}
                    placeholder="bcc@example.com, bcc2@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Email Content</h5>
            </div>
            <div className="card-body">
              {/* Template Selection */}
              <div className="mb-3">
                <label className="form-label">Use Template (Optional)</label>
                <select
                  className="form-select"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  <option value="">Start from scratch...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Select a template to pre-fill subject and body
                </small>
              </div>

              {/* Subject */}
              <div className="mb-3">
                <label className="form-label">Subject <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject (use {{variables}} for dynamic content)"
                />
              </div>

              {/* Body */}
              <div className="mb-3">
                <label className="form-label">Body <span className="text-danger">*</span></label>
                <QuillEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Write your email content here. Use {{variables}} for dynamic content."
                  height="400px"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <i className="icofont-eye me-2"></i>
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSend}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="icofont-paper-plane me-2"></i>
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Variables & Preview */}
        <div className="col-lg-4">
          {/* Variables Help */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="icofont-code me-2"></i>
                Available Variables
              </h6>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-2">
                Click to insert into email body. Variables are replaced with actual values.
              </p>

              {/* CSV Variables Section - Show first when CSV is selected */}
              {recipientType === 'csv' && csvColumns.length > 0 && (
                <div className="mb-3">
                  <div className="small fw-bold text-info mb-2">
                    <i className="icofont-file-document me-1"></i>
                    CSV Columns ({csvRowCount} recipients)
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {csvColumns.map(col => {
                      const sampleValue = csvSampleData[`csv_${col}`]
                      return (
                        <button
                          key={col}
                          type="button"
                          className="btn btn-sm btn-info text-white py-0 px-2"
                          onClick={() => insertVariable(`{{csv_${col}}}`)}
                          title={sampleValue ? `Sample: ${sampleValue}` : 'Click to insert'}
                        >
                          <code style={{ fontSize: '10px', color: 'inherit' }}>{col}</code>
                          {sampleValue && (
                            <span className="ms-1 opacity-75" style={{ fontSize: '9px' }}>
                              ({sampleValue.substring(0, 10)}{sampleValue.length > 10 ? '..' : ''})
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="list-group list-group-flush">
                {[
                  { key: '{{name}}', label: 'Recipient Name', sample: previewData.name },
                  { key: '{{email}}', label: 'Recipient Email', sample: previewData.email },
                  { key: '{{event_title}}', label: 'Event Title', sample: previewData.event_title },
                  { key: '{{event_date}}', label: 'Event Date', sample: previewData.event_date },
                  { key: '{{event_location}}', label: 'Event Location', sample: previewData.event_location },
                  { key: '{{survey_link}}', label: 'Survey Link' },
                  { key: '{{ticket_link}}', label: 'Ticket Link' },
                  { key: '{{ticket_number}}', label: 'Ticket Number' },
                  { key: '{{deadline}}', label: 'Deadline', sample: previewData.deadline },
                  { key: '{{dashboard_link}}', label: 'Dashboard Link' },
                  { key: '{{application_id}}', label: 'Application ID' }
                ].map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    className="list-group-item list-group-item-action py-2"
                    onClick={() => insertVariable(variable.key)}
                    title={variable.sample ? `Sample: ${variable.sample}` : 'Click to insert'}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small">{variable.label}</span>
                      <code className="small text-primary">{variable.key}</code>
                    </div>
                    {variable.sample && (
                      <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                        Preview: {variable.sample.substring(0, 30)}{variable.sample.length > 30 ? '...' : ''}
                      </small>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="card mb-4 sticky-top" style={{ top: '90px', zIndex: 100 }}>
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="icofont-eye me-2"></i>
                  Preview
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong className="small text-muted">Subject:</strong>
                  <div className="p-2 bg-light rounded mt-1">
                    {getPreviewSubject()}
                  </div>
                </div>
                <div>
                  <strong className="small text-muted">Body:</strong>
                  <div
                    className="p-3 bg-light rounded mt-1 border"
                    style={{ maxHeight: '400px', overflow: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: getPreviewBody() }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
