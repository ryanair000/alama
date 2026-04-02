import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { validateComponentMarks } from '../utils/grading';
import { ASSESSMENT_PRESETS } from '../utils/presets';

export default function AssessmentStructure() {
  const { activeUnit, updateUnit, addComponent, updateComponent, removeComponent } = useApp();
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState('');

  if (!activeUnit) return null;

  const { id: unitId, mode, components } = activeUnit;
  const totalMax = components.reduce((s, c) => s + (parseFloat(c.maxMark) || 0), 0);
  const remaining = 100 - totalMax;
  const isValid = validateComponentMarks(components);
  const hasExam = components.some(c => /exam/i.test(c.name));

  const handleModeChange = (newMode) => {
    updateUnit(unitId, { mode: newMode });
  };

  const handleAddComponent = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newMax) return;
    addComponent(unitId, newName.trim(), parseFloat(newMax));
    setNewName(''); setNewMax('');
  };

  const handleUpdate = (compId, field, value) => {
    updateComponent(unitId, compId, { [field]: field === 'maxMark' ? parseFloat(value) || 0 : value });
  };

  const handleRemove = (compId) => {
    removeComponent(unitId, compId);
  };

  const applyPreset = (preset) => {
    components.forEach(c => removeComponent(unitId, c.id));
    preset.components.forEach(c => addComponent(unitId, c.name, c.maxMark));
  };

  const addExamForRemaining = () => {
    if (remaining > 0) {
      addComponent(unitId, 'Main Exam', remaining);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Assessment Structure</h3>

      <div className="mode-toggle">
        <button
          className={`btn btn-sm ${mode === 'components' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleModeChange('components')}
        >
          Multiple Components
        </button>
        <button
          className={`btn btn-sm ${mode === 'total' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleModeChange('total')}
        >
          Total Mark Only
        </button>
      </div>

      {mode === 'total' ? (
        <p className="text-muted">Students will have a single Total Mark column (out of 100).</p>
      ) : (
        <>
          {components.length === 0 && (
            <div className="preset-section">
              <p className="preset-label">Quick setup — pick a common structure:</p>
              <div className="preset-grid">
                {ASSESSMENT_PRESETS.map((p, i) => (
                  <button key={i} className="preset-btn" onClick={() => applyPreset(p)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-muted text-sm" style={{ marginTop: 8 }}>Or add components manually below.</p>
            </div>
          )}

          {components.length > 0 && (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Max Mark</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {components.map(c => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="text"
                        value={c.name}
                        onChange={e => handleUpdate(c.id, 'name', e.target.value)}
                        className="input-inline"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={c.maxMark}
                        onChange={e => handleUpdate(c.id, 'maxMark', e.target.value)}
                        className="input-inline input-sm"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td>
                      <button className="btn-icon btn-delete" onClick={() => handleRemove(c.id)} aria-label={`Remove ${c.name}`}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td>
                    <strong className={isValid ? 'text-success' : 'text-danger'}>
                      {totalMax} / 100
                    </strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}

          {!isValid && components.length > 0 && remaining > 0 && !hasExam && (
            <div className="exam-suggest">
              <span>⚠️ {remaining} marks remaining.</span>
              <button className="btn btn-sm btn-primary" onClick={addExamForRemaining}>
                + Add Main Exam ({remaining} marks)
              </button>
            </div>
          )}

          {!isValid && components.length > 0 && (hasExam || remaining <= 0) && (
            <p className="text-danger text-sm">Component max marks must add up to 100.</p>
          )}

          <form className="inline-form" onSubmit={handleAddComponent}>
            <input
              type="text"
              placeholder="Component name (e.g. CAT 1)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Max"
              value={newMax}
              onChange={e => setNewMax(e.target.value)}
              min="1"
              max="100"
              required
              className="input-sm"
            />
            <button type="submit" className="btn btn-sm btn-primary">Add</button>
          </form>

          {components.length > 0 && (
            <button className="btn btn-sm btn-link" onClick={() => {
              components.forEach(c => removeComponent(unitId, c.id));
            }} style={{ marginTop: 8 }}>
              Clear all & start over
            </button>
          )}
        </>
      )}
    </div>
  );
}
