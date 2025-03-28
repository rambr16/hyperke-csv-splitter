
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { parseCSV, splitData, objectsToCSV, downloadStringAsFile } from "@/utils/csvUtils";
import FileUpload from "./FileUpload";

interface SplitterFormProps {}

const SplitterForm: React.FC<SplitterFormProps> = () => {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [accountName, setAccountName] = React.useState<string>("");
  const [sentTypes, setSentTypes] = React.useState<string>("");
  const [splitSize, setSplitSize] = React.useState<string>("");
  const [csvData, setCsvData] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [processedData, setProcessedData] = React.useState<Record<string, Record<string, string>[]>>({});
  const [hasProcessed, setHasProcessed] = React.useState<boolean>(false);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setHasProcessed(false);
    
    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      setCsvData(data);
      if (data.length > 0) {
        setHeaders(Object.keys(data[0]));
      }
      toast({
        title: "File loaded successfully",
        description: `Loaded ${data.length} records from ${selectedFile.name}`,
      });
    } catch (error) {
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

  const validateInputs = (): boolean => {
    if (!file) {
      toast({ title: "No file selected", description: "Please upload a CSV file", variant: "destructive" });
      return false;
    }
    
    if (!accountName.trim()) {
      toast({ title: "Account name required", description: "Please enter an account name", variant: "destructive" });
      return false;
    }
    
    if (!sentTypes.trim()) {
      toast({ title: "Sent types required", description: "Please enter comma-separated sent types (e.g., a1,a2,a3)", variant: "destructive" });
      return false;
    }
    
    // Validate split size is a number if provided
    if (splitSize.trim() !== "" && isNaN(Number(splitSize))) {
      toast({ title: "Invalid split size", description: "Split size must be a number", variant: "destructive" });
      return false;
    }
    
    return true;
  };

  const handleProcess = () => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    
    try {
      const sentTypesArray = sentTypes.split(',').map(t => t.trim()).filter(t => t !== "");
      
      if (sentTypesArray.length === 0) {
        toast({ title: "No valid sent types", description: "Please enter valid comma-separated sent types", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      const splitSizeValue = splitSize.trim() !== "" ? parseInt(splitSize) : undefined;
      
      const result = splitData(csvData, sentTypesArray, accountName, splitSizeValue);
      
      setProcessedData(result);
      setHasProcessed(true);
      
      toast({
        title: "Processing complete",
        description: `Split ${csvData.length} records into ${sentTypesArray.length} files`,
      });
    } catch (error) {
      toast({
        title: "Processing error",
        description: "An error occurred while processing the data",
        variant: "destructive",
      });
      console.error("Processing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (sentType: string) => {
    if (!processedData[sentType]) return;
    
    const allHeaders = [...headers, "account", "sent"];
    const csvString = objectsToCSV(processedData[sentType], allHeaders);
    const fileName = `${accountName}_${sentType}.csv`;
    
    downloadStringAsFile(csvString, fileName, "text/csv");
    
    toast({
      title: "File downloaded",
      description: `Downloaded ${fileName} with ${processedData[sentType].length} records`,
    });
  };

  const handleDownloadAll = () => {
    Object.keys(processedData).forEach(sentType => {
      handleDownload(sentType);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">CSV File</Label>
              <FileUpload
                onFileSelected={handleFileSelected}
                selectedFile={file}
                onClearFile={handleClearFile}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  placeholder="e.g., AMZ"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="sentTypes">Sent Types</Label>
                <Input
                  id="sentTypes"
                  placeholder="e.g., a1,a2,a3"
                  value={sentTypes}
                  onChange={(e) => setSentTypes(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="splitSize">
                  Split Size 
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                </Label>
                <Input
                  id="splitSize"
                  placeholder="Records per type (leave blank for even split)"
                  value={splitSize}
                  onChange={(e) => setSplitSize(e.target.value)}
                  type="number"
                  min="1"
                />
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
                {Object.keys(processedData).map((sentType) => (
                  <div key={sentType} className="flex justify-between items-center p-2 bg-app-gray-light rounded">
                    <div>
                      <span className="font-medium">{sentType}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {processedData[sentType].length} records
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(sentType)}
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
