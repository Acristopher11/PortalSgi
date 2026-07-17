import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Input,
  Button,
  Field,
  makeStyles,
  shorthands,
  Spinner,
} from '@fluentui/react-components';
import { LockClosedRegular, MailRegular } from '@fluentui/react-icons';
import { signIn } from '../lib/auth';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    ...shorthands.padding('24px'),
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    ...shorthands.padding('40px', '32px'),
    ...shorthands.borderRadius('12px'),
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  title: {
    color: '#1e293b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  error: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', '#fca5a5'),
    fontSize: '13px',
  },
  input: {
    width: '100%',
  },
  button: {
    marginTop: '8px',
    height: '40px',
    backgroundColor: '#1E3A5F',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#152943',
      color: '#ffffff',
    },
  },
  subtitle: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: '16px',
  },
});

export const Login: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signIn(email.trim(), password);
      // Success: redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[LoginError]', err);
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <Text className={styles.title} size={800} weight="bold">
            Portal SGI
          </Text>
          <Text className={styles.subtitle} size={300}>
            Sistema de Gestión Integrado SaaS
          </Text>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <Field label="Correo Electrónico" required>
            <Input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e, data) => setEmail(data.value)}
              placeholder="nombre@empresa.com"
              contentBefore={<MailRegular />}
              disabled={loading}
            />
          </Field>

          <Field label="Contraseña" required>
            <Input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e, data) => setPassword(data.value)}
              placeholder="••••••••"
              contentBefore={<LockClosedRegular />}
              disabled={loading}
            />
          </Field>

          <Button
            type="submit"
            className={styles.button}
            disabled={loading}
            icon={loading ? <Spinner size="tiny" /> : undefined}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
};
