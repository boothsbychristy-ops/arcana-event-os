import { useEffect } from "react";

export function useAccessibility() {
  useEffect(() => {
    // Track keyboard vs mouse navigation
    let isKeyboardNavigation = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isKeyboardNavigation = true;
        document.body.classList.add('keyboard-navigation');
      }
    };
    
    const handleMouseDown = () => {
      isKeyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    };
    
    // Add skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-to-main';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');
    
    // Only add if not already present
    if (!document.querySelector('.skip-to-main')) {
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Ensure main content has ID
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main';
      mainContent.setAttribute('role', 'main');
      mainContent.setAttribute('aria-label', 'Main content');
    }
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    
    // Announce route changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.id = 'route-announcer';
    
    if (!document.querySelector('#route-announcer')) {
      document.body.appendChild(announcer);
    }
    
    // Set up focus trap for modals/dialogs
    const trapFocus = (element: HTMLElement) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable?.focus();
            e.preventDefault();
          }
        }
      };
      
      element.addEventListener('keydown', handleTab);
      firstFocusable?.focus();
      
      return () => element.removeEventListener('keydown', handleTab);
    };
    
    // Export for modal components
    (window as any).trapFocus = trapFocus;
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
}

// Hook for managing focus on route changes
export function useRouteFocus(routeName: string) {
  useEffect(() => {
    // Announce route change
    const announcer = document.querySelector('#route-announcer');
    if (announcer) {
      announcer.textContent = `Navigated to ${routeName}`;
    }
    
    // Focus main content
    const mainContent = document.querySelector('main');
    if (mainContent instanceof HTMLElement) {
      mainContent.focus();
    }
  }, [routeName]);
}

// Hook for ARIA labels on dynamic content
export function useAriaAnnounce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  useEffect(() => {
    if (!message) return;
    
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    const timer = setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    };
  }, [message, priority]);
}