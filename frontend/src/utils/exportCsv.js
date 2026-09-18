/**
 * Export JSON array of data to CSV file and trigger download
 * @param {Array<Object>} data 
 * @param {Array<{ key: string, label: string, formatter?: (val: any, row: Object) => string }>} columns 
 * @param {string} filename 
 */
export function exportToCSV(data, columns, filename = 'export.csv') {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (col.formatter) {
        val = col.formatter(val, row);
      } else if (val === null || val === undefined) {
        val = '';
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
