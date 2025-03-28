
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SplitterForm from "@/components/SplitterForm";
import DataPreview from "@/components/DataPreview";
import { parseCSV } from "@/utils/csvUtils";

const Index = () => {
  const [originalData, setOriginalData] = useState<Record<string, string>[]>([]);

  const handleFileLoaded = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseCSV(text);
      setOriginalData(data);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setOriginalData([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-app-gray-light">
      <header className="bg-white shadow-sm">
        <div className="container py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-app-blue-dark">Hyperke CSV Splitter</h1>
            <p className="text-muted-foreground">
              Upload a CSV file, configure split settings, and download the processed files
            </p>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 gap-8">
          <SplitterForm onFileLoaded={handleFileLoaded} />
          
          <ScrollArea className="h-full">
            <div className="space-y-8 pb-10">
              <DataPreview 
                data={originalData} 
                title="Original Data Preview" 
                emptyMessage="Upload a CSV file to see a preview" 
              />
            </div>
          </ScrollArea>
        </div>
      </main>

      <footer className="bg-app-gray-dark text-white py-4">
        <div className="container">
          <div className="text-center text-sm">
            <p>Hyperke CSV Splitter &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
