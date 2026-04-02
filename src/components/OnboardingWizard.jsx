import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { validateComponentMarks } from '../utils/grading';
import { ASSESSMENT_PRESETS } from '../utils/presets';

export default function OnboardingWizard({ onComplete }) {
  const { activeUnit, updateUnit, addComponent, removeComponent, recomputeStudents } = useApp();
  const [step, setStep] = useState(1);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState('');

  if (!activeUnit) return null;

  const { id: unitId, mode, components } = activeUnit;
  const totalMax = components.reduce((s, c) => s + (parseFloat(c.maxMark) || 0), 0);
  const isValid = mode === 'total' || validateComponentMarks(components);
  const totalSteps = 3;

  const handleModeChange = (newMode) => {
    updateUnit(unitId, { mode: newMode });
    // Clear components when switching to total mode
    if (newMode === 'total') {
      components.forEach(c => removeComponent(unitId, c.id));
    }
  };

  const applyPreset = (preset) => {
    // Remove existing components
    components.forEach(c => removeComponent(unitId, c.id));
    // Add preset components
    preset.components.forEach(c => {
      addComponent(unitId, c.name, c.maxMark);
    });
  };

  const handleAddComponent = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newMax) return;
    addComponent(unitId, newName.trim(), parseFloat(newMax));
    setNewName('');
    setNewMax('');
  };

  const handleRemove = (compId) => {
    removeComponent(unitId, compId);
  };

  const handleFinish = () => {
    updateUnit(unitId, { setupComplete: true });
    recomputeStudents(unitId);
    onComplete();
  };

  const canProceed = () => {
    if (step === 1) return activeUnit.code.trim() && activeUnit.name.trim();
    if (step === 2) return isValid;
    return true;
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard">
        <div className="wizard-header">
          <div className="wizard-progress">
            {[1, 2, 3].map(s => (
              <div key={s} className={`wizard-step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`}>
                {s < step ? '✓' : s}
              </div>
            ))}
            <div className="wizard-progress-line">
              <div className="wizard-progress-fill" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} />
            </div>
          </div>
          <h2 className="wizard-title">
            {step === 1 && 'Unit Details'}
            {step === 2 && 'Assessment Structure'}
            {step === 3 && 'Grading Scale'}
          </h2>
          <p className="wizard-desc">
            {step === 1 && 'Enter the unit code, name, and your details.'}
            {step === 2 && 'Choose how marks are broken down for this unit.'}
            {step === 3 && 'Review the grading boundaries. You can customise these later.'}
          </p>
        </div>

        <div className="wizard-body">
          {/* STEP 1: Unit Details */}
          {step === 1 && (
            <div className="wizard-step">
              <div className="form-group">
                <label className="form-label">Unit Code <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. BIT 2301"
                  value={activeUnit.code}
                  onChange={e => updateUnit(unitId, { code: e.target.value })}
                  autoFocus
                />
                <span className="form-hint">The official course code</span>
              </div>
              <div className="form-group">
                <label className="form-label">Unit Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Data Structures and Algorithms"
                  value={activeUnit.name}
                  onChange={e => updateUnit(unitId, { name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lecturer Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Omondi"
                  value={activeUnit.lecturerName || ''}
                  onChange={e => updateUnit(unitId, { lecturerName: e.target.value })}
                />
                <span className="form-hint">Appears on printed results</span>
              </div>
            </div>
          )}

          {/* STEP 2: Assessment Structure */}
          {step === 2 && (
            <div className="wizard-step">
              <div className="mode-cards">
                <div
                  className={`mode-card ${mode === 'components' ? 'selected' : ''}`}
                  onClick={() => handleModeChange('components')}
                >
                  <div className="mode-card-icon">📝</div>
                  <div className="mode-card-text">
                    <strong>Multiple Components</strong>
                    <span>CATs, assignments, practicals, exam — each graded separately</span>
                  </div>
                </div>
                <div
                  className={`mode-card ${mode === 'total' ? 'selected' : ''}`}
                  onClick={() => handleModeChange('total')}
                >
                  <div className="mode-card-icon">📊</div>
                  <div className="mode-card-text">
                    <strong>Total Mark Only</strong>
                    <span>Enter a single final mark out of 100 for each student</span>
                  </div>
                </div>
              </div>

              {mode === 'components' && (
                <>
                  {components.length === 0 && (
                    <div className="preset-section">
                      <p className="preset-label">Quick start with a preset:</p>
                      <div className="preset-grid">
                        {ASSESSMENT_PRESETS.map((p, i) => (
                          <button key={i} className="preset-btn" onClick={() => applyPreset(p)}>
                            <strong>{p.label}</strong>
                            <span>{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {components.length > 0 && (
                    <div className="component-list">
                      {components.map(c => (
                        <div key={c.id} className="component-row">
                          <span className="component-name">{c.name}</span>
                          <span className="component-mark">{c.maxMark} marks</span>
                          <button
                            className="btn-icon-sm"
                            onClick={() => handleRemove(c.id)}
                            title="Remove"
                          >✕</button>
                        </div>
                      ))}
                      <div className={`component-total ${isValid ? 'valid' : 'invalid'}`}>
                        <span>Total</span>
                        <span>{totalMax} / 100 {isValid ? '✓' : '— must equal 100'}</span>
                      </div>
                    </div>
                  )}

                  <form className="add-component-form" onSubmit={handleAddComponent}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Component name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                    <input
                      type="number"
                      className="form-input form-input-sm"
                      placeholder="Max"
                      value={newMax}
                      onChange={e => setNewMax(e.target.value)}
                      min="1"
                      max="100"
                    />
                    <button type="submit" className="btn btn-sm btn-outline" disabled={!newName.trim() || !newMax}>
                      + Add
                    </button>
                  </form>

                  {components.length > 0 && !isValid && (
                    <button className="btn btn-sm btn-link" onClick={() => {
                      components.forEach(c => removeComponent(unitId, c.id));
                    }}>
                      Clear all and start over
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 3: Grading Scale */}
          {step === 3 && (
            <div className="wizard-step">
              <div className="scale-preview">
                {activeUnit.gradingScale.map((tier, i) => (
                  <div key={i} className="scale-row">
                    <span className="scale-grade">{tier.grade}</span>
                    <div className="scale-bar-wrap">
                      <div
                        className="scale-bar"
                        style={{ width: `${tier.max - tier.min + 1}%`, marginLeft: `${tier.min}%` }}
                      />
                    </div>
                    <span className="scale-range">{tier.min}–{tier.max}</span>
                  </div>
                ))}
              </div>
              <div className="scale-footer">
                <span className="form-hint">
                  Pass mark: <strong>{activeUnit.passMark}</strong> — 
                  You can fine-tune the grading scale after setup in the Settings panel.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {step > 1 && (
            <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <div className="wizard-footer-right">
            <span className="wizard-step-label">Step {step} of {totalSteps}</span>
            {step < totalSteps ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Continue →
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleFinish} disabled={!canProceed()}>
                Start Grading →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
