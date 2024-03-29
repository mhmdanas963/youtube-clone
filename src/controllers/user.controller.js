import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Cookie options
const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError({
      statusCode: 500,
      errorMessage:
        "Something went wrong while generating access token and refresh token",
    });
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  // console.log(req.body);

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError({
      statusCode: 400,
      errorMessage: "All fields are required",
    });
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError({
      statusCode: 409,
      errorMessage: "User with email or username already exists",
    });
  }

  // console.log(req.files);

  let avatarFilePath;
  let coverImageFilePath;

  if (
    req.files &&
    Array.isArray(req.files?.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarFilePath = req.files.avatar[0]?.path;
  } else {
    throw new ApiError({ statusCode: 400, errorMessage: "Avatar is required" });
  }

  if (Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageFilePath = req.files?.coverImage[0].path;
  }

  const avatarResponse = await uploadToCloudinary(avatarFilePath);
  let coverImageResponse;

  // console.log(avatarResponse);

  if (coverImageFilePath) {
    coverImageResponse = await uploadToCloudinary(coverImageFilePath);
  }

  if (!avatarResponse) {
    throw new ApiError({
      statusCode: 509,
      errorMessage: "Error while uploading avatar to cloudinary",
    });
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatarResponse.url,
    coverImage: coverImageResponse?.url || "",
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError({
      statusCode: 500,
      errorMessage: "Something went wrong while creating user",
    });
  }

  return res.status(201).json(
    new ApiResponse({
      statusCode: 200,
      data: createdUser,
      message: "Successfully registered the user",
    })
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Checks is user is already logged in
  if (req.cookies?.refreshToken)
    throw new ApiError({
      statusCode: 401,
      errorMessage: "User is already logged in",
    });

  // Checks if username or email is received from client
  if (!(username || email))
    throw new ApiError({
      statusCode: 401,
      errorMessage: "Username or email is required",
    });

  // Checks if password is received from client
  if (!password)
    throw new ApiError({
      statusCode: 401,
      errorMessage: "Password is required",
    });

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user)
    throw new ApiError({
      statusCode: 404,
      errorMessage: "User does not exist",
    });

  const isPasswordValid = await user.checkPassword(password);

  if (!isPasswordValid)
    throw new ApiError({
      statusCode: 401,
      errorMessage: "Invalid user credentials",
    });

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user);

  // Remove password and refresh token from user
  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse({
        statusCode: 200,
        data: {
          loggedInUser,
          accessToken,
          refreshToken,
        },
        message: "User logged in successfully",
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse({
        statusCode: 200,
        data: {},
        message: "User logged out successfully",
      })
    );
});

const refreshAccessToken = async(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken)
    throw new ApiError({
      statusCode: 401,
      errorMessage: "Unauthorized request",
    });

  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedRefreshToken?._id);

  if (!user)
    throw new ApiError({
      statusCode: 401,
      errorMessage: "Invalid refresh token",
    });

  if (decodedRefreshToken !== user?.refreshToken)
    throw new ApiError({
      statusCode: 401,
      errorMessage: "Invalid refresh token",
    });

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse({
        statusCode: 200,
        data: {
          accessToken,
          refreshToken,
        },
        message: "Renewed access token successfully",
      })
    );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
