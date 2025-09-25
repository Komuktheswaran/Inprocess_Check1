import React, { useEffect, useState } from 'react';
import ApiService from '../services/ApiService';
import '../styles/themes.css';
import '../styles/Downloads.css';

const Parameterwisedownload = ({ navigation }) => {
    const [params, setParams] = useState([]);
    const [paraId, setParaId] = useState('');
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
    }, []);



    useEffect(() => {
        (async () => {
            try {
                const res = await ApiService.getParameters();
                if (res?.success && Array.isArray(res.data)) {
                    setParams(res.data);
                }
            } catch (error) {
                console.error('Failed to load parameters:', error);
            }
        })();
    }, []);

    const exportCsv = (rows) => {
        // Map backend field names to CSV headers
        const headers = [
            'LogDateTime', 'ShiftName', 'LineName',
            'ParaName', 'ValueRecorded', 'Remarks'
        ];

        const csv = [
            headers.join(','),
            ...rows.map(r => [
                r.LogDateTime ?? '',           // Backend: LogDateTime
                r.ShiftName ?? '',             // Backend: ShiftName  
                r.LineName ?? '',              // Backend: LineName
                r.ParaName ?? '',              // Backend: ParaName
                r.ValueRecorded ?? '',         // Backend: ValueRecorded
                r.Remarks ?? ''                // Backend: Remarks
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `parameter_log_param_${paraId || 'all'}_${from}_to_${to}_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleDownload = async () => {
        if (!paraId) {
            alert('Please select a parameter');
            return;
        }

        if (!from || !to) {
            alert('Please select both From and To dates');
            return;
        }

        // Validate date range
        if (new Date(from) > new Date(to)) {
            alert('From date cannot be later than To date.');
            return;
        }

        setLoading(true);
        try {
            // Fix parameter name: use 'paraid' not 'para_id'
            const q = new URLSearchParams({
                mode: 'parameter',
                paraid: paraId,     // FIXED: Changed from 'para_id' to 'paraid'
                from: from,         // Send as YYYY-MM-DD
                to: to              // Send as YYYY-MM-DD
            }).toString();

            console.log('Query URL:', `/parameter-log/query?${q}`);

            const res = await ApiService.apiCall(`/parameter-log/query?${q}`);

            if (!res?.success) {
                alert(`Failed to fetch logs: ${res?.message || 'Unknown error'}`);
                return;
            }

            if (!res.data || res.data.length === 0) {
                alert('No data found for the selected parameter and date range.');
                return;
            }

            exportCsv(res.data);
            alert(`Successfully downloaded ${res.data.length} records for parameter.`);

        } catch (error) {
            console.error('Download failed:', error);
            alert(`Download failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fix parameter selection: use flexible equality (== instead of ===)
    const selectedParam = params.find(p => p.Para_ID == paraId);

    return (
        <div className="downloads-container">
            <h2 className="downloads-title">Parameter wise download</h2>

            <div className="download-form">
                <div className="form-field">
                    <label>Parameter *</label>
                    <select
                        className="form-select"
                        value={paraId}
                        onChange={(e) => setParaId(e.target.value)}
                    >
                        <option value="">Select Parameter</option>
                        {params.map(p => (
                            <option key={p.Para_ID} value={p.Para_ID}>
                                {p.Para_Name} ({p.Para_Unit || 'N/A'})
                            </option>
                        ))}
                    </select>
                </div>

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
                        disabled={!paraId || !from || !to || loading}
                    >
                        {loading ? 'Downloading...' : 'Download CSV'}
                    </button>
                </div>
            </div>

            {/* Parameter info card */}
            {selectedParam && (
                <div className="parameter-info-card">
                    <h3>Selected Parameter</h3>
                    <div className="parameter-details">
                        <div className="parameter-detail">
                            <span className="label">Name:</span>
                            <span className="value">{selectedParam.Para_Name}</span>
                        </div>
                        <div className="parameter-detail">
                            <span className="label">Type:</span>
                            <span className="value">{selectedParam.Para_Type || 'N/A'}</span>
                        </div>
                        <div className="parameter-detail">
                            <span className="label">Unit:</span>
                            <span className="value">{selectedParam.Para_Unit || 'N/A'}</span>
                        </div>
                        {selectedParam.Para_Type === 'Quantitative' && (
                            <>
                                <div className="parameter-detail">
                                    <span className="label">Min:</span>
                                    <span className="value">{selectedParam.Para_Min ?? 'N/A'}</span>
                                </div>
                                <div className="parameter-detail">
                                    <span className="label">Max:</span>
                                    <span className="value">{selectedParam.Para_Max ?? 'N/A'}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Selection summary */}
            {paraId && from && to && (
                <div className="active-filters-card">
                    <h3>Download Selection</h3>
                    <div className="filters-summary">
                        <div className="filter-tag">
                            <span className="filter-label">Parameter:</span>
                            <span className="filter-value">{selectedParam?.Para_Name || paraId}</span>
                        </div>
                        <div className="filter-tag">
                            <span className="filter-label">From:</span>
                            <span className="filter-value">{from}</span>
                        </div>
                        <div className="filter-tag">
                            <span className="filter-label">To:</span>
                            <span className="filter-value">{to}</span>
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

export default Parameterwisedownload;
