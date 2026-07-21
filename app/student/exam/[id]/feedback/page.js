'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function FeedbackPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Please provide a star rating.');
    
    setSubmitting(true);
    try {
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
            <button type="button" onClick={() => router.push('/student/results')} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
              Skip
            </button>
            <button type="submit" disabled={submitting || rating === 0} className="btn-primary" style={{ flex: 1 }}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
