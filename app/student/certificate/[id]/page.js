'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CertificatePage() {
  const { id } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await fetch(`/api/certificate/${id}`);
        const data = await res.json();
        
        if (res.ok) {
          setCertData(data);
        } else {
          setError(data.error || 'Failed to load certificate');
        }
      } catch (err) {
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#f8fafc' }}>Loading Certificate...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;

  return (
    <div className="print-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '20px' }}>
      
      {/* Print Button (Hidden in print) */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-wrapper {
            background: white !important;
            padding: 0 !important;
            display: block !important;
            min-height: auto !important;
          }
          .certificate-container { 
            box-shadow: none !important; 
            border: none !important; 
            max-width: 100% !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          @page { size: landscape; margin: 0; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
        <button 
          onClick={() => window.print()}
          style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
        >
          🖨️ Print / Save as PDF
        </button>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Certificate URL copied to clipboard!');
          }}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
        >
          🔗 Copy Link
        </button>
      </div>

      {/* Certificate UI */}
      {certData.template && certData.template.backgroundImage ? (
        <div 
          className="certificate-container"
          style={{ 
            width: '100%', 
            maxWidth: '1000px', 
            aspectRatio: '1.414',
            background: `url(${certData.template.backgroundImage}) center/contain no-repeat`,
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}
        >
          {certData.template.elements?.map((el, idx) => {
            let displayTxt = el.customText;
            if (el.type === 'studentName') displayTxt = certData.studentName;
            if (el.type === 'score') displayTxt = `${certData.score.toFixed(2)}%`;
            if (el.type === 'rank') displayTxt = `#${certData.rank}`;
            if (el.type === 'date') displayTxt = new Date(certData.date).toLocaleDateString();
            if (el.type === 'organizationName') displayTxt = certData.organizationName;
            if (el.type === 'eventName') displayTxt = certData.eventName;

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${el.fontSize}px`,
                  color: el.color,
                  fontFamily: el.fontFamily,
                  whiteSpace: 'nowrap',
                }}
              >
                {displayTxt}
              </div>
            );
          })}
        </div>
      ) : (
        <div 
          className="certificate-container"
          style={{ 
            width: '100%', 
            maxWidth: '900px', 
            background: 'white', 
            aspectRatio: '1.414', // Standard landscape certificate ratio (A4)
            padding: '40px',
            boxSizing: 'border-box',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            color: '#1e293b'
          }}
        >
          {/* Decorative Border */}
          <div style={{ 
            position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px',
            border: '2px solid #cbd5e1', pointerEvents: 'none'
          }}></div>
          <div style={{ 
            position: 'absolute', top: '25px', left: '25px', right: '25px', bottom: '25px',
            border: '4px double #3b82f6', pointerEvents: 'none'
          }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', zIndex: 10, position: 'relative' }}>
            
            <h2 style={{ fontSize: '24px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 20px 0' }}>
              {certData.organizationName}
            </h2>

            <h1 style={{ fontSize: '56px', color: '#1e293b', margin: '0 0 10px 0', fontFamily: 'serif' }}>
              Certificate of Completion
            </h1>
            
            <p style={{ fontSize: '18px', color: '#64748b', margin: '0 0 30px 0', fontStyle: 'italic' }}>
              This is to certify that
            </p>

            <h2 style={{ fontSize: '48px', color: '#3b82f6', margin: '0 0 30px 0', fontFamily: 'cursive', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', minWidth: '400px' }}>
              {certData.studentName}
            </h2>

            <p style={{ fontSize: '18px', color: '#475569', margin: '0 0 10px 0', maxWidth: '600px', lineHeight: '1.6' }}>
              has successfully completed the assessment <strong>{certData.testTitle}</strong> 
              <br />as part of the event <strong>{certData.eventName}</strong>.
            </p>

            <div style={{ margin: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Final Score</span>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{certData.score.toFixed(2)}%</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '700px', margin: 'auto 0 0 0', paddingTop: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '150px', borderBottom: '1px solid #94a3b8', marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>
                  {new Date(certData.date).toLocaleDateString()}
                </div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Date Issued</span>
              </div>

              {/* Verification Seal or ID */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '40px', background: '#3b82f6', 
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '8px'
                }}>
                  🏅
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {id.slice(-8).toUpperCase()}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '150px', borderBottom: '1px solid #94a3b8', marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: '#334155', fontFamily: 'cursive' }}>
                  {certData.organizationName}
                </div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Authorized Signature</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
