import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar } from '../ui';
import styles from './Header.module.css';
export function Header({ className = '' }) {
    return (_jsx("header", { className: `${styles.header} ${className}`, children: _jsxs("div", { className: styles.headerContent, children: [_jsxs("div", { className: styles.logoSection, children: [_jsx("img", { src: "https://images.unsplash.com/photo-1611224923853-80b023f02d79?w=40&h=40&fit=crop&crop=center", alt: "Skill Issues Logo", className: styles.logo }), _jsx("h1", { className: styles.title, children: "Skill Issues" })] }), _jsx("div", { className: styles.authSection, children: _jsx(Avatar, {}) })] }) }));
}
