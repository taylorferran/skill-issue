import { Avatar } from '../ui';
import styles from './Header.module.css';

export interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.headerContent}>
        <div className={styles.logoSection}>
          <img 
            src="https://images.unsplash.com/photo-1611224923853-80b023f02d79?w=40&h=40&fit=crop&crop=center" 
            alt="Skill Issues Logo" 
            className={styles.logo}
          />
          <h1 className={styles.title}>Skill Issues</h1>
        </div>
        
        <div className={styles.authSection}>
          <Avatar />
        </div>
      </div>
    </header>
  );
}