// Shiftwisedownload.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import ApiService from "../../services/ApiService";
import "../../styles/themes.css";
import "../../styles/Downloads.css";

// Span-style multi-select with "Select all"
const MultiCheckboxDropdown = ({
  label,
  options,
  selectedValues,
  setSelectedValues,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected =
    options.length > 0 &&
    selectedValues.length > 0 &&
    selectedValues.length === options.length;

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const toggleAll = () => setSelectedValues(allSelected ? [] : options.slice());

  const displaySelected = () => {
    if (!selectedValues.length) return `Select ${label}`;
    if (selectedValues.length === options.length) return `All ${label}`;
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
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={options.length === 0}
            />
            <span>Select all</span>
          </label>
          <hr className="dropdown-separator" />
          {options.map((opt) => (
            <label key={opt} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt)}
                onChange={() => toggleValue(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Shiftwisedownload = ({ navigation }) => {
  const [configurations, setConfigurations] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [onDate, setOnDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split("T")[0];
    setOnDate(formatDate(today));
  }, []);

  const shifts = useMemo(() => {
    const s = [...new Set((configurations || []).map((c) => c.Shift))].filter(
      Boolean
    );
    return s.sort();
  }, [configurations]);

  useEffect(() => {
    (async () => {
      try {
        const res = await ApiService.getConfigurations();
        if (res?.success && Array.isArray(res.data))
          setConfigurations(res.data);
      } catch (e) {
        console.error("Failed to load configurations:", e);
      }
    })();
  }, []);

  const exportCsv = (rows) => {
    const headers = [
      "LogDate",
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
          r.LogDateTime ? r.LogDateTime.split("T")[0] : "",
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
    const allShifts = selectedShifts.length === shifts.length;
    const fileShift = allShifts
      ? "all-shifts"
      : selectedShifts[0] || "all-shifts";
    a.download = `parameter-log-shifts-${fileShift}-${
      onDate || "all-dates"
    }-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownload = async () => {
    try {
      const qs = new URLSearchParams();
      if (onDate) qs.set("onDate", onDate);

      if (selectedShifts.length === 1) {
        qs.set("shift", selectedShifts[0]);
      } else if (selectedShifts.length === shifts.length) {
        // all selected -> omit filter
      } else if (selectedShifts.length > 1) {
        // Backend expects scalar; omit filter for subset to avoid errors.
        // If backend adds array/IN support, use:
        // selectedShifts.forEach((s) => qs.append("shift", s));
      } else {
        // none selected -> omit filter
      }

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
    }
  };

  return (
    <div className="downloads-container">
      <h2 className="downloads-title">Shift wise download</h2>

      <div className="download-form">
        <div className="form-field">
          <MultiCheckboxDropdown
            label="Shifts"
            options={shifts}
            selectedValues={selectedShifts}
            setSelectedValues={setSelectedShifts}
          />
        </div>

        <div className="form-field">
          <label>Date (optional)</label>
          <input
            type="date"
            className="form-input"
            value={onDate}
            onChange={(e) => setOnDate(e.target.value)}
            placeholder="Leave empty for all dates"
          />
        </div>

        <div className="download-actions">
          <button className="btn-primary" onClick={handleDownload}>
            Download CSV
          </button>
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

export default Shiftwisedownload;
