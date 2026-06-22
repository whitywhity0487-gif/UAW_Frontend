import React, { useEffect, useRef, useCallback } from 'react';

const PolicySecurity = ({ children, isAdmin }) => {
  const shieldRef = useRef(null);
  const contentRef = useRef(null);

  // ─── Show / Hide shield instantly ───────────────────────────────────────────
  const showShield = useCallback(() => {
    if (shieldRef.current) {
      shieldRef.current.style.display = "flex";
    }
    // Also blur the content behind the shield
    if (contentRef.current) {
      contentRef.current.style.filter = "blur(30px)";
    }
  }, []);

  const hideShield = useCallback(() => {
    if (shieldRef.current) {
      shieldRef.current.style.display = "none";
    }
    if (contentRef.current) {
      contentRef.current.style.filter = "none";
    }
  }, []);

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
        e.key === "F12" ||
        // Ctrl+Shift+I (DevTools)
        (e.ctrlKey && e.shiftKey && ["i", "I"].includes(e.key)) ||
        // Ctrl+Shift+J (Console)
        (e.ctrlKey && e.shiftKey && ["j", "J"].includes(e.key)) ||
        // Ctrl+Shift+C (Inspector)
        (e.ctrlKey && e.shiftKey && ["c", "C"].includes(e.key));

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        // Show shield immediately on any screenshot attempt
        showShield();
        setTimeout(hideShield, 3000);

        // Try to overwrite clipboard
        try {
          navigator.clipboard.writeText("Screenshots are disabled for this page.");
        } catch (_) {}
      }
    };

    const handleCopyCut = (e) => {
      e.preventDefault();
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

  }, [isAdmin, showShield, hideShield]);

  // ─── Shield Logic for Snipping Tools & Screenshots ─────────────
  useEffect(() => {
    if (isAdmin) return;

    const handleVisibility = () => {
      if (document.hidden) {
        showShield();
      } else {
        // Small delay before hiding to catch quick screenshot tools
        setTimeout(hideShield, 500);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "PrintScreen") {
        try {
          navigator.clipboard.writeText("Screenshots are disabled for this page.");
        } catch (_) {}
        showShield();
        setTimeout(hideShield, 3000);
      }
    };

    const handleBlur = () => {
      showShield();
    };

    const handleFocus = () => {
      // Delay hiding on focus to ensure shield was visible during capture
      setTimeout(hideShield, 300);
    };

    // Use a resize observer to detect snipping tool activation
    // When snipping tool opens, the window may briefly lose focus
    let lastFocusTime = Date.now();
    const focusTracker = () => {
      const now = Date.now();
      if (now - lastFocusTime < 1000) {
        // Rapid focus/blur cycle detected - possible screenshot tool
        showShield();
        setTimeout(hideShield, 3000);
      }
      lastFocusTime = now;
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("focus", focusTracker);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("focus", focusTracker);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isAdmin, showShield, hideShield]);

  // ─── Detect DevTools open (resize-based detection) ──────────────────────────
  useEffect(() => {
    if (isAdmin) return;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        showShield();
      }
    };

    const interval = setInterval(checkDevTools, 1000);
    window.addEventListener("resize", checkDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkDevTools);
    };
  }, [isAdmin, showShield]);

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
        flex: 1,
        position: "relative",
      }}
    >
      {/* Content wrapper with ref for blur control */}
      <div ref={contentRef} style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        transition: "filter 0.05s ease-in-out",
      }}>
        {children}
      </div>

      {/* ─── Screenshot / Capture Shield ───────────────────────────────────────── */}
      {!isAdmin && (
        <div
          ref={shieldRef}
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
