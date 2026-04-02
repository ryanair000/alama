import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ inDrawer }) {
  const { units, activeUnitId, setActiveUnitId, createUnit, deleteUnit } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [lecturer, setLecturer] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    createUnit(code.trim(), name.trim(), lecturer.trim());
    setCode(''); setName(''); setLecturer('');
    setShowForm(false);
  };

  const handleDelete = (e, unitId) => {
    e.stopPropagation();
    if (confirm('Delete this unit and all its data? This cannot be undone.')) {
      deleteUnit(unitId);
    }
  };

  const content = (
    <>
      {!inDrawer && (
        <div className="sidebar-header">
          <h2>My Units</h2>
          <button
            className="btn btn-sm btn-create"
            onClick={() => setShowForm(!showForm)}
            title={showForm ? 'Cancel' : 'Create new unit'}
          >
            {showForm ? '✕ Cancel' : '+ New Unit'}
          </button>
        </div>
      )}

      {inDrawer && (
        <div className="drawer-new-unit">
          <button
            className="btn btn-primary btn-block"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ New Unit'}
          </button>
        </div>
      )}

      {showForm && (
        <form className="sidebar-form" onSubmit={handleCreate}>
          <div className="sidebar-form-group">
            <input
              type="text"
              placeholder="Unit Code (e.g. BIT 2301)"
              value={code}
              onChange={e => setCode(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="sidebar-form-group">
            <input
              type="text"
              placeholder="Unit Name (e.g. Data Structures)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="sidebar-form-group">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={lecturer}
              onChange={e => setLecturer(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={!code.trim() || !name.trim()}
          >
            Create Unit
          </button>
        </form>
      )}

      <div className="sidebar-units">
        {units.length === 0 && !showForm && (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">📚</div>
            <p>No units yet</p>
            <span>Click "+ New Unit" above to create your first unit</span>
          </div>
        )}
        {units.map(unit => (
          <div
            key={unit.id}
            className={`sidebar-unit ${unit.id === activeUnitId ? 'active' : ''}`}
            onClick={() => setActiveUnitId(unit.id)}
          >
            <div className="unit-info">
              <span className="unit-code">{unit.code}</span>
              <span className="unit-name">{unit.name}</span>
              <span className="unit-meta">
                {unit.students.length} student{unit.students.length !== 1 ? 's' : ''}
                {unit.setupComplete ? '' : ' · Needs setup'}
              </span>
            </div>
            <button
              className="btn-delete"
              onClick={(e) => handleDelete(e, unit.id)}
              title="Delete unit"
              aria-label={`Delete ${unit.code}`}
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      {units.length > 0 && (
        <div className="sidebar-footer">
          <span className="sidebar-footer-text">
            {units.length} unit{units.length !== 1 ? 's' : ''} · {units.reduce((s, u) => s + u.students.length, 0)} students
          </span>
        </div>
      )}
    </>
  );

  if (inDrawer) return content;
  return <aside className="sidebar">{content}</aside>;
}
