// Parameterwisedownload.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import ApiService from "../../services/ApiService";
import "../../styles/themes.css";
import "../../styles/Downloads.css";

// Span-style multi-select with "Select all"
const MultiCheckboxDropdown = ({
  label,
  options,
  selectedValues,
  setSelectedValues,
  displayProp = "label",
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

  const allValues = useMemo(() => options.map((o) => o.value), [options]);
  const allSelected =
    allValues.length > 0 &&
    selectedValues.length > 0 &&
    selectedValues.length === allValues.length;

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const toggleAll = () => setSelectedValues(allSelected ? [] : allValues);

  const displaySelected = () => {
    if (!selectedValues.length) return `Select ${label}`;
    if (selectedValues.length === allValues.length) return `All ${label}`;
    return options
      .filter((o) => selectedValues.includes(o.value))
      .map((o) => o[displayProp])
      .join(", ");
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
              disabled={allValues.length === 0}
            />
            <span>Select all</span>
          </label>
          <hr className="dropdown-separator" />
          {options.map((opt) => (
            <label key={opt.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={() => toggleValue(opt.value)}
              />
              <span>{opt[displayProp]}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Parameterwisedownload = ({ navigation }) => {
  const [params, setParams] = useState([]);
  const [selectedParams, setSelectedParams] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  // Load default dates
  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d) => d.toISOString().split("T")[0];
    setFrom(fmt(yesterday));
    setTo(fmt(today));
  }, []);

  // Load parameters
  useEffect(() => {
    (async () => {
      try {
        const res = await ApiService.getParameters();
        if (res?.success && Array.isArray(res.data)) setParams(res.data);
      } catch (e) {
        console.error("Failed to load parameters:", e);
      }
    })();
  }, []);

  // Normalize to object options { value, label }
  const paramOptions = useMemo(() => {
    return (params || [])
      .map((p) => {
        const id = p.Para_ID ?? p.ParaID;
        const name = p.Para_Name ?? p.ParaName ?? `Param ${id}`;
        const unit = p.Unit_Measured ?? p.ParaUnit ?? null;
        return { value: String(id), label: unit ? `${name} (${unit})` : name };
      })
      .filter((x) => x.value);
  }, [params]);

  const exportCsv = (rows) => {
    const headers = [
      "LogDateTime",
      "ShiftName",
      "LineName",
      "ParaName",
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

    const allParams = selectedParams.length === paramOptions.length;
    const firstLabel =
      paramOptions.find((p) => p.value === selectedParams[0])?.label ||
      "all-params";

    a.download = `parameter-log-params-${
      allParams ? "all" : firstLabel
    }_${from}_to_${to}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
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

    try {
      setLoading(true);
      const qs = new URLSearchParams({ from, to });

      if (selectedParams.length === 1) {
        qs.set("paraid", selectedParams[0]);
      } else if (selectedParams.length === paramOptions.length) {
        // all selected -> omit filter
      } else if (selectedParams.length > 1) {
        // Backend currently expects scalar; omit filter for subset to avoid errors.
        // If backend adds array/IN support, use:
        // selectedParams.forEach((id) => qs.append("paraid", id));
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="downloads-container">
      <h2 className="downloads-title">Parameter wise download</h2>

      <div className="download-form">
        <div className="form-field">
          <MultiCheckboxDropdown
            label="Parameters"
            options={paramOptions}
            selectedValues={selectedParams}
            setSelectedValues={setSelectedParams}
            displayProp="label"
          />
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

      <button
        className="create-param-back-button"
        onClick={() => navigation?.goBack?.()}
      >
        <span className="create-param-back-button-text">← Back to Home</span>
      </button>
    </div>
  );
};

export default Parameterwisedownload;
