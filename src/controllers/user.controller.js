import {asyncHandler} from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

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

    const existedUser = User.findOne({
        $or: [{ userName }, { email }]
    })

    if(existedUser)
    {
        throw new apiError(409, "user with this email or username already exists ")
    }

    // console.log(req.files);
    // finding the localpath so that we can upload it on cloudinary 
    const avatarLocalPath = req.files?.avatar[0].path ;
    const coverImageLocalPath = req.files?.coverImage[0]?.path ;

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

export { registerUser }