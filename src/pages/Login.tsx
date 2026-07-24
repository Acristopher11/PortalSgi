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
  tokens,
} from '@fluentui/react-components';
import { LockClosedRegular, MailRegular, PersonRegular } from '@fluentui/react-icons';
import { signIn } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding('24px'),
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    maxWidth: '420px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding('40px', '32px'),
    ...shorthands.borderRadius('12px'),
    boxShadow: 'var(--shadow-card, 0 4px 12px rgba(0, 0, 0, 0.08))',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  title: {
    color: tokens.colorNeutralForeground1,
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
  success: {
    color: '#15803d',
    backgroundColor: '#f0fdf4',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', '#bbf7d0'),
    fontSize: '13px',
  },
  input: {
    width: '100%',
  },
  button: {
    marginTop: '8px',
    height: '40px',
    backgroundColor: tokens.colorBrandBackground,
    color: '#ffffff',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: '#ffffff',
    },
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    marginBottom: '16px',
  },
});

export const Login: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  
  // Login & Register toggle state
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading & Messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isRegistering) {
      if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
        setError('Por favor, completa todos los campos.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }

      try {
        setLoading(true);
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              nombre: nombre.trim(),
            }
          }
        });
        if (signUpError) throw signUpError;
        
        setSuccessMessage('Registro exitoso. Tu cuenta está siendo creada.');
        
        // Supabase logs the user in automatically on signup (if email confirmation is disabled/auto).
        // Wait 1.5 seconds for Supabase to sync, then navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard', { viewTransition: true });
        }, 1500);

      } catch (err: any) {
        console.error('[SignUpError]', err);
        setError(err.message || 'Ocurrió un error durante el registro. Intenta de nuevo.');
        setLoading(false);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Por favor, ingresa tu correo y contraseña.');
        return;
      }

      try {
        setLoading(true);
        await signIn(email.trim(), password);
        navigate('/dashboard', { viewTransition: true });
      } catch (err: any) {
        console.error('[LoginError]', err);
        setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <Text className={styles.title} size={800} weight="bold">
            GEMS
          </Text>
          <Text className={styles.subtitle} size={300}>
            Motor Universal de Cumplimiento y Excelencia
          </Text>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          {isRegistering && (
            <Field label="Nombre Completo" required>
              <Input
                type="text"
                className={styles.input}
                value={nombre}
                onChange={(e, data) => setNombre(data.value)}
                placeholder="Juan Pérez"
                contentBefore={<PersonRegular />}
                disabled={loading}
              />
            </Field>
          )}

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

          {isRegistering && (
            <Field label="Confirmar Contraseña" required>
              <Input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e, data) => setConfirmPassword(data.value)}
                placeholder="••••••••"
                contentBefore={<LockClosedRegular />}
                disabled={loading}
              />
            </Field>
          )}

          <Button
            type="submit"
            className={styles.button}
            disabled={loading}
            icon={loading ? <Spinner size="tiny" /> : undefined}
          >
            {loading 
              ? (isRegistering ? 'Creando cuenta...' : 'Iniciando sesión...') 
              : (isRegistering ? 'Registrarse y Solicitar Acceso' : 'Iniciar Sesión')}
          </Button>
        </form>

        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <Button
            appearance="subtle"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccessMessage(null);
            }}
            disabled={loading}
          >
            {isRegistering
              ? '¿Ya tienes una cuenta? Inicia Sesión'
              : '¿No tienes una cuenta? Regístrate aquí'}
          </Button>
        </div>
      </div>
    </div>
  );
};
