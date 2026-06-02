import cors from "cors";
import express from "express";
import apiRoutes from "./routes/apiRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 3333;

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

app.get("/", (_req, res) => {
  res.json({ name: "ORION Analytics API", status: "online" });
});

app.listen(port, () => {
  console.log(`ORION Analytics API running on http://localhost:${port}`);
});
