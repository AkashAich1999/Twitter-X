import mongoose from "mongoose";

const connectMongoDB = async (req, res) => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error Connecting to MongoDB: ${error.message}`);
        process.exit(1); 
    }
}

export default connectMongoDB;