import React, { useEffect, useMemo, useState, useRef } from "react";
import "../../styles/EnterDetailsScreen.css";
import ApiService from "../../services/ApiService";

// Normalize backend parameter fields to a consistent shape
const normalizeParameter = (p, idx = 0) => {
  const id =
    p.Para_ID ??
    p.ParaId ??
    p.ParameterID ??
    p.id ??
    p.ID ??
    p.MeasureID ??
    `p-${idx}`;
  const name =
    p.Para_Name ??
    p.ParameterName ??
    p.name ??
    p.MeasureName ??
    p.Title ??
    `Parameter ${idx + 1}`;
  const unit =
    p.UnitMeasured ??
    p.Unit_Measured ??
    p.UnitName ??
    p.Unit ??
    p.UOM ??
    p.uom ??
    p.Para_Unit ??
    p.unit ??
    "N/A";
  let min = p.Para_Min ?? p.MinValue ?? p.minvalue ?? p.Min ?? p.min ?? null;
  let max = p.Para_Max ?? p.MaxValue ?? p.maxvalue ?? p.Max ?? p.max ?? null;
  if (typeof min === "string") min = min.trim() === "" ? null : Number(min);
  if (typeof max === "string") max = max.trim() === "" ? null : Number(max);
  const type = p.Para_Type ?? p.type ?? "Quantitative";
  const criteria = p.Criteria ?? p.criteria ?? p.Criteria_Description ?? null;
  const inspectorName =
    p.Inspector_Name ?? p.InspectorName ?? p.inspector ?? null;
  return { id, name, unit, min, max, type, criteria, raw: p };
};

// Build IST local YYYY-MM-DD for input type="date"
const nowIstLocal = (() => {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
})();

// Convert the date value into an ISO string
const toIstIso = (localMinuteString) => {
  if (!localMinuteString) return null;
  return `${localMinuteString}`;
};

const EnterDetailsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  // Header fields
  const [dateTime, setDateTime] = useState(nowIstLocal);
  const [shiftName, setShiftName] = useState("");
  const [lineName, setLineName] = useState("");

  // Inspector name moved here from modal
  const [inspectorName, setInspectorName] = useState("");

  // Configuration data from backend
  const [configurations, setConfigurations] = useState([]);
  const [loadingConfigurations, setLoadingConfigurations] = useState(false);

  // Get unique lines and shifts from configurations
  const lines = useMemo(() => {
    const uniqueLines = [
      ...new Set(configurations.map((config) => config.Line)),
    ];
    return uniqueLines.sort();
  }, [configurations]);

  const shifts = useMemo(() => {
    const uniqueShifts = [
      ...new Set(configurations.map((config) => config.Shift)),
    ];
    return uniqueShifts.sort();
  }, [configurations]);

  // Data
  const [parameters, setParameters] = useState([]);

  // Per-parameter entry map: paramId => { value: '', remark: '' }
  const [entries, setEntries] = useState({});

  // Validation errors per parameter: { [paramId]: 'error message' or null }
  const [validationErrors, setValidationErrors] = useState({});

  // Flag to control if parameters section should be shown
  const [showParameters, setShowParameters] = useState(false);

  // Global flag for any validation errors (submit disable)
  const hasValidationErrors = useMemo(
    () => Object.keys(validationErrors).length > 0,
    [validationErrors]
  );

  // Enhanced validation for both quantitative and qualitative
  useEffect(() => {
    if (!showParameters || parameters.length === 0) return;

    const newErrors = {};
    let errorCount = 0;
    parameters.forEach((p) => {
      const e = entries[p.id];
      if (!e) return;

      const error = validateParameter(p.id, e.value, e.remark);
      if (error) {
        newErrors[p.id] = error;
        errorCount++;
      }
    });

    setValidationErrors(newErrors);
    console.log(
      `Re-validating all: ${errorCount} errors remaining (${Object.keys(
        newErrors
      ).join(", ")})`
    );
  }, [entries, parameters, showParameters]);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);
    try {
      await ApiService.healthCheck();
      await loadConfigurations();
    } catch (err) {
      console.error("Initialization failed:", err);
      alert("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadConfigurations = async () => {
    setLoadingConfigurations(true);
    try {
      const res = await ApiService.getConfigurations();
      if (res?.success && Array.isArray(res.data)) {
        setConfigurations(res.data);
      }
    } catch (err) {
      console.error("Error loading configurations:", err);
    } finally {
      setLoadingConfigurations(false);
    }
  };

  // Combined validation for both quantitative and qualitative parameters
  const validateParameter = (paramId, value, remark) => {
    const param = parameters.find((p) => p.id === paramId);
    if (!param) return null;

    const isQualitative = param.type?.toLowerCase().includes("qual");

    // Qualitative validation: "NOT OK" requires remarks
    if (isQualitative) {
      if (value === "NOT OK") {
        const trimmedRemark = (remark || "").trim();
        if (trimmedRemark === "") {
          return `"NOT OK" selected: Remarks required to explain the issue`;
        }
      }
      return null;
    }

    // Quantitative validation
    const numValue = Number(value);
    if (isNaN(numValue) || value.trim() === "") return null;

    const minVal = param.min != null ? Number(param.min) : null;
    const maxVal = param.max != null ? Number(param.max) : null;
    const hasMin = minVal != null && !isNaN(minVal);
    const hasMax = maxVal != null && !isNaN(maxVal);

    if (!hasMin && !hasMax) return null;

    const inRange =
      (!hasMin || numValue >= minVal) && (!hasMax || numValue <= maxVal);
    if (inRange) return null;

    const trimmedRemark = (remark || "").trim();
    if (trimmedRemark === "") {
      return `Value ${numValue} out-of-range (min ${
        hasMin ? minVal : "none"
      }, max ${hasMax ? maxVal : "none"}): Remarks required`;
    }

    return null;
  };

  const handleEntryChange = (id, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
    console.log(
      `Updated ${field} for ${id}: "${value}" (validation will re-run)`
    );
  };

  const handleValueBlur = (id, value) => handleEntryChange(id, "value", value);
  const handleRemarkBlur = (id, remark) =>
    handleEntryChange(id, "remark", remark);

  const handleLoadData = async () => {
    if (!dateTime || !shiftName || !lineName) {
      alert("Please select Date, Shift, and Line first.");
      return;
    }
    console.log("Loading data for:", { dateTime, shiftName, lineName });

    try {
      const logsRes = await ApiService.queryLogs({
        date: toIstIso(dateTime),
        shift: shiftName,
        line: lineName,
      });

      console.log("Fetched logs:", logsRes);

      const paramsRes = await ApiService.getParameters();
      console.log("Fetched all parameters:", paramsRes);

      if (!paramsRes?.success || !Array.isArray(paramsRes.data)) {
        throw new Error("Failed to load parameters from master table");
      }

      const allNormalizedParams = paramsRes.data.map((p, i) =>
        normalizeParameter(p, i)
      );

      let filteredParams;
      let initialEntries = {};
      let loadedInspectorName = ""; // NEW: Store loaded inspector name

      if (
        logsRes?.success &&
        Array.isArray(logsRes.data) &&
        logsRes.data.length > 0
      ) {
        console.log("Logs found: Filtering parameters to logged ones.");
        const uniqueParaIds = new Set();
        logsRes.data.forEach((log) => {
          uniqueParaIds.add(String(log.Para_ID));
        });

        filteredParams = allNormalizedParams.filter((p) =>
          uniqueParaIds.has(String(p.id))
        );

        filteredParams.forEach((p) => {
          initialEntries[p.id] = { value: "", remark: "" };
        });

        const latestEntryByParaId = {};
        logsRes.data.forEach((log) => {
          const id = String(log.Para_ID);
          if (
            !latestEntryByParaId[id] ||
            Number(log.Log_ID) > Number(latestEntryByParaId[id].Log_ID)
          ) {
            latestEntryByParaId[id] = log;
          }
        });

        const fetchedEntries = {};
        Object.values(latestEntryByParaId).forEach((log) => {
          fetchedEntries[String(log.Para_ID)] = {
            value: log.ValueRecorded ?? "",
            remark: log.Remarks ?? "",
          };
        });

        Object.keys(initialEntries).forEach((key) => {
          initialEntries[key] = fetchedEntries[key] || {
            value: "",
            remark: "",
          };
        });

        // NEW: Extract inspector name from the most recent log
        // Find the log with the highest Log_ID to get the latest inspector
        const latestLog = logsRes.data.reduce((latest, current) => {
          return Number(current.Log_ID) > Number(latest.Log_ID)
            ? current
            : latest;
        }, logsRes.data[0]);

        // Extract Inspector_Name from the latest log
        loadedInspectorName =
          latestLog.Inspector_Name ||
          latestLog.inspector ||
          latestLog.Inspector ||
          latestLog.InspectorName ||
          "";

        console.log("Loaded Inspector Name:", loadedInspectorName);
      } else {
        console.log("No logs found: Using all parameters for new entry.");
        filteredParams = allNormalizedParams;
        filteredParams.forEach((p) => {
          initialEntries[p.id] = { value: "", remark: "" };
        });
        // No logs means no inspector name to load
        loadedInspectorName = "";
      }

      setParameters(filteredParams);
      setEntries(initialEntries);
      setInspectorName(loadedInspectorName); // NEW: Set inspector name
      setShowParameters(true);
      setValidationErrors({});

      console.log(
        "Loaded",
        filteredParams.length,
        "parameters with inspector:",
        loadedInspectorName
      );
    } catch (err) {
      console.error("Error loading data:", err);
      alert("Failed to load data. Please try again.");
      try {
        const paramsRes = await ApiService.getParameters();
        if (paramsRes?.success && Array.isArray(paramsRes.data)) {
          const allParams = paramsRes.data.map((p, i) =>
            normalizeParameter(p, i)
          );
          const emptyEntries = {};
          allParams.forEach((p) => {
            emptyEntries[p.id] = { value: "", remark: "" };
          });
          setParameters(allParams);
          setEntries(emptyEntries);
          setInspectorName(""); // Clear inspector name on error
          setShowParameters(true);
          setValidationErrors({});
        }
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
      }
    }
  };

  // Validate including inspector name
  const validate = () => {
    if (!dateTime) {
      alert("Please select Date & Time.");
      return false;
    }
    if (!shiftName) {
      alert("Please select Shift.");
      return false;
    }
    if (!lineName) {
      alert("Please select Line.");
      return false;
    }
    if (!inspectorName.trim()) {
      alert("Please enter Inspector Name.");
      return false;
    }

    if (hasValidationErrors) {
      alert(
        "Please add remarks to out-of-range values or 'NOT OK' qualitative parameters (see red rows)."
      );
      return false;
    }

    if (!anyEntryFilled) {
      alert("Enter at least one parameter value.");
      return false;
    }
    return true;
  };

  const anyEntryFilled = useMemo(() => {
    return parameters.some((p) => {
      const e = entries[p.id];
      return e && e.value.trim() !== "";
    });
  }, [entries, parameters]);

  // Simplified save without modal
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const dateIsoIst = toIstIso(dateTime);
      if (!dateIsoIst) {
        alert("Invalid datetime.");
        setLoading(false);
        return;
      }

      const items = [];
      for (const p of parameters) {
        const e = entries[p.id];
        if (!e || e.value.trim() === "") continue;

        const isQual = p.type?.toLowerCase().includes("qual");
        const measureValue = isQual ? String(e.value) : Number(e.value);

        items.push({
          datetime: dateIsoIst,
          shiftname: shiftName,
          linename: lineName,
          paraid: p.id,
          measurename: p.name,
          uom: p.unit !== "N/A" ? p.unit : null,
          minvalue: p.min ?? null,
          maxvalue: p.max ?? null,
          measurevalue: measureValue,
          remark: e.remark || "",
          inspector: inspectorName.trim(),
        });
      }

      if (items.length === 0) {
        alert("No values to save.");
        setLoading(false);
        return;
      }

      const res = ApiService.createLogsBulk
        ? await ApiService.createLogsBulk(items)
        : await ApiService.createLog(items[0]);

      if (!res?.success) {
        alert("Failed to save. Please try again.");
        setLoading(false);
        return;
      }

      alert("Records saved successfully!");

      setEntries((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          next[k] = { value: "", remark: "" };
        });
        return next;
      });
      setValidationErrors({});
      // Keep inspector name for next entry
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="enter-details-container">
        <p className="enter-details-subtitle">Loading...</p>
      </div>
    );
  }

  return (
    <div className="enter-details-container">
      <h1 className="enter-details-title">Enter Details</h1>
      <p className="enter-details-subtitle">
        Record measurement data and quality checks
      </p>

      {/* Header entry form */}
      <section className="eds-form-section">
        <div className="eds-section-title">Entry Information</div>
        <div className="eds-row">
          <div className="eds-input-group">
            <label className="eds-label">Date & Time (IST)</label>
            <input
              type="date"
              className="eds-text-input"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          <div className="eds-input-group">
            <label className="eds-label">Shift</label>
            <select
              className="eds-text-input"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
            >
              <option value="">Select Shift</option>
              {shifts.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </div>

          <div className="eds-input-group">
            <label className="eds-label">Line</label>
            <select
              className="eds-text-input"
              value={lineName}
              onChange={(e) => setLineName(e.target.value)}
            >
              <option value="">Select Line</option>
              {lines.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="eds-save-button"
          onClick={handleLoadData}
          disabled={!dateTime || !shiftName || !lineName}
        >
          Update Data
        </button>
      </section>

      {/* Parameters list */}
      {showParameters && (
        <div className="eds-form-section">
          <div className="eds-section-title">Parameters</div>

          {/* Inspector Name Input at top of parameters section */}
          <div className="eds-row eds-inspector-section">
            <div className="eds-input-group full">
              <label className="eds-label eds-inspector-label">
                Inspector Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="eds-text-input"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="Enter inspector name (required)"
              />
            </div>
          </div>

          {/* Global warning */}
          {hasValidationErrors && (
            <div className="eds-validation-warning">
              Add remarks to out-of-range values or "NOT OK" qualitative
              parameters (red rows below) to enable Submit.
            </div>
          )}

          <div className="eds-table-wrapper">
            <table className="eds-param-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Parameter</th>
                  <th>Data Type</th>
                  <th>Target (Min)</th>
                  <th>Target (Max)</th>
                  <th>Criteria</th>
                  <th>UOM</th>
                  <th>Measured Value</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((p, i) => {
                  const entry = entries[p.id] || { value: "", remark: "" };
                  const error = validationErrors[p.id];
                  const isOutOfRange = !!error;
                  const remarkPlaceholder = isOutOfRange
                    ? "Required: Explain issue"
                    : "Optional";
                  return (
                    <React.Fragment key={p.id}>
                      <tr className={isOutOfRange ? "row-error" : ""}>
                        <td>{i + 1}</td>
                        <td>{p.name}</td>
                        <td>{p.type || ""}</td>
                        <td>{p.min ?? ""}</td>
                        <td>{p.max ?? ""}</td>
                        <td>
                          {p.type &&
                          p.type.toLowerCase().includes("qual") &&
                          p.criteria
                            ? p.criteria
                            : ""}
                        </td>
                        <td>{p.unit ?? ""}</td>
                        <td>
                          {p.type && p.type.toLowerCase().includes("qual") ? (
                            <select
                              value={entry.value}
                              onChange={(ev) =>
                                handleEntryChange(
                                  p.id,
                                  "value",
                                  ev.target.value
                                )
                              }
                              onBlur={(ev) =>
                                handleValueBlur(p.id, ev.target.value)
                              }
                              className={`eds-picker ${
                                isOutOfRange ? "input-error" : ""
                              }`}
                            >
                              <option value="">Select</option>
                              <option value="OK">OK</option>
                              <option value="NOT OK">NOT OK</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              value={entry.value}
                              placeholder="Enter measured value"
                              onChange={(ev) =>
                                handleEntryChange(
                                  p.id,
                                  "value",
                                  ev.target.value
                                )
                              }
                              onBlur={(ev) =>
                                handleValueBlur(p.id, ev.target.value)
                              }
                              className={`eds-text-input ${
                                isOutOfRange ? "input-error" : ""
                              }`}
                            />
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={entry.remark}
                            placeholder={remarkPlaceholder}
                            onChange={(ev) =>
                              handleEntryChange(p.id, "remark", ev.target.value)
                            }
                            onBlur={(ev) =>
                              handleRemarkBlur(p.id, ev.target.value)
                            }
                            className={`eds-text-input ${
                              isOutOfRange ? "input-error" : ""
                            }`}
                          />
                        </td>
                      </tr>
                      {error && (
                        <tr>
                          <td colSpan="9" className="error-message">
                            ⚠️ {error}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        className="eds-save-button"
        onClick={handleSave}
        disabled={
          loading ||
          !showParameters ||
          hasValidationErrors ||
          !inspectorName.trim()
        }
      >
        {loading ? "Saving..." : "Submit"}
      </button>

      <button className="eds-back" onClick={() => navigation?.goBack?.()}>
        ← Back
      </button>
    </div>
  );
};

export default EnterDetailsScreen;
