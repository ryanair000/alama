import React from 'react';

export default function Header({ onMenuClick }) {
  return (
    <header className="app-header">
      <div className="header-left">
        {onMenuClick && (
          <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}
        <div className="header-brand">
          <div className="header-logo">
            <span className="logo-letter">A</span>
          </div>
          <div>
            <h1 className="header-title">Alama</h1>
            <p className="header-subtitle">Student Grading System</p>
          </div>
        </div>
      </div>
      <div className="header-accent">
        <span className="ke-bar ke-green"></span>
        <span className="ke-bar ke-red"></span>
        <span className="ke-bar ke-black"></span>
      </div>
    </header>
  );
}
