import { jsx as _jsx } from "react/jsx-runtime";
import styles from './Button.module.css';
export function Button({ children, onClick, variant = 'primary', size = 'medium', disabled = false, fullWidth = false, className = '' }) {
    const buttonClasses = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className
    ].filter(Boolean).join(' ');
    return (_jsx("button", { className: buttonClasses, onClick: onClick, disabled: disabled, type: "button", children: children }));
}
