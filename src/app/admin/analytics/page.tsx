'use client'

// ═══════════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ANALYTICS DASHBOARD (PHASE 9)
// ═══════════════════════════════════════════════════════════════════════════
// Registration funnel, timeline charts, reviewer performance
// Phase 6 Optimization: Dynamic Chart.js loading (November 29, 2025)

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout'

// Dynamically import Chart components to reduce initial bundle size
// Charts are only loaded when the analytics page is visited
const BarChart = dynamic(
  () => import('react-chartjs-2').then((mod) => {
    // Register Chart.js components only when needed
    import('chart.js').then((ChartJS) => {
      ChartJS.Chart.register(
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.BarElement,
        ChartJS.Title,
        ChartJS.Tooltip,
        ChartJS.Legend
      )
    })
    return mod.Bar
  }),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
      </div>
    ),
  }
)

const LineChart = dynamic(
  () => import('react-chartjs-2').then((mod) => {
    import('chart.js').then((ChartJS) => {
      ChartJS.Chart.register(
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.PointElement,
        ChartJS.LineElement,
        ChartJS.Title,
        ChartJS.Tooltip,
        ChartJS.Legend,
        ChartJS.Filler
      )
    })
    return mod.Line
  }),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
      </div>
    ),
  }
)

const DoughnutChart = dynamic(
  () => import('react-chartjs-2').then((mod) => {
    import('chart.js').then((ChartJS) => {
      ChartJS.Chart.register(
        ChartJS.ArcElement,
        ChartJS.Tooltip,
        ChartJS.Legend
      )
    })
    return mod.Doughnut
  }),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
      </div>
    ),
  }
)

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AnalyticsData {
  funnel: {
    interested: number
    shortlisted: number
    surveyCompleted: number
    accepted: number
    rejected: number
    pending: number
    ticketed: number
    checkedIn: number
  }
  timeline: { date: string; count: number; cumulative: number }[]
  ticketStats: {
    total: number
    checkedIn: number
    active: number
  }
  reviewerPerformance: {
    id: string
    name: string
    email: string
    reviews: number
    shortlists: number
  }[]
  summary: {
    totalApplications: number
    acceptanceRate: number
    conversionRate: number
    attendanceRate: number
    pendingReviews: number
  }
}

