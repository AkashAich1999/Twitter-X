import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({ error: "Unauthorized: No Token Provided" });  // user need to login first
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // if some decoded returns some unexpected value or it expires
        if(!decoded){
            return res.status(401).json({ error: "Unauthorize: Invalid Token" });
        }

        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(404).json({ error: "User Not Found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute Middleware", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}