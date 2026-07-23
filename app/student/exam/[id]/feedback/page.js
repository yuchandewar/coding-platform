'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function FeedbackPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [skipTimer, setSkipTimer] = useState(30);

  useEffect(() => {
    if (skipTimer > 0) {
      const timer = setTimeout(() => setSkipTimer(skipTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [skipTimer]);

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Failed to exit full screen', err);
    }
  };

  const handleSkip = async () => {
    await exitFullscreen();
    router.push('/student/results');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Please provide a star rating.');
    
    setSubmitting(true);
    try {
      await exitFullscreen();
      const res = await fetch(`/api/student/tests/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedbackText })
      });
      
      if (res.ok) {
        router.push('/student/results');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#f8fafc', marginBottom: '16px' }}>Exam Completed!</h1>
        <p style={{ color: '#cbd5e1', marginBottom: '32px' }}>Your submission has been recorded successfully. Please take a moment to rate your experience.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '40px', padding: 0,
                    color: star <= (hoverRating || rating) ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                    transition: 'color 0.2s'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
              {rating > 0 ? `You selected ${rating} stars` : 'Select a rating'}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', textAlign: 'left', fontSize: '14px' }}>Additional Feedback (Optional)</label>
            <textarea 
              className="input-field" 
              value={feedbackText} 
              onChange={e => setFeedbackText(e.target.value)} 
              placeholder="How can we improve this test?"
              style={{ minHeight: '100px', width: '100%' }}
            ></textarea>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={handleSkip} 
              disabled={skipTimer > 0}
              className="btn-primary" 
              style={{ flex: 1, background: skipTimer > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', cursor: skipTimer > 0 ? 'not-allowed' : 'pointer' }}
            >
              {skipTimer > 0 ? `Skip in ${skipTimer}s` : 'Skip'}
            </button>
            <button type="submit" disabled={submitting || rating === 0} className="btn-primary" style={{ flex: 1 }}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>

      {/* Author Credits */}
      <div style={{ marginTop: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        <p style={{ marginBottom: '8px' }}>Platform developed by <strong style={{ color: '#f8fafc' }}>Yashpal Chandewar</strong></p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <a 
            href="https://www.linkedin.com/in/yashpal-chandewar-47979b311" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </a>
          <a 
            href="https://www.instagram.com/yashpal_chandewar" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#ec4899', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
