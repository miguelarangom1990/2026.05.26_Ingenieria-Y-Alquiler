import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { currentUser, loginWithEmail, registerWithEmail, resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser && !isLoading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [currentUser, isLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isResetting) {
      if (!email) {
        setError('Por favor ingresa tu correo electrónico.');
        return;
      }
      try {
        setIsSubmitting(true);
        await resetPassword(email);
        setSuccessMessage('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.');
        setIsSubmitting(false);
        setTimeout(() => setIsResetting(false), 5000);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || 'Error al solicitar el restablecimiento.');
      }
      return;
    }

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.code === 'auth/invalid-credential') {
         setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (err.code === 'auth/email-already-in-use') {
         setError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
         setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
         setError(err.message || 'Error al procesar la solicitud.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">ConstruManage</h1>
        <p className="text-slate-500 mb-8">
          {isResetting ? 'Recupera tu contraseña' : isRegistering ? 'Crea una cuenta inicial' : 'Inicia sesión para continuar'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 w-full rounded-xl border border-slate-300 py-3 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          {!isResetting && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 w-full rounded-xl border border-slate-300 py-3 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          )}

          {!isResetting && !isRegistering && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsResetting(true);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isResetting ? 'Restablecer contraseña' : isRegistering ? 'Crear Cuenta' : 'Ingresar'}
          </button>
        </form>
        
        <p className="mt-8 text-sm text-slate-400">
          Usa tu cuenta corporativa para acceder al sistema.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {isResetting ? (
            <button 
              onClick={() => {
                setIsResetting(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Volver al inicio de sesión
            </button>
          ) : (
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
