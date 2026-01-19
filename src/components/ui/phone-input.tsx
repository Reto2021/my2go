import * as React from "react";
import { ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Country data with dial codes and flags
const countries = [
  { code: "CH", name: "Schweiz", dialCode: "+41", flag: "🇨🇭" },
  { code: "DE", name: "Deutschland", dialCode: "+49", flag: "🇩🇪" },
  { code: "AT", name: "Österreich", dialCode: "+43", flag: "🇦🇹" },
  { code: "FR", name: "Frankreich", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italien", dialCode: "+39", flag: "🇮🇹" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423", flag: "🇱🇮" },
  { code: "NL", name: "Niederlande", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgien", dialCode: "+32", flag: "🇧🇪" },
  { code: "LU", name: "Luxemburg", dialCode: "+352", flag: "🇱🇺" },
  { code: "ES", name: "Spanien", dialCode: "+34", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "GB", name: "Grossbritannien", dialCode: "+44", flag: "🇬🇧" },
  { code: "PL", name: "Polen", dialCode: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Tschechien", dialCode: "+420", flag: "🇨🇿" },
  { code: "HU", name: "Ungarn", dialCode: "+36", flag: "🇭🇺" },
  { code: "US", name: "USA", dialCode: "+1", flag: "🇺🇸" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
  variant?: "default" | "auth";
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "79 123 45 67",
  error = false,
  className,
  variant = "default",
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse current value to extract country and number
  const parsePhoneValue = (val: string) => {
    if (!val) return { country: countries[0], number: "" };
    
    // Find matching country by dial code
    const sortedCountries = [...countries].sort((a, b) => 
      b.dialCode.length - a.dialCode.length
    );
    
    for (const country of sortedCountries) {
      if (val.startsWith(country.dialCode)) {
        return {
          country,
          number: val.slice(country.dialCode.length).trim(),
        };
      }
    }
    
    // Default to Switzerland if no match
    return { country: countries[0], number: val.replace(/^\+?/, "") };
  };
  
  const { country: selectedCountry, number } = parsePhoneValue(value);
  
  const handleCountrySelect = (country: typeof countries[0]) => {
    onChange(country.dialCode + number);
    setOpen(false);
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and spaces
    const cleanedNumber = e.target.value.replace(/[^\d\s]/g, "");
    onChange(selectedCountry.dialCode + cleanedNumber);
  };

  if (variant === "auth") {
    return (
      <div className={cn("flex gap-2", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1 h-12 px-3 rounded-2xl",
                "bg-muted border-2",
                error ? "border-destructive" : "border-transparent",
                "hover:bg-muted/80 transition-all duration-200",
                "focus:outline-none focus:border-accent focus:bg-background"
              )}
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-64 p-0 bg-popover border border-border shadow-lg z-50" 
            align="start"
          >
            <ScrollArea className="h-64">
              <div className="p-1">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                      "hover:bg-muted transition-colors",
                      selectedCountry.code === country.code && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="flex-1 text-sm font-medium">{country.name}</span>
                    <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        
        <div className="relative flex-1">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="tel"
            placeholder={placeholder}
            value={number}
            onChange={handleNumberChange}
            className={cn(
              "w-full h-12 pl-12 pr-4 rounded-2xl",
              "bg-muted border-2",
              error ? "border-destructive" : "border-transparent",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:border-accent focus:bg-background",
              "transition-all duration-200"
            )}
          />
        </div>
      </div>
    );
  }

  // Default variant for ProfilePage
  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "flex items-center gap-1 h-10 px-3 shrink-0",
              error && "border-destructive"
            )}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.dialCode}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-0 bg-popover border border-border shadow-lg z-50" 
          align="start"
        >
          <ScrollArea className="h-64">
            <div className="p-1">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                    "hover:bg-muted transition-colors",
                    selectedCountry.code === country.code && "bg-primary/10 text-primary"
                  )}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="flex-1 text-sm font-medium">{country.name}</span>
                  <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      
      <input
        type="tel"
        placeholder={placeholder}
        value={number}
        onChange={handleNumberChange}
        className={cn(
          "flex-1 h-10 px-3 rounded-md",
          "bg-background border border-input",
          error && "border-destructive",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "transition-colors"
        )}
      />
    </div>
  );
}
