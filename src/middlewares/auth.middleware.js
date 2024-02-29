import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken)
      throw new ApiError({
        statusCode: 401,
        errorMessage: "User is not authorized",
      });

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );

    if (!user)
      throw new ApiError({
        statusCode: 400,
        errorMessage: "Invalid access token",
      });

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError({
      statusCode: 401,
      errorMessage: "Bad Auth",
    });
  }
});
