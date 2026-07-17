import React, { useState, useEffect } from 'react';
import { Input, Spinner, Label } from '@fluentui/react-components';
import { searchSharePointUsers } from '../../repositories/usuarioRepository';
import { useAuth } from '../../hooks/useAuth';

interface PeoplePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectUser?: (user: { email: string; name: string }) => void;
  placeholder?: string;
  id?: string;
}

export const PeoplePicker: React.FC<PeoplePickerProps> = ({
  label,
  value,
  onChange,
  onSelectUser,
  placeholder = 'Buscar usuario...',
  id,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<{ email: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    onChange(val); // Permite entrada manual / texto libre
    if (val.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchSharePointUsers(val);
      setResults(res);
      setShowDropdown(res.length > 0);
    } catch (e) {
      console.error('[PeoplePicker] Error searching users:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user: { email: string; name: string }) => {
    setQuery(user.email);
    onChange(user.email);
    if (onSelectUser) {
      onSelectUser(user);
    }
    setShowDropdown(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', width: '100%' }}>
      {label && <Label htmlFor={id} style={{ fontWeight: 'bold' }}>{label}</Label>}
      <Input
        id={id}
        value={query}
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
        onBlur={() => {
          // Pequeño retardo para permitir el evento onMouseDown en el dropdown
          setTimeout(() => setShowDropdown(false), 200);
        }}
      />
      {loading && <Spinner size="tiny" style={{ position: 'absolute', right: '10px', top: label ? '32px' : '8px' }} />}
      
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: label ? '56px' : '32px',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #CBD5E0',
          borderRadius: '4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 100,
          maxHeight: '160px',
          overflowY: 'auto',
        }}>
          {results.map((res, idx) => (
            <div
              key={idx}
              onMouseDown={() => selectUser(res)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: idx < results.length - 1 ? '1px solid #EDF2F7' : 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F7FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a202c' }}>{res.name}</div>
              <div style={{ fontSize: '11px', color: '#718096' }}>{res.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
