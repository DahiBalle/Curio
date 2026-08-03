import React from 'react';

export const Icon = ({ name, size = 24, className = '', color = 'currentColor' }) => {
  // A simple icon mapper since we don't have an icon library installed.
  // Using some standard SVGs matching the layout.
  
  const icons = {
    verified: (
      <svg aria-label="Verified" fill="#0095f6" height={size} width={size} viewBox="0 0 40 40">
        <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" />
      </svg>
    ),
    options: (
      <svg aria-label="Options" fill={color} height={size} width={size} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="1.5"></circle>
        <circle cx="6" cy="12" r="1.5"></circle>
        <circle cx="18" cy="12" r="1.5"></circle>
      </svg>
    ),
    addContact: (
      <svg aria-label="Discover People" fill={color} height={size} width={size} viewBox="0 0 24 24">
        <path d="M19.006 8.252H21.2v2.196h-2.194v2.196h-2.196v-2.196h-2.196V8.252h2.196V6.056h2.196v2.196Zm-10.74 3.32a5.27 5.27 0 1 1 5.27-5.27 5.276 5.276 0 0 1-5.27 5.27Zm0-8.54a3.27 3.27 0 1 0 3.27 3.27 3.274 3.274 0 0 0-3.27-3.27Zm9.066 18.064H-.005l.02-3.297a7.993 7.993 0 0 1 7.972-7.854h2.553a7.994 7.994 0 0 1 7.973 7.854l.02 3.297Zm-15.02-2h12.98l-.014-1.294a5.992 5.992 0 0 0-5.975-5.856h-2.553a5.992 5.992 0 0 0-5.975 5.856l-.014 1.294Z"></path>
      </svg>
    ),
    link: (
      <svg aria-label="Link" fill={color} height={size} width={size} viewBox="0 0 24 24">
        <path d="m11.214 21.572-2.784-2.785a8.775 8.775 0 0 1-2.569-6.208A8.773 8.773 0 0 1 8.43 6.37l4.032-4.033a8.778 8.778 0 0 1 12.41 12.41l-2.071 2.071a1 1 0 0 1-1.414-1.414l2.071-2.071a6.778 6.778 0 0 0-9.582-9.582L9.844 7.785a6.777 6.777 0 0 0 0 9.582l2.784 2.785a1 1 0 1 1-1.414 1.42Zm10.354-9.055a1 1 0 0 1-1.414 0l-2.784-2.784a6.776 6.776 0 0 0-9.582 0 6.777 6.777 0 0 0-1.986 4.79 6.776 6.776 0 0 0 1.986 4.792l4.033 4.033a6.778 6.778 0 0 0 9.582-9.582l-2.071-2.071a1 1 0 1 1 1.414-1.414l2.071 2.071a8.778 8.778 0 0 1-12.41 12.41l-4.033-4.033a8.778 8.778 0 0 1 0-12.41A8.777 8.777 0 0 1 9.07 8.016l2.784 2.784a1 1 0 0 1 0 1.414l.012-.016Z"></path>
      </svg>
    ),
    threads: (
       <svg aria-label="Threads" fill={color} height={size} width={size} viewBox="0 0 24 24">
        <path d="M14.619 8.243a3.528 3.528 0 0 0-5.236 0 3.528 3.528 0 0 0 0 5.236 3.528 3.528 0 0 0 5.236 0c.264-.265.485-.568.656-.9a6.002 6.002 0 0 1-3.274.975 6 6 0 1 1 6-6 1 1 0 1 0 2 0 8 8 0 1 0-8 8 7.973 7.973 0 0 0 5.347-2.046c.15-.145.293-.298.428-.458a5.526 5.526 0 0 1-.502 3.652c-.675 1.348-1.983 2.14-3.666 2.14a4.088 4.088 0 0 1-3.791-2.585 1 1 0 1 0-1.854.747 6.088 6.088 0 0 0 5.645 3.838c2.617 0 4.606-1.196 5.539-3.056a7.518 7.518 0 0 0 .524-5.215A5.528 5.528 0 0 0 14.62 8.243ZM12 11.5A1.5 1.5 0 1 1 12 8.5a1.5 1.5 0 0 1 0 3Z"></path>
       </svg>
    ),
    grid: (
      <svg aria-label="Posts" fill={color} height={size} width={size} viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.992 21h18.016A1.992 1.992 0 0 0 23 19.008V4.992A1.992 1.992 0 0 0 21.008 3H2.992A1.992 1.992 0 0 0 1 4.992v14.016A1.992 1.992 0 0 0 2.992 21Z"></path>
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 9.992h22M1 15.008h22M8.992 3v18M15.008 3v18"></path>
      </svg>
    ),
    reels: (
      <svg aria-label="Reels" fill={color} height={size} width={size} viewBox="0 0 24 24">
        <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="2.049" x2="21.95" y1="7.002" y2="7.002"></line>
        <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="13.504" x2="16.362" y1="2.001" y2="7.002"></line>
        <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="7.207" x2="10.002" y1="2.11" y2="7.002"></line>
        <path d="M2 12.001v3.449c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.703 2 8.552Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        <path d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    ),
    tags: (
      <svg aria-label="Tagged" fill={color} height={size} width={size} viewBox="0 0 24 24">
        <path d="M10.201 3.797 12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h5.259A1.818 1.818 0 0 1 22 6.08v14.104a1.818 1.818 0 0 1-1.818 1.818H3.818A1.818 1.818 0 0 1 2 20.184V6.08a1.818 1.818 0 0 1 1.818-1.818h5.26a1.59 1.59 0 0 0 1.123-.465Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        <path d="M18.598 22.002V21.4a3.949 3.949 0 0 0-3.948-3.949H9.495A3.949 3.949 0 0 0 5.546 21.4v.603" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        <circle cx="12.072" cy="11.075" fill="none" r="3.556" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle>
      </svg>
    )
  };

  const svgContent = icons[name] || null;

  return (
    <span className={`ui-icon ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {svgContent}
    </span>
  );
};
