import "dotenv/config";
import express from "express";
import { prisma } from "./lib/db.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import * as authRoutes from "./routes/auth.js";
import * as investorRoutes from "./routes/investors.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.post("/auth/register", authRoutes.register);
app.post("/auth/login", authRoutes.login);

app.post("/investors", authMiddleware, investorRoutes.createInvestor);
app.get("/investors", authMiddleware, investorRoutes.listInvestors);
app.get(
  "/investors/greater",
  authMiddleware,
  investorRoutes.listInvestorsMayor,
);
app.get(
  "/investors/:id/state",
  authMiddleware,
  investorRoutes.getInvestorEstado,
);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
