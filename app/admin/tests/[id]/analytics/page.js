'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../../admin.module.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

export default function AnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [performanceFilter, setPerformanceFilter] = useState('All'); // Strong, Average, Weak

  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${id}/analytics`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      alert('Error fetching analytics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading analytics...</div>;
  if (!data) return <div style={{ padding: '40px', color: 'red' }}>Failed to load data</div>;

  const uniqueCategories = data.categoryAverages.map(c => c.category);

  let filteredStudents = data.studentsAnalytics;

  if (categoryFilter !== 'All') {
    filteredStudents = filteredStudents.filter(s => 
      s.categories.some(c => c.category === categoryFilter)
    );
  }

  if (performanceFilter !== 'All') {
    filteredStudents = filteredStudents.filter(s => {
      if (categoryFilter === 'All') {
        // If 'All' categories selected, check if student has this performance in ANY category
        return s.categories.some(c => c.label === performanceFilter);
      } else {
        // Check performance specifically in the selected category
        const cat = s.categories.find(c => c.category === categoryFilter);
        return cat && cat.label === performanceFilter;
      }
    });
  }

  return (
    <div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-report, #print-report * {
            visibility: visible;
          }
          #print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .glass-panel { background: white !important; color: black !important; border: none !important; }
          * { color: black !important; }
        }
      `}</style>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push(`/admin/tests/${id}/leaderboard`)} className="btn-primary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>← Back to Leaderboard</button>
          <h1>Analytics & Performance Track: {data.testTitle}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Overall Category Performance (Average %)</h3>
          {data.categoryAverages.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.categoryAverages} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="category" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="averagePercentage" fill="var(--primary-color)" name="Average Score %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p style={{ color: '#94a3b8' }}>No categories found.</p>}
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Performance Filters</h3>
          <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '20px' }}>Use filters to identify students who are weak or strong in specific categories.</p>
          
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Select Category</label>
              <select className="input-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Performance Level</label>
              <select className="input-field" value={performanceFilter} onChange={e => setPerformanceFilter(e.target.value)}>
                <option value="All">All Levels</option>
                <option value="Strong">Strong (≥ 80%)</option>
                <option value="Average">Average (41% - 79%)</option>
                <option value="Weak">Weak (≤ 40%)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Filtered Students ({filteredStudents.length})</h3>
        
        {filteredStudents.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No students match the criteria.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredStudents.map(student => (
              <div key={student.studentId} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#f8fafc' }}>{student.studentName}</h4>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Total Score: {student.score} / {student.maxScore}</div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="btn-primary" 
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    View Report
                  </button>
                </div>
                
                {categoryFilter !== 'All' && (
                  <div style={{ marginTop: '12px', fontSize: '13px' }}>
                    {(() => {
                      const cat = student.categories.find(c => c.category === categoryFilter);
                      if (!cat) return <span style={{ color: '#94a3b8' }}>N/A in this category</span>;
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#cbd5e1' }}>{cat.category}:</span>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'
                          }}>
                            {cat.percentage}% ({cat.label})
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Report Modal */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div id="print-report" className="glass-panel" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            <button 
              onClick={() => setSelectedStudent(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
            >
              &times;
            </button>
            
            <h2 style={{ color: 'var(--primary-color)', marginBottom: '4px' }}>Performance Report</h2>
            <h3 style={{ color: '#f8fafc', marginBottom: '24px' }}>Student: {selectedStudent.studentName}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <h4 style={{ marginBottom: '16px', color: '#cbd5e1' }}>Category Skill Radar</h4>
                {selectedStudent.categories.length > 2 ? (
                  <div style={{ width: '100%', height: 300, background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <ResponsiveContainer>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedStudent.categories}>
                        <PolarGrid stroke="rgba(255,255,255,0.2)" />
                        <PolarAngleAxis dataKey="category" stroke="#cbd5e1" fontSize={12} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name={selectedStudent.studentName} dataKey="percentage" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.6} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 300, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '20px', textAlign: 'center' }}>
                    Radar chart requires at least 3 categories.
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ marginBottom: '16px', color: '#cbd5e1' }}>Category Breakdown & Action Plan</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                  {selectedStudent.categories.map((cat, idx) => (
                    <div key={idx} style={{ 
                      padding: '16px', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '8px', 
                      borderLeft: `4px solid ${cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'}` 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '15px' }}>{cat.category}</strong>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: 'bold',
                          color: cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'
                        }}>
                          {cat.percentage}% - {cat.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Marks: {cat.obtainedMarks} / {cat.totalMarks}</div>
                      
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--primary-color)' }}>Recommendation:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>{cat.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => window.print()} className="btn-primary" style={{ background: 'var(--success-color)' }}>
                🖨️ Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
