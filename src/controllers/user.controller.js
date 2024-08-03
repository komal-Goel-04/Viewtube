import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


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
    // console.log(req.body)

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

    // console.log("avatar url : ",avatar)

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

    // console.log(createdUser)

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

        // console.log("access token controller : ", accessToken)

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })

        return { accessToken, refreshToken }
    }
    catch(err) {
        // console.log("error while generating tokens")
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
    // console.log("password fetched from req.body : ",password)

    // console.log(userName);

    if(!userName && !email){
        // console.log("username or email not given")
        throw new apiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(!user){
        // console.log("User doesn't exist")
        throw new apiError(404, "User doesn't exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        // console.log("password invalid")
        throw new apiError(401, "password invalid")
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id)

    //as the user here does not have refresh token bcz it was updated on 
    //generateAccessandRefreshToken method so lets update
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

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
                refreshToken: null //this removes the field from the document
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
    console.log("incoming refresh token : ", incomingRefreshToken)

    if(!incomingRefreshToken)
        throw new apiError(401, "Unauthorized request")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        // console.log("decoded token : ", decodedToken)

        const user = await User.findById(decodedToken?._id)
    
        if(!user)
            throw new apiError(401, "Invalid refresh token")
    
        // console.log("users refresh token : ", user?.refreshToken)
        if(incomingRefreshToken !== user?.refreshToken)
            throw new apiError(401, "refresh token is expired or used");
    
        const {newAccessToken, newRefreshToken } = await generateAccessandRefreshToken(user._id)

        // console.log("new access token : ", newAccessToken)
    
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

const changeUserPassword = asyncHandler ( async (req, res) => {
    const { oldPassword, newPassword } = req.body

    // console.log("oldPassword : ", oldPassword);
    // console.log("newPassword : ", newPassword);

    const user = await User.findById(req.user?._id)
    // console.log("user : ", user);
    const ispasswordcorrect = await user.isPasswordCorrect(oldPassword)

    if(!ispasswordcorrect)
        throw new apiError(400, "Invalid old password")

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new apiResponse(200, "Password changed successfully"))
} )

const getCurrentUser = asyncHandler ( async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    return res
    .status(200)
    .json(new apiResponse(
        200,
        {
            user
        },
        "current user fetched successfully"
    ))
} )

const updateAccountDetails = asyncHandler ( async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName && !email)
        throw new apiError(400, "All field are empty")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        }, 
        {new: true}
    ).select("-passsword -refreshToken")

    return res
    .status(200)
    .json(
        new apiResponse (
            200, 
            {
            user
            },
            "Account details updated successfully"
        )
    )
})

const updateUserAvatar = asyncHandler ( async (req, res) => {
    // console.log("req.file : ", req.file)
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath)
        throw new apiError(400, "Avatar file is missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
        throw new apiError( 400,"Error while uploading on cloudinary")

    const user = await User.findByIdAndUpdate(
        req.body?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("password")

    return res
    .status(200)
    .json( new apiResponse(
        200,
        {
            user
        },
        "avatar updated successfully"
    ))
} )

const updateUserCoverImage = asyncHandler ( async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath)
        throw new apiError(400, "Cover image is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
        throw new apiError( 400,"Error while uploading on cloudinary")

    const user = await User.findByIdAndUpdate(
        req.body?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("password")

    return res
    .status(200)
    .json( new apiResponse(
        200,
        {
            user
        },
        "avatar updated successfully"
    ))
} )

const getUserChannelProfile = asyncHandler ( async (req, res) => {
    const {userName} = req.params
    // console.log(userName)

    if(!userName)
        throw new apiError(400, "Username is missing");

    const channel = await User.aggregate([
        //getting channels document
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        //finding subscribers of your channel
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // finding whom you have subscribed to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        //finding no. of subscribers and total channels you have subscribed
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                //for button subscribe and subscribed
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    console.log("channel : ", channel)

    if(!channel?.length === 0)
        throw new apiError(404, "channel doesn't exists")

    return res
    .status(200)
    .json(
        new apiResponse(200, channel[0], "User channel fetched successfully")
    )
} )

const getWatchHistory = asyncHandler ( async (req, res) => {
    // console.log(req.user._id)
    const user = await User.aggregate([
        {
            //find which users watch history is needed
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
} )


export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeUserPassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}