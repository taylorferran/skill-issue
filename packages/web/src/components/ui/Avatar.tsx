import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import styles from './Avatar.module.css';

export interface AvatarProps {
  className?: string;
}

export function Avatar({ className = '' }: AvatarProps) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Button 
        variant="primary" 
        size="medium"
        onClick={() => navigate('/login')}
        className={className}
      >
        Sign In
      </Button>
    );
  }

  const getInitials = (name: string, email: string): string => {
    if (name && name.trim()) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user.name, user.email);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleProfileSettings = () => {
    setIsOpen(false);
    // Navigate to profile settings when implemented
    console.log('Navigate to profile settings');
  };

  const handleAccountInfo = () => {
    setIsOpen(false);
    // Navigate to account info when implemented
    console.log('Navigate to account info');
  };

  return (
    <div className={`${styles.avatarContainer} ${className}`} ref={dropdownRef}>
      <button
        className={styles.avatarButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.name || 'User avatar'} 
            className={styles.avatarImage}
          />
        ) : (
          <span className={styles.avatarInitials}>{initials}</span>
        )}
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownHeader}>
            <div className={styles.userName}>{user.name || 'User'}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
          
          <div className={styles.dropdownDivider} />
          
          <button 
            className={styles.dropdownItem} 
            onClick={handleProfileSettings}
          >
            Profile Settings
          </button>
          
          <button 
            className={styles.dropdownItem} 
            onClick={handleAccountInfo}
          >
            Account Info
          </button>
          
          <div className={styles.dropdownDivider} />
          
          <button 
            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}