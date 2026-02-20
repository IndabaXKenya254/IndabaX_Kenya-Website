'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SUBMISSION TIMELINE CHART
// ═══════════════════════════════════════════════════════════════════════
// Shows applications and survey completions over time
// Phase 12: Analytics & Reporting
// Phase 6 Optimization: Dynamic Chart.js loading (November 29, 2025)

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Chart.js components to reduce initial bundle size
const LineChart = dynamic(
  () => import('react-chartjs-2').then((mod) => {
    // Register Chart.js components only when this module loads
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
      <div className="chart-loading text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
        <p className="text-muted mt-2">Loading timeline chart...</p>
      </div>
    ),
  }
)

interface TimelineDataPoint {
  date: string
  applications: number
  surveys_completed: number
  cumulative_applications: number
  cumulative_surveys: number
}

interface TimelineChartProps {
  data: TimelineDataPoint[]
  deadline?: string
  eventTitle?: string
}

export function TimelineChart({ data, deadline, eventTitle }: TimelineChartProps) {
  const labels = data.map(d => {
    const date = new Date(d.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Cumulative Applications',
        data: data.map(d => d.cumulative_applications),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Cumulative Surveys Completed',
        data: data.map(d => d.cumulative_surveys),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Daily Applications',
        data: data.map(d => d.applications),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderDash: [5, 5],
      },
    ],
  }

  // Find deadline index if provided
  let deadlineIndex = -1
  if (deadline) {
    const deadlineDate = new Date(deadline).toDateString()
    deadlineIndex = data.findIndex(d => new Date(d.date).toDateString() === deadlineDate)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: eventTitle ? `Submission Timeline - ${eventTitle}` : 'Submission Timeline',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          title: (items: any) => {
            if (items.length > 0) {
              const idx = items[0].dataIndex
              return new Date(data[idx].date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            }
            return ''
          },
        },
      },
      annotation: deadline ? {
        annotations: {
          deadline: {
            type: 'line',
            xMin: deadlineIndex,
            xMax: deadlineIndex,
            borderColor: 'rgba(244, 67, 54, 0.8)',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Deadline',
              position: 'start',
            },
          },
        },
      } : undefined,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
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

  // Calculate insights
  const totalApplications = data.length > 0 ? data[data.length - 1].cumulative_applications : 0
  const totalSurveys = data.length > 0 ? data[data.length - 1].cumulative_surveys : 0
  const peakDay = data.reduce((max, d) => d.applications > max.applications ? d : max, data[0] || { date: '', applications: 0 })
  const avgDaily = data.length > 0 ? (totalApplications / data.length).toFixed(1) : 0

  return (
    <div className="timeline-chart-container">
      <div className="chart-wrapper" style={{ height: '350px' }}>
        <LineChart data={chartData} options={options} />
      </div>

      {/* Timeline Insights */}
      <div className="timeline-insights mt-4">
        <h6 className="mb-3">
          <i className="icofont-chart-line me-2"></i>
          Timeline Insights
        </h6>
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="insight-card p-3 bg-light rounded">
              <div className="insight-label text-muted small">Total Applications</div>
              <div className="insight-value h4 mb-0">{totalApplications}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="insight-card p-3 bg-light rounded">
              <div className="insight-label text-muted small">Surveys Completed</div>
              <div className="insight-value h4 mb-0">{totalSurveys}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="insight-card p-3 bg-light rounded">
              <div className="insight-label text-muted small">Peak Day</div>
              <div className="insight-value h5 mb-0">
                {peakDay?.date ? new Date(peakDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
              </div>
              <div className="insight-detail small text-muted">
                {peakDay?.applications || 0} applications
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="insight-card p-3 bg-light rounded">
              <div className="insight-label text-muted small">Avg Daily</div>
              <div className="insight-value h4 mb-0">{avgDaily}</div>
            </div>
          </div>
        </div>
      </div>

      {deadline && (
        <div className="deadline-info mt-3 p-3 bg-warning bg-opacity-10 rounded">
          <i className="icofont-alarm me-2"></i>
          <strong>Deadline:</strong> {new Date(deadline).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}

      <style jsx>{`
        .timeline-chart-container {
          padding: 1rem;
        }
        .insight-card {
          transition: transform 0.2s;
        }
        .insight-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

export default TimelineChart
