'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EVENT COMPARISON CHART
// ═══════════════════════════════════════════════════════════════════════
// Compare metrics across multiple events
// Phase 12: Analytics & Reporting
// Phase 6 Optimization: Dynamic Chart.js loading (November 29, 2025)

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Chart.js components to reduce initial bundle size
const BarChart = dynamic(
  () => import('react-chartjs-2').then((mod) => {
    // Register Chart.js components only when this module loads
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
      <div className="chart-loading text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
        <p className="text-muted mt-2">Loading comparison chart...</p>
      </div>
    ),
  }
)

interface EventMetrics {
  event_id: string
  event_title: string
  total_applications: number
  shortlisted: number
  surveys_completed: number
  approved: number
  rejected: number
  approval_rate: number
  survey_completion_rate: number
  avg_review_time: number
}

interface EventComparisonChartProps {
  events: EventMetrics[]
}

export function EventComparisonChart({ events }: EventComparisonChartProps) {
  const labels = events.map(e => e.event_title.length > 20 ? e.event_title.substring(0, 20) + '...' : e.event_title)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Applications',
        data: events.map(e => e.total_applications),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Shortlisted',
        data: events.map(e => e.shortlisted),
        backgroundColor: 'rgba(255, 206, 86, 0.7)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
      },
      {
        label: 'Approved',
        data: events.map(e => e.approved),
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      },
      {
        label: 'Rejected',
        data: events.map(e => e.rejected),
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        borderColor: 'rgba(244, 67, 54, 1)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Event Comparison - Applications',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Events',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
        },
      },
    },
  }

  // Rate comparison chart
  const rateChartData = {
    labels,
    datasets: [
      {
        label: 'Approval Rate (%)',
        data: events.map(e => e.approval_rate),
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      },
      {
        label: 'Survey Completion Rate (%)',
        data: events.map(e => e.survey_completion_rate),
        backgroundColor: 'rgba(156, 39, 176, 0.7)',
        borderColor: 'rgba(156, 39, 176, 1)',
        borderWidth: 1,
      },
    ],
  }

  const rateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Event Comparison - Rates',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Events',
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
      },
    },
  }

  return (
    <div className="event-comparison-container">
      {/* Charts Grid */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="chart-card p-3 border rounded">
            <div style={{ height: '350px' }}>
              <BarChart data={chartData} options={options} />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="chart-card p-3 border rounded">
            <div style={{ height: '350px' }}>
              <BarChart data={rateChartData} options={rateOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="comparison-table mt-4">
        <h6 className="mb-3">
          <i className="icofont-table me-2"></i>
          Detailed Comparison
        </h6>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Event</th>
                <th className="text-center">Applications</th>
                <th className="text-center">Shortlisted</th>
                <th className="text-center">Surveys Done</th>
                <th className="text-center">Approved</th>
                <th className="text-center">Rejected</th>
                <th className="text-center">Approval Rate</th>
                <th className="text-center">Survey Rate</th>
                <th className="text-center">Avg Review</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, idx) => (
                <tr key={event.event_id}>
                  <td>
                    <strong>{event.event_title}</strong>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-primary">{event.total_applications}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-warning text-dark">{event.shortlisted}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-info">{event.surveys_completed}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-success">{event.approved}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-danger">{event.rejected}</span>
                  </td>
                  <td className="text-center">
                    <span className={`badge ${event.approval_rate >= 50 ? 'bg-success' : 'bg-secondary'}`}>
                      {event.approval_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`badge ${event.survey_completion_rate >= 70 ? 'bg-success' : 'bg-secondary'}`}>
                      {event.survey_completion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                    {event.avg_review_time < 60
                      ? `${event.avg_review_time.toFixed(0)}m`
                      : `${(event.avg_review_time / 60).toFixed(1)}h`}
                  </td>
                </tr>
              ))}
            </tbody>
            {events.length > 1 && (
              <tfoot className="table-light">
                <tr>
                  <td><strong>Average</strong></td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.total_applications, 0) / events.length).toFixed(0)}
                  </td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.shortlisted, 0) / events.length).toFixed(0)}
                  </td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.surveys_completed, 0) / events.length).toFixed(0)}
                  </td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.approved, 0) / events.length).toFixed(0)}
                  </td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.rejected, 0) / events.length).toFixed(0)}
                  </td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.approval_rate, 0) / events.length).toFixed(1)}%
                  </td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.survey_completion_rate, 0) / events.length).toFixed(1)}%
                  </td>
                  <td className="text-center">
                    {(events.reduce((s, e) => s + e.avg_review_time, 0) / events.length).toFixed(0)}m
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-5 text-muted">
          <i className="icofont-chart-bar-graph d-block mb-2" style={{ fontSize: '3rem' }}></i>
          <p>Select events to compare</p>
        </div>
      )}

      <style jsx>{`
        .event-comparison-container {
          padding: 1rem;
        }
        .chart-card {
          background: #fff;
        }
      `}</style>
    </div>
  )
}

export default EventComparisonChart
