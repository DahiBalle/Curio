import React from 'react';
import './Button.css';
export const Button = ({ children, variant = 'primary', onClick, className = '', style }) => {
    return (
        <button
            className={`ui-button ui-button--${variant} ${className}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </button>
    );
};

