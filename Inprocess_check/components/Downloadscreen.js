import React, { useState, useEffect, useMemo, useRef } from "react";
import ApiService from "../services/ApiService";
import "../styles/themes.css";
import "../styles/Downloads.css";

// Custom dropdown with checkboxes
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

  const displaySelected = () => {
    if (!selectedValues.length) return `Select ${label}`;
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
        onClick={() => setOpen((open) => !open)}
      >
        {displaySelected()}
        <span className="dropdown-arrow">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="dropdown-options">
          {options.map((opt) => (
            <label
              key={displayProp ? opt.value : opt}
              className="checkbox-label"
            >
              <input
                type="checkbox"
                checked={
                  displayProp
                    ? selectedValues.includes(opt.value)
                    : selectedValues.includes(opt)
                }
                onChange={() =>
                  displayProp ? toggleValue(opt.value) : toggleValue(opt)
                }
              />
              {displayProp ? opt[displayProp] : opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Downloadscreen = ({ navigation }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [paraIds, setParaIds] = useState([]);

  const [params, setParams] = useState([]);
  const [configurations, setConfigurations] = useState([]);

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const formatDate = (date) => date.toISOString().split("T")[0];
    setFrom(formatDate(yesterday));
    setTo(formatDate(today));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const paramsRes = await ApiService.getParameters();
        if (paramsRes?.success && Array.isArray(paramsRes.data))
          setParams(paramsRes.data);
        const configRes = await ApiService.getConfigurations();
        if (configRes?.success && Array.isArray(configRes.data))
          setConfigurations(configRes.data);
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    };
    loadData();
  }, []);

  const allLines = useMemo(() => {
    const uniqueLines = [...new Set(configurations.map((c) => c.Line))];
    return uniqueLines.sort();
  }, [configurations]);

  const allShifts = useMemo(() => {
    const uniqueShifts = [...new Set(configurations.map((c) => c.Shift))];
    return uniqueShifts.sort();
  }, [configurations]);

  const paraOptions = params.map((p) => ({
    value: p.Para_ID,
    label: `${p.Para_Name} (${p.Para_Unit || "N/A"})`,
    name: p.Para_Name,
  }));

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
    a.download = `parameter-log-combined-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownload = async () => {
    if (
      !from &&
      !to &&
      shifts.length === 0 &&
      lines.length === 0 &&
      paraIds.length === 0
    ) {
      alert(
        "Please select at least one filter (Date, Line, Shift, or Parameter)"
      );
      return;
    }

    const qs = new URLSearchParams();
    qs.set("mode", "combined");
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    lines.forEach((line) => qs.append("line", line));
    shifts.forEach((shift) => qs.append("shift", shift));
    paraIds.forEach((paraId) => qs.append("paraid", paraId));

    try {
      const res = await ApiService.apiCall(
        `/parameter-log/query?${qs.toString()}`
      );
      if (!res?.success) {
        alert("Failed to fetch logs");
        return;
      }
      exportCsv(res.data);
    } catch (e) {
      console.error("Download failed:", e);
      alert("Download failed. Please try again.");
    }
  };

  const activeFiltersCount =
    [from, to].filter(Boolean).length +
    lines.length +
    shifts.length +
    paraIds.length;

  const selectedParams = params.filter((p) => paraIds.includes(p.Para_ID));

  return (
    <div className="downloads-container">
      <h2 className="downloads-title">Download Records</h2>

      <div className="download-form">
        <div className="form-field">
          <label>From Date</label>
          <input
            type="date"
            className="form-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>To Date</label>
          <input
            type="date"
            className="form-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <MultiCheckboxDropdown
          label="Line"
          options={allLines.map((line) => ({ value: line, display: line }))}
          selectedValues={lines}
          setSelectedValues={setLines}
          displayProp="display"
        />

        <MultiCheckboxDropdown
          label="Shift"
          options={allShifts.map((shift) => ({ value: shift, display: shift }))}
          selectedValues={shifts}
          setSelectedValues={setShifts}
          displayProp="display"
        />

        <MultiCheckboxDropdown
          label="Parameter"
          options={paraOptions}
          selectedValues={paraIds}
          setSelectedValues={setParaIds}
          displayProp="label"
        />

        <div className="download-actions">
          <button
            className="btn-primary"
            onClick={handleDownload}
            disabled={activeFiltersCount === 0}
          >
            Download CSV ({activeFiltersCount} filter
            {activeFiltersCount !== 1 ? "s" : ""})
          </button>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="active-filters-card">
          <h3>Active Filters ({activeFiltersCount})</h3>
          <div className="filters-summary">
            {from && (
              <div className="filter-tag">
                <span className="filter-label">From:</span>
                <span className="filter-value">{from}</span>
              </div>
            )}
            {to && (
              <div className="filter-tag">
                <span className="filter-label">To:</span>
                <span className="filter-value">{to}</span>
              </div>
            )}
            {lines.length > 0 && (
              <div className="filter-tag">
                <span className="filter-label">Lines:</span>
                <span className="filter-value">{lines.join(", ")}</span>
              </div>
            )}
            {shifts.length > 0 && (
              <div className="filter-tag">
                <span className="filter-label">Shifts:</span>
                <span className="filter-value">{shifts.join(", ")}</span>
              </div>
            )}
            {selectedParams.length > 0 && (
              <div className="filter-tag">
                <span className="filter-label">Parameters:</span>
                <span className="filter-value">
                  {selectedParams.map((p) => p.Para_Name).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        className="create-param-back-button"
        onClick={() => navigation.goBack()}
      >
        <span className="create-param-back-button-text">← Back to Home</span>
      </button>
    </div>
  );
};

export default Downloadscreen;
