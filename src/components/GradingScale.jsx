import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_GRADING_SCALE } from '../utils/grading';

function validateScale(scale) {
  const warnings = [];
  for (let i = 0; i < scale.length; i++) {
    if (scale[i].min > scale[i].max) {
      warnings.push(`${scale[i].grade || `Tier ${i + 1}`}: min (${scale[i].min}) > max (${scale[i].max})`);
    }
  }
  const sorted = [...scale].sort((a, b) => b.max - a.max);
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (next.max >= curr.min && next.min <= curr.max) {
      warnings.push(`${curr.grade} and ${next.grade} ranges overlap`);
    } else if (curr.min - next.max > 1) {
      warnings.push(`Gap between ${curr.grade} (${curr.min}) and ${next.grade} (${next.max})`);
    }
  }
  return warnings;
}

export default function GradingScale() {
  const { activeUnit, updateUnit } = useApp();

  if (!activeUnit) return null;

  const { id: unitId, gradingScale, passMark } = activeUnit;
  const scaleWarnings = useMemo(() => validateScale(gradingScale), [gradingScale]);

  const handleScaleChange = (index, field, value) => {
    const newScale = gradingScale.map((tier, i) => {
      if (i !== index) return tier;
      return { ...tier, [field]: field === 'grade' ? value : parseInt(value) || 0 };
    });
    updateUnit(unitId, { gradingScale: newScale });
  };

  const addTier = () => {
    const newScale = [...gradingScale, { grade: '', min: 0, max: 0 }];
    updateUnit(unitId, { gradingScale: newScale });
  };

  const removeTier = (index) => {
    const newScale = gradingScale.filter((_, i) => i !== index);
    updateUnit(unitId, { gradingScale: newScale });
  };

  const resetScale = () => {
    updateUnit(unitId, { gradingScale: [...DEFAULT_GRADING_SCALE], passMark: 40 });
  };

  const handlePassMark = (value) => {
    updateUnit(unitId, { passMark: parseInt(value) || 0 });
  };

  return (
    <div className="card">
      <div className="card-header-row">
        <h3 className="card-title">Grading Scale</h3>
        <button className="btn btn-sm btn-outline" onClick={resetScale}>Reset Default</button>
      </div>

      <table className="mini-table">
        <thead>
          <tr>
            <th scope="col">Grade</th>
            <th scope="col">Min</th>
            <th scope="col">Max</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {gradingScale.map((tier, i) => (
            <tr key={`${tier.grade}-${i}`}>
              <td>
                <input
                  type="text"
                  value={tier.grade}
                  onChange={e => handleScaleChange(i, 'grade', e.target.value)}
                  className="input-inline input-xs"
                  maxLength={3}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={tier.min}
                  onChange={e => handleScaleChange(i, 'min', e.target.value)}
                  className="input-inline input-sm"
                  min="0"
                  max="100"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={tier.max}
                  onChange={e => handleScaleChange(i, 'max', e.target.value)}
                  className="input-inline input-sm"
                  min="0"
                  max="100"
                />
              </td>
              <td>
                <button className="btn-icon btn-delete" onClick={() => removeTier(i)} aria-label={`Remove grade ${tier.grade}`}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {scaleWarnings.length > 0 && (
        <div className="scale-warnings">
          {scaleWarnings.map((w, i) => (
            <p key={i} className="text-danger text-sm">⚠️ {w}</p>
          ))}
        </div>
      )}

      <div className="row-between">
        <button className="btn btn-sm btn-outline" onClick={addTier}>+ Add Grade</button>
        <label className="inline-label">
          Pass Mark:
          <input
            type="number"
            value={passMark}
            onChange={e => handlePassMark(e.target.value)}
            className="input-inline input-sm"
            min="0"
            max="100"
          />
        </label>
      </div>
    </div>
  );
}
