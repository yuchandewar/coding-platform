'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../admin.module.css';
import Editor from '@monaco-editor/react';

export default function SubmissionDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmission(data);
    } catch (err) {
      console.error(err);
      alert('Error loading submission details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;
  if (!submission) return <div style={{ padding: '40px' }}>Submission not found</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/admin/submissions')} className="btn-primary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>← Back</button>
          <h1>Submission Details</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px' }}>
        {/* Left Side: Summary Panel */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', color: '#f8fafc' }}>Summary</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Student</div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>{submission.studentId?.username || 'Unknown'}</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{submission.studentId?.email || ''}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Exam Title</div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>{submission.testId?.title || 'Unknown Test'}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Final Score</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: submission.score >= 50 ? 'var(--success-color)' : 'var(--danger-color)' 
              }}>
                {submission.score?.toFixed(2)}%
              </div>
            </div>
            
            <div style={{ padding: '12px', background: submission.tabSwitches > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${submission.tabSwitches > 0 ? '#ef4444' : '#10b981'}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: submission.tabSwitches > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>Anti-Cheating Logs</div>
              <div style={{ color: 'white', marginTop: '4px' }}>
                Tab Switches: {submission.tabSwitches || 0}
              </div>
            </div>

            {submission.rating && (
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Student Feedback</div>
                <div style={{ color: '#fbbf24', fontSize: '16px', marginBottom: '4px' }}>{'★'.repeat(submission.rating)}</div>
                {submission.feedbackText && (
                  <div style={{ color: '#cbd5e1', fontSize: '13px', fontStyle: 'italic' }}>"{submission.feedbackText}"</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Answers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ color: '#f8fafc' }}>Question Responses</h3>
          
          {submission.testId?.questions?.map((q, idx) => {
            // Find the student's answer for this question
            const answer = submission.answers?.find(a => a.questionId === q._id);
            
            return (
              <div key={q._id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ color: 'var(--primary-color)' }}>Question {idx + 1} ({q.type})</h4>
                  {!answer && <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>Unanswered</span>}
                </div>
                
                <div style={{ color: '#cbd5e1', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                  {q.questionText}
                </div>

                {/* Render Answer */}
                {answer && q.type === 'programming' && (
                  <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                      <span>Submitted Code</span>
                      <span>Language: {answer.language}</span>
                    </div>
                    <div style={{ height: '300px' }}>
                      <Editor
                        height="100%"
                        theme="vs-dark"
                        language={answer.language}
                        value={answer.code}
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                      />
                    </div>
                  </div>
                )}
                
                {answer && q.type === 'quiz' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = answer.selectedOptionIndex === optIdx;
                      const isCorrect = q.correctOptionIndex === optIdx;
                      
                      let bgColor = 'rgba(0,0,0,0.2)';
                      let borderColor = 'rgba(255,255,255,0.05)';
                      
                      if (isSelected && isCorrect) {
                        bgColor = 'rgba(16, 185, 129, 0.2)';
                        borderColor = '#10b981';
                      } else if (isSelected && !isCorrect) {
                        bgColor = 'rgba(239, 68, 68, 0.2)';
                        borderColor = '#ef4444';
                      } else if (!isSelected && isCorrect) {
                        bgColor = 'rgba(16, 185, 129, 0.1)';
                        borderColor = '#10b981';
                      }

                      return (
                        <div 
                          key={optIdx} 
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', 
                            background: bgColor, 
                            border: `1px solid ${borderColor}`,
                            borderRadius: '8px'
                          }}
                        >
                          <span style={{ color: '#f8fafc' }}>{opt}</span>
                          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {isSelected && <span style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>YOUR ANSWER</span>}
                            {isCorrect && !isSelected && <span style={{ color: '#10b981' }}>CORRECT ANSWER</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {answer && q.type === 'fill_in_the_blank' && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Student's Answer:</div>
                    <div style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>{answer.textResponse || 'N/A'}</div>
                    
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Acceptable Answers:</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {q.blankAnswers?.map((ans, i) => (
                        <span key={i} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', border: '1px solid #10b981' }}>{ans}</span>
                      ))}
                    </div>
                  </div>
                )}

                {answer && q.type === 'pairing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '8px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>Left Item</div>
                      <div>Student Match</div>
                      <div>Correct Match</div>
                    </div>
                    {q.pairs?.map((pair, idx) => {
                      const studentMatch = answer.pairedResponses?.find(pr => pr.left === pair.left)?.right || 'N/A';
                      const isCorrect = studentMatch === pair.right;
                      
                      return (
                        <div key={idx} style={{ 
                          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', 
                          padding: '12px 16px', 
                          background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          borderRadius: '8px', alignItems: 'center'
                        }}>
                          <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{pair.left}</div>
                          <div style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>{studentMatch}</div>
                          <div style={{ color: '#10b981' }}>{pair.right}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
