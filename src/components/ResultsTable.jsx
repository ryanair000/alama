import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { parseExcelFile, autoDetectColumns } from '../utils/excel';

export default function ResultsTable() {
  const { activeUnit, updateStudentMark, addStudent, removeStudent, setStudents } = useApp();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [editCell, setEditCell] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({ name: '', regNo: '' });
  const [importError, setImportError] = useState('');
  const fileRef = useRef();

  if (!activeUnit) return null;

  const { id: unitId, mode, components, students, passMark } = activeUnit;

  // --- Import logic ---
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    try {
      const { rows, headers } = await parseExcelFile(file);
      if (rows.length === 0) { setImportError('No data found in file.'); return; }
      const detected = autoDetectColumns(headers);
      setMapping({ name: detected.name || '', regNo: detected.regNo || '' });
      setParsed({ rows, headers });
    } catch {
      setImportError('Failed to parse file. Ensure it is a valid .xlsx file.');
    }
  };

  const handleImport = () => {
    if (!parsed || !mapping.name) { setImportError('Please select the Name column.'); return; }
    const imported = parsed.rows.map(row => {
      const marks = {};
      if (mode === 'components') {
        components.forEach(comp => {
          const matchCol = parsed.headers.find(h => h.toLowerCase().trim() === comp.name.toLowerCase().trim());
          if (matchCol) marks[comp.id] = parseFloat(row[matchCol]) || 0;
        });
      }
      const student = {
        name: String(row[mapping.name] || '').trim(),
        regNo: mapping.regNo ? String(row[mapping.regNo] || '').trim() : '',
        marks,
        total: 0,
      };
      if (mode === 'total') {
        const totalCol = parsed.headers.find(h => /^total$/i.test(h.trim()));
        if (totalCol) student.total = parseFloat(row[totalCol]) || 0;
      }
      return student;
    }).filter(s => s.name.length > 0);
    if (imported.length === 0) { setImportError('No valid student names found.'); return; }
    setStudents(unitId, imported);
    setParsed(null); setShowImport(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const cancelImport = () => {
    setParsed(null); setShowImport(false); setImportError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // --- Table logic ---
  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.regNo || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let va, vb;
      if (sortField === 'name') { va = a.name; vb = b.name; }
      else if (sortField === 'regNo') { va = a.regNo; vb = b.regNo; }
      else if (sortField === 'total') { va = a.computedTotal; vb = b.computedTotal; }
      else if (sortField === 'grade') { va = a.computedGrade; vb = b.computedGrade; }
      else { va = parseFloat(a.marks?.[sortField] ?? 0); vb = parseFloat(b.marks?.[sortField] ?? 0); }
      if (typeof va === 'string') return va.localeCompare(vb) * dir;
      return ((va || 0) - (vb || 0)) * dir;
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const handleCellClick = (studentId, field) => setEditCell({ studentId, field });

  const handleCellBlur = (studentId, field, value, maxMark) => {
    if (field === 'name' || field === 'regNo') updateStudentMark(unitId, studentId, field, value);
    else {
      const num = parseFloat(value);
      const clamped = isNaN(num) ? 0 : Math.max(0, Math.min(maxMark || 100, num));
      updateStudentMark(unitId, studentId, field, clamped);
    }
    setEditCell(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    else if (e.key === 'Escape') setEditCell(null);
  };

  const handleRemove = (studentId) => {
    if (confirm('Remove this student?')) removeStudent(unitId, studentId);
  };

  const renderCell = (student, field, maxMark) => {
    const isEditing = editCell?.studentId === student.id && editCell?.field === field;
    let value;
    if (field === 'name') value = student.name || '';
    else if (field === 'regNo') value = student.regNo || '';
    else if (field === 'total' && mode === 'total') value = student.total ?? 0;
    else value = student.marks?.[field] ?? '';

    if (isEditing) {
      const isText = field === 'name' || field === 'regNo';
      return (
        <input type={isText ? 'text' : 'number'} defaultValue={value} autoFocus
          className="cell-input" min={isText ? undefined : 0} max={isText ? undefined : maxMark || 100}
          onBlur={e => handleCellBlur(student.id, field, e.target.value, maxMark)}
          onKeyDown={handleKeyDown}
        />
      );
    }
    return (
      <span className="cell-value" onClick={() => handleCellClick(student.id, field)}
        title="Click to edit">
        {value === '' || value === 0 ? <span className="cell-placeholder">{field === 'name' ? 'Enter name' : field === 'regNo' ? '—' : '0'}</span> : value}
      </span>
    );
  };

  // --- Empty state ---
  if (students.length === 0) {
    return (
      <div className="card results-empty-card">
        <div className="results-empty">
          <div className="results-empty-icon">📋</div>
          <h3>No students yet</h3>
          <p>Add students to start entering marks and grades.</p>
          <div className="results-empty-actions">
            <button className="btn btn-primary" onClick={() => setShowImport(true)}>
              📁 Import from Excel
            </button>
            <button className="btn btn-outline" onClick={() => addStudent(unitId)}>
              + Add Manually
            </button>
          </div>
        </div>

        {showImport && (
          <div className="import-inline">
            <div className="import-inline-header">
              <h4>Import Students</h4>
              <button className="btn-icon-sm" onClick={cancelImport} aria-label="Close import">✕</button>
            </div>
            <div className="upload-area">
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} id="file-upload-empty" className="file-input" />
              <label htmlFor="file-upload-empty" className="file-label">
                <span className="upload-icon">📁</span>
                <span>Choose .xlsx file</span>
              </label>
            </div>
            {importError && <p className="text-danger text-sm">{importError}</p>}
            {parsed && renderMappingUI()}
          </div>
        )}
      </div>
    );
  }

  function renderMappingUI() {
    return (
      <div className="column-mapping">
        <p className="text-sm text-muted">Found {parsed.rows.length} rows. Map your columns:</p>
        <div className="mapping-row">
          <label>Student Name *
            <select value={mapping.name} onChange={e => setMapping(m => ({ ...m, name: e.target.value }))}>
              <option value="">— Select column —</option>
              {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
          <label>Reg/Admission No
            <select value={mapping.regNo} onChange={e => setMapping(m => ({ ...m, regNo: e.target.value }))}>
              <option value="">— None —</option>
              {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
        </div>
        <div className="mapping-actions">
          <button className="btn btn-primary" onClick={handleImport}>Import {parsed.rows.length} Students</button>
          <button className="btn btn-outline" onClick={cancelImport}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-row">
        <h3 className="card-title">
          Results
          <span className="card-title-count">{students.length} student{students.length !== 1 ? 's' : ''}</span>
        </h3>
        <div className="results-actions">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search students..." value={search}
              onChange={e => setSearch(e.target.value)} className="search-input" />
            {search && <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">✕</button>}
          </div>
          <button className="btn btn-sm btn-outline" onClick={() => setShowImport(!showImport)}>
            📁 Import
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => addStudent(unitId)}>
            + Add Row
          </button>
        </div>
      </div>

      {showImport && (
        <div className="import-inline">
          <div className="import-inline-header">
            <h4>Import from Excel</h4>
            <button className="btn-icon-sm" onClick={cancelImport} aria-label="Close import">✕</button>
          </div>
          <div className="upload-area-compact">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} id="file-upload-table" className="file-input" />
            <label htmlFor="file-upload-table" className="file-label-compact">
              <span>📁 Choose .xlsx file</span>
            </label>
          </div>
          {importError && <p className="text-danger text-sm">{importError}</p>}
          {parsed && renderMappingUI()}
        </div>
      )}

      {search && filtered.length === 0 && (
        <div className="search-no-results">
          No students matching "<strong>{search}</strong>"
        </div>
      )}

      <div className="table-scroll">
        <table className="results-table" id="results-table">
          <thead>
            <tr>
              <th scope="col" className="th-num">#</th>
              <th scope="col" className="sortable" onClick={() => handleSort('regNo')}>Reg No{sortIcon('regNo')}</th>
              <th scope="col" className="sortable" onClick={() => handleSort('name')}>Name{sortIcon('name')}</th>
              {mode === 'components' && components.map(c => (
                <th key={c.id} scope="col" className="sortable th-mark" onClick={() => handleSort(c.id)}>
                  {c.name}<span className="th-max">/{c.maxMark}</span>{sortIcon(c.id)}
                </th>
              ))}
              <th scope="col" className="sortable th-mark th-total-col" onClick={() => handleSort('total')}>Total{sortIcon('total')}</th>
              <th scope="col" className="sortable th-grade" onClick={() => handleSort('grade')}>Grade{sortIcon('grade')}</th>
              <th scope="col" className="th-actions"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((student, idx) => {
              const isFailing = (student.computedTotal ?? 0) < passMark;
              return (
                <tr key={student.id} className={isFailing ? 'row-fail' : ''}>
                  <td className="td-num">{idx + 1}</td>
                  <td className="td-reg">{renderCell(student, 'regNo')}</td>
                  <td className="td-name">{renderCell(student, 'name')}</td>
                  {mode === 'components' && components.map(c => (
                    <td key={c.id} className="td-mark">{renderCell(student, c.id, c.maxMark)}</td>
                  ))}
                  <td className="td-mark td-total">
                    {mode === 'total' ? renderCell(student, 'total', 100) : <strong>{student.computedTotal ?? 0}</strong>}
                  </td>
                  <td className={`td-grade ${isFailing ? 'grade-fail' : 'grade-pass'}`}>
                    <span className="grade-badge">{student.computedGrade}</span>
                  </td>
                  <td className="td-actions">
                    <button className="btn-icon-sm btn-delete-row" onClick={() => handleRemove(student.id)} title="Remove student" aria-label={`Remove ${student.name || 'student'}`}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view — visible on small screens */}
      <div className="mobile-results-cards">
        {sorted.map((student, idx) => {
          const isFailing = (student.computedTotal ?? 0) < passMark;
          return (
            <div key={student.id} className={`student-card ${isFailing ? 'student-card-fail' : ''}`}>
              <div className="student-card-header">
                <div className="student-card-info">
                  <span className="student-card-num">{idx + 1}</span>
                  <div>
                    <div className="student-card-name">{renderCell(student, 'name')}</div>
                    <div className="student-card-reg">{renderCell(student, 'regNo')}</div>
                  </div>
                </div>
                <div className="student-card-grade-wrap">
                  <span className={`student-card-grade ${isFailing ? 'grade-fail' : 'grade-pass'}`}>
                    {student.computedGrade}
                  </span>
                  <button className="btn-icon-sm" onClick={() => handleRemove(student.id)}
                    title="Remove" aria-label={`Remove ${student.name || 'student'}`}>✕</button>
                </div>
              </div>
              <div className="student-card-marks">
                {mode === 'components' && components.map(c => (
                  <div key={c.id} className="student-card-mark">
                    <span className="student-card-mark-label">{c.name}<span className="th-max">/{c.maxMark}</span></span>
                    <span className="student-card-mark-value">{renderCell(student, c.id, c.maxMark)}</span>
                  </div>
                ))}
                <div className="student-card-mark student-card-total">
                  <span className="student-card-mark-label">Total</span>
                  <span className="student-card-mark-value">
                    {mode === 'total' ? renderCell(student, 'total', 100) : <strong>{student.computedTotal ?? 0}</strong>}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="table-footer">
        <span className="table-footer-hint">💡 Click any cell to edit · Press Enter to save · Esc to cancel</span>
      </div>
    </div>
  );
}
