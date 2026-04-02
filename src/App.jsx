import React, { useState, useEffect } from 'react';
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

      <nav className="tab-nav desktop-tabs">
        <button className={`tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>
          📋 Results
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          📊 Statistics
        </button>
      </nav>

      <MobileBottomTabs tab={tab} setTab={setTab} />

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

function MobileBottomTabs({ tab, setTab }) {
  return (
    <nav className="mobile-bottom-tabs" role="tablist">
      <button
        className={`mobile-tab ${tab === 'results' ? 'active' : ''}`}
        onClick={() => setTab('results')}
        role="tab"
        aria-selected={tab === 'results'}
      >
        <span className="mobile-tab-icon">📋</span>
        <span className="mobile-tab-label">Results</span>
      </button>
      <button
        className={`mobile-tab ${tab === 'stats' ? 'active' : ''}`}
        onClick={() => setTab('stats')}
        role="tab"
        aria-selected={tab === 'stats'}
      >
        <span className="mobile-tab-icon">📊</span>
        <span className="mobile-tab-label">Statistics</span>
      </button>
    </nav>
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

function AppShell() {
  const { activeUnitId } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer when a unit is selected (mobile)
  useEffect(() => {
    setDrawerOpen(false);
  }, [activeUnitId]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div className="app">
      <Header onMenuClick={() => setDrawerOpen(true)} />
      <StorageWarning />
      <div className="app-body">
        {/* Desktop sidebar — always visible on large screens */}
        <div className="sidebar-desktop">
          <Sidebar />
        </div>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <aside className="drawer" onClick={e => e.stopPropagation()}>
              <div className="drawer-header">
                <h2>My Units</h2>
                <button className="btn-icon-sm" onClick={() => setDrawerOpen(false)} aria-label="Close menu">✕</button>
              </div>
              <Sidebar inDrawer />
            </aside>
          </div>
        )}

        <main className="main-content">
          <ErrorBoundary>
            <UnitView />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
