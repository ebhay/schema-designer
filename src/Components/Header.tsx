import { Share, Users } from "lucide-react";
import Dropdown from "./Dropdown";
import { Button } from "./ui/button";
import { useState, type SetStateAction } from "react";
import { MoonCrossIcon } from "@/Icons/MoonCrossIcon";
import { MoonIcon } from "@/Icons/MoonIcon";

type HeaderProps = {
  setSelectedProject: React.Dispatch<SetStateAction<string>>;
}

const Header = ({ setSelectedProject }: HeaderProps) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const options = [
    { label: "E-Commerce Database", value: "ecommerce" },
    { label: "User Management Database", value: "usermanagement" },
    { label: "Database 2", value: "database-2" },
  ];
  
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const updated = !prev;
      console.log("Dark Mode:", updated);
      return updated;
    });
  };

  return (
    <div className="px-4 py-2 h-14 flex justify-between items-center border-b border-gray-400">
      <div className="flex gap-2 items-center">
        <div className="p-2 text-2xl font-semibold rounded-sm">
          Schema Designer
        </div>
        <div className="p-2">
          <Dropdown
            placeholder="Select an option"
            options={options}
            onChange={(value: string) => {
              setSelectedProject(value);
              console.log(`Selected Project: ${value}`);
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Button size="lg" variant="outline" className="cursor-pointer gap-2">
          <Users className="w-4 h-4" />
          <span>Invite</span>
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="cursor-pointer"
          onClick={toggleDarkMode}
        >
          {darkMode ? (
            <MoonCrossIcon size="5" className="w-4 h-4" />
          ) : (
            <MoonIcon size="5" className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Header;
