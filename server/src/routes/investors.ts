import type { Request, Response } from "express";
import { prisma } from "../lib/db.js";
import { callSpInversionistasMayor } from "../lib/procedure.js";
import type { RequestWithAuth } from "../middleware/auth.middleware.js";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function createInvestor(
  req: Request,
  res: Response,
): Promise<void> {
  const r = req as RequestWithAuth;
  try {
    const { name, surname, investment } = r.body as {
      name?: string;
      surname?: string;
      investment?: unknown;
    };

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "name is required" });
      return;
    }
    if (!surname || typeof surname !== "string" || surname.trim() === "") {
      res.status(400).json({ error: "surname is required" });
      return;
    }
    if (!isFiniteNumber(investment) || investment < 0) {
      res
        .status(400)
        .json({ error: "investment must be a non-negative number" });
      return;
    }

    const userId = r.auth?.sub;
    if (userId == null) {
      res.status(403).json({ error: "unauthorized" });
      return;
    }

    const investor = await prisma.investor.create({
      data: {
        name: name.trim(),
        surname: surname.trim(),
        investment,
        registeredById: userId,
      },
    });

    res.status(201).json(investor);
  } catch (err) {
    console.error("createInvestor error", err);
    res.status(500).json({ error: "failed to create investor" });
  }
}

export async function listInvestors(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const investors = await prisma.investor.findMany({
      orderBy: { id: "asc" },
      include: {
        registeredBy: { select: { id: true, username: true } },
      },
    });
    const formatted = investors.map((inv) => ({
      id: inv.id,
      name: inv.name,
      surname: inv.surname,
      investment: inv.investment,
      registeredBy: inv.registeredBy
        ? { id: inv.registeredBy.id, username: inv.registeredBy.username }
        : null,
    }));
    res.json(formatted);
  } catch (err) {
    console.error("listInvestors error", err);
    res.status(500).json({ error: "failed to list investors" });
  }
}

/** Calls stored procedure sp_inversionistas_mayor(amount). Default threshold 15000. */
export async function listInvestorsMayor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const amount = req.query.amount;
    const threshold =
      amount !== undefined && amount !== "" ? Number(amount) : 15000;
    if (!Number.isFinite(threshold) || threshold < 0) {
      res.status(400).json({ error: "amount must be a non-negative number" });
      return;
    }
    const investors = await callSpInversionistasMayor(threshold);
    const userIds = [...new Set(investors.map((i) => i.registeredById))];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true },
          })
        : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const formatted = investors.map((inv) => {
      const user = userMap[inv.registeredById];
      return {
        id: inv.id,
        name: inv.name,
        surname: inv.surname,
        investment: inv.investment,
        registeredBy: user ? { id: user.id, username: user.username } : null,
      };
    });
    res.json(formatted);
  } catch (err) {
    console.error("listInvestorsMayor error", err);
    res.status(500).json({ error: "failed to list investors by threshold" });
  }
}

/** Calls stored function fn_estado_inversionista(id). Returns { estado: "active"|"inactive" }. */
export async function getInvestorEstado(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid investor id" });
      return;
    }

    // verify the id exists in the database
    const investor = await prisma.investor.findUnique({
      where: { id },
    });
    if (!investor) {
      res.status(404).json({ error: "Investor not found" });
      return;
    }

    const result = await prisma.$queryRawUnsafe<[{ estado: string }]>(
      "SELECT fn_estado_inversionista(?) AS estado",
      id,
    );
    const estado = result?.[0]?.estado ?? null;
    if (estado === null) {
      res
        .status(404)
        .json({ error: "Investor not found or function returned no value" });
      return;
    }
    res.json({ state: estado });
  } catch (err) {
    console.error("getInvestorEstado error", err);
    res
      .status(500)
      .json({ error: "Failed to get investor estado, try again later" });
  }
}
