import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const icons = {
    dark: <Moon className="h-4 w-4" />,
    light: <Sun className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const labels = {
    dark: 'Dark',
    light: 'Light',
    system: 'System',
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      data-testid="button-theme-toggle"
      className="rounded-full"
    >
      {icons[theme]}
      <span className="sr-only">Toggle theme ({labels[theme]})</span>
    </Button>
  );
}
