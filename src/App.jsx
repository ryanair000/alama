import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingWizard from './components/OnboardingWizard';
import AssessmentStructure from './components/AssessmentStructure';
import GradingScale from './components/GradingScale';
import ResultsTable from './components/ResultsTable';
import Statistics from './components/Statistics';
import ExportPrint from './components/ExportPrint';

function UnitView() {
  const { activeUnit, updateUnit } = useApp();
  const [tab, setTab] = useState('results');
  const [showSettings, setShowSettings] = useState(false);

  if (!activeUnit) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h2>Welcome to Alama</h2>
        <p>Create a unit from the sidebar to start grading your students.</p>
        <div className="empty-features">
          <div className="empty-feature">
            <span>📝</span>
            <div><strong>Flexible Assessment</strong><br/>CATs, assignments, exams — define your own structure</div>
          </div>
          <div className="empty-feature">
            <span>📁</span>
            <div><strong>Excel Import</strong><br/>Upload .xlsx class lists instantly</div>
          </div>
          <div className="empty-feature">
            <span>📊</span>
            <div><strong>Auto Grading</strong><br/>Grades computed automatically from your scale</div>
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding wizard for units that haven't completed setup
  if (!activeUnit.setupComplete) {
    return (
      <OnboardingWizard onComplete={() => setTab('results')} />
    );
  }

  const assessmentSummary = activeUnit.mode === 'total'
    ? 'Total Mark Only'
    : activeUnit.components.map(c => `${c.name} (${c.maxMark})`).join(' + ');

  return (
    <div className="unit-view">
      <div className="unit-header">
        <div>
          <h2 className="unit-title">{activeUnit.code} — {activeUnit.name}</h2>
          {activeUnit.lecturerName && (
            <p className="unit-lecturer">Lecturer: {activeUnit.lecturerName}</p>
          )}
          <p className="unit-assessment-info">{assessmentSummary}</p>
        </div>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙ Settings
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-panel-header">
            <h3>Unit Settings</h3>
            <button className="btn-icon-sm" onClick={() => setShowSettings(false)} aria-label="Close settings">✕</button>
          </div>
          <div className="settings-grid">
            <label className="form-group-inline">
              <span className="form-label-sm">Code</span>
              <input type="text" value={activeUnit.code}
                onChange={e => updateUnit(activeUnit.id, { code: e.target.value })}
                className="form-input" />
            </label>
            <label className="form-group-inline">
              <span className="form-label-sm">Name</span>
              <input type="text" value={activeUnit.name}
                onChange={e => updateUnit(activeUnit.id, { name: e.target.value })}
                className="form-input" />
            </label>
            <label className="form-group-inline">
              <span className="form-label-sm">Lecturer</span>
              <input type="text" value={activeUnit.lecturerName || ''}
                onChange={e => updateUnit(activeUnit.id, { lecturerName: e.target.value })}
                className="form-input" />
            </label>
          </div>
          <div className="settings-sections">
            <AssessmentStructure />
            <GradingScale />
          </div>
        </div>
      )}

      <nav className="tab-nav">
        <button className={`tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>
          📋 Results
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          📊 Statistics
        </button>
      </nav>

      {tab === 'results' && (
        <>
          <ExportPrint />
          <ResultsTable />
        </>
      )}

      {tab === 'stats' && <Statistics />}
    </div>
  );
}

function MobileNav() {
  const { units, activeUnitId, setActiveUnitId } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-nav">
      <button className="btn btn-sm btn-outline" onClick={() => setOpen(!open)}>
        ☰ Units ({units.length})
      </button>
      {open && (
        <div className="mobile-dropdown">
          {units.map(u => (
            <button
              key={u.id}
              className={`mobile-unit ${u.id === activeUnitId ? 'active' : ''}`}
              onClick={() => { setActiveUnitId(u.id); setOpen(false); }}
            >
              {u.code} — {u.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StorageWarning() {
  const { storageError } = useApp();
  const [dismissed, setDismissed] = useState(false);
  if (!storageError || dismissed) return null;
  return (
    <div className="storage-warning" role="alert">
      <span>⚠️ Storage is full — your latest changes may not be saved. Consider exporting your data.</span>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss warning">✕</button>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <StorageWarning />
        <div className="app-body">
          <Sidebar />
          <main className="main-content">
            <MobileNav />
            <ErrorBoundary>
              <UnitView />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
