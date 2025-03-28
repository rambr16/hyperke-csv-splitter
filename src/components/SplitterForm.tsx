
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { parseCSV, splitData, objectsToCSV, downloadStringAsFile } from "@/utils/csvUtils";
import FileUpload from "./FileUpload";
import SplitConfigRow from "./SplitConfigRow";
import { Plus, RefreshCw } from "lucide-react";

interface SplitterFormProps {
  onFileLoaded: (file: File) => void;
  onReset?: () => void;
}

interface SplitConfig {
  accountName: string;
  sentType: string;
  splitSize: string;
}

const SplitterForm: React.FC<SplitterFormProps> = ({ onFileLoaded, onReset }) => {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [splitConfigs, setSplitConfigs] = React.useState<SplitConfig[]>([
    { accountName: "", sentType: "", splitSize: "" },
    { accountName: "", sentType: "", splitSize: "" }
  ]);
  const [csvData, setCsvData] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [processedData, setProcessedData] = React.useState<Record<string, Record<string, string>[]>>({});
  const [hasProcessed, setHasProcessed] = React.useState<boolean>(false);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setHasProcessed(false);
    
    try {
      console.log(`Reading file: ${selectedFile.name}, size: ${selectedFile.size} bytes`);
      const text = await selectedFile.text();
      console.log(`File content length: ${text.length} characters`);
      
      // Log the first ~200 characters to debug format issues
      console.log(`First part of file: ${text.substring(0, 200)}...`);
      
      const data = parseCSV(text);
      setCsvData(data);
      
      console.log("Parsed CSV data:", data.length, "records");
      
      if (data.length > 0) {
        setHeaders(Object.keys(data[0]));
        console.log("CSV headers:", Object.keys(data[0]));
      }
      
      if (onFileLoaded) {
        onFileLoaded(selectedFile);
      }
      
      toast({
        title: "File loaded successfully",
        description: `Loaded ${data.length} records from ${selectedFile.name}`,
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast({
        title: "Error loading file",
        description: "The file could not be parsed as a CSV",
        variant: "destructive",
      });
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setHasProcessed(false);
    setProcessedData({});
  };

  const handleReset = () => {
    console.log("SplitterForm: Resetting all data");
    handleClearFile();
    setSplitConfigs([
      { accountName: "", sentType: "", splitSize: "" },
      { accountName: "", sentType: "", splitSize: "" }
    ]);
    
    if (onReset) {
      onReset();
    }
    
    toast({
      title: "Data reset",
      description: "All data has been cleared",
    });
  };

  const handleAccountNameChange = (index: number, value: string) => {
    const newConfigs = [...splitConfigs];
    newConfigs[index].accountName = value;
    setSplitConfigs(newConfigs);
  };

  const handleSentTypeChange = (index: number, value: string) => {
    const newConfigs = [...splitConfigs];
    newConfigs[index].sentType = value;
    setSplitConfigs(newConfigs);
  };

  const handleSplitSizeChange = (index: number, value: string) => {
    const newConfigs = [...splitConfigs];
    newConfigs[index].splitSize = value;
    setSplitConfigs(newConfigs);
  };

  const handleAddRow = () => {
    setSplitConfigs([
      ...splitConfigs,
      { accountName: "", sentType: "", splitSize: "" }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (splitConfigs.length <= 2) return; // Keep at least 2 rows
    const newConfigs = splitConfigs.filter((_, i) => i !== index);
    setSplitConfigs(newConfigs);
  };

  const validateInputs = (): boolean => {
    if (!file) {
      toast({ title: "No file selected", description: "Please upload a CSV file", variant: "destructive" });
      return false;
    }
    
    // Filter out empty rows
    const validConfigs = splitConfigs.filter(config => 
      config.accountName.trim() !== "" && config.sentType.trim() !== ""
    );
    
    if (validConfigs.length === 0) {
      toast({ 
        title: "Invalid configuration", 
        description: "Please provide at least one valid row with account name and sent type", 
        variant: "destructive" 
      });
      return false;
    }
    
    // Check if any split sizes are invalid
    for (const config of validConfigs) {
      if (config.splitSize.trim() !== "" && isNaN(Number(config.splitSize.trim()))) {
        toast({ 
          title: "Invalid split size", 
          description: "Split sizes must be numbers", 
          variant: "destructive" 
        });
        return false;
      }
    }
    
    return true;
  };

  const handleProcess = () => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    
    try {
      // Filter out empty rows and convert to required format
      const validConfigs = splitConfigs
        .filter(config => config.accountName.trim() !== "" && config.sentType.trim() !== "")
        .map(config => ({
          accountName: config.accountName.trim(),
          sentType: config.sentType.trim(),
          splitSize: config.splitSize.trim() !== "" ? parseInt(config.splitSize.trim()) : 0
        }));
      
      console.log("Processing with configurations:", validConfigs);
      
      // Process all configurations at once with the new splitData function
      const result = splitData(csvData, validConfigs);
      
      setProcessedData(result);
      setHasProcessed(true);
      
      toast({
        title: "Processing complete",
        description: `Split ${csvData.length} records into ${Object.keys(result).length} files`,
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing error",
        description: "An error occurred while processing the data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (key: string) => {
    if (!processedData[key]) return;
    
    const allHeaders = [...headers, "account", "sent"];
    const csvString = objectsToCSV(processedData[key], allHeaders);
    
    downloadStringAsFile(csvString, `${key}.csv`, "text/csv");
    
    toast({
      title: "File downloaded",
      description: `Downloaded ${key}.csv with ${processedData[key].length} records`,
    });
  };

  const handleDownloadAll = () => {
    Object.keys(processedData).forEach(key => {
      handleDownload(key);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="file-upload">CSV File</Label>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
              >
                <RefreshCw size={16} className="mr-1" />
                Reset All
              </Button>
            </div>
            
            <FileUpload
              onFileSelected={handleFileSelected}
              selectedFile={file}
              onClearFile={handleClearFile}
            />
            
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Split Configuration</Label>
                <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] gap-4">
                  <div className="text-sm font-medium text-muted-foreground">Account Name</div>
                  <div className="text-sm font-medium text-muted-foreground">Sent Type</div>
                  <div className="text-sm font-medium text-muted-foreground">Split Size (optional)</div>
                  <div></div>
                </div>
                
                {splitConfigs.map((config, index) => (
                  <SplitConfigRow
                    key={index}
                    index={index}
                    accountName={config.accountName}
                    sentType={config.sentType}
                    splitSize={config.splitSize}
                    onAccountNameChange={handleAccountNameChange}
                    onSentTypeChange={handleSentTypeChange}
                    onSplitSizeChange={handleSplitSizeChange}
                    onRemove={handleRemoveRow}
                    canRemove={splitConfigs.length > 2}
                  />
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddRow}
                  className="mt-2"
                >
                  <Plus size={16} className="mr-1" />
                  Add Row
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleProcess} 
                disabled={isLoading || !file}
                className="bg-app-blue hover:bg-app-blue-dark"
              >
                {isLoading ? "Processing..." : "Process CSV"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {hasProcessed && Object.keys(processedData).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Processed Files</h3>
              
              <div className="space-y-2">
                {Object.keys(processedData).map((key) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-app-gray-light rounded">
                    <div>
                      <span className="font-medium">{key}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {processedData[key].length} records
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(key)}
                      className="text-app-blue hover:text-app-blue-dark hover:bg-app-blue/10"
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
              
              {Object.keys(processedData).length > 1 && (
                <div className="flex justify-end">
                  <Button onClick={handleDownloadAll} variant="outline">
                    Download All Files
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SplitterForm;
