
/**
 * Parse a CSV string into an array of objects
 */
export const parseCSV = (csvString: string): Record<string, string>[] => {
  // First, normalize line endings to ensure consistent handling across platforms
  const normalizedString = csvString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedString.split('\n');
  
  if (lines.length < 2) return [];
  
  // Get headers from the first line
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse data rows
  const result: Record<string, string>[] = [];
  
  // Debug the total number of lines
  console.log(`CSV has ${lines.length} lines (including header row)`);
  
  // Skip the header row (index 0) and process all data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Handle values that may contain commas inside quotes
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    // Skip malformed rows
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i} due to mismatched column count: expected ${headers.length}, got ${values.length}`);
      continue;
    }
    
    // Create object from values
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      // Remove quotation marks if present
      let value = values[index];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1).replace(/""/g, '"');
      }
      row[header] = value;
    });
    
    result.push(row);
  }
  
  console.log(`Parsed ${result.length} records from CSV`);
  return result;
};
