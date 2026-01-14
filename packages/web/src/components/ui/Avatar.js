import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import styles from './Avatar.module.css';
export function Avatar({ className = '' }) {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    if (!user) {
        return (_jsx(Button, { variant: "primary", size: "medium", onClick: () => navigate('/login'), className: className, children: "Sign In" }));
    }
    const getInitials = (name, email) => {
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
    return (_jsxs("div", { className: `${styles.avatarContainer} ${className}`, ref: dropdownRef, children: [_jsx("button", { className: styles.avatarButton, onClick: () => setIsOpen(!isOpen), "aria-expanded": isOpen, "aria-haspopup": "true", children: user.avatarUrl ? (_jsx("img", { src: user.avatarUrl, alt: user.name || 'User avatar', className: styles.avatarImage })) : (_jsx("span", { className: styles.avatarInitials, children: initials })) }), isOpen && (_jsxs("div", { className: styles.dropdownMenu, children: [_jsxs("div", { className: styles.dropdownHeader, children: [_jsx("div", { className: styles.userName, children: user.name || 'User' }), _jsx("div", { className: styles.userEmail, children: user.email })] }), _jsx("div", { className: styles.dropdownDivider }), _jsx("button", { className: styles.dropdownItem, onClick: handleProfileSettings, children: "Profile Settings" }), _jsx("button", { className: styles.dropdownItem, onClick: handleAccountInfo, children: "Account Info" }), _jsx("div", { className: styles.dropdownDivider }), _jsx("button", { className: `${styles.dropdownItem} ${styles.dropdownItemDanger}`, onClick: handleSignOut, children: "Sign Out" })] }))] }));
}
