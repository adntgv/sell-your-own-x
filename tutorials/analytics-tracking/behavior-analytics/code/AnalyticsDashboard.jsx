// components/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react'
import { Line, Bar, Doughnut, Funnel } from 'react-chartjs-2'

const AnalyticsDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null)
    const [timeRange, setTimeRange] = useState('7d')
    const [loading, setLoading] = useState(true)
    const [selectedMetric, setSelectedMetric] = useState('overview')
    
    useEffect(() => {
        fetchDashboardData()
    }, [timeRange])
    
    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`)
            const data = await response.json()
            setDashboardData(data)
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }
    
    const MetricCard = ({ title, value, change, changeType, icon }) => (
        <div className="metric-card">
            <div className="metric-header">
                <h3>{title}</h3>
                <span className="metric-icon">{icon}</span>
            </div>
            <div className="metric-value">{value}</div>
            <div className={`metric-change ${changeType}`}>
                {change > 0 ? '+' : ''}{change}% vs previous period
            </div>
        </div>
    )
    
    const FunnelChart = ({ funnelData }) => {
        if (!funnelData?.steps) return <div>No funnel data available</div>
        
        const chartData = {
            labels: funnelData.steps.map(step => step.step.replace('_', ' ')),
            datasets: [{
                label: 'Users',
                data: funnelData.steps.map(step => step.count),
                backgroundColor: [
                    '#3498db', '#2ecc71', '#f39c12', 
                    '#e74c3c', '#9b59b6', '#1abc9c'
                ]
            }]
        }
        
        return (
            <div className="funnel-analysis">
                <h3>Conversion Funnel</h3>
                <div className="funnel-stats">
                    <div className="funnel-stat">
                        <span>Overall Conversion</span>
                        <span className="stat-value">{funnelData.overallConversion}%</span>
                    </div>
                    <div className="funnel-stat">
                        <span>Biggest Dropoff</span>
                        <span className="stat-value">{funnelData.biggestDropoff.percentage}%</span>
                        <span className="stat-detail">{funnelData.biggestDropoff.step}</span>
                    </div>
                </div>
                <div className="funnel-chart">
                    <Bar data={chartData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }} />
                </div>
                <div className="funnel-steps">
                    {funnelData.steps.map((step, index) => (
                        <div key={step.step} className="funnel-step">
                            <div className="step-number">{step.stepNumber}</div>
                            <div className="step-info">
                                <div className="step-name">{step.step.replace('_', ' ')}</div>
                                <div className="step-metrics">
                                    <span className="step-count">{step.count.toLocaleString()} users</span>
                                    {index > 0 && (
                                        <span className="step-conversion">
                                            {step.conversionFromPrevious}% conversion
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    
    const UserSegments = ({ segments }) => {
        if (!segments) return <div>No segment data available</div>
        
        return (
            <div className="user-segments">
                <h3>User Segments</h3>
                <div className="segments-grid">
                    <div className="segment-chart">
                        <h4>By Plan</h4>
                        <Doughnut data={{
                            labels: Object.keys(segments.byPlan || {}),
                            datasets: [{
                                data: Object.values(segments.byPlan || {}),
                                backgroundColor: ['#3498db', '#2ecc71', '#f39c12']
                            }]
                        }} />
                    </div>
                    <div className="segment-chart">
                        <h4>By Engagement</h4>
                        <Doughnut data={{
                            labels: Object.keys(segments.byEngagement || {}),
                            datasets: [{
                                data: Object.values(segments.byEngagement || {}),
                                backgroundColor: ['#e74c3c', '#f39c12', '#2ecc71']
                            }]
                        }} />
                    </div>
                </div>
            </div>
        )
    }
    
    if (loading) {
        return <div className="dashboard-loading">Loading analytics dashboard...</div>
    }
    
    if (!dashboardData) {
        return <div className="dashboard-error">Failed to load dashboard data</div>
    }
    
    return (
        <div className="analytics-dashboard">
            <div className="dashboard-header">
                <h1>Analytics Dashboard</h1>
                <div className="dashboard-controls">
                    <select 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="time-range-selector"
                    >
                        <option value="1d">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <button onClick={fetchDashboardData} className="refresh-btn">
                        Refresh
                    </button>
                </div>
            </div>
            
            <div className="dashboard-content">
                {/* Overview Metrics */}
                <div className="metrics-overview">
                    <MetricCard
                        title="Total Users"
                        value={dashboardData.overview.totalUsers?.toLocaleString()}
                        change={12.5}
                        changeType="positive"
                        icon="👥"
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value={`${dashboardData.overview.conversionRate}%`}
                        change={-2.1}
                        changeType="negative"
                        icon="📈"
                    />
                    <MetricCard
                        title="Avg Session"
                        value={`${Math.round(dashboardData.overview.averageSessionDuration / 60)}m`}
                        change={8.3}
                        changeType="positive"
                        icon="⏱️"
                    />
                    <MetricCard
                        title="Bounce Rate"
                        value={`${dashboardData.overview.bounceRate}%`}
                        change={-5.2}
                        changeType="positive"
                        icon="🎯"
                    />
                </div>
                
                {/* Navigation Tabs */}
                <div className="dashboard-tabs">
                    <button 
                        className={selectedMetric === 'overview' ? 'active' : ''}
                        onClick={() => setSelectedMetric('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={selectedMetric === 'funnels' ? 'active' : ''}
                        onClick={() => setSelected setSelectedMetric('funnels')}
                    >
                        Funnels
                    </button>
                    <button 
                        className={selectedMetric === 'segments' ? 'active' : ''}
                        onClick={() => setSelectedMetric('segments')}
                    >
                        Segments
                    </button>
                    <button 
                        className={selectedMetric === 'retention' ? 'active' : ''}
                        onClick={() => setSelectedMetric('retention')}
                    >
                        Retention
                    </button>
                </div>
                
                {/* Tab Content */}
                <div className="tab-content">
                    {selectedMetric === 'overview' && (
                        <div className="overview-content">
                            {/* Add overview charts and tables */}
                        </div>
                    )}
                    
                    {selectedMetric === 'funnels' && (
                        <FunnelChart funnelData={dashboardData.funnels} />
                    )}
                    
                    {selectedMetric === 'segments' && (
                        <UserSegments segments={dashboardData.segments} />
                    )}
                    
                    {selectedMetric === 'retention' && (
                        <div className="retention-content">
                            {/* Add retention analysis */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AnalyticsDashboard
