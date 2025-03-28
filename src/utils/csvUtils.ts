
/**
 * Utility functions for working with CSV files
 */

// Parse a CSV string into an array of objects
export const parseCSV = (csvString: string): Record<string, string>[] => {
  const lines = csvString.split('\n');
  if (lines.length < 2) return [];
  
  // Get headers from the first line
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse data rows
  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = lines[i].split(',').map(value => value.trim());
    if (values.length !== headers.length) continue; // Skip malformed rows
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    result.push(row);
  }
  
  return result;
};

// Convert an array of objects to a CSV string
export const objectsToCSV = (data: Record<string, string>[], headers?: string[]): string => {
  if (data.length === 0) return '';
  
  // If headers not provided, use keys from the first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  let csvString = csvHeaders.join(',') + '\n';
  
  // Add data rows
  data.forEach(row => {
    const rowValues = csvHeaders.map(header => {
      const value = row[header] !== undefined ? row[header] : '';
      // Escape quotes and wrap in quotes if needed
      return value.includes(',') || value.includes('"') || value.includes('\n') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    });
    csvString += rowValues.join(',') + '\n';
  });
  
  return csvString;
};

// Split data based on multiple split sizes
export const splitData = (
  data: Record<string, string>[], 
  sentTypes: string[],
  accountName: string,
  splitSizes: number[] = []
): Record<string, Record<string, string>[]> => {
  const result: Record<string, Record<string, string>[]> = {};
  
  // Initialize result object with empty arrays for each sent type
  sentTypes.forEach(type => {
    result[type] = [];
  });
  
  // If no data to split, return empty result
  if (data.length === 0) {
    return result;
  }
  
  // Handle the case when no split sizes are provided (even distribution)
  if (splitSizes.length === 0) {
    const calculatedSplitSize = Math.ceil(data.length / sentTypes.length);
    
    // Distribute rows among sent types
    data.forEach((row, index) => {
      const typeIndex = Math.floor(index / calculatedSplitSize);
      // Make sure we don't exceed the array bounds
      const sentType = typeIndex < sentTypes.length ? sentTypes[typeIndex] : sentTypes[sentTypes.length - 1];
      
      // Add account and sent columns to the row
      const newRow = { ...row, account: accountName, sent: sentType };
      result[sentType].push(newRow);
    });
  } 
  // Handle the case with specific split sizes
  else {
    let currentIndex = 0;
    
    // Process each sent type with its corresponding split size
    for (let i = 0; i < sentTypes.length; i++) {
      const sentType = sentTypes[i];
      // If there's a split size for this sent type, use it; otherwise use remaining records
      const splitSize = i < splitSizes.length ? splitSizes[i] : 
                       (i === 0 && splitSizes.length === 1) ? splitSizes[0] : 
                       Math.ceil((data.length - currentIndex) / (sentTypes.length - i));
      
      // Add records to this sent type's group
      const endIndex = Math.min(currentIndex + splitSize, data.length);
      for (let j = currentIndex; j < endIndex; j++) {
        const row = data[j];
        const newRow = { ...row, account: accountName, sent: sentType };
        result[sentType].push(newRow);
      }
      
      currentIndex = endIndex;
      
      // If we've processed all records, break the loop
      if (currentIndex >= data.length) {
        break;
      }
    }
  }
  
  return result;
};

// Download a string as a file
export const downloadStringAsFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};
