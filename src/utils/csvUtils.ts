
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

// Split data based on sent types and optional split sizes
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
  
  console.log(`splitData called with ${data.length} records, sentTypes: ${sentTypes.join(',')}, account: ${accountName}, splitSizes: ${splitSizes.join(',') || 'none'}`);
  
  // Special handling for single sent type to ensure at least two output files
  if (sentTypes.length === 1 && splitSizes.length <= 1) {
    const sentType = sentTypes[0];
    let splitSize: number;
    
    // Determine the split size
    if (splitSizes.length === 1 && splitSizes[0] > 0) {
      splitSize = splitSizes[0];
    } else {
      // Default to half the data when no split size is provided
      splitSize = Math.ceil(data.length / 2);
    }
    
    console.log(`Single sent type with ${splitSize} split size (out of ${data.length} total records)`);
    
    // Generate a second sent type for the remainder
    const secondSentType = `${sentType}_remainder`;
    result[secondSentType] = [];
    
    // Split the first part according to the specified split size
    const firstPart = data.slice(0, splitSize);
    firstPart.forEach(row => {
      result[sentType].push({ ...row, account: accountName, sent: sentType });
    });
    
    // Put the remainder in the second sent type
    const secondPart = data.slice(splitSize);
    secondPart.forEach(row => {
      result[secondSentType].push({ ...row, account: accountName, sent: secondSentType });
    });
    
    console.log(`Split into ${result[sentType].length} records for ${sentType} and ${result[secondSentType].length} records for ${secondSentType}`);
    return result;
  }
  
  // Handle multiple sent types
  // Handle the case when no split sizes are provided (even distribution)
  if (splitSizes.length === 0) {
    const calculatedSplitSize = Math.ceil(data.length / sentTypes.length);
    console.log(`No split sizes provided. Using calculated size of ${calculatedSplitSize} per sent type`);
    
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
      let splitSize: number;
      
      // Handle different split size scenarios
      if (i < splitSizes.length) {
        splitSize = splitSizes[i];
      } else if (splitSizes.length === 1) {
        // If only one split size is provided, use it for the first sent type
        // and divide the rest evenly among remaining sent types
        if (i === 0) {
          splitSize = splitSizes[0];
        } else {
          const remainingRecords = data.length - splitSizes[0];
          const remainingSentTypes = sentTypes.length - 1;
          splitSize = remainingRecords > 0 ? Math.ceil(remainingRecords / remainingSentTypes) : 0;
        }
      } else {
        // Distribute remaining records evenly
        splitSize = Math.ceil((data.length - currentIndex) / (sentTypes.length - i));
      }
      
      console.log(`Sent type ${sentType} gets split size of ${splitSize}`);
      
      // Add records to this sent type's group
      const endIndex = Math.min(currentIndex + splitSize, data.length);
      for (let j = currentIndex; j < endIndex; j++) {
        const row = data[j];
        const newRow = { ...row, account: accountName, sent: sentType };
        result[sentType].push(newRow);
      }
      
      console.log(`Added ${endIndex - currentIndex} records to sent type ${sentType}`);
      currentIndex = endIndex;
      
      // If we've processed all records, break the loop
      if (currentIndex >= data.length) {
        break;
      }
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
