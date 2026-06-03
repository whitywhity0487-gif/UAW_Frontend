import React, { useEffect } from 'react';

const PolicySecurity = ({ children, isAdmin }) => {
  // ─── Block keyboard shortcuts (screenshot, copy, print, devtools) ────────────
  useEffect(() => {
    if (isAdmin) return;

    const handleKeyDown = (e) => {
      const blocked =
        // Copy / Print / Save / View-source / Select All / Cut (Ctrl or Cmd)
        ((e.ctrlKey || e.metaKey) && ["c", "C", "p", "P", "s", "S", "u", "U", "a", "A", "x", "X"].includes(e.key)) ||
        // Windows Snipping Tool: Win+Shift+S
        (e.metaKey && e.shiftKey && ["s", "S"].includes(e.key)) ||
        // macOS screenshots: Cmd+Shift+3 / 4 / 5
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) ||
        // PrintScreen key (Windows)
        e.key === "PrintScreen" ||
        // DevTools
        e.key === "F12";

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        alert("Action restricted: Security protocols active for policy documents.");
      }
    };

    const handleCopyCut = (e) => {
      e.preventDefault();
      alert("Copying is disabled for this document.");
    };

    const handleDrag = (e) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("copy", handleCopyCut, true);
    document.addEventListener("cut", handleCopyCut, true);
    document.addEventListener("dragstart", handleDrag, true);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("copy", handleCopyCut, true);
      document.removeEventListener("cut", handleCopyCut, true);
      document.removeEventListener("dragstart", handleDrag, true);
    };

  }, [isAdmin]);

  // ─── Shield Logic for Snipping Tools & Screenshots ─────────────
  useEffect(() => {
    if (isAdmin) return;

    const showShield = () => {
      const overlay = document.getElementById("__policy-screenshot-shield");
      if (overlay) overlay.style.display = "flex";
    };

    const hideShield = () => {
      const overlay = document.getElementById("__policy-screenshot-shield");
      if (overlay) overlay.style.display = "none";
    };

    const handleVisibility = () => {
      if (document.hidden) showShield();
      else hideShield();
    };

    const handleKeyUp = (e) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("Screenshots are disabled for this page.");
        showShield();
        setTimeout(hideShield, 3000); // hide after 3 seconds
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", showShield);
    window.addEventListener("focus", hideShield);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", showShield);
      window.removeEventListener("focus", hideShield);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isAdmin]);

  return (
    <div
      onContextMenu={(e) => { if (!isAdmin) e.preventDefault(); }}
      style={{
        width: "100%",
        height: "100%",
        WebkitUserSelect: isAdmin ? "auto" : "none",
        MozUserSelect: isAdmin ? "auto" : "none",
        msUserSelect: isAdmin ? "auto" : "none",
        userSelect: isAdmin ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
        flex: 1
      }}
    >
      {children}

      {/* ─── Screenshot / Capture Shield ───────────────────────────────────────── */}
      {!isAdmin && (
        <div
          id="__policy-screenshot-shield"
          style={{
            display: "none",
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <svg width="44" height="44" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <p style={{ color: "white", fontSize: 16, margin: 0, fontWeight: 600 }}>
            Content protected
          </p>
          <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>
            Screenshot capture is not permitted.
          </p>
        </div>
      )}

      <style>
        {`
          /* ── Block print & PDF save ── */
          @media print {
            html, body { 
              display: none !important; 
              visibility: hidden !important; 
            }
          }

          /* ── Black-out on OS screenshot media queries (Chrome/Edge/Safari) ── */
          @media (display-mode: screenshot), print {
            html, body { visibility: hidden !important; }
            html::before, body::after {
              content: 'Screenshot Disabled';
              visibility: visible !important;
              display: flex !important;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              position: fixed;
              inset: 0;
              background: #111827;
              z-index: 999999;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PolicySecurity;
