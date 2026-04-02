import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { computeStats, computeGradeDistribution } from '../utils/grading';

const COLORS = ['#006600', '#228B22', '#DAA520', '#CC5500', '#BB0000', '#660000', '#333'];

export default function Statistics() {
  const { activeUnit } = useApp();

  if (!activeUnit) return null;

  if (activeUnit.students.length === 0) {
    return (
      <div className="card">
        <div className="results-empty">
          <div className="results-empty-icon">📊</div>
          <h3>No statistics yet</h3>
          <p>Import or add students and enter their marks to see statistics, charts, and grade distribution.</p>
        </div>
      </div>
    );
  }

  const { students, gradingScale, passMark } = activeUnit;

  const stats = useMemo(() => computeStats(students, passMark), [students, passMark]);
  const distribution = useMemo(() => computeGradeDistribution(students, gradingScale), [students, gradingScale]);

  return (
    <div className="card">
      <h3 className="card-title">Statistics</h3>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.count}</span>
          <span className="stat-label">Total Students</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.average}</span>
          <span className="stat-label">Class Average</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.highest}</span>
          <span className="stat-label">Highest Mark</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.lowest}</span>
          <span className="stat-label">Lowest Mark</span>
        </div>
        <div className="stat-card stat-pass">
          <span className="stat-value">{stats.passCount}</span>
          <span className="stat-label">Passed</span>
        </div>
        <div className="stat-card stat-fail">
          <span className="stat-value">{stats.failCount}</span>
          <span className="stat-label">Failed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.passRate}%</span>
          <span className="stat-label">Pass Rate</span>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <h4>Grade Distribution</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(val, name) => name === 'count' ? val : `${val}%`} />
              <Bar dataKey="count" fill="#006600" radius={[4, 4, 0, 0]}>
                {distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Grade Breakdown</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={distribution.filter(d => d.count > 0)}
                dataKey="count"
                nameKey="grade"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ grade, percentage }) => `${grade} (${percentage}%)`}
              >
                {distribution.filter(d => d.count > 0).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grade-table-wrap">
        <table className="mini-table">
          <thead>
            <tr>
              <th>Grade</th>
              <th>Range</th>
              <th>Count</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((d, i) => {
              const tier = gradingScale[i];
              return (
                <tr key={d.grade}>
                  <td><strong>{d.grade}</strong></td>
                  <td>{tier ? `${tier.min}–${tier.max}` : ''}</td>
                  <td>{d.count}</td>
                  <td>{d.percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
