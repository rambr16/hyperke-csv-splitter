
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SplitConfigRowProps {
  index: number;
  accountName: string;
  sentType: string;
  splitSize: string;
  onAccountNameChange: (index: number, value: string) => void;
  onSentTypeChange: (index: number, value: string) => void;
  onSplitSizeChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const SplitConfigRow: React.FC<SplitConfigRowProps> = ({
  index,
  accountName,
  sentType,
  splitSize,
  onAccountNameChange,
  onSentTypeChange,
  onSplitSizeChange,
  onRemove,
  canRemove
}) => {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center mb-2">
      <Input
        placeholder="e.g., AMZ"
        value={accountName}
        onChange={(e) => onAccountNameChange(index, e.target.value)}
      />
      
      <Input
        placeholder="03/12 | AMZ | Offering Specific Roles with a Stronger Hook | Outscraper | Google mx | Feb 200"
        value={sentType}
        onChange={(e) => onSentTypeChange(index, e.target.value)}
      />
      
      <Input
        placeholder="e.g., 100"
        value={splitSize}
        onChange={(e) => onSplitSizeChange(index, e.target.value)}
      />
      
      {canRemove && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 hover:bg-red-100"
        >
          <X size={18} />
        </Button>
      )}
      
      {!canRemove && <div className="w-10"></div>}
    </div>
  );
};

export default SplitConfigRow;
