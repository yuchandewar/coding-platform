'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function AdminSettings() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash-latest');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok) {
        setHasKey(data.hasGeminiKey);
        setMaskedKey(data.geminiApiKeyMasked);
        if (data.geminiModel) setGeminiModel(data.geminiModel);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = { geminiModel };
      if (apiKey) payload.geminiApiKey = apiKey;

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Settings saved successfully!');
        setApiKey('');
        fetchSettings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save settings');
      }
    } catch (error) {
      alert('An error occurred');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Admin Settings</h1>
      
      {loading ? (
        <p>Loading settings...</p>
      ) : (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>AI Integrations</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
            Configure your AI integration keys here. These keys are used to automatically generate questions for your tests.
          </p>
          
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Google Gemini API Key
              </label>
              {hasKey && (
                <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '12px' }}>
                  ✅ Active Key: {maskedKey}
                </div>
              )}
              <input 
                type="password" 
                className="input-field" 
                placeholder="AIzaSy..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required={!hasKey}
                style={{ width: '100%', marginBottom: '8px' }}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                You can get a free API key from Google AI Studio. {hasKey ? 'Enter a new key to overwrite the existing one.' : ''}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Preferred AI Model
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={geminiModel} 
                onChange={e => setGeminiModel(e.target.value)} 
                style={{ width: '100%', marginBottom: '8px' }}
                placeholder="e.g. gemini-2.5-flash"
                required
              />
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Type the exact model name supported by your API key (e.g., gemini-2.5-flash, gemini-2.5-pro).
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
