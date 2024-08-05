import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { Subscription } from "../models/subscription.model.js"


const toggleSubscription = asyncHandler (async (req, res) => {
    const {channelId} = req.params
    
    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId))
        throw new apiError(400, "channel Id invalid")

    const isSubscribed = await Subscription.findOne({channel: channelId, subscriber: req.user._id})

    if(isSubscribed) {
        await Subscription.deleteOne({_id: isSubscribed._id})
        return res.status(200).json(
            new apiResponse(200, { message: "channel subscription  removed" }, "Successfully updated subscription status")
        );
    }
    else {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        return res.status(200).json(
            new apiResponse(200, { message: "channel subscribed" }, "Successfully updated subscription status")
        );
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // const {channelId} = req.params
    const channelId  = req.user._id

    // console.log(req.user._id)

    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId))
        throw new apiError(400, "channel Id invalid")   
    
    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: "subscribers"
            }
        },
        {
            $unwind: "$subscribers" // To deconstruct the array and get individual subscriber objects
        },
        {
            $project: {
                _id: 1,
                channel: 1,
                "subscribers._id": 1,
                "subscribers.userName": 1,
                "subscribers.fullName": 1,
                "subscribers.avatar": 1
            }
        }
    ])

    if(!subscriberList)
        throw new apiError(400, "no subscribers yet")

    // console.log("subscriberList : ", subscriberList)

    return res.status(200).json(
        new apiResponse(
            200,
            {subscribers :subscriberList },
            "subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id

    if(!subscriberId || !mongoose.Types.ObjectId.isValid(subscriberId))
        throw new apiError(400, "subscriber Id invalid")   

    const subscribedChannelsList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: '_id',
                localField: 'channel',
                as: "subscribedChannels"
            }
        },
        {
            $unwind: "$subscribedChannels"
        },
        {
            $project: {
                _id: 1,
                subscriber: 1,
                "subscribedChannels._id": 1,
                "subscribedChannels.userName": 1,
                "subscribedChannels.fullName": 1,
                "subscribedChannels.avatar": 1
            }
        }
    ])

    if(!subscribedChannelsList)
        throw new apiError(400, "not subscribed any channels yet")

    // console.log("subscribed channels list : ", subscribedChannelsList)

    return res.status(200).json(
        new apiResponse(
            200,
            {subscribedChannelsList},
            "subscribed channels fetched successfully"
        )
    )
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}