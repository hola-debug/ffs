import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Beams from '../components/Beams';
import logo from '../assets/logo.svg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Revisá tu email para confirmar la cuenta');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 relative">
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <Beams
          beamWidth={2}
          beamHeight={69}
          beamNumber={20}
          lightColor="#f2f2f2"
          speed={8}
          noiseIntensity={1.69}
          scale={0.2}
          rotation={69}
        />
      </div>
      <div className="w-full max-w-md px-6 py-10 relative z-10">
        <div className="flex flex-col items-center mb-12">
          <img src={logo} alt="ffs.finance" className="h-12 mb-4" />
       
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl backdrop-blur-xl bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full px-5 py-4 rounded-2xl backdrop-blur-2xl bg-white/10 border-0 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-2xl backdrop-blur-2xl bg-white/10 border-0 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-8 rounded-2xl backdrop-blur-2xl bg-white/20 hover:bg-white/30 text-white font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg"
          >
            {loading ? 'Procesando...' : isSignup ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full mt-6 text-sm text-white/50 hover:text-white/80 transition-colors duration-200"
        >
          {isSignup ? '¿Ya tenés cuenta? Ingresá' : '¿No tenés cuenta? Registrate'}
        </button>
      </div>
    </div>
  );
}
