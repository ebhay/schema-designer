import { useEffect, useRef, useState } from "react";
import { ChevronDown, PlusIcon } from "lucide-react";
import { Button } from "./ui/button";

type Option = {
    label: string;
    value: string;
};

type DropdownProps = {
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
}

const Dropdown = ({ placeholder, onChange, options }: DropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState<boolean>(false);
    const [selected, setSelected] = useState<Option | null>(null);

    const handleSelect = (option: Option) => {
        setSelected(option);
        onChange(option.label);
        setOpen(false);
    }

    const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-64" ref={dropdownRef}>
            {/* DropDown Buttton */}
            <Button
                variant="ghost"
                onClick={() => setOpen(prev => !prev)}
                className="w-full flex justify-between items-center px-4 py-2 text-sm border border-gray-200 rounded-sm text-left bg-white hover:bg-gray-100"
            >
                <span>{selected?.label || placeholder || 'Select an option'}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
            </Button>


            {/* Dropdown Options */}
            {open && (
                <div className="absolute left-0 w-full mt-1 border border-gray-200 rounded-sm bg-white shadow-md z-50">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option)}
                            className={`m-1 px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 hover:rounded-sm ${selected?.value === option.value ? 'm-1 rounded-sm bg-gray-100 font-medium' : ''}`}
                        >
                            {option.label}
                            <div className="text-xs text-slate-500">
                                0 tables
                            </div>
                        </div>
                    ))}

                    {/* + New Project Button */}
                    <Button
                        size='lg'
                        variant="ghost"
                        onClick={() => {
                            setOpen(false);
                            console.log('Create new project clicked');
                        }}
                        className="w-full justify-start gap-2 text-sm text-left hover:bg-gray-100 rounded-sm"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>New Project</span>
                    </Button>

                </div>
            )}

        </div>
    )
}

export default Dropdown;