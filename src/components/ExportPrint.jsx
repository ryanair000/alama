import React from 'react';
import { useApp } from '../context/AppContext';
import { exportToExcel } from '../utils/excel';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

export default function ExportPrint() {
  const { activeUnit } = useApp();

  if (!activeUnit || activeUnit.students.length === 0) return null;

  const handleExport = () => {
    exportToExcel(
      activeUnit.students,
      activeUnit.mode === 'components' ? activeUnit.components : [],
      `${activeUnit.code} — ${activeUnit.name}`,
      activeUnit.lecturerName
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const { students, components, mode, code, name, lecturerName } = activeUnit;
    const date = new Date().toLocaleDateString('en-KE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    let tableHeaders = '<th>#</th><th>Reg No</th><th>Name</th>';
    if (mode === 'components') {
      components.forEach(c => { tableHeaders += `<th>${esc(c.name)} (${esc(c.maxMark)})</th>`; });
    }
    tableHeaders += '<th>Total</th><th>Grade</th>';

    const tableRows = students.map((s, i) => {
      let row = `<td>${i + 1}</td><td>${esc(s.regNo)}</td><td>${esc(s.name)}</td>`;
      if (mode === 'components') {
        components.forEach(c => {
          row += `<td>${esc(s.marks?.[c.id] ?? '')}</td>`;
        });
      }
      row += `<td><strong>${esc(s.computedTotal ?? 0)}</strong></td>`;
      row += `<td><strong>${esc(s.computedGrade ?? '')}</strong></td>`;
      return `<tr>${row}</tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${esc(code)} — ${esc(name)} Results</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #000; padding-bottom: 15px; }
    .header h1 { font-size: 20px; margin-bottom: 4px; }
    .header h2 { font-size: 16px; font-weight: normal; margin-bottom: 8px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    td:first-child, th:first-child { text-align: center; width: 30px; }
    .footer { margin-top: 40px; font-size: 12px; }
    .signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .sig-line { border-top: 1px solid #000; width: 200px; padding-top: 4px; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${esc(code)} — ${esc(name)}</h1>
    <h2>Student Results</h2>
  </div>
  <div class="meta">
    <span><strong>Lecturer:</strong> ${esc(lecturerName) || '_______________'}</span>
    <span><strong>Date:</strong> ${date}</span>
    <span><strong>Total Students:</strong> ${students.length}</span>
  </div>
  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="signature">
    <div class="sig-line">Lecturer's Signature</div>
    <div class="sig-line">HOD's Signature</div>
    <div class="sig-line">Date</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="export-bar">
      <button className="btn btn-primary" onClick={handleExport}>
        📥 Export as Excel
      </button>
      <button className="btn btn-outline" onClick={handlePrint}>
        🖨 Print Results
      </button>
    </div>
  );
}
