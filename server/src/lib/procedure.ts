import mariadb from "mariadb";
import { getMariaDbConfig } from "./db.js";

let pool: mariadb.Pool | null = null;

function getPool(): mariadb.Pool {
  if (!pool) {
    pool = mariadb.createPool(getMariaDbConfig());
  }
  return pool;
}

export interface InvestorRow {
  id: number;
  name: string;
  surname: string;
  investment: number;
  registeredById: number;
}

/**
 * Calls stored procedure sp_inversionistas_mayor(p_amount).
 * Returns investors with investment >= p_amount (procedure uses 15000 when NULL).
 */
export async function callSpInversionistasMayor(
  threshold: number,
): Promise<InvestorRow[]> {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    const result = await conn.query("CALL sp_inversionistas_mayor(?)", [
      threshold,
    ]);
    if (
      Array.isArray(result) &&
      result.length > 0 &&
      Array.isArray(result[0])
    ) {
      return result[0] as InvestorRow[];
    }
    if (
      Array.isArray(result) &&
      result.length > 0 &&
      typeof result[0] === "object" &&
      result[0] !== null &&
      !Array.isArray(result[0])
    ) {
      return result as unknown as InvestorRow[];
    }
    return (result ?? []) as InvestorRow[];
  } finally {
    conn.end().catch(() => {});
  }
}
