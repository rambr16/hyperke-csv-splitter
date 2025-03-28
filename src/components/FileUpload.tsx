
import React, { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  selectedFile,
  onClearFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileSelected(file);
        }
      }
    },
    [onFileSelected]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelected(files[0]);
      }
    },
    [onFileSelected]
  );

  return (
    <Card
      className={cn(
        "border-2 border-dashed p-6 flex flex-col items-center justify-center space-y-4 transition-colors",
        isDragging
          ? "border-app-blue bg-app-blue/5"
          : selectedFile
          ? "border-green-500 bg-green-50"
          : "border-gray-300 hover:border-app-blue"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <File className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClearFile}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-full bg-app-blue/10 p-3">
            <Upload className="h-6 w-6 text-app-blue" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              Drag & drop your CSV file here, or{" "}
              <label className="text-app-blue cursor-pointer hover:underline">
                browse
                <input
                  type="file"
                  className="sr-only"
                  accept=".csv,text/csv"
                  onChange={handleFileInputChange}
                />
              </label>
            </p>
            <p className="text-xs text-muted-foreground">
              Only CSV files are supported
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

export default FileUpload;
