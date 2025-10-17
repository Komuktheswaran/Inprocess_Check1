import React, { useState, useEffect, useMemo } from 'react';
import ApiService from '../../services/ApiService';
import '../../styles/themes.css';
import '../../styles/Downloads.css';

const Shiftwisedownload = ({ navigation }) => {
    const [shift, setShift] = useState('');
    const [onDate, setOnDate] = useState(''); // optional filter date
    const [configurations, setConfigurations] = useState([]); // configurations from DB

    const [to, setTo] = useState('');
    const [from, setFrom] = useState('');

    useEffect(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formatDate = (date) => date.toISOString().split('T')[0];

        setOnDate(formatDate(today));
    }, []);

    // Get unique shifts from configurations
    const shifts = useMemo(() => {
        const uniqueShifts = [...new Set(configurations.map(config => config.Shift))];
        return uniqueShifts.sort();
    }, [configurations]);

    // Load configurations on component mount
    useEffect(() => {
        const loadConfigurations = async () => {
            try {
                const res = await ApiService.getConfigurations();
                if (res?.success && Array.isArray(res.data)) {
                    setConfigurations(res.data);
                }
            } catch (e) {
                console.error('Failed to load configurations:', e);
            }
        };

        loadConfigurations();
    }, []);

    const toIstIsoDay = (localDate) => localDate ? `${localDate}T00:00:00+05:30` : null;

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
        a.download = `parameter-log-shift-${shift}-${onDate || 'all-dates'}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleDownload = async () => {
        if (!shift) {
            alert('Please select a shift');
            return;
        }

        const q = new URLSearchParams({
            mode: 'shift',
            shift: shift,
            ...(onDate && { onDate: toIstIsoDay(onDate) })
        }).toString();

        try {
            const res = await ApiService.apiCall(`/parameter-log/query?${q}`);
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

    return (
        <div className="downloads-container">
            <h2 className="downloads-title">Shift wise download</h2>

            <div className="download-form">
                <div className="form-field">
                    <label>Shift *</label>
                    <select
                        className="form-select"
                        value={shift}
                        onChange={e => setShift(e.target.value)}
                    >
                        <option value="">Select Shift</option>
                        {shifts.map(shiftName => (
                            <option key={shiftName} value={shiftName}>
                                {shiftName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label>Date (optional)</label>
                    <input
                        type="date"
                        className="form-input"
                        value={onDate}
                        onChange={e => setOnDate(e.target.value)}
                        placeholder="Leave empty for all dates"
                    />
                </div>

                <div className="download-actions">
                    <button
                        className="btn-primary"
                        onClick={handleDownload}
                        disabled={!shift}
                    >
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Active selection summary */}
            {shift && (
                <div className="active-filters-card">
                    <h3>Download Selection</h3>
                    <div className="filters-summary">
                        <div className="filter-tag">
                            <span className="filter-label">Shift:</span>
                            <span className="filter-value">{shift}</span>
                        </div>
                        {onDate && (
                            <div className="filter-tag">
                                <span className="filter-label">Date:</span>
                                <span className="filter-value">{onDate}</span>
                            </div>
                        )}
                        {!onDate && (
                            <div className="filter-tag">
                                <span className="filter-label">Date:</span>
                                <span className="filter-value">All dates</span>
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

export default Shiftwisedownload;
