import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className = '' }: UserMenuProps) {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className={`user-menu ${className}`} ref={menuRef}>
      <div className="user-trigger" onClick={handleUserClick}>
        <img
          src={user?.images?.[0]?.url || '/default-avatar.svg'}
          alt={user?.display_name || 'User'}
          className="user-avatar"
        />
        <span className="user-name">{user?.display_name}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <img
              src={user?.images?.[0]?.url || '/default-avatar.svg'}
              alt={user?.display_name || 'User'}
              className="dropdown-avatar"
            />
            <div className="dropdown-user-info">
              <div className="dropdown-user-name">{user?.display_name}</div>
              <div className="dropdown-user-id">@{user?.id}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item logout-item" onClick={handleLogout}>
            <span className="dropdown-icon">↗</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
