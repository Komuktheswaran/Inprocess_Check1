import React, { useEffect, useMemo, useState } from 'react';
import '../styles/EnterDetailsScreen.css';
import ApiService from '../services/ApiService';

// Normalize backend parameter fields to a consistent shape
const normalizeParameter = (p, idx = 0) => {
    const id = p.Para_ID ?? p.ParaId ?? p.ParameterID ?? p.id ?? p.ID ?? p.MeasureID ?? `p-${idx}`;
    const name = p.Para_Name ?? p.ParameterName ?? p.name ?? p.MeasureName ?? p.Title ?? `Parameter ${idx + 1}`;
    const unit = p.UnitMeasured ?? p.Unit_Measured
        ?? p.UnitName ?? p.Unit ?? p.UOM ?? p.uom ?? p.Para_Unit ?? p.unit ?? 'N/A';
    const min = p.Para_Min ?? p.MinValue ?? p.minvalue ?? p.Min ?? p.min ?? null;
    const max = p.Para_Max ?? p.MaxValue ?? p.maxvalue ?? p.Max ?? p.max ?? null;
    const type = p.Para_Type ?? p.type ?? 'Quantitative';
    return { id, name, unit, min, max, type, raw: p };
};

// Build IST local YYYY-MM-DDTHH:mm for input type="datetime-local"
const nowIstLocal = (() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t) => parts.find(p => p.type === t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
})();

// Convert the datetime-local value into an ISO string with IST offset (+05:30)
const toIstIso = (localMinuteString) => {
    if (!localMinuteString) return null;
    // Expecting YYYY-MM-DDTHH:mm
    return `${localMinuteString}`;
};

const EnterDetailsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    // Header fields
    const [dateTime, setDateTime] = useState(nowIstLocal);
    const [shiftName, setShiftName] = useState('');
    const [lineName, setLineName] = useState('');

    // REMOVED: unitName and modelName states

    // Configuration data from backend
    const [configurations, setConfigurations] = useState([]);
    const [loadingConfigurations, setLoadingConfigurations] = useState(false);

    // Get unique lines and shifts from configurations
    const lines = useMemo(() => {
        const uniqueLines = [...new Set(configurations.map(config => config.Line))];
        return uniqueLines.sort();
    }, [configurations]);

    const shifts = useMemo(() => {
        const uniqueShifts = [...new Set(configurations.map(config => config.Shift))];
        return uniqueShifts.sort();
    }, [configurations]);

    // Data
    const [parameters, setParameters] = useState([]);

    // Per-parameter entry map: paramId => { value: '', remark: '' }
    const [entries, setEntries] = useState({});

    // NEW: Flag to control if parameters section should be shown
    const [showParameters, setShowParameters] = useState(false);

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        setLoading(true);
        try {
            await ApiService.healthCheck();
            await loadConfigurations(); // Load configs first, parameters will be loaded on button press
        } catch (err) {
            console.error('Initialization failed:', err);
            alert('Failed to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadConfigurations = async () => {
        setLoadingConfigurations(true);
        try {
            const res = await ApiService.getConfigurations(); // New API call
            if (res?.success && Array.isArray(res.data)) {
                setConfigurations(res.data);
            }
        } catch (err) {
            console.error('Error loading configurations:', err);
            // Set default configurations if API fails
        } finally {
            setLoadingConfigurations(false);
        }
    };

    const handleLoadData = async () => {
        if (!dateTime || !shiftName || !lineName) {
            alert('Please select Date, Shift, and Line first.');
            return;
        }

        try {
            // Load parameters (now on button press)
            const paramsRes = await ApiService.getParameters();
            if (paramsRes?.success && Array.isArray(paramsRes.data)) {
                const normalized = paramsRes.data.map((p, i) => normalizeParameter(p, i));
                setParameters(normalized);

                // Initialize entries as empty first
                const initialEntries = {};
                normalized.forEach(p => {
                    initialEntries[p.id] = { value: '', remark: '' };
                });

                // Now fetch existing logs
                // Inside EnterDetailsScreen.js (in handleLoadData)
                const logsRes = await ApiService.queryLogs({ // Changed from getLogs to queryLogs
                    date: toIstIso(dateTime), // Format as needed
                    shift: shiftName,
                    line: lineName
                });

                console.log('Fetched logs:', logsRes);
                if (logsRes?.success && Array.isArray(logsRes.data)) {
                    // Map fetched logs to entries
                    // Group by Para_ID and pick the log with the latest Log_ID
                    const latestEntryByParaId = {};
                    const fetchedEntries = {};
                    logsRes.data.forEach(log => {
                        const id = String(log.Para_ID);
                        if (
                            !latestEntryByParaId[id] ||
                            Number(log.Log_ID) > Number(latestEntryByParaId[id].Log_ID)
                        ) {
                            latestEntryByParaId[id] = log;
                        }
                    });
                    Object.values(latestEntryByParaId).forEach(log => {
                        fetchedEntries[String(log.Para_ID)] = {
                            value: log.ValueRecorded ?? '',
                            remark: log.Remarks ?? ''
                        };
                    });



                    // Merge: Use fetched if available, else empty
                    Object.keys(initialEntries).forEach(key => {
                        initialEntries[key] = fetchedEntries[key] || { value: '', remark: '' };
                    });
                } else {
                    // No data found, keep all blank
                }

                setEntries(initialEntries);
                setShowParameters(true); // Now show the parameters section
            }
        } catch (err) {
            console.error('Error loading data:', err);
            alert('Failed to load data. Please try again.');
        }
    };

    const anyEntryFilled = useMemo(() => {
        return parameters.some(p => {
            const e = entries[p.id];
            return e && e.value.trim() !== '';
        });
    }, [entries, parameters]);

    const handleEntryChange = (id, field, value) => {
        setEntries(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value,
            },
        }));
    };

    const validate = () => {
        if (!dateTime) {
            alert('Please select Date & Time.');
            return false;
        }
        if (!shiftName) {
            alert('Please select Shift.');
            return false;
        }
        if (!lineName) {
            alert('Please select Line.');
            return false;
        }
        // REMOVED: Unit validation
        if (!anyEntryFilled) {
            alert('Enter at least one parameter value.');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const dateIsoIst = toIstIso(dateTime); // YYYY-MM-DDTHH:mm → YYYY-MM-DDTHH:mm:00+05:30
            if (!dateIsoIst) {
                alert('Invalid datetime.');
                setLoading(false);
                return;
            }

            const items = [];
            for (const p of parameters) {
                const e = entries[p.id];
                if (!e || e.value.trim() === '') continue;

                const isQual = p.type?.toLowerCase().includes('qual');
                const measureValue = isQual ? String(e.value) : Number(e.value);

                items.push({
                    datetime: dateIsoIst,
                    shiftname: shiftName,
                    linename: lineName,
                    // REMOVED: modelname field
                    paraid: p.id, // FIX: lowercase matches backend
                    measurename: p.name, // optional, backend can resolve by either
                    uom: p.unit !== 'N/A' ? p.unit : null,
                    minvalue: p.min ?? null,
                    maxvalue: p.max ?? null,
                    measurevalue: measureValue,
                    remark: e.remark || ''
                });
            }

            if (items.length === 0) {
                alert('No values to save.');
                setLoading(false);
                return;
            }

            // Bulk save for efficiency and atomicity...
            const res = ApiService.createLogsBulk
                ? await ApiService.createLogsBulk(items)
                : await ApiService.createLog(items[0]); // fallback if bulk not present

            if (!res?.success) {
                console.warn('Save failed:', res);
                alert('Failed to save. Please try again.');
                setLoading(false);
                return;
            }

            alert('Records saved successfully!');
            // await loadRecords(); // Uncomment if you have a loadRecords function

            // Reset values after save
            setEntries(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(k => {
                    next[k] = { value: '', remark: '' };
                });
                return next;
            });

        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save. Please try again.');
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
            <p className="enter-details-subtitle">Record measurement data and quality checks</p>

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
                            onChange={e => setDateTime(e.target.value)}
                        />
                    </div>

                    <div className="eds-input-group">
                        <label className="eds-label">Shift</label>
                        <select
                            className="eds-text-input"
                            value={shiftName}
                            onChange={e => setShiftName(e.target.value)}
                        >
                            <option value="">Select Shift</option>
                            {shifts.map(shift => (
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
                            onChange={e => setLineName(e.target.value)}
                        >
                            <option value="">Select Line</option>
                            {lines.map(line => (
                                <option key={line} value={line}>
                                    {line}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* REMOVED: Unit and Model input fields */}
                </div>

                {/* New Load Data Button */}
                <button
                    className="eds-save-button"
                    onClick={handleLoadData}
                    disabled={!dateTime || !shiftName || !lineName}
                >
                    Update Data
                </button>
            </section>

            {/* Parameters list - Conditionally rendered after load */}
            {showParameters && (
                <div className="eds-form-section">
                    <div className="eds-section-title">Parameters</div>

                    <div className="eds-table-wrapper">
                        <table className="eds-param-table">
                            <thead>
                                <tr>
                                    <th>S#</th>
                                    <th>Parameter</th>
                                    <th>Data Type</th>
                                    <th>Target (Min)</th>
                                    <th>Target (Max)</th>
                                    <th>UOM</th>
                                    <th>Measured Value</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parameters.map((p, i) => {
                                    const entry = entries[p.id] || { value: '', remark: '' };
                                    return (
                                        <tr key={p.id}>
                                            <td>{i + 1}</td>
                                            <td>{p.name}</td>
                                            <td>{p.type || ''}</td>
                                            <td>{p.min ?? ''}</td>
                                            <td>{p.max ?? ''}</td>
                                            <td>{p.unit ?? ''}</td>
                                            <td>
                                                {/* Numeric/Qualitative value entry */}
                                                {p.type && p.type.toLowerCase().includes('qual')
                                                    ? (
                                                        <select
                                                            value={entry.value}
                                                            onChange={ev => handleEntryChange(p.id, 'value', ev.target.value)}
                                                            className="eds-picker"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="OK">OK</option>
                                                            <option value="NOT OK">NOT OK</option>
                                                        </select>
                                                    )
                                                    : (
                                                        <input
                                                            type="number"
                                                            value={entry.value}
                                                            placeholder="Measured"
                                                            onChange={ev => handleEntryChange(p.id, 'value', ev.target.value)}
                                                            className="eds-text-input"
                                                        />
                                                    )
                                                }
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={entry.remark}
                                                    placeholder="Remarks"
                                                    onChange={ev => handleEntryChange(p.id, 'remark', ev.target.value)}
                                                    className="eds-text-input"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                className="eds-save-button"
                onClick={handleSave}
                disabled={loading || !showParameters}
            >
                {loading ? 'Saving...' : 'Submit'}
            </button>

            <button
                className="eds-back"
                onClick={() => navigation?.goBack?.()}
                type="button"
            >
                ← Back
            </button>
        </div>
    );
};

export default EnterDetailsScreen;
