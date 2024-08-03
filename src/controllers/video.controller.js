import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js"
import mongoose from "mongoose"


const getAllVideos = asyncHandler ( async (req, res) => {
} )

const publishVideo = asyncHandler ( async (req, res) => {
    // get vdo and thumbnail from frontend
    // check - not empty
    // check if its uploaded to local server
    // check whether both vdo and thumbnail path exists
    // upload on cloudinary
    // again check whether uploaded successfully or not
    // create a video object
    // create entry in database
    // check for video creation
    // return res

    const { description, title } = req.body

    if(!description || !title)
        throw new apiError(400, "title and description is required")


    let videoLocalPath, thumbnailLocalPath
    if(req.files.videoFile)
        videoLocalPath = req.files.videoFile[0].path
    if(req.files.thumbNail)
        thumbnailLocalPath = req.files.thumbNail[0].path


    if(!videoLocalPath || !thumbnailLocalPath)
        throw new apiError(400, "video and thumbnail are required")

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbNail = await uploadOnCloudinary(thumbnailLocalPath)

    console.log("thumbNail : ", thumbNail)
    console.log("videoFile : ", videoFile)

    if(!videoFile || !thumbNail)
        throw new apiError(400, "error while uploading it to cloudinary")

    // console.log("videoFile : ", videoFile)
    // console.log("thumbNail : ", thumbNail)
    // console.log("user : ",req.user)

    const video = await Video.create(
        {
            title,
            description,
            thumbNail: thumbNail.url,
            videoFile: videoFile.url,
            duration: videoFile.duration,
            owner: req.user._id
        }
    )

    // console.log("owner", req.user._id);

    if(!video)
        throw new apiError(500, "something went wrong while uploading to database")

    return res.status(200).json(
        new apiResponse(
            200,
            {
                video
            },
            "video uploaded successfully"
        )
    )

} )

const getVideoById = asyncHandler ( async (req, res) => {
    console.log("req.params : ",req.params)
    const id = req.params.videoId
    console.log("id : ",id)

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "video ID not valid")

    const video = await Video.findById(id)

    if(!video)
        throw new apiError(400, "video doesn't exist")

    return res.status(200).json(
        new apiResponse(
            200,
            {
                video
            },
            "video fetched successfully"
        )
    )
} )

const updateThumbNail = asyncHandler ( async (req, res) => {
    // get the id of the thumbnail 
    // check if id is valid
    // find the thumbnail
    // check if thumbnail exists
    // find the user
    // check whether user and owner are same
    // take the thumbnail on local server
    // check if uploaded correctly
    // upload on cludinary
    // check if uploaded correctly
    // in video just update the thumbnail url
    // return res


    const id = req.params.videoId

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "video ID not valid")

    const video = await Video.findById(id)

    if(!video)
        throw new apiError(400, "video doesn't exist")

    if (!video.owner.equals(req.user._id)) {
        throw new apiError(403, "You do not have permission to delete this video");
    }

    //  console.log("thumbnail", req.file)
    // const thumbnailLocalPath = req.file?.path

    if(!req.file)
        throw new apiError(400, "thumbNail is empty")

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath)
        throw new apiError(400, "multer error while uploading")

    const newThumbNail = await uploadOnCloudinary(thumbnailLocalPath)

    console.log(newThumbNail)

    if(!newThumbNail)
        throw new apiError(400, "error while uploading on cloudinary")

    video.thumbNail = newThumbNail.url

    video.save()

    return res.status(200).json(
        new apiResponse(200,{video}, "thumbnail updated successfully")
    )
} )

const deleteVideo = asyncHandler ( async (req, res) => {
    // get the id from req params
    // check for empty
    // find the video
    // check if video exists
    // find the user who requested
    // owner and user should be same else error
    // if found then delete from database
    // return response

    const id = req.params.videoId

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "video ID not valid")

    const video = await Video.findById(id)

    if(!video)
        throw new apiError(200, "video doesn't exists")

    // console.log("user requested : ", req.user._id)
    // console.log("owner : ", video.owner)

    // this compares by reference....so its always true
    // if(req.user._id !== video.owner)
    //     throw new apiError(400, "you do not have the permission to delete this video")

    if (!video.owner.equals(req.user._id)) {
        throw new apiError(403, "You do not have permission to delete this video");
    }

    await Video.deleteOne({ _id: id });

    return res.status(200).json(
        new apiResponse(200, "video deleted successfully")
    )

} )

const togglePublishStatus = asyncHandler ( async (req, res) => {
    // get the id of video
    // check for empty
    // check whether video exist
    // get the user
    // check owner == user
    // tottle the ispublish field of video
    // save to database
    // return res

    const id = req.params.videoId

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "video ID not valid")

    const video = await Video.findById(id)

    if(!video)
        throw new apiError(200, "video doesn't exists")

    if (!video.owner.equals(req.user._id)) {
        throw new apiError(403, "You do not have permission to delete this video");
    }

    video.isPublished = !video.isPublished
    video.save()

    return res.status(200)
    .json(
        new apiResponse(
            200,
            {
                video
            },
            "toggled isPublished button successfully"
        )
    )
    
} )


export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateThumbNail,
    deleteVideo,
    togglePublishStatus
}