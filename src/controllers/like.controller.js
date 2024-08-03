import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose"





const toggleVideoLike = asyncHandler ( async (req, res) => {
    // get the videoid check for valid
    // check if video exists with this id
    // get the user
    // find the docs with video = user._id
    // if found then set video = null
    // else set video = user._id


    const videoId = req.params.videoId

    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId))
        throw new apiError(400, "videoId not valid")


    const video = await Video.findById(videoId)

    if(!video)
        throw new apiError(400, "video doesn't exist")

    const userId = req.user._id

    const existingLike = await Like.findOne({ likedBy: userId, video: videoId });

    if (existingLike) {
        // If the user has liked the video, remove the like
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(
            new apiResponse(200, { message: "Video like removed" }, "Successfully updated like status")
        );
    } else {
        // If the user has not liked the video, create a new like entry
        await Like.create({
            video: videoId,
            likedBy: userId
        });
        return res.status(200).json(
            new apiResponse(200, { message: "Video liked" }, "Successfully updated like status")
        );
    }

} )

const toggleCommentLike = asyncHandler ( async (req, res) => {
    const commentId = req.params.commentId

    if(!commentId || !mongoose.Types.ObjectId.isValid(commentId))
        throw new apiError(400, "commentId not valid")


    const comment = await Comment.findById(commentId)

    console.log("comment : ", comment)

    if(!comment)
        throw new apiError(400, "comment doesn't exist")

    const userId = req.user._id

    const existingLike = await Like.findOne({ likedBy: userId, comment: commentId });

    if (existingLike) {
        // If the user has liked the comment, remove the like
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(
            new apiResponse(200, { message: "comment like removed" }, "Successfully updated like status")
        );
    } else {
        // If the user has not liked the comment, create a new like entry
        await Like.create({
            comment: commentId,
            likedBy: userId
        });
        return res.status(200).json(
            new apiResponse(200, { message: "comment liked" }, "Successfully updated like status")
        );
    }
} )

const toggleTweetLike = asyncHandler ( async (req, res) => {
    const tweetId = req.params.tweetId

    if(!tweetId || !mongoose.Types.ObjectId.isValid(tweetId))
        throw new apiError(400, "tweetId not valid")


    const tweet = await Tweet.findById(tweetId)


    if(!tweet)
        throw new apiError(400, "tweet doesn't exist")

    const userId = req.user._id

    const existingLike = await Like.findOne({ likedBy: userId, tweet: tweetId });

    if (existingLike) {
        // If the user has liked the comment, remove the like
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(
            new apiResponse(200, { message: "tweet like removed" }, "Successfully updated like status")
        );
    } else {
        // If the user has not liked the comment, create a new like entry
        await Like.create({
            tweet: tweetId,
            likedBy: userId
        });
        return res.status(200).json(
            new apiResponse(200, { message: "tweet liked" }, "Successfully updated like status")
        );
    }
} )

const getLikedVideos = asyncHandler ( async (req, res) => {
    const userId = req.user._id

    // console.log(userId)

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    console.log("all likes : ", likedVideos)

    return res.status(200).json(
        new apiResponse(200, "checking")
    )
} )

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}