interface Event {
  id: string
  title: string
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [selectedEvent, period])

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

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (selectedEvent) params.append('event_id', selectedEvent)

      const response = await fetch(`/api/admin/analytics?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHART CONFIGS
  // ═══════════════════════════════════════════════════════════════════════

  const funnelChartData = {
    labels: ['Interested', 'Shortlisted', 'Survey Done', 'Accepted', 'Ticketed', 'Checked In'],
    datasets: [{
      label: 'Registration Funnel',
      data: data ? [
        data.funnel.interested,
        data.funnel.shortlisted,
        data.funnel.surveyCompleted,
        data.funnel.accepted,
        data.funnel.ticketed,
        data.funnel.checkedIn
      ] : [],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(0, 103, 0, 0.8)',
        'rgba(46, 204, 113, 0.8)'
      ],
      borderColor: [
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(153, 102, 255)',
        'rgb(75, 192, 192)',
        'rgb(0, 103, 0)',
        'rgb(46, 204, 113)'
      ],
      borderWidth: 2
    }]
  }

  const funnelChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Registration Funnel',
        font: { size: 16 }
      }
    },
    scales: {
      x: { beginAtZero: true }
    }
  }

  const timelineChartData = {
    labels: data?.timeline.map(t => {
      const date = new Date(t.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }) || [],
    datasets: [
      {
        label: 'Daily Registrations',
        data: data?.timeline.map(t => t.count) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Cumulative',
        data: data?.timeline.map(t => t.cumulative) || [],
        borderColor: 'rgb(0, 103, 0)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  }

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Registrations Over Time',
        font: { size: 16 }
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }

  const statusChartData = {
    labels: ['Accepted', 'Rejected', 'Pending'],
    datasets: [{
      data: data ? [data.funnel.accepted, data.funnel.rejected, data.funnel.pending] : [],
      backgroundColor: [
        'rgba(46, 204, 113, 0.8)',
        'rgba(231, 76, 60, 0.8)',
        'rgba(241, 196, 15, 0.8)'
      ],
      borderColor: [
        'rgb(46, 204, 113)',
        'rgb(231, 76, 60)',
        'rgb(241, 196, 15)'
      ],
      borderWidth: 2
    }]
  }

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      title: {
        display: true,
        text: 'Application Status',
        font: { size: 16 }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2>
              <i className="icofont-chart-bar-graph me-2"></i>
              Analytics Dashboard
            </h2>
            <p className="text-muted">Registration funnel, trends, and reviewer performance</p>
          </div>
          <div className="col-md-6">
            <div className="d-flex gap-2 justify-content-md-end">
              <select
                className="form-select"
                style={{ maxWidth: '250px' }}
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <select
                className="form-select"
                style={{ maxWidth: '150px' }}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading analytics...</p>
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card bg-primary text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Total Applications</h6>
                        <h2 className="mb-0">{data.summary.totalApplications}</h2>
                      </div>
                      <i className="icofont-papers" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-success text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Acceptance Rate</h6>
                        <h2 className="mb-0">{data.summary.acceptanceRate}%</h2>
                      </div>
                      <i className="icofont-check-circled" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-info text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white-50 mb-1">Conversion Rate</h6>
                        <h2 className="mb-0">{data.summary.conversionRate}%</h2>
                      </div>
                      <i className="icofont-chart-arrows-axis" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning text-dark h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-dark-50 mb-1">Pending Reviews</h6>
                        <h2 className="mb-0">{data.summary.pendingReviews}</h2>
                      </div>
                      <i className="icofont-clock-time" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row mb-4">
              {/* Funnel Chart */}
              <div className="col-lg-8">
                <div className="card h-100">
                  <div className="card-body">
                    <div style={{ height: '350px' }}>
                      <BarChart data={funnelChartData} options={funnelChartOptions} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Doughnut */}
              <div className="col-lg-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div style={{ height: '350px' }}>
                      <DoughnutChart data={statusChartData} options={statusChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row mb-4">
              {/* Timeline Chart */}
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div style={{ height: '300px' }}>
                      <LineChart data={timelineChartData} options={timelineChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviewer Performance */}
            <div className="row">
              <div className="col-lg-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="icofont-users me-2"></i>
                      Reviewer Performance
                    </h5>
                  </div>
                  <div className="card-body">
                    {data.reviewerPerformance.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        <i className="icofont-user" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                        <p className="mt-2">No reviewer data yet</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Reviewer</th>
                              <th className="text-center">Reviews</th>
                              <th className="text-center">Shortlists</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.reviewerPerformance.map((reviewer, index) => (
                              <tr key={reviewer.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <span className="badge bg-primary me-2">{index + 1}</span>
                                    <div>
                                      <strong>{reviewer.name}</strong>
                                      <br />
                                      <small className="text-muted">{reviewer.email}</small>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <span className="badge bg-info fs-6">{reviewer.reviews}</span>
                                </td>
                                <td className="text-center">
                                  <span className="badge bg-success fs-6">{reviewer.shortlists}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ticket Stats */}
              <div className="col-lg-6">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="icofont-ticket me-2"></i>
                      Ticket Statistics
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="p-3 bg-light rounded">
                          <h3 className="text-primary mb-0">{data.ticketStats.total}</h3>
                          <small className="text-muted">Total Tickets</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-3 bg-light rounded">
                          <h3 className="text-success mb-0">{data.ticketStats.checkedIn}</h3>
                          <small className="text-muted">Checked In</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-3 bg-light rounded">
                          <h3 className="text-warning mb-0">{data.ticketStats.active}</h3>
                          <small className="text-muted">Pending</small>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Attendance Rate</span>
                        <strong>{data.summary.attendanceRate}%</strong>
                      </div>
                      <div className="progress" style={{ height: '20px' }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${data.summary.attendanceRate}%` }}
                        >
                          {data.summary.attendanceRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="alert alert-warning">
            <i className="icofont-warning me-2"></i>
            No analytics data available
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
