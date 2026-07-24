import React from 'react';
import { Text, tokens } from '@fluentui/react-components';
import type { Risk } from '../../types';

interface RiskHeatmapProps {
  risks: Risk[];
  title?: string;
  activeRisk?: Risk | null;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ 
  risks, 
  title = 'Mapa de Calor de Riesgos (Impacto vs. Probabilidad)',
  activeRisk
}) => {
  const probabilityScale = [1, 2, 3];
  const impactScale = [3, 2, 1]; // vertical axis

  const getScoreColor = (score: number) => {
    if (score >= 6) return 'var(--color-caribbean-red, #DC143C)'; // Alto (6-9)
    if (score >= 4) return '#9a6e00'; // Moderado (4-5) - amarillo de alto contraste
    return '#107C10'; // Bajo (1-3)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: tokens.colorNeutralBackground1, padding: '24px', borderRadius: '8px', border: `1px solid ${tokens.colorNeutralStroke1}`, boxShadow: 'var(--shadow-subtle)' }}>
      <Text weight="bold" size={400} style={{ color: tokens.colorNeutralForeground1, marginBottom: '8px' }}>
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
          color: tokens.colorNeutralForeground1,
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
            color: tokens.colorNeutralForeground1,
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
              <div key={p} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: tokens.colorNeutralForeground2 }}>
                {p === 1 ? 'Baja (1)' : p === 2 ? 'Moderada (2)' : 'Alta (3)'}
              </div>
            ))}

            {/* Grid Rows */}
            {impactScale.map(i => (
              <React.Fragment key={i}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: tokens.colorNeutralForeground2, display: 'flex', alignItems: 'center', height: '60px' }}>
                  {i === 1 ? 'Bajo (1)' : i === 2 ? 'Moderado (2)' : 'Alto (3)'}
                </div>
                {probabilityScale.map(p => {
                  const count = risks.filter(r => r.probabilidad === p && r.impacto === i).length;
                  const score = p * i;
                  const cellColor = getScoreColor(score);
                  const isHighlighted = activeRisk && activeRisk.probabilidad === p && activeRisk.impacto === i;
                  
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
                        boxShadow: isHighlighted 
                          ? '0 0 12px #0078D4, inset 0 0 10px rgba(0,0,0,0.15)' 
                          : 'inset 0 0 10px rgba(0,0,0,0.15)',
                        border: isHighlighted ? '3px solid #0078D4' : 'none',
                        transform: isHighlighted ? 'scale(1.05)' : 'none',
                        zIndex: isHighlighted ? 10 : 1,
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'default',
                      }}
                      title={`Score: ${score} | Riesgos: ${count}${isHighlighted ? ' (Contiene el riesgo seleccionado)' : ''}`}
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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '11px', color: tokens.colorNeutralForeground2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#107C10', borderRadius: '2px' }}></div> Bajo (1-3)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#9a6e00', borderRadius: '2px' }}></div> Moderado (4-5)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-caribbean-red, #DC143C)', borderRadius: '2px' }}></div> Alto (6-9)
        </div>
      </div>
    </div>
  );
};
