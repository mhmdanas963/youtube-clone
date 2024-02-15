import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Connect to DB
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      "SUCCESSFULLY CONNECTED TO MONGODB ATLAS!",
      connectionInstance.connection.host
    );
  } catch (error) {
    // Reject promise if db connection failed
    return Promise.reject(error);
  }
};

export default connectDB;
