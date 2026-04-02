import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_GRADING_SCALE, DEFAULT_PASS_MARK, getGrade, calculateTotal } from '../utils/grading';

const AppContext = createContext();

let nextId = Date.now();
function genId() { return Date.now().toString(36) + '-' + (nextId++).toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

const EMPTY_UNIT = {
  id: '',
  code: '',
  name: '',
  lecturerName: '',
  mode: 'components', // 'components' or 'total'
  components: [],
  gradingScale: DEFAULT_GRADING_SCALE,
  passMark: DEFAULT_PASS_MARK,
  students: [],
};

export function AppProvider({ children }) {
  const [units, setUnits, storageError] = useLocalStorage('alama_units', []);
  const [activeUnitId, setActiveUnitId] = useLocalStorage('alama_activeUnit', null);
  const prevUnitsRef = useRef(units);

  // Auto-recompute grades when components, mode, or gradingScale change
  useEffect(() => {
    const prev = prevUnitsRef.current;
    prevUnitsRef.current = units;
    if (prev === units) return;

    const needsRecompute = units.some((u, i) => {
      const old = prev.find(p => p.id === u.id);
      if (!old) return false;
      return old.components !== u.components || old.mode !== u.mode || old.gradingScale !== u.gradingScale;
    });
    if (!needsRecompute) return;

    setUnits(current => current.map(u => {
      const old = prev.find(p => p.id === u.id);
      if (!old) return u;
      if (old.components === u.components && old.mode === u.mode && old.gradingScale === u.gradingScale) return u;
      if (u.students.length === 0) return u;
      const students = u.students.map(s => {
        const total = u.mode === 'components'
          ? calculateTotal(s, u.components)
          : (parseFloat(s.total) || 0);
        return {
          ...s,
          computedTotal: +total.toFixed(2),
          computedGrade: getGrade(total, u.gradingScale),
        };
      });
      return { ...u, students };
    }));
  }, [units, setUnits]);

  const activeUnit = units.find(u => u.id === activeUnitId) || null;

  const createUnit = useCallback((code, name, lecturerName) => {
    const id = genId();
    const unit = { ...EMPTY_UNIT, id, code, name, lecturerName };
    setUnits(prev => [...prev, unit]);
    setActiveUnitId(id);
    return id;
  }, [setUnits, setActiveUnitId]);

  const updateUnit = useCallback((unitId, updates) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, ...updates } : u));
  }, [setUnits]);

  const deleteUnit = useCallback((unitId) => {
    setUnits(prev => prev.filter(u => u.id !== unitId));
    setActiveUnitId(prev => prev === unitId ? null : prev);
  }, [setUnits, setActiveUnitId]);

  const recomputeStudents = useCallback((unitId) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      const students = u.students.map(s => {
        const total = u.mode === 'components'
          ? calculateTotal(s, u.components)
          : (parseFloat(s.total) || 0);
        return {
          ...s,
          computedTotal: +total.toFixed(2),
          computedGrade: getGrade(total, u.gradingScale),
        };
      });
      return { ...u, students };
    }));
  }, [setUnits]);

  const addComponent = useCallback((unitId, name, maxMark) => {
    const id = genId();
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      return { ...u, components: [...u.components, { id, name, maxMark: parseFloat(maxMark) || 0 }] };
    }));
    return id;
  }, [setUnits]);

  const updateComponent = useCallback((unitId, compId, updates) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      return {
        ...u,
        components: u.components.map(c => c.id === compId ? { ...c, ...updates } : c),
      };
    }));
  }, [setUnits]);

  const removeComponent = useCallback((unitId, compId) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      return { ...u, components: u.components.filter(c => c.id !== compId) };
    }));
  }, [setUnits]);

  const setStudents = useCallback((unitId, students) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      const updated = students.map(s => {
        const total = u.mode === 'components'
          ? calculateTotal(s, u.components)
          : (parseFloat(s.total) || 0);
        return {
          ...s,
          id: s.id || genId(),
          computedTotal: +total.toFixed(2),
          computedGrade: getGrade(total, u.gradingScale),
        };
      });
      return { ...u, students: updated };
    }));
  }, [setUnits]);

  const updateStudentMark = useCallback((unitId, studentId, field, value) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      const students = u.students.map(s => {
        if (s.id !== studentId) return s;
        let updated;
        if (field === 'total') {
          updated = { ...s, total: value };
        } else if (field === 'name') {
          updated = { ...s, name: value };
        } else if (field === 'regNo') {
          updated = { ...s, regNo: value };
        } else {
          updated = { ...s, marks: { ...s.marks, [field]: value } };
        }
        const total = u.mode === 'components'
          ? calculateTotal(updated, u.components)
          : (parseFloat(updated.total) || 0);
        return {
          ...updated,
          computedTotal: +total.toFixed(2),
          computedGrade: getGrade(total, u.gradingScale),
        };
      });
      return { ...u, students };
    }));
  }, [setUnits]);

  const addStudent = useCallback((unitId) => {
    const id = genId();
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      const newStudent = {
        id,
        name: '',
        regNo: '',
        marks: {},
        total: 0,
        computedTotal: 0,
        computedGrade: getGrade(0, u.gradingScale),
      };
      return { ...u, students: [...u.students, newStudent] };
    }));
  }, [setUnits]);

  const removeStudent = useCallback((unitId, studentId) => {
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      return { ...u, students: u.students.filter(s => s.id !== studentId) };
    }));
  }, [setUnits]);

  const value = {
    units,
    activeUnit,
    activeUnitId,
    storageError,
    setActiveUnitId,
    createUnit,
    updateUnit,
    deleteUnit,
    recomputeStudents,
    addComponent,
    updateComponent,
    removeComponent,
    setStudents,
    updateStudentMark,
    addStudent,
    removeStudent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
