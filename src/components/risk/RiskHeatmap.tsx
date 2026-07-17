import React from 'react';
import { Text } from '@fluentui/react-components';
import type { Risk } from '../../types';

interface RiskHeatmapProps {
  risks: Risk[];
  title?: string;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ 
  risks, 
  title = 'Mapa de Calor de Riesgos (Impacto vs. Probabilidad)' 
}) => {
  const probabilityScale = [1, 2, 3];
  const impactScale = [3, 2, 1]; // vertical axis

  const getScoreColor = (score: number) => {
    if (score >= 6) return 'var(--color-caribbean-red, #DC143C)'; // Alto (6-9)
    if (score >= 4) return '#FFB900'; // Moderado (4-5)
    return '#107C10'; // Bajo (1-3)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #E8EAED', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Text weight="bold" size={400} style={{ color: 'var(--color-midnight-blue, #001F3F)', marginBottom: '8px' }}>
        {title}
      </Text>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
        {/* Eje Y: IMPACTO (VI) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '11px',
          color: 'var(--color-midnight-blue, #001F3F)',
          writingMode: 'vertical-lr',
          transform: 'rotate(180deg)',
          paddingRight: '4px',
          letterSpacing: '2px',
          userSelect: 'none'
        }}>
          ◀ IMPACTO (VI)
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Eje X: PROBABILIDAD (VP) */}
          <div style={{
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '11px',
            color: 'var(--color-midnight-blue, #001F3F)',
            letterSpacing: '2px',
            marginBottom: '4px',
            userSelect: 'none'
          }}>
            PROBABILIDAD (VP) ▶
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', gap: '8px', alignItems: 'center' }}>
            {/* Header Row */}
            <div></div>
            {probabilityScale.map(p => (
              <div key={p} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: '#636F7D' }}>
                {p === 1 ? 'Baja (1)' : p === 2 ? 'Moderada (2)' : 'Alta (3)'}
              </div>
            ))}

            {/* Grid Rows */}
            {impactScale.map(i => (
              <React.Fragment key={i}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#636F7D', display: 'flex', alignItems: 'center', height: '60px' }}>
                  {i === 1 ? 'Bajo (1)' : i === 2 ? 'Moderado (2)' : 'Alto (3)'}
                </div>
                {probabilityScale.map(p => {
                  const count = risks.filter(r => r.probabilidad === p && r.impacto === i).length;
                  const score = p * i;
                  const cellColor = getScoreColor(score);
                  
                  return (
                    <div
                      key={p}
                      style={{
                        height: '60px',
                        backgroundColor: cellColor,
                        color: '#fff',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s',
                        cursor: 'default',
                      }}
                      title={`Score: ${score} | Riesgos: ${count}`}
                    >
                      <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{count}</span>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>Score {score}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '11px', color: '#636F7D' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#107C10', borderRadius: '2px' }}></div> Bajo (1-3)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#FFB900', borderRadius: '2px' }}></div> Moderado (4-5)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-caribbean-red, #DC143C)', borderRadius: '2px' }}></div> Alto (6-9)
        </div>
      </div>
    </div>
  );
};
