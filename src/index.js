import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

// Configure env variables
dotenv.config({
  _path: "./.env",
});

// Listen server after connecting to DB
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`ERR: ${error}`);
      process.exit(1);
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `Server is running on PORT: http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.log("MONGODB CONNECTION FAILED: ", error);
    process.exit(1);
  });
