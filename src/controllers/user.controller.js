import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res, next) => {
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

  console.log(existingUser, "------------ Existing user");

  if (existingUser) {
    throw new ApiError({
      statusCode: 409,
      errorMessage: "User with email or username already exists",
    });
  }

  const avatarFilePath = req.files?.avatar[0]?.path;
  const coverImageFilePath = req.files?.coverImage[0].path;

  // console.log(avatarFile, "------------ Avatar File")
  // console.log(coverImageFile, "------------ Cover Image File")

  if (!avatarFilePath) {
    throw new ApiError({ statusCode: 400, errorMessage: "Avatar is required" });
  }

  const avatarResponse = await uploadToCloudinary(avatarFilePath);
  const coverImageResponse = await uploadToCloudinary(coverImageFilePath);

  // console.log(avatarResponse,"------------ Avatar response)
  // console.log(coverImageResponse, ""------------ Cover Image response")

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

  // console.log(user, "------------ User)

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // console.log(createdUser, ""------------ Created User");

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
