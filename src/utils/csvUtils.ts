
/**
 * Utility functions for working with CSV files
 */

// Parse a CSV string into an array of objects
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

// Split data based on configurations with various split size handling scenarios
export const splitData = (
  data: Record<string, string>[], 
  configs: { accountName: string; sentType: string; splitSize: number; }[]
): Record<string, Record<string, string>[]> => {
  const result: Record<string, Record<string, string>[]> = {};
  
  // If no data to split, return empty result
  if (data.length === 0) {
    return result;
  }
  
  console.log(`splitData called with ${data.length} records and ${configs.length} configurations`);
  
  // Process each configuration
  let startIndex = 0;
  let nonZeroSplitSizesCount = configs.filter(c => c.splitSize > 0).length;
  let configsWithoutSplitSizeCount = configs.filter(c => c.splitSize === 0).length;
  
  // Special case: If we have all split sizes provided but they don't add up to the total,
  // we need to create an additional "remainder" file
  let totalSpecifiedRecords = configs.reduce((sum, config) => sum + (config.splitSize > 0 ? config.splitSize : 0), 0);
  let needsRemainder = totalSpecifiedRecords > 0 && totalSpecifiedRecords < data.length && nonZeroSplitSizesCount === configs.length;
  
  // Assign records to each split based on the configuration
  configs.forEach((config, index) => {
    const { accountName, sentType, splitSize } = config;
    
    // Determine the number of records for this split
    let recordsForThisSplit: number;
    
    if (splitSize > 0) {
      // Use the specified split size, but don't exceed available records
      recordsForThisSplit = Math.min(splitSize, data.length - startIndex);
    } else if (configsWithoutSplitSizeCount > 0) {
      // Distribute remaining records evenly among configs without split sizes
      const remainingRecords = data.length - totalSpecifiedRecords;
      recordsForThisSplit = Math.ceil(remainingRecords / configsWithoutSplitSizeCount);
      configsWithoutSplitSizeCount--; // Decrement for next iteration
    } else {
      // Default behavior: if no split sizes specified at all, distribute evenly
      recordsForThisSplit = Math.ceil(data.length / configs.length);
    }
    
    // Ensure we don't exceed available records
    recordsForThisSplit = Math.min(recordsForThisSplit, data.length - startIndex);
    
    console.log(`Split for ${accountName}_${sentType}: ${recordsForThisSplit} records starting at index ${startIndex}`);
    
    // Create the split and add to results
    const key = `${accountName}_${sentType}`;
    result[key] = [];
    
    // Add the records to this split
    for (let i = startIndex; i < startIndex + recordsForThisSplit && i < data.length; i++) {
      result[key].push({
        ...data[i],
        account: accountName,
        sent: sentType
      });
    }
    
    // Move the index for the next split
    startIndex += recordsForThisSplit;
    
    // Special case: When only one configuration is provided, create a remainder split
    if (configs.length === 1 && startIndex < data.length) {
      const remainderKey = `${accountName}_${sentType}_remainder`;
      result[remainderKey] = [];
      
      for (let i = startIndex; i < data.length; i++) {
        result[remainderKey].push({
          ...data[i],
          account: accountName,
          sent: `${sentType}_remainder`
        });
      }
      
      console.log(`Created remainder split ${remainderKey} with ${data.length - startIndex} records`);
      startIndex = data.length; // Update startIndex to avoid further processing
    }
  });
  
  // If we've processed all configs but still have records left and all configs had split sizes,
  // create a remainder split using the last config's information
  if (startIndex < data.length && needsRemainder) {
    const lastConfig = configs[configs.length - 1];
    const remainderKey = `${lastConfig.accountName}_${lastConfig.sentType}_remainder`;
    result[remainderKey] = [];
    
    for (let i = startIndex; i < data.length; i++) {
      result[remainderKey].push({
        ...data[i],
        account: lastConfig.accountName,
        sent: `${lastConfig.sentType}_remainder`
      });
    }
    
    console.log(`Created balance remainder split ${remainderKey} with ${data.length - startIndex} records`);
  }
  
  // Final log of results
  Object.keys(result).forEach(key => {
    console.log(`Final result: ${key} has ${result[key].length} records`);
  });
  
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
