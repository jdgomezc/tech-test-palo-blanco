import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { CompanyTitle } from "../components/CompanyTitle";
import { useFetch, useFetchMutation } from "../hooks/useFetch";
import { LoadingSpinner, LoadingDots } from "../components/LoadingSpinner";

interface Investor {
  id: number;
  name: string;
  surname: string;
  investment: number;
  registeredBy: { id: number; username: string } | null;
}

const DEFAULT_GREATER_AMOUNT = 15000;

export default function Dashboard() {
  const { logout, username } = useAuth();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [investment, setInvestment] = useState("");
  const [error, setError] = useState("");
  const [minAmount, setMinAmount] = useState(DEFAULT_GREATER_AMOUNT);
  const [stateSearchId, setStateSearchId] = useState("");
  const [stateSearchedId, setStateSearchedId] = useState<number | null>(null);

  const { data: investors = [], isLoading } = useFetch<Investor[]>(
    ["investors"],
    "/investors",
  );

  const { data: greaterInvestors = [], isLoading: isLoadingGreater } = useFetch<
    Investor[]
  >(
    ["investors", "greater", minAmount],
    `/investors/greater?amount=${minAmount}`,
  );

  const {
    data: investorState,
    isLoading: isLoadingState,
    isError: isErrorState,
    error: errorState,
  } = useFetch<{ state: string }>(
    ["investor", "state", stateSearchedId ?? ""],
    stateSearchedId != null ? `/investors/${stateSearchedId}/state` : "",
    { enabled: stateSearchedId != null && Number.isInteger(stateSearchedId) },
  );

  const createMutation = useFetchMutation<
    Investor,
    { name: string; surname: string; investment: number }
  >("/investors", "POST", {
    invalidateKeys: [["investors"]],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const num = Number(investment);
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!surname.trim()) {
      setError("El apellido es obligatorio.");
      return;
    }
    if (!Number.isFinite(num) || num < 0) {
      setError("La inversión debe ser un número mayor o igual a 0.");
      return;
    }
    createMutation.mutate(
      { name: name.trim(), surname: surname.trim(), investment: num },
      {
        onSuccess: () => {
          setName("");
          setSurname("");
          setInvestment("");
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const isPending = createMutation.isPending;

  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm shadow-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            {username && (
              <span className="text-sm text-stone-600 shrink-0">
                Bienvenido,{" "}
                <span className="font-medium text-stone-800">{username}</span>
              </span>
            )}
          </div>
          <div className="flex-1 flex justify-center">
            <CompanyTitle tagline="" asLink size="compact" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition shrink-0"
            >
              Inicio
            </Link>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition shrink-0"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Card: Registrar inversor */}
        <section className="rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50 overflow-hidden">
          <div className="border-b border-stone-100 bg-stone-50/80 px-6 py-4">
            <h2 className="text-lg font-semibold text-stone-800">
              Registrar inversor
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Alta de un nuevo inversor en el sistema
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div
                className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="inv-name"
                  className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5"
                >
                  Nombre
                </label>
                <input
                  id="inv-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/80 px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-60"
                  placeholder="Ej. María"
                />
              </div>
              <div>
                <label
                  htmlFor="inv-surname"
                  className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5"
                >
                  Apellido
                </label>
                <input
                  id="inv-surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/80 px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-60"
                  placeholder="Ej. García"
                />
              </div>
              <div>
                <label
                  htmlFor="inv-investment"
                  className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5"
                >
                  Inversión
                </label>
                <input
                  id="inv-investment"
                  type="number"
                  min={0}
                  step={0.01}
                  value={investment}
                  onChange={(e) => setInvestment(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/80 px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-60"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-emerald-900/20"
              >
                {isPending ? (
                  <>
                    <LoadingSpinner className="size-4 border-stone-900 text-white" />
                    <span>Guardando…</span>
                  </>
                ) : (
                  "Registrar inversor"
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Card: Listado de inversores */}
        <section className="rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50 overflow-hidden flex flex-col min-h-0">
          <div className="border-b border-stone-100 bg-stone-50/80 px-6 py-4 shrink-0">
            <h2 className="text-lg font-semibold text-stone-800">
              Listado de inversores
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {isLoading
                ? "Cargando…"
                : `${investors.length} inversor${investors.length !== 1 ? "es" : ""}`}
            </p>
          </div>
          <div className="flex-1 min-h-0 flex flex-col p-4">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3 text-stone-500">
                  <LoadingDots className="text-emerald-600 text-2xl" />
                  <span className="text-sm">Cargando listado…</span>
                </div>
              </div>
            ) : investors.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12 text-stone-500 text-sm">
                No hay inversores registrados. Registra el primero arriba.
              </div>
            ) : (
              <ul className="overflow-y-auto space-y-2 pr-1 max-h-[420px]">
                {investors.map((inv) => (
                  <li
                    key={inv.id}
                    className="rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-stone-800">
                          {inv.name} {inv.surname}
                        </span>
                        <span className="rounded-md bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-stone-500">
                          {inv.id}
                        </span>
                      </span>
                      <span className="text-lg font-medium text-stone-500/85">
                        Q {inv.investment.toLocaleString("en-US")}
                      </span>
                    </div>
                    {inv.registeredBy && (
                      <span className="text-xs text-stone-500">
                        Por {inv.registeredBy.username}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Card: Inversores con inversión mínima (greater) */}
        <section className="rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50 overflow-hidden flex flex-col min-h-0">
          <div className="border-b border-stone-100 bg-stone-50/80 px-6 py-4 shrink-0">
            <h2 className="text-lg font-semibold text-stone-800">
              Inversores con inversión mínima
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Listado con inversión mayor o igual al monto indicado (por defecto
              15.000)
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor="min-amount" className="text-sm text-stone-600">
                Monto mínimo:
              </label>
              <input
                id="min-amount"
                type="number"
                min={0}
                step={1000}
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
                className="w-32 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col p-4">
            {isLoadingGreater ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3 text-stone-500">
                  <LoadingDots className="text-emerald-600 text-2xl" />
                  <span className="text-sm">Cargando…</span>
                </div>
              </div>
            ) : greaterInvestors.length === 0 ? (
              <p className="py-8 text-center text-stone-500 text-sm">
                No hay inversores con inversión ≥{" "}
                {minAmount.toLocaleString("es")}.
              </p>
            ) : (
              <ul className="overflow-y-auto space-y-2 pr-1 max-h-[280px]">
                {greaterInvestors.map((inv) => (
                  <li
                    key={inv.id}
                    className="rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-stone-800">
                          {inv.name} {inv.surname}
                        </span>
                        <span className="rounded-md bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-stone-500">
                          {inv.id}
                        </span>
                      </span>
                      <span className="text-lg font-medium text-stone-400">
                        {inv.investment.toLocaleString("es")}
                      </span>
                    </div>
                    {inv.registeredBy && (
                      <span className="text-xs text-stone-400">
                        Por {inv.registeredBy.username}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Card: Estado de un inversor */}
        <section className="rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50 overflow-hidden">
          <div className="border-b border-stone-100 bg-stone-50/80 px-6 py-4">
            <h2 className="text-lg font-semibold text-stone-800">
              Estado de un inversor
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Busca por ID para ver si está activo o inactivo
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="state-id" className="text-sm text-stone-600">
                ID del inversor:
              </label>
              <input
                id="state-id"
                type="number"
                min={1}
                value={stateSearchId}
                onChange={(e) => setStateSearchId(e.target.value)}
                placeholder="Ej. 1"
                className="w-28 rounded-lg border border-stone-300 bg-stone-50/80 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => {
                  const id = Number(stateSearchId);
                  if (Number.isInteger(id) && id >= 1) setStateSearchedId(id);
                  else setStateSearchedId(null);
                }}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 text-sm transition"
              >
                Buscar estado
              </button>
            </div>
            {stateSearchedId != null && (
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                {isLoadingState ? (
                  <div className="flex items-center gap-2 text-stone-500">
                    <LoadingDots className="text-emerald-600" />
                    <span className="text-sm">Buscando…</span>
                  </div>
                ) : isErrorState ? (
                  <p className="text-sm text-red-600">
                    {errorState?.message ?? "Error al obtener el estado."}
                  </p>
                ) : investorState ? (
                  (() => {
                    const found = investors.find(
                      (i) => i.id === stateSearchedId,
                    );
                    return (
                      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-stone-800">
                              {found
                                ? `${found.name} ${found.surname}`
                                : `Inversor #${stateSearchedId}`}
                            </span>
                            <span className="rounded-md bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-stone-500">
                              #{stateSearchedId}
                            </span>
                          </span>
                          {found && (
                            <span className="text-lg font-medium text-stone-400">
                              {found.investment.toLocaleString("es")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* {found?.registeredBy && (
                            <span className="text-xs text-stone-500">
                              Por {found.registeredBy.username}
                            </span>
                          )} */}
                          <span
                            className={
                              investorState.state === "active"
                                ? "rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                                : "rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                            }
                          >
                            {investorState.state === "active"
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : null}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
