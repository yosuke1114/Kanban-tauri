import React from "react";
import { RecurrenceRule } from "@/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getRecurrenceDescription } from "@/services/recurrence/recurrenceService";

interface RecurrenceSettingsProps {
  recurrence?: RecurrenceRule;
  onChange: (recurrence?: RecurrenceRule) => void;
}

export function RecurrenceSettings({
  recurrence,
  onChange,
}: RecurrenceSettingsProps) {
  const [enabled, setEnabled] = React.useState(!!recurrence);
  const [type, setType] = React.useState<RecurrenceRule["type"]>(
    recurrence?.type || "weekly"
  );
  const [interval, setInterval] = React.useState(recurrence?.interval || 1);
  const [endDate, setEndDate] = React.useState(recurrence?.endDate || "");

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked) {
      onChange({
        type,
        interval,
        endDate: endDate || undefined,
      });
    } else {
      onChange(undefined);
    }
  };

  const handleTypeChange = (newType: RecurrenceRule["type"]) => {
    setType(newType);
    if (enabled) {
      onChange({
        type: newType,
        interval,
        endDate: endDate || undefined,
      });
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInterval = Math.max(1, parseInt(e.target.value) || 1);
    setInterval(newInterval);
    if (enabled) {
      onChange({
        type,
        interval: newInterval,
        endDate: endDate || undefined,
      });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    if (enabled) {
      onChange({
        type,
        interval,
        endDate: newEndDate || undefined,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="recurrence-toggle" className="text-sm font-medium">
          繰り返しタスク
        </Label>
        <Switch
          id="recurrence-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {enabled && (
        <div className="space-y-4 pl-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recurrence-interval" className="text-sm mb-2 block">
                間隔
              </Label>
              <Input
                id="recurrence-interval"
                type="number"
                min="1"
                value={interval}
                onChange={handleIntervalChange}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="recurrence-type" className="text-sm mb-2 block">
                単位
              </Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger id="recurrence-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">日</SelectItem>
                  <SelectItem value="weekly">週</SelectItem>
                  <SelectItem value="monthly">月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="recurrence-end" className="text-sm mb-2 block">
              終了日 (任意)
            </Label>
            <Input
              id="recurrence-end"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-full"
            />
          </div>

          {recurrence && (
            <div className="text-sm text-muted-foreground">
              {getRecurrenceDescription(recurrence)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
