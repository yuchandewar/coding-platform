'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CertificatePage() {
  const { id } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

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

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = Math.min(window.innerWidth - 40, 1000);
      setScale(availableWidth / 1000);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleDownload = async (format) => {
    setIsDownloading(true);
    try {
      const element = document.querySelector('.certificate-container');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true, // For external background images
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Force the cloned element to be full 1000x707 without scale transforms
          // so it captures perfectly regardless of mobile screen width
          const clonedElement = clonedDoc.querySelector('.certificate-container');
          clonedElement.style.transform = 'scale(1)';
          clonedElement.style.width = '1000px';
          clonedElement.style.height = '707px';
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const filename = `Certificate_${certData.studentName.replace(/\s+/g, '_')}`;

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [1000, 707]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, 1000, 707);
        pdf.save(`${filename}.pdf`);
      } else {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${filename}.png`;
        link.click();
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Failed to generate certificate file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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
            width: 100vw !important;
            height: 100vh !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-wrapper {
            background: white !important;
            padding: 0 !important;
            display: block !important;
            min-height: auto !important;
          }
          .certificate-scaler {
            width: 100vw !important;
            height: 100vh !important;
            overflow: hidden !important;
            display: block !important;
          }
          .certificate-container { 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important;
            transform: none !important;
            width: 100vw !important;
            height: 100vh !important;
            background-size: 100% 100% !important;
            --cert-width: 100vw !important;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => handleDownload('pdf')}
          disabled={isDownloading}
          style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isDownloading ? 'wait' : 'pointer', fontSize: '14px' }}
        >
          {isDownloading ? '⏳ Generating...' : '📄 Download PDF'}
        </button>
        <button 
          onClick={() => handleDownload('image')}
          disabled={isDownloading}
          style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isDownloading ? 'wait' : 'pointer', fontSize: '14px' }}
        >
          {isDownloading ? '⏳ Generating...' : '🖼️ Download Image'}
        </button>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Certificate URL copied to clipboard!');
          }}
          disabled={isDownloading}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontWeight: 'bold', cursor: isDownloading ? 'wait' : 'pointer', fontSize: '14px' }}
        >
          🔗 Copy Link
        </button>
      </div>

      {/* Scaler Wrapper */}
      <div 
        className="certificate-scaler" 
        style={{ 
          width: '100%', 
          maxWidth: '1000px', 
          aspectRatio: '1.414', 
          overflow: 'hidden', 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        {/* Certificate UI */}
        {certData.template && certData.template.backgroundImage ? (
          <div 
            className="certificate-container"
            style={{ 
              width: '1000px', 
              height: '707px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              background: `url(${certData.template.backgroundImage}) center/100% 100% no-repeat`,
              position: 'absolute',
              top: 0,
              left: 0,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              '--cert-width': '1000px'
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
                    fontSize: `calc(${el.fontSize} * var(--cert-width) / 1000)`,
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
              width: '1000px', 
              height: '707px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              background: 'white', 
              padding: 'calc(40 * var(--cert-width) / 1000)',
              boxSizing: 'border-box',
              position: 'absolute',
              top: 0,
              left: 0,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              color: '#1e293b',
              '--cert-width': '1000px'
            }}
          >
            {/* Decorative Border */}
            <div style={{ 
              position: 'absolute', 
              top: 'calc(15 * var(--cert-width) / 1000)', left: 'calc(15 * var(--cert-width) / 1000)', right: 'calc(15 * var(--cert-width) / 1000)', bottom: 'calc(15 * var(--cert-width) / 1000)',
              border: 'calc(2 * var(--cert-width) / 1000) solid #cbd5e1', pointerEvents: 'none'
            }}></div>
            <div style={{ 
              position: 'absolute', 
              top: 'calc(25 * var(--cert-width) / 1000)', left: 'calc(25 * var(--cert-width) / 1000)', right: 'calc(25 * var(--cert-width) / 1000)', bottom: 'calc(25 * var(--cert-width) / 1000)',
              border: 'calc(4 * var(--cert-width) / 1000) double #3b82f6', pointerEvents: 'none'
            }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', zIndex: 10, position: 'relative' }}>
              
              <h2 style={{ fontSize: 'calc(24 * var(--cert-width) / 1000)', color: '#64748b', textTransform: 'uppercase', letterSpacing: 'calc(4 * var(--cert-width) / 1000)', margin: '0 0 calc(20 * var(--cert-width) / 1000) 0' }}>
                {certData.organizationName}
              </h2>

              <h1 style={{ fontSize: 'calc(56 * var(--cert-width) / 1000)', color: '#1e293b', margin: '0 0 calc(10 * var(--cert-width) / 1000) 0', fontFamily: 'serif' }}>
                Certificate of Completion
              </h1>
              
              <p style={{ fontSize: 'calc(18 * var(--cert-width) / 1000)', color: '#64748b', margin: '0 0 calc(30 * var(--cert-width) / 1000) 0', fontStyle: 'italic' }}>
                This is to certify that
              </p>

              <h2 style={{ fontSize: 'calc(48 * var(--cert-width) / 1000)', color: '#3b82f6', margin: '0 0 calc(30 * var(--cert-width) / 1000) 0', fontFamily: 'cursive', borderBottom: 'calc(2 * var(--cert-width) / 1000) solid #e2e8f0', paddingBottom: 'calc(10 * var(--cert-width) / 1000)', minWidth: 'calc(400 * var(--cert-width) / 1000)' }}>
                {certData.studentName}
              </h2>

              <p style={{ fontSize: 'calc(18 * var(--cert-width) / 1000)', color: '#475569', margin: '0 0 calc(10 * var(--cert-width) / 1000) 0', maxWidth: 'calc(600 * var(--cert-width) / 1000)', lineHeight: '1.6' }}>
                has successfully completed the assessment <strong>{certData.testTitle}</strong> 
                <br />as part of the event <strong>{certData.eventName}</strong>.
              </p>

              <div style={{ margin: 'calc(30 * var(--cert-width) / 1000) 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 'calc(16 * var(--cert-width) / 1000)', color: '#64748b', textTransform: 'uppercase', letterSpacing: 'calc(2 * var(--cert-width) / 1000)' }}>Final Score</span>
                <span style={{ fontSize: 'calc(32 * var(--cert-width) / 1000)', fontWeight: 'bold', color: '#10b981' }}>{certData.score.toFixed(2)}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 'calc(700 * var(--cert-width) / 1000)', margin: 'auto 0 0 0', paddingTop: 'calc(40 * var(--cert-width) / 1000)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 'calc(150 * var(--cert-width) / 1000)', borderBottom: 'calc(1 * var(--cert-width) / 1000) solid #94a3b8', marginBottom: 'calc(8 * var(--cert-width) / 1000)', fontSize: 'calc(16 * var(--cert-width) / 1000)', fontWeight: 'bold', color: '#334155' }}>
                    {new Date(certData.date).toLocaleDateString()}
                  </div>
                  <span style={{ fontSize: 'calc(14 * var(--cert-width) / 1000)', color: '#64748b' }}>Date Issued</span>
                </div>

                {/* Verification Seal or ID */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: 'calc(80 * var(--cert-width) / 1000)', height: 'calc(80 * var(--cert-width) / 1000)', borderRadius: 'calc(40 * var(--cert-width) / 1000)', background: '#3b82f6', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(32 * var(--cert-width) / 1000)',
                    boxShadow: '0 calc(4 * var(--cert-width) / 1000) calc(6 * var(--cert-width) / 1000) rgba(0,0,0,0.1)', marginBottom: 'calc(8 * var(--cert-width) / 1000)'
                  }}>
                    🏅
                  </div>
                  <span style={{ fontSize: 'calc(10 * var(--cert-width) / 1000)', color: '#94a3b8' }}>ID: {id.slice(-8).toUpperCase()}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 'calc(150 * var(--cert-width) / 1000)', borderBottom: 'calc(1 * var(--cert-width) / 1000) solid #94a3b8', marginBottom: 'calc(8 * var(--cert-width) / 1000)', fontSize: 'calc(16 * var(--cert-width) / 1000)', fontWeight: 'bold', color: '#334155', fontFamily: 'cursive' }}>
                    {certData.organizationName}
                  </div>
                  <span style={{ fontSize: 'calc(14 * var(--cert-width) / 1000)', color: '#64748b' }}>Authorized Signature</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
