import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler  } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { Subscription } from "../models/subscription.model.js"




const getChannelStats = asyncHandler ( async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelId = req.user._id

    let totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    if(!totalSubscribers)
        totalSubscribers = 0;

    let totalVideos = await Video.countDocuments({ owner: channelId });

    if(!totalVideos)
        totalVideos = 0;

    let totalLikes = await Like.countDocuments({video: channelId})

    if(!totalLikes)
        totalLikes = 0

    


    return res.status(200).json(
        new apiResponse(
            200,
            {
                totalLikes,
                totalSubscribers,
                totalVideos
            },
            "all stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler ( async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const channelId = req.user._id
    const allVideos = await Video.find({owner: channelId})

    if(!allVideos)
        throw new apiError("No videos posted")

    console.log("all videos : ", allVideos)

    return res.status(200).json(
        new apiResponse(
            200,
            {videos: allVideos},
            "all videos posted by channel are fetched successfully"
        )
    )
})



export {
    getChannelStats,
    getChannelVideos
}