import * as XLSX from 'xlsx';

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const headers = json.length > 0 ? Object.keys(json[0]) : [];
        resolve({ rows: json, headers });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(students, components, unitName, lecturerName) {
  const rows = students.map((s, i) => {
    const row = { '#': i + 1 };
    if (s.regNo) row['Reg No'] = s.regNo;
    row['Student Name'] = s.name;
    if (components && components.length > 0) {
      components.forEach(c => {
        row[c.name] = s.marks?.[c.id] ?? '';
      });
    }
    row['Total'] = s.computedTotal ?? 0;
    row['Grade'] = s.computedGrade ?? '';
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, unitName || 'Results');

  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length + 2, 12)
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${(unitName || 'results').replace(/[^a-zA-Z0-9]/g, '_')}_results.xlsx`);
}

export function autoDetectColumns(headers) {
  const mapping = { name: null, regNo: null };
  const namePat = /name|student/i;
  const regPat = /reg|admission|adm|registration|matric|number|no/i;

  for (const h of headers) {
    if (!mapping.name && namePat.test(h)) mapping.name = h;
    if (!mapping.regNo && regPat.test(h) && !namePat.test(h)) mapping.regNo = h;
  }
  // If reg pattern also matched name column header, be more specific
  if (mapping.name && mapping.regNo && mapping.name === mapping.regNo) {
    mapping.regNo = null;
  }
  return mapping;
}
