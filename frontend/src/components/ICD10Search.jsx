import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { COLORS } from "./UI";

export default function ICD10Search({ onSelect, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.length < 2) { setResults([]); setShowDropdown(false); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchICD10(value);
        setResults(res.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleSelect = (item) => {
    onSelect(item);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder || "Buscar diagnóstico CIE-10..."}
          style={{
            width: "100%", padding: "12px 14px 12px 38px", borderRadius: 12,
            border: "2px solid " + COLORS.border, fontSize: 15, fontWeight: 500,
            outline: "none", boxSizing: "border-box", fontFamily: "inherit",
          }}
        />
        <span style={{ position: "absolute", left: 12, top: 14, fontSize: 16, opacity: 0.4 }}>🔍</span>
        {loading && <span style={{ position: "absolute", right: 12, top: 14, fontSize: 14 }}>⏳</span>}
      </div>

      {showDropdown && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "#fff", borderRadius: "0 0 14px 14px",
          border: "2px solid " + COLORS.primary, borderTop: "none",
          maxHeight: 280, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}>
          {results.map((item, i) => (
            <button
              key={item.code + "-" + i}
              onClick={() => handleSelect(item)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                width: "100%", padding: "10px 14px", border: "none",
                borderBottom: i < results.length - 1 ? "1px solid " + COLORS.divider : "none",
                background: "transparent", cursor: "pointer", textAlign: "left",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = COLORS.primaryLight}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 6,
                background: COLORS.primaryLight, color: COLORS.primary,
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {item.code}
              </span>
              <span style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.4 }}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.length >= 2 && results.length === 0 && !loading && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          padding: "12px 14px", background: "#fff", borderRadius: "0 0 14px 14px",
          border: "2px solid " + COLORS.border, borderTop: "none",
          fontSize: 14, color: COLORS.textSec, textAlign: "center",
        }}>
          No se encontraron resultados para "{query}"
        </div>
      )}
    </div>
  );
}
