// Downloadscreen.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import ApiService from "../../services/ApiService";
import "../../styles/themes.css";
import "../../styles/Downloads.css";

/**
 * Multi-select dropdown with checkboxes and a master "Select all" toggle.
 * - Supports primitive options (e.g., ["S1","S2"]) OR object options with { value, label } and displayProp="label".
 */
const MultiCheckboxDropdown = ({
  label,
  options,
  selectedValues,
  setSelectedValues,
  displayProp = null,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  // Derive all selectable values
  const allValues = useMemo(
    () => (displayProp ? options.map((opt) => opt.value) : options.slice()),
    [options, displayProp]
  );

  const allSelected =
    allValues.length > 0 &&
    selectedValues.length > 0 &&
    selectedValues.length === allValues.length;

  const toggleAll = () => {
    if (allSelected) setSelectedValues([]);
    else setSelectedValues(allValues);
  };

  const displaySelected = () => {
    if (!selectedValues.length) return `Select ${label}`;
    if (selectedValues.length === allValues.length) return `All ${label}`;
    if (displayProp) {
      return options
        .filter((opt) => selectedValues.includes(opt.value))
        .map((opt) => opt[displayProp])
        .join(", ");
    }
    return selectedValues.join(", ");
  };

  return (
    <div className="multi-checkbox-dropdown" ref={dropdownRef}>
      <label className="dropdown-label">{label}</label>

      <div
        className="dropdown-selection"
        tabIndex={0}
        onClick={() => setOpen(!open)}
      >
        {displaySelected()}
        <span className="dropdown-arrow">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="dropdown-options">
          {/* Master Select all */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={allValues.length === 0}
            />
            <span>Select all</span>
          </label>

          <hr className="dropdown-separator" />

          {displayProp
            ? options.map((opt) => (
                <label key={opt.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt.value)}
                    onChange={() => toggleValue(opt.value)}
                  />
                  <span>{opt[displayProp]}</span>
                </label>
              ))
            : options.map((val) => (
                <label key={String(val)} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(val)}
                    onChange={() => toggleValue(val)}
                  />
                  <span>{String(val)}</span>
                </label>
              ))}
        </div>
      )}
    </div>
  );
};

