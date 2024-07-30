import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Jwt } from "jsonwebtoken"


const registerUser = asyncHandler( async ( req, res ) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, again check for avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response  

    // console.log("request.body : ", req.body);

    const { fullName, email, password, userName } = req.body

    //for validation u can write if cond for every field
    // if(fullName === "")
    //     throw new apiError(400, "fullname is required")

    if( [fullName, email, userName, password].some( (field) => field?.trim() === "" )) 
    {
        throw new apiError(400, "All fields is required")
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if(existedUser)
    {
        throw new apiError(409, "user with this email or username already exists ")
    }

    // console.log(req.files);
    // finding the localpath so that we can upload it on cloudinary 
    const avatarLocalPath = req.files?.avatar[0].path ;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path ;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path ;
    }

    //as avatar is required - validation
    if(!avatarLocalPath)
        throw new apiError(400, " Avatar is required ");

    //upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //again check whether avatar is uploaded properly on cloudinary
    if(!avatar)
        throw new apiError(400, " Avatar is required ");

    //create user object - create entry in db
    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        userName: userName.toLowerCase()
    })

    //check if this user is created or empty if created remove password, refreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
        throw new apiError(500, "something went wrong while registering the user")
    
    //returning response
    return res.status(201).json(
        new apiResponse(200, createdUser, "user registered successfully")
    )
} )

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })

        return { accessToken, refreshToken }
    }
    catch(err) {
        console.log("error while generating tokens")
        throw new apiError(500, "Something went wrong while generating access and refresh token ")
    }
}

const loginUser = asyncHandler( async( req, res ) => {
    // fetch data from req.body
    // username or email based access
    // find the user
    // check password
    // access and refresh token generate
    // send cookies
    // send response

    const { userName, email, password } = req.body

    // console.log(userName);

    if(!userName && !email){
        console.log("username or email not given")
        throw new apiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(!user){
        console.log("User doesn't exist")
        throw new apiError(404, "User doesn't exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        console.log("password invalid")
        throw new apiError(401, "password invalid")
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id)

    //as the user here does not have refresh token bcz it was updated on 
    //generateAccessandRefreshToken method so lets update
    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken");

    // sending cookies 
    const options = { 
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken ", accessToken, options)
    .cookie("refreshToken ", refreshToken, options)
    .json(
        new apiResponse(
            200, 
            {
                user: loggedInUser,
                accessToken, 
                refreshToken
            },
            "user logged in successfully"
        )
    )
} )

const logoutUser = asyncHandler( async ( req, res ) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = { 
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new apiResponse(200, "User logged out")
    )
} )

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
        throw new apiError(401, "Unauthorized request")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
            throw new apiError(401, "Invalid refresh token")
    
        if(incomingRefreshToken !== user?.refreshToken)
            throw new apiError(401, "refresh token is expired or used");
    
        const {newAccessToken, newRefreshToken } = await generateAccessandRefreshToken(user._id)
    
        const options = { 
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken : ", newAccessToken)
        .cookie("refreshToken : ", newRefreshToken)
        .json(
            new apiResponse(
                200,
                {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                },
                "access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token")
    }
} ) 

export { registerUser, loginUser, logoutUser, refreshAccessToken }