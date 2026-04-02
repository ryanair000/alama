import React from 'react';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo">
          <span className="logo-letter">A</span>
        </div>
        <div>
          <h1 className="header-title">Alama</h1>
          <p className="header-subtitle">Student Grading System</p>
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
