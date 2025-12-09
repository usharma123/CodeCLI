import express, { type Request, type Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "nextjs-chatbot-api" });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Hello from nextjs-chatbot-api",
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
