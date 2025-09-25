import React, { useEffect, useState, useMemo } from 'react';
import ApiService from '../services/ApiService';
import '../styles/themes.css';
import '../styles/Downloads.css';

const Downloadscreen = ({ navigation }) => {
    // Filters
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [shift, setShift] = useState(''); // optional
    const [line, setLine] = useState(''); // NEW: Line filter
    const [paraId, setParaId] = useState(''); // optional parameter id

    // Data
    const [params, setParams] = useState([]); // parameter list
    const [configurations, setConfigurations] = useState([]); // NEW: configurations from DB

    useEffect(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formatDate = (date) => date.toISOString().split('T')[0];

        setFrom(formatDate(yesterday));
        setTo(formatDate(today));
    }, []);

    // Get unique lines and shifts from configurations
    const lines = useMemo(() => {
        const uniqueLines = [...new Set(configurations.map(config => config.Line))];
        return uniqueLines.sort();
    }, [configurations]);

    const shifts = useMemo(() => {
        const uniqueShifts = [...new Set(configurations.map(config => config.Shift))];
        return uniqueShifts.sort();
    }, [configurations]);

    // Load parameter list and configurations for dropdown
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load parameters
                const paramsRes = await ApiService.getParameters();
                if (paramsRes?.success && Array.isArray(paramsRes.data)) {
                    setParams(paramsRes.data);
                }

                // Load configurations
                const configRes = await ApiService.getConfigurations();
                if (configRes?.success && Array.isArray(configRes.data)) {
                    setConfigurations(configRes.data);
                }
            } catch (e) {
                console.error('Failed to load data:', e);
            }
        };

        loadData();
    }, []);

    // Convert datetime-local minute string to ISO with IST offset

    const exportCsv = (rows) => {
        const headers = ['LogDateTime', 'ShiftName', 'LineName', 'ParaName', 'UnitMeasured', 'ValueRecorded', 'Remarks'];
        const csv = [
            headers.join(','),
            ...rows.map(r => [
                r.LogDateTime ?? '',
                r.ShiftName ?? '',
                r.LineName ?? '',
                r.ParaName ?? '',
                r.UnitMeasured ?? '',
                r.ValueRecorded ?? '',
                r.Remarks ?? ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `parameter-log-combined-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleDownload = async () => {
        // Validate that at least one filter is applied
        if (!from && !to && !shift && !line && !paraId) {
            alert('Please select at least one filter (Date, Line, Shift, or Parameter)');
            return;
        }

        // Build combined filters (omit empty ones)
        const qs = new URLSearchParams();
        qs.set('mode', 'combined'); // backend can treat this as "apply all present filters"
        if (from) qs.set('from', from);
        if (to) qs.set('to', to);
        if (shift) qs.set('shift', shift);
        if (line) qs.set('line', line); // NEW: Line parameter
        if (paraId) qs.set('paraid', paraId);

        try {
            const res = await ApiService.apiCall(`/parameter-log/query?${qs.toString()}`);
            if (!res?.success) {
                alert('Failed to fetch logs');
                return;
            }
            exportCsv(res.data);
        } catch (e) {
            console.error('Download failed:', e);
            alert('Download failed. Please try again.');
        }
    };

    // Get active filters count
    const activeFiltersCount = [from, to, shift, line, paraId].filter(Boolean).length;
    const selectedParam = params.find(p => p.Para_ID == paraId);

    return (
        <div className="downloads-container">
            <h2 className="downloads-title">Download Records</h2>

            {/* Filters Card */}
            <div className="download-form">
                <div className="form-field">
                    <label>From Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label>To Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label>Line</label>
                    <select
                        className="form-select"
                        value={line}
                        onChange={e => setLine(e.target.value)}
                    >
                        <option value="">All lines</option>
                        {lines.map(lineName => (
                            <option key={lineName} value={lineName}>
                                {lineName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label>Shift</label>
                    <select
                        className="form-select"
                        value={shift}
                        onChange={e => setShift(e.target.value)}
                    >
                        <option value="">All shifts</option>
                        {shifts.map(shiftName => (
                            <option key={shiftName} value={shiftName}>
                                {shiftName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label>Parameter</label>
                    <select
                        className="form-select"
                        value={paraId}
                        onChange={e => setParaId(e.target.value)}
                    >
                        <option value="">All parameters</option>
                        {params.map(p => (
                            <option key={p.Para_ID} value={p.Para_ID}>
                                {p.Para_Name} ({p.Para_Unit || 'N/A'})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="download-actions">
                    <button
                        className="btn-primary"
                        onClick={handleDownload}
                        disabled={activeFiltersCount === 0}
                    >
                        Download CSV ({activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''})
                    </button>
                </div>
            </div>

            {/* Active Filters Summary */}
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
                        {line && (
                            <div className="filter-tag">
                                <span className="filter-label">Line:</span>
                                <span className="filter-value">{line}</span>
                            </div>
                        )}
                        {shift && (
                            <div className="filter-tag">
                                <span className="filter-label">Shift:</span>
                                <span className="filter-value">{shift}</span>
                            </div>
                        )}
                        {selectedParam && (
                            <div className="filter-tag">
                                <span className="filter-label">Parameter:</span>
                                <span className="filter-value">{selectedParam.Para_Name}</span>
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
