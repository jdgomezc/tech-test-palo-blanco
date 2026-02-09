import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFetchMutation } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { CompanyTitle } from "../components/CompanyTitle";

interface LoginResponse {
  token: string;
  expiresIn: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useFetchMutation<LoginResponse, { username: string; password: string }>(
    "/auth/login",
    "POST"
  );
  const isPending = loginMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (data) => {
          setToken(data.token);
          navigate("/", { replace: true });
        },
        onError: (err) => setError(err.message),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50/80 text-stone-900 px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-10">
          <CompanyTitle />
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-200/50 p-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-6">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 animate-shimmer"
                role="alert"
              >
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2"
              >
                Usuario
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={isPending}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/80 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-60"
                placeholder="Tu usuario"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2"
              >
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isPending}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/80 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 hover:shadow-emerald-800/25"
            >
              {isPending ? (
                <>
                  <LoadingSpinner className="size-5 border-stone-900 text-white" />
                  <span>Entrando…</span>
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-stone-500">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-emerald-600 hover:text-emerald-700 font-medium transition"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
