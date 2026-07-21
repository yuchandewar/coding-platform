'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../../admin.module.css';

export default function CertificateDesigner() {
  const { id } = useParams();
  const router = useRouter();
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [backgroundImage, setBackgroundImage] = useState('');
  const [elements, setElements] = useState([]);
  
  const [eligibilityCondition, setEligibilityCondition] = useState('all');
  const [eligibilityThreshold, setEligibilityThreshold] = useState(0);

  const [selectedElementIndex, setSelectedElementIndex] = useState(null);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${id}`);
      const data = await res.json();
      setTest(data);
      
      if (data.certificateTemplate) {
        setBackgroundImage(data.certificateTemplate.backgroundImage || '');
        setElements(data.certificateTemplate.elements || []);
      }
      if (data.certificateEligibility) {
        setEligibilityCondition(data.certificateEligibility.condition || 'all');
        setEligibilityThreshold(data.certificateEligibility.threshold || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          certificateTemplate: { backgroundImage, elements },
          certificateEligibility: { condition: eligibilityCondition, threshold: eligibilityThreshold }
        })
      });
      
      if (res.ok) {
        alert('Certificate design saved successfully!');
      } else {
        alert('Failed to save certificate design');
      }
    } catch (err) {
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setBackgroundImage(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          handleImageUpload(file);
          break;
        }
      }
    }
  };

  const addElement = (type) => {
    setElements([...elements, { 
      type, 
      customText: type === 'customText' ? 'Your Text Here' : '', 
      x: 50, 
      y: 50, 
      fontSize: 24, 
      color: '#000000', 
      fontFamily: 'serif' 
    }]);
    setSelectedElementIndex(elements.length);
  };

  const updateElement = (index, updates) => {
    const newElements = [...elements];
    newElements[index] = { ...newElements[index], ...updates };
    setElements(newElements);
  };

  const removeElement = (index) => {
    setElements(elements.filter((_, i) => i !== index));
    setSelectedElementIndex(null);
  };

  // Dragging Logic
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartPercent, setDragStartPercent] = useState({ x: 0, y: 0 });

  const onMouseDown = (e, index) => {
    setSelectedElementIndex(index);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragStartPercent({ x: elements[index].x, y: elements[index].y });
    e.stopPropagation();
  };

  const onMouseMove = (e) => {
    if (!isDragging || selectedElementIndex === null || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    
    const dxPercent = (dx / rect.width) * 100;
    const dyPercent = (dy / rect.height) * 100;
    
    let newX = dragStartPercent.x + dxPercent;
    let newY = dragStartPercent.y + dyPercent;
    
    // clamp to 0-100
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    
    updateElement(selectedElementIndex, { x: newX, y: newY });
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <div onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push(`/admin/tests/${id}`)} className="btn-primary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>← Back to Test</button>
          <h1>Design Certificate</h1>
        </div>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Certificate Design'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        
        {/* Left Side: Canvas Area */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Visual Editor</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              Upload a background image (or paste one), then add text elements and drag them into position.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="cert-upload"
                />
                <label htmlFor="cert-upload" className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {uploading ? 'Uploading...' : '📁 Upload Background Image'}
                </label>
                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>OR</div>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Paste Image URL here..." 
                  value={backgroundImage} 
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div 
              ref={canvasRef}
              onPaste={handlePaste}
              tabIndex={0} // To catch paste events
              style={{ 
                width: '100%', 
                aspectRatio: '1.414', // A4 Landscape ratio
                background: backgroundImage ? `url(${backgroundImage}) center/contain no-repeat` : '#1e293b',
                border: '2px dashed rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'crosshair',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
              }}
            >
              {!backgroundImage && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94a3b8', textAlign: 'center' }}>
                  No background image set.<br/>Click "Upload Background Image" or paste an image here (Ctrl+V).
                </div>
              )}

              {/* Render Elements on Canvas */}
              {elements.map((el, idx) => {
                let displayTxt = el.customText;
                if (el.type === 'studentName') displayTxt = '[Student Name]';
                if (el.type === 'score') displayTxt = '[Score]';
                if (el.type === 'rank') displayTxt = '[Rank]';
                if (el.type === 'date') displayTxt = '[Date Issued]';
                if (el.type === 'organizationName') displayTxt = '[Organization]';
                if (el.type === 'eventName') displayTxt = '[Event Name]';

                return (
                  <div
                    key={idx}
                    onMouseDown={(e) => onMouseDown(e, idx)}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${el.fontSize}px`,
                      color: el.color,
                      fontFamily: el.fontFamily,
                      cursor: 'move',
                      border: selectedElementIndex === idx ? '2px solid #3b82f6' : '1px dashed transparent',
                      padding: '4px',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      zIndex: selectedElementIndex === idx ? 10 : 1
                    }}
                  >
                    {displayTxt}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Tools & Settings */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Eligibility Rules</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>Who should receive this certificate?</p>
            
            <select 
              className="input-field" 
              value={eligibilityCondition} 
              onChange={e => setEligibilityCondition(e.target.value)}
              style={{ marginBottom: '12px' }}
            >
              <option value="all">Everyone who completes</option>
              <option value="rank">Only Top Ranks</option>
              <option value="score">Only Above Score (%)</option>
            </select>
            
            {eligibilityCondition === 'rank' && (
              <div>
                <label style={{ fontSize: '13px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>Maximum Rank (e.g., 5 for Top 5)</label>
                <input type="number" min="1" className="input-field" value={eligibilityThreshold} onChange={e => setEligibilityThreshold(Number(e.target.value))} />
              </div>
            )}
            
            {eligibilityCondition === 'score' && (
              <div>
                <label style={{ fontSize: '13px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>Minimum Score % (e.g., 50)</label>
                <input type="number" min="0" max="100" className="input-field" value={eligibilityThreshold} onChange={e => setEligibilityThreshold(Number(e.target.value))} />
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add Elements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => addElement('studentName')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '13px', padding: '8px' }}>+ Student Name</button>
              <button onClick={() => addElement('score')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '13px', padding: '8px' }}>+ Score</button>
              <button onClick={() => addElement('rank')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '13px', padding: '8px' }}>+ Rank</button>
              <button onClick={() => addElement('date')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '13px', padding: '8px' }}>+ Date</button>
              <button onClick={() => addElement('customText')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '13px', padding: '8px', gridColumn: '1 / -1' }}>+ Custom Text</button>
            </div>
          </div>

          {selectedElementIndex !== null && elements[selectedElementIndex] && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Element Properties</h3>
                <button onClick={() => removeElement(selectedElementIndex)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>🗑️ Delete</button>
              </div>
              
              {elements[selectedElementIndex].type === 'customText' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Text</label>
                  <input type="text" className="input-field" value={elements[selectedElementIndex].customText} onChange={e => updateElement(selectedElementIndex, { customText: e.target.value })} />
                </div>
              )}
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Font Size (px)</label>
                <input type="number" min="10" max="200" className="input-field" value={elements[selectedElementIndex].fontSize} onChange={e => updateElement(selectedElementIndex, { fontSize: Number(e.target.value) })} />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Color</label>
                <input type="color" value={elements[selectedElementIndex].color} onChange={e => updateElement(selectedElementIndex, { color: e.target.value })} style={{ width: '100%', height: '40px', padding: '0', border: 'none', cursor: 'pointer', background: 'transparent' }} />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Font Family</label>
                <select className="input-field" value={elements[selectedElementIndex].fontFamily} onChange={e => updateElement(selectedElementIndex, { fontFamily: e.target.value })}>
                  <option value="serif">Serif (Classic)</option>
                  <option value="sans-serif">Sans-Serif (Modern)</option>
                  <option value="cursive">Cursive (Signature)</option>
                  <option value="monospace">Monospace (Code)</option>
                </select>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
