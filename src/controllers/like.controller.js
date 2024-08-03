import { asyncHandler } from "../utils/asyncHandler.js";





const toggleVideoLike = asyncHandler ( async (req, res) => {
    // get the videoid check for valid
    // check if video exists with this id
    // get the user
    // find the docs with video = user._id
    // if found then set video = null
    // else set video = user._id
} )

const toggleCommentLike = asyncHandler ( async (req, res) => {

} )

const toggleTweetLike = asyncHandler ( async (req, res) => {

} )

const getLikedVideos = asyncHandler ( async (req, res) => {

} )

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}