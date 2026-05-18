'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - APPLICATION FUNNEL CHART
// ═══════════════════════════════════════════════════════════════════════
// Visualizes application pipeline: Interested → Shortlisted → Approved
// Phase 12: Analytics & Reporting
// Phase 6 Optimization: Dynamic Chart.js loading (November 29, 2025)

import React, { useEffect, useState } from 'react'
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
        <p className="text-muted mt-2">Loading funnel chart...</p>
      </div>
    ),
  }
)

interface FunnelData {
  total_interested: number
  shortlisted: number
  surveys_completed: number
  approved: number
  rejected: number
  pending: number
}

interface FunnelChartProps {
  data: FunnelData
  eventTitle?: string
}

export function FunnelChart({ data, eventTitle }: FunnelChartProps) {
  const stages = [
    { label: 'Total Interested', value: data.total_interested, color: 'rgba(54, 162, 235, 0.8)' },
    { label: 'Shortlisted', value: data.shortlisted, color: 'rgba(255, 206, 86, 0.8)' },
    { label: 'Surveys Completed', value: data.surveys_completed, color: 'rgba(75, 192, 192, 0.8)' },
    { label: 'Approved', value: data.approved, color: 'rgba(76, 175, 80, 0.8)' },
    { label: 'Rejected', value: data.rejected, color: 'rgba(244, 67, 54, 0.8)' },
  ]

  const chartData = {
    labels: stages.map(s => s.label),
    datasets: [
      {
        label: 'Applications',
        data: stages.map(s => s.value),
        backgroundColor: stages.map(s => s.color),
        borderColor: stages.map(s => s.color.replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: eventTitle ? `Application Funnel - ${eventTitle}` : 'Application Funnel',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const total = data.total_interested
            if (total === 0) return ''
            const percentage = ((context.raw / total) * 100).toFixed(1)
            return `${percentage}% of total`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Applications',
        },
      },
      y: {
        title: {
          display: false,
        },
      },
    },
  }

  // Calculate conversion rates
  const conversionRates = [
    {
      from: 'Interested',
      to: 'Shortlisted',
      rate: data.total_interested > 0 ? ((data.shortlisted / data.total_interested) * 100).toFixed(1) : 0,
    },
    {
      from: 'Shortlisted',
      to: 'Survey Completed',
      rate: data.shortlisted > 0 ? ((data.surveys_completed / data.shortlisted) * 100).toFixed(1) : 0,
    },
    {
      from: 'Survey Completed',
      to: 'Approved',
      rate: data.surveys_completed > 0 ? ((data.approved / data.surveys_completed) * 100).toFixed(1) : 0,
    },
  ]

  return (
    <div className="funnel-chart-container">
      <div className="chart-wrapper" style={{ height: '300px' }}>
        <BarChart data={chartData} options={options} />
      </div>

      {/* Conversion Rates */}
      <div className="conversion-rates mt-4">
        <h6 className="mb-3">
          <i className="icofont-chart-flow me-2"></i>
          Conversion Rates
        </h6>
        <div className="row g-3">
          {conversionRates.map((conv, idx) => (
            <div key={idx} className="col-md-4">
              <div className="conversion-card p-3 bg-light rounded">
                <div className="conversion-label text-muted small">
                  {conv.from} → {conv.to}
                </div>
                <div className="conversion-value h4 mb-0 text-primary">
                  {conv.rate}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats mt-4">
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <div className="stat-card text-center p-3 border rounded">
              <div className="stat-value h3 mb-1 text-primary">{data.total_interested}</div>
              <div className="stat-label small text-muted">Total Applications</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card text-center p-3 border rounded">
              <div className="stat-value h3 mb-1 text-success">{data.approved}</div>
              <div className="stat-label small text-muted">Approved</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card text-center p-3 border rounded">
              <div className="stat-value h3 mb-1 text-danger">{data.rejected}</div>
              <div className="stat-label small text-muted">Rejected</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card text-center p-3 border rounded">
              <div className="stat-value h3 mb-1 text-warning">{data.pending}</div>
              <div className="stat-label small text-muted">Pending</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .funnel-chart-container {
          padding: 1rem;
        }
        .conversion-card {
          transition: transform 0.2s;
        }
        .conversion-card:hover {
          transform: translateY(-2px);
        }
        .stat-card {
          transition: box-shadow 0.2s;
        }
        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}

export default FunnelChart
