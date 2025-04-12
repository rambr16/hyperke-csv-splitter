
/**
 * Split data based on configurations with various split size handling scenarios
 */
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
  
  // Process each configuration individually to ensure unique keys
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const { accountName, sentType, splitSize } = config;
    const key = `${accountName}_${sentType}_${i}`; // Add index to make each key unique
    
    // Calculate how many records to allocate to this split
    let recordsToAllocate = 0;
    
    if (splitSize > 0) {
      // If split size is specified, use that or what's remaining
      recordsToAllocate = Math.min(splitSize, remainingData.length);
    } else if (i === configs.length - 1) {
      // For the last config with no split size, allocate all remaining records
      recordsToAllocate = remainingData.length;
    } else {
      // For configs with no split size (except the last one), distribute evenly
      // Count how many configs have no split size left
      const remainingConfigsWithNoSize = configs.slice(i).filter(c => c.splitSize <= 0).length;
      
      if (remainingConfigsWithNoSize > 0) {
        recordsToAllocate = Math.ceil(remainingData.length / remainingConfigsWithNoSize);
      }
    }
    
    if (recordsToAllocate > 0) {
      console.log(`Allocating ${recordsToAllocate} records to ${key}`);
      
      // Initialize the array for this split
      result[key] = [];
      
      // Add records to this split
      for (let j = 0; j < recordsToAllocate; j++) {
        if (j < remainingData.length) {
          result[key].push({
            ...remainingData[j],
            account: accountName,
            sent: sentType
          });
        }
      }
      
      // Remove the allocated records from remainingData
      remainingData = remainingData.slice(recordsToAllocate);
    }
  }
  
  // Final log of results
  Object.keys(result).forEach(key => {
    // Extract the original config key without the index
    const keyParts = key.split('_');
    const originalKey = keyParts.slice(0, -1).join('_');
    console.log(`Final result: ${originalKey} has ${result[key].length} records`);
  });
  
  return result;
};
