import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"



const verifyJWT = asyncHandler( async ( req, _, next ) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if(!token)
            throw new apiError(401, "Unauthorized request")

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        // console.log("jwt user : ", user)

        if(!user)
            throw new apiError(401, " Invalid access token ")

        req.user = user
        next()
    }
    catch (err) {
        throw new apiError(401, err?.message || " Invalid access token ")
    }
} )

export { verifyJWT }