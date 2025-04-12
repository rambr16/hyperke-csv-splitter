
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
  if (data.length === 0 || configs.length === 0) {
    return result;
  }
  
  console.log(`splitData called with ${data.length} records and ${configs.length} configurations`);
  
  // Create a copy of data to work with
  let remainingData = [...data];
  let totalAllocated = 0;
  
  // First, handle all configurations with specified split sizes
  // Process all configurations with specified split sizes first
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const { accountName, sentType, splitSize } = config;
    const key = `${accountName}_${sentType}`;
    
    // Skip configs with no split size for now
    if (splitSize <= 0) continue;
    
    // Calculate how many records to allocate to this split
    // Don't exceed the remaining records
    const recordsToAllocate = Math.min(splitSize, remainingData.length);
    
    if (recordsToAllocate > 0) {
      console.log(`Allocating ${recordsToAllocate} records to ${key} (specified split size)`);
      
      // Initialize the array for this split if needed
      result[key] = [];
      
      // Add records to this split
      for (let j = 0; j < recordsToAllocate; j++) {
        result[key].push({
          ...remainingData[j],
          account: accountName,
          sent: sentType
        });
      }
      
      // Remove the allocated records from remainingData
      remainingData = remainingData.slice(recordsToAllocate);
      totalAllocated += recordsToAllocate;
    }
  }
  
  // Count configs with no specified size
  const configsWithNoSize = configs.filter(c => c.splitSize <= 0).length;
  
  // If there are still records left and configs with no specified size
  if (remainingData.length > 0 && configsWithNoSize > 0) {
    // Calculate records per remaining config (approximate equal distribution)
    const recordsPerConfig = Math.ceil(remainingData.length / configsWithNoSize);
    
    let configsProcessed = 0;
    
    // Process configs with no specified size
    for (const config of configs) {
      if (config.splitSize > 0) continue; // Skip configs with specified size
      
      const { accountName, sentType } = config;
      const key = `${accountName}_${sentType}`;
      
      // For the last config, give all remaining records
      const recordsToAllocate = (configsProcessed === configsWithNoSize - 1)
        ? remainingData.length
        : Math.min(recordsPerConfig, remainingData.length);
      
      if (recordsToAllocate > 0) {
        console.log(`Allocating ${recordsToAllocate} records to ${key} (unspecified split size)`);
        
        // Initialize the array for this split if needed
        result[key] = [];
        
        // Add records to this split
        for (let j = 0; j < recordsToAllocate; j++) {
          result[key].push({
            ...remainingData[j],
            account: accountName,
            sent: sentType
          });
        }
        
        // Remove the allocated records from remainingData
        remainingData = remainingData.slice(recordsToAllocate);
      }
      
      configsProcessed++;
    }
  }
  
  // Handle special case for only 1 configuration
  if (configs.length === 1 && configs[0].splitSize > 0 && remainingData.length > 0) {
    const config = configs[0];
    const remainderKey = `${config.accountName}_${config.sentType}_remainder`;
    
    console.log(`Creating remainder split ${remainderKey} with ${remainingData.length} records`);
    
    // Initialize the array for this split
    result[remainderKey] = [];
    
    // Add remaining records to this split
    for (const record of remainingData) {
      result[remainderKey].push({
        ...record,
        account: config.accountName,
        sent: `${config.sentType}_remainder`
      });
    }
  }
  
  // Special case for multiple configurations with all split sizes specified
  if (configs.length > 1 && configsWithNoSize === 0 && remainingData.length > 0) {
    // Use the last config for the remainder
    const lastConfig = configs[configs.length - 1];
    const remainderKey = `${lastConfig.accountName}_${lastConfig.sentType}_remainder`;
    
    console.log(`Creating remainder split ${remainderKey} with ${remainingData.length} records`);
    
    // Initialize the array for this split
    result[remainderKey] = [];
    
    // Add remaining records to this split
    for (const record of remainingData) {
      result[remainderKey].push({
        ...record,
        account: lastConfig.accountName,
        sent: `${lastConfig.sentType}_remainder`
      });
    }
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
