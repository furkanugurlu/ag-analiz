import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import graphRoutes from "./routes/graphRoutes";
import algorithmRoutes from "./routes/algorithmRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/graph", graphRoutes);
app.use("/algorithm", algorithmRoutes);

// Base Route
app.get("/", (req, res) => {
    const fileID = "2526G";
    console.log(`Log: processing ${fileID}`);
    res.json({ message: "API Running", file: fileID });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
