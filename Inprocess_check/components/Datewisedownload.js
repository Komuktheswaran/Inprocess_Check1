import React, { useState, useEffect } from 'react';
import '../styles/Downloads.css';
import '../styles/themes.css';
import ApiService from '../services/ApiService';

const Datewisedownload = ({ navigation }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formatDate = (date) => date.toISOString().split('T')[0];

        setFrom(formatDate(yesterday));
        setTo(formatDate(today));
    }, []); // Runs once on mount

    const exportCsv = (rows) => {
        const headers = ['LogDateTime', 'ShiftName', 'LineName', 'ModelName', 'ParaName', 'UnitMeasured', 'ValueRecorded', 'Remarks'];
        const csv = [
            headers.join(','),
            ...rows.map(r => [
                r.LogDateTime ?? '', r.ShiftName ?? '', r.LineName ?? '', r.ModelName ?? '',
                r.ParaName ?? '', r.UnitMeasured ?? '', r.ValueRecorded ?? '', r.Remarks ?? ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `parameter-log-datewise-${from}-to-${to}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleDownload = async () => {
        if (!from || !to) {
            alert('Please select both From and To dates.');
            return;
        }

        // Validate date range
        if (new Date(from) > new Date(to)) {
            alert('From date cannot be later than To date.');
            return;
        }

        setLoading(true);
        try {
            // Send only date strings without time - let backend handle the conversion
            const q = new URLSearchParams({
                mode: 'daterange',
                from: from,  // Send as YYYY-MM-DD
                to: to       // Send as YYYY-MM-DD
            }).toString();

            console.log('Query URL:', `/parameter-log/query?${q}`);

            const res = await ApiService.apiCall(`/parameter-log/query?${q}`);

            if (!res?.success) {
                alert(`Failed to fetch logs: ${res?.message || 'Unknown error'}`);
                return;
            }

            if (!res.data || res.data.length === 0) {
                alert('No data found for the selected date range.');
                return;
            }

            exportCsv(res.data);
            alert(`Successfully downloaded ${res.data.length} records.`);

        } catch (error) {
            console.error('Download failed:', error);
            alert(`Download failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="downloads-container">
            <h2 className="downloads-title">Date wise download</h2>

            <div className="download-form">
                <div className="form-field">
                    <label>From Date *</label>
                    <input
                        type="date"
                        className="form-input"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        max={to || undefined}
                    />
                </div>

                <div className="form-field">
                    <label>To Date *</label>
                    <input
                        type="date"
                        className="form-input"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        min={from || undefined}
                    />
                </div>

                <div className="download-actions">
                    <button
                        className={`btn-primary ${loading ? 'loading' : ''}`}
                        onClick={handleDownload}
                        disabled={!from || !to || loading}
                    >
                        {loading ? 'Downloading...' : 'Download CSV'}
                    </button>
                </div>
            </div>

            {/* Date range summary */}
            {from && to && (
                <div className="active-filters-card">
                    <h3>Selected Date Range</h3>
                    <div className="filters-summary">
                        <div className="filter-tag">
                            <span className="filter-label">From:</span>
                            <span className="filter-value">{from}</span>
                        </div>
                        <div className="filter-tag">
                            <span className="filter-label">To:</span>
                            <span className="filter-value">{to}</span>
                        </div>
                        <div className="filter-tag">
                            <span className="filter-label">Duration:</span>
                            <span className="filter-value">
                                {Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1} day(s)
                            </span>
                        </div>
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

export default Datewisedownload;
