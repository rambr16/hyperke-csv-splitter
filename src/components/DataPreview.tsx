
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataPreviewProps {
  data: Record<string, string>[];
  maxRows?: number;
  title: string;
  emptyMessage?: string;
}

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  maxRows = 5,
  title,
  emptyMessage = "No data to display",
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all unique column headers
  const headers = Object.keys(data[0] || {});
  const previewData = data.slice(0, maxRows);
  const hasMoreRows = data.length > maxRows;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          <span className="text-sm font-normal text-muted-foreground">
            {data.length} record{data.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] rounded-md">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell key={`${index}-${header}`} className="max-w-[200px] truncate">
                        {row[header] || ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMoreRows && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Showing {maxRows} of {data.length} records
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DataPreview;
