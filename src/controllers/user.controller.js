import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res, next) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images: check for avatar
  // upload them to cloudinary, avatar
  // check for response from cloudinary
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

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

  const existingUser = User.findOne({
    $or: [{ username }, { email }],
  });

  // console.log(existingUser)

  if (existingUser) {
    throw new ApiError({
      statusCode: 409,
      errorMessage: "User with email or username already exists",
    });
  }

  const avatarFilePath = req.files?.avatar[0]?.path;
  const coverImageFilePath = req.files?.coverImage[0].path;

  // console.log(avatarFile)
  // console.log(coverImageFile)

  if (!avatarFilePath) {
    throw new ApiError({ statusCode: 400, errorMessage: "Avatar is required" });
  }

  const avatarResponse = await uploadToCloudinary(avatarFilePath);
  const coverImageResponse = await uploadToCloudinary(coverImageFilePath);

  // console.log(avatarResponse)
  // console.log(coverImageResponse)

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
    coverImage: coverImageResponse.url,
    password,
  });

  // console.log(user)

  const createdUser = User.findById(user._id).select("-password -refreshToken");

  // console.log(createdUser);

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

export { registerUser };
