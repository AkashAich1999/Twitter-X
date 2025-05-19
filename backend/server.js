import express from "express";
import authRoutes from "./routes/auth.routes.js"
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();

// console.log(process.env.MONGO_URI);
connectMongoDB();

// middleware
app.use(express.json());    // to parse req.body
app.use(express.urlencoded({ extended:true }));     // to parse form data (urlencoded)
app.use(cookieParser());
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log("Server is Running on PORT: ", PORT);
});