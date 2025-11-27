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
import type { Ingredient } from "@shared/schema";

interface IngredientComboboxProps {
  ingredients: Ingredient[];
  value: string;
  onValueChange: (value: string) => void;
  currency?: string;
  testId?: string;
}

export function IngredientCombobox({
  ingredients,
  value,
  onValueChange,
  currency = "USD",
  testId = "select-ingredient",
}: IngredientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const sortedIngredients = useMemo(() => {
    return [...ingredients].sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients]);

  const selectedIngredient = ingredients.find((ing) => ing.id === value);

  const filteredIngredients = useMemo(() => {
    if (!searchValue) return sortedIngredients;
    const search = searchValue.toLowerCase();
    return sortedIngredients.filter((ing) =>
      ing.name.toLowerCase().includes(search)
    );
  }, [sortedIngredients, searchValue]);

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
          {selectedIngredient ? (
            <span className="truncate">
              {selectedIngredient.name}
              {selectedIngredient.isCountBased ? " (count)" : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">Select ingredient...</span>
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
            <CommandEmpty>No ingredient found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__add_new__"
                onSelect={() => {
                  onValueChange("__add_new__");
                  setOpen(false);
                  setSearchValue("");
                }}
                data-testid="option-add-new-ingredient"
              >
                <Plus className="mr-2 h-4 w-4 text-primary" />
                <span className="text-primary">Add New Ingredient</span>
              </CommandItem>
              {filteredIngredients.map((ing) => (
                <CommandItem
                  key={ing.id}
                  value={ing.id}
                  onSelect={() => {
                    onValueChange(ing.id);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  data-testid={`option-ingredient-${ing.id}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === ing.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">
                    {ing.name}
                    {ing.isCountBased ? " (count)" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatCurrency(Number(ing.pricePerGram).toFixed(4), currency)}/g
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
