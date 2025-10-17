import React, { useState, useEffect, useRef } from "react";
import "../../styles/CreateParameterScreen.css";
import ApiService from "../../services/ApiService";

const CreateParameterScreen = ({ navigation }) => {
  // Form state
  const [parameterName, setParameterName] = useState("");
  const [parameterType, setParameterType] = useState("Quantitative");
  const [unit, setUnit] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [Criteria, setCriteria] = useState("");

  // NEW: Errors state for inline validation messages
  const [errors, setErrors] = useState({});

  // List state
  const [parameters, setParameters] = useState([]);
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [editingParameterId, setEditingParameterId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isEditing = editingParameterId !== null;

  // Refs
  const formSectionRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    loadParameters();
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 100);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [parameters]);

  const loadParameters = async () => {
    setLoadingParameters(true);
    try {
      const response = await ApiService.getParameters();
      console.log("Fetched parameters:", response.data);
      setParameters(response?.success ? response.data || [] : []);
    } catch (err) {
      console.error("Failed to load parameters:", err);
      alert("Failed to load parameters");
      setParameters([]);
    } finally {
      setLoadingParameters(false);
    }
  };

  // UPDATED: Clear errors when clearing form
  const clearForm = () => {
    setParameterName("");
    setParameterType("Quantitative");
    setUnit("");
    setMinValue("");
    setMaxValue("");
    setCriteria("");
    setEditingParameterId(null);
    setErrors({}); // NEW: Clear validation errors
  };

  const handleEdit = (p) => {
    setParameterName(p.Para_Name ?? "");
    setParameterType(p.Para_Type ?? "Quantitative");
    setUnit(p.Unit_Measured ?? "");
    setCriteria(p.Criteria ?? "");
    setMinValue(
      p.Para_Min !== null && p.Para_Min !== undefined ? String(p.Para_Min) : ""
    );
    setMaxValue(
      p.Para_Max !== null && p.Para_Max !== undefined ? String(p.Para_Max) : ""
    );
    setEditingParameterId(p.Para_ID);
    setErrors({}); // NEW: Clear errors on edit
    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // UPDATED: Inline error validation instead of alerts
  const validateForm = () => {
    const newErrors = {};

    if (!parameterName.trim()) {
      newErrors.parameterName = "Please enter parameter name";
    }
    if (!unit.trim()) {
      newErrors.unit = "Please enter unit";
    }
    if (parameterType === "Qualitative" && !Criteria.trim()) {
      newErrors.Criteria = "Please enter Criteria"; // UPDATED: Conditional for Qualitative only
    }
    if (parameterType === "Quantitative") {
      const minNum = minValue === "" ? null : Number(minValue);
      const maxNum = maxValue === "" ? null : Number(maxValue);
      if (minNum !== null && isNaN(minNum)) {
        newErrors.minValue = "Min value must be a number";
      }
      if (maxNum !== null && isNaN(maxNum)) {
        newErrors.maxValue = "Max value must be a number";
      }
      if (minNum !== null && maxNum !== null && minNum > maxNum) {
        newErrors.maxValue = "Min value cannot be greater than Max value";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // UPDATED: Fix unit field to match API response schema
  const buildPayload = () => ({
    Para_Name: parameterName.trim(),
    Para_Type: parameterType,
    Unit_Measured: unit.trim(), // UPDATED: Changed from 'Unit' to 'Unit_Measured' for consistency
    Criteria: Criteria.trim(),
    Para_Min:
      parameterType === "Quantitative"
        ? minValue === ""
          ? null
          : Number(minValue)
        : null,
    Para_Max:
      parameterType === "Quantitative"
        ? maxValue === ""
          ? null
          : Number(maxValue)
        : null,
  });

  const handleCreate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await ApiService.createParameter(buildPayload());
      if (res?.success) {
        alert("Parameter created successfully!"); // UPDATED: Keep alert for success as it's non-blocking
        clearForm();
        await loadParameters();
      } else {
        alert("Failed to create parameter");
      }
    } catch (err) {
      console.error("Error creating parameter:", err);
      if (err.response && err.response.status === 409) {
        alert(
          "Duplicate parameter! A parameter with the same name and min/max values already exists."
        );
      } else {
        alert("Failed to create parameter");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await ApiService.updateParameter(
        editingParameterId,
        buildPayload()
      );
      if (res?.success) {
        alert("Parameter updated successfully!");
        clearForm();
        await loadParameters();
      } else {
        alert("Failed to update parameter");
      }
    } catch (err) {
      console.error("Error updating parameter:", err);
      if (err.response && err.response.status === 409) {
        alert(
          "Duplicate parameter! A parameter with the same name and min/max values already exists."
        );
      } else {
        alert("Failed to update parameter");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isEditing) await handleUpdate();
    else await handleCreate();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this parameter?"))
      return;
    try {
      const res = await ApiService.deleteParameter(id);
      if (res?.success) {
        alert("Parameter deleted successfully!");
        await loadParameters();
      } else {
        alert("Failed to delete parameter");
      }
    } catch (err) {
      console.error("Error deleting parameter:", err);
      alert("Failed to delete parameter");
    }
  };

  const scrollToTop = () =>
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="create-param-container">
      {/* CREATE PARAMETER CARD */}
      <section ref={formSectionRef} className="create-param-form-card">
        <div className="card-header">
          <h1 className="card-title">
            {isEditing ? "Edit Parameter" : "Create New Parameter"}
          </h1>
          <p className="card-subtitle">
            {isEditing
              ? "Update the parameter details below"
              : "Define a new quality control parameter"}
          </p>
        </div>

        <div className="create-param-form">
          <div className="create-param-field">
            <label className="create-param-label">Parameter Name *</label>
            <input
              className="create-param-input"
              type="text"
              value={parameterName}
              onChange={(e) => setParameterName(e.target.value)}
              placeholder="Enter parameter name (e.g., Voltage Test)"
            />
            {/* NEW: Inline error display */}
            {errors.parameterName && (
              <span className="error">{errors.parameterName}</span>
            )}
          </div>
          <div className="create-param-field">
            <label className="create-param-label">Unit *</label>
            <input
              className="create-param-input"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Enter unit (e.g., V, A, mm, kg, °C)"
            />
            {/* NEW: Inline error display */}
            {errors.unit && <span className="error">{errors.unit}</span>}
          </div>
          {/* UPDATED: Show Criteria only for Qualitative */}
          <div className="create-param-field">
            <label className="create-param-label">Criteria *</label>
            <input
              className="create-param-input"
              type="text"
              value={Criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Enter Criteria (e.g., No Pin Holes, No Cracks)"
            />
            {/* NEW: Inline error display */}
            {errors.Criteria && (
              <span className="error">{errors.Criteria}</span>
            )}
          </div>

          <div className="create-param-field">
            <label className="create-param-label">Parameter Type *</label>
            <select
              className="create-param-select"
              value={parameterType}
              onChange={(e) => setParameterType(e.target.value)}
            >
              <option value="Quantitative">Quantitative (Numerical)</option>
              <option value="Qualitative">Qualitative (Ok/Not Ok)</option>
            </select>
          </div>
          {parameterType === "Quantitative" && (
            <>
              <div className="create-param-field">
                <label className="create-param-label">Min Value</label>
                <input
                  className="create-param-input"
                  type="number"
                  step="0.01"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="Minimum value"
                />
                {/* NEW: Inline error display */}
                {errors.minValue && (
                  <span className="error">{errors.minValue}</span>
                )}
              </div>

              <div className="create-param-field">
                <label className="create-param-label">Max Value</label>
                <input
                  className="create-param-input"
                  type="number"
                  step="0.01"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="Maximum value"
                />
                {/* NEW: Inline error display */}
                {errors.maxValue && (
                  <span className="error">{errors.maxValue}</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="create-param-actions">
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Parameter"
              : "Create Parameter"}
          </button>
          {isEditing && (
            <button className="btn-outline" onClick={clearForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </section>

      {/* PARAMETERS LIST CARD */}
      <section className="create-param-list-card">
        <div className="card-header">
          <h2 className="card-title">
            Existing Parameters ({parameters.length})
          </h2>
          <div className="card-actions">
            <button
              className="btn-outline"
              onClick={loadParameters}
              disabled={loadingParameters}
            >
              {loadingParameters ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {loadingParameters ? (
          <div className="loading-state">
            <p>Loading parameters...</p>
          </div>
        ) : parameters.length === 0 ? (
          <div className="empty-state">
            <p>No parameters found.</p>
            <p>Create your first parameter using the form above!</p>
          </div>
        ) : (
          <div ref={listRef} className="param-list">
            {/* UPDATED: Added Criteria column to header */}
            <div className="param-list-header">
              <div>Parameter</div>
              <div>Unit</div>
              <div>Min</div>
              <div>Max</div>
              <div>Criteria</div> {/* NEW: Criteria header */}
              <div>Actions</div>
            </div>

            {/* Parameter Rows */}
            {parameters.map((p) => {
              const isQuant = p.Para_Type === "Quantitative";
              return (
                <div
                  key={p.Para_ID}
                  className="param-row"
                  style={
                    editingParameterId === p.Para_ID
                      ? { outline: "2px solid var(--color-primary-blue)" }
                      : undefined
                  }
                >
                  <div className="param-name-cell">
                    <span className="param-name">{p.Para_Name}</span>
                    <span className={isQuant ? "badge-quant" : "badge-qual"}>
                      {isQuant ? "Quant" : "Qual"}
                    </span>
                  </div>
                  <div className="param-unit">{p.Unit_Measured || "N/A"}</div>
                  <div className="param-min">
                    {isQuant ? p.Para_Min ?? "N/A" : "-"}
                  </div>
                  <div className="param-max">
                    {isQuant ? p.Para_Max ?? "N/A" : "-"}
                  </div>
                  {/* NEW: Criteria cell */}
                  <div className="param-criteria">{p.Criteria || "N/A"}</div>
                  <div className="param-actions">
                    <button
                      className="btn-outline"
                      onClick={() => handleEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-outline btn-danger"
                      onClick={() => handleDelete(p.Para_ID)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating scroll-to-top */}
      {showScrollTop && (
        <button
          className="btn-primary"
          onClick={scrollToTop}
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            borderRadius: "999px",
            width: "48px",
            height: "48px",
            padding: "0",
          }}
          title="Scroll to top"
        >
          ↑
        </button>
      )}

      {/* Back button */}
      <button
        className="btn-outline back-button"
        onClick={() => navigation.goBack()}
      >
        ← Back to Home
      </button>
    </div>
  );
};

export default CreateParameterScreen;