const Downloadscreen = ({ navigation }) => {
  // Raw data
  const [configurations, setConfigurations] = useState([]);
  const [params, setParams] = useState([]);

  // Options for filters
  const lineOptions = useMemo(() => {
    const set = new Set((configurations || []).map((c) => c.Line));
    return Array.from(set).filter(Boolean).sort();
  }, [configurations]);

  const shiftOptions = useMemo(() => {
    const set = new Set((configurations || []).map((c) => c.Shift));
    return Array.from(set).filter(Boolean).sort();
  }, [configurations]);

  const paramOptions = useMemo(() => {
    // Normalize parameters to { value, label }
    return (params || [])
      .map((p) => {
        const id = p.Para_ID ?? p.ParaID;
        const name = p.Para_Name ?? p.ParaName ?? `Param ${id}`;
        const unit = p.Unit_Measured ?? p.ParaUnit ?? null;
        return {
          value: String(id),
          label: unit ? `${name} (${unit})` : name,
        };
      })
      .filter((p) => p.value);
  }, [params]);

  // Selected values
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [selectedParams, setSelectedParams] = useState([]);

  // Date range
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Loading state
  const [loading, setLoading] = useState(false);

  // Initialize dates (yesterday -> today)
  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d) => d.toISOString().split("T")[0];
    setFrom(fmt(yesterday));
    setTo(fmt(today));
  }, []);

  // Load configurations (for Lines & Shifts) and parameters
  useEffect(() => {
    (async () => {
      try {
        const [cfgRes, prmRes] = await Promise.all([
          ApiService.getConfigurations(),
          ApiService.getParameters(),
        ]);
        if (cfgRes?.success && Array.isArray(cfgRes.data)) {
          setConfigurations(cfgRes.data);
        }
        if (prmRes?.success && Array.isArray(prmRes.data)) {
          setParams(prmRes.data);
        }
      } catch (e) {
        console.error("Failed to load filter data:", e);
      }
    })();
  }, []);

  const exportCsv = (rows) => {
    const headers = [
      "LogDateTime",
      "ShiftName",
      "LineName",
      "ParaName",
      "UnitMeasured",
      "ValueRecorded",
      "Remarks",
    ];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.LogDateTime ?? "",
          r.ShiftName ?? "",
          r.LineName ?? "",
          r.ParaName ?? "",
          r.UnitMeasured ?? "",
          r.ValueRecorded ?? "",
          r.Remarks ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);

    const allLines = selectedLines.length === lineOptions.length;
    const allShifts = selectedShifts.length === shiftOptions.length;
    const allParams = selectedParams.length === paramOptions.length;

    const fileShift = allShifts
      ? "all-shifts"
      : selectedShifts[0] || "all-shifts";
    const fileLine = allLines ? "all-lines" : selectedLines[0] || "all-lines";
    const fileParam = allParams
      ? "all-params"
      : paramOptions.find((p) => p.value === selectedParams[0])?.label ||
        selectedParams[0] ||
        "all-params";

    a.download = `parameter-log_${fileShift}_${fileLine}_${fileParam}_${
      from || "from"
    }_to_${to || "to"}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Helper: decide whether to append a single filter or omit
  const appendSingleIfNecessary = (qs, key, selected, allValues) => {
    if (!selected || selected.length === 0) return; // omit -> no filter
    if (selected.length === allValues.length) return; // all selected -> omit filter
    if (selected.length === 1) {
      qs.set(key, selected[0]);
      return;
    }
    // More than one selected (subset) -> omit filter to stay compatible with current backend
    // If backend later supports arrays/IN, change here to append each value:
    // selected.forEach(v => qs.append(key, v));
  };

  const handleDownload = async () => {
    if (!from || !to) {
      alert("Please select both From and To dates");
      return;
    }
    if (new Date(from) > new Date(to)) {
      alert("From date cannot be later than To date.");
      return;
    }

    setLoading(true);
    try {
      const qs = new URLSearchParams({ from, to });

      appendSingleIfNecessary(qs, "shift", selectedShifts, shiftOptions);
      appendSingleIfNecessary(qs, "line", selectedLines, lineOptions);
      appendSingleIfNecessary(
        qs,
        "paraid",
        selectedParams,
        paramOptions.map((p) => p.value)
      );

      const res = await ApiService.apiCall(
        `/parameter-log/query?${qs.toString()}`
      );

      if (!res?.success) {
        alert(res?.message || "Failed to fetch logs");
        return;
      }
      if (!Array.isArray(res.data) || res.data.length === 0) {
        alert("No data found for the selected criteria.");
        return;
      }

      exportCsv(res.data);
    } catch (e) {
      console.error("Download failed:", e);
      alert("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="downloads-container">
      <h2 className="downloads-title">Download Logs</h2>

      <div className="download-form">
        <div className="form-row">
          <div className="form-field">
            <MultiCheckboxDropdown
              label="Shifts"
              options={shiftOptions}
              selectedValues={selectedShifts}
              setSelectedValues={setSelectedShifts}
            />
          </div>

          <div className="form-field">
            <MultiCheckboxDropdown
              label="Lines"
              options={lineOptions}
              selectedValues={selectedLines}
              setSelectedValues={setSelectedLines}
            />
          </div>

          <div className="form-field">
            <MultiCheckboxDropdown
              label="Parameters"
              options={paramOptions}
              selectedValues={selectedParams}
              setSelectedValues={setSelectedParams}
              displayProp="label"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>From</label>
            <input
              type="date"
              className="form-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>To</label>
            <input
              type="date"
              className="form-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="download-actions">
          <button
            className="btn-primary"
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? "Preparing..." : "Download CSV"}
          </button>
        </div>
      </div>

      {/* Active selection summary */}
      <div className="active-filters-card">
        <h3>Current Selection</h3>
        <div className="filters-summary">
          <div className="filter-tag">
            <span className="filter-label">Shifts:</span>
            <span className="filter-value">
              {selectedShifts.length === 0
                ? "None"
                : selectedShifts.length === shiftOptions.length
                ? "All"
                : selectedShifts.join(", ")}
            </span>
          </div>

          <div className="filter-tag">
            <span className="filter-label">Lines:</span>
            <span className="filter-value">
              {selectedLines.length === 0
                ? "None"
                : selectedLines.length === lineOptions.length
                ? "All"
                : selectedLines.join(", ")}
            </span>
          </div>

          <div className="filter-tag">
            <span className="filter-label">Parameters:</span>
            <span className="filter-value">
              {selectedParams.length === 0
                ? "None"
                : selectedParams.length === paramOptions.length
                ? "All"
                : selectedParams
                    .map(
                      (v) => paramOptions.find((p) => p.value === v)?.label || v
                    )
                    .join(", ")}
            </span>
          </div>

          <div className="filter-tag">
            <span className="filter-label">Date:</span>
            <span className="filter-value">
              {from && to ? `${from} → ${to}` : "Not set"}
            </span>
          </div>
        </div>
      </div>

      <button
        className="create-param-back-button"
        onClick={() => navigation?.goBack?.()}
      >
        <span className="create-param-back-button-text">← Back to Home</span>
      </button>
    </div>
  );
};

export default Downloadscreen;
