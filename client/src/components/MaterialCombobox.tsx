import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/currency";
import type { Material } from "@shared/schema";

interface MaterialComboboxProps {
  materials: Material[];
  value: string;
  onValueChange: (value: string) => void;
  currency?: string;
  testId?: string;
}

export function MaterialCombobox({
  materials,
  value,
  onValueChange,
  currency = "USD",
  testId = "select-material",
}: MaterialComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  const selectedMaterial = materials.find((mat) => mat.id === value);

  const filteredMaterials = useMemo(() => {
    if (!searchValue) return sortedMaterials;
    const search = searchValue.toLowerCase();
    return sortedMaterials.filter((mat) =>
      mat.name.toLowerCase().includes(search)
    );
  }, [sortedMaterials, searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          data-testid={testId}
        >
          {selectedMaterial ? (
            <span className="truncate">{selectedMaterial.name}</span>
          ) : (
            <span className="text-muted-foreground">Select material...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search..."
            value={searchValue}
            onValueChange={setSearchValue}
            data-testid={`${testId}-search`}
          />
          <CommandList>
            <CommandEmpty>No material found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__add_new__"
                onSelect={() => {
                  onValueChange("__add_new__");
                  setOpen(false);
                  setSearchValue("");
                }}
                data-testid="option-add-new-material"
              >
                <Plus className="mr-2 h-4 w-4 text-primary" />
                <span className="text-primary">Add New Material</span>
              </CommandItem>
              {filteredMaterials.map((mat) => (
                <CommandItem
                  key={mat.id}
                  value={mat.id}
                  onSelect={() => {
                    onValueChange(mat.id);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  data-testid={`option-material-${mat.id}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === mat.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">{mat.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatCurrency(Number(mat.pricePerUnit || 0).toFixed(2), currency)}/{mat.unit || "pc"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
