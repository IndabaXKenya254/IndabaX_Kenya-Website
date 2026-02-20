'use client'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DYNAMIC CHART WRAPPER
// ═══════════════════════════════════════════════════════════════════════
// Dynamically loads Chart.js components to reduce initial bundle size
// Phase 6: Code Splitting & Bundle Optimization (November 29, 2025)
// ═══════════════════════════════════════════════════════════════════════

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Dynamically import chart components
// This prevents Chart.js from being included in the main bundle
const BarChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Bar),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
      </div>
    ),
  }
)

const LineChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
      </div>
    ),
  }
)

const DoughnutChart = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Doughnut),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading chart...</span>
        </div>
      </div>
    ),
  }
)

// Export chart components
export { BarChart, LineChart, DoughnutChart }
