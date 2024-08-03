import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { apiResponse } from "../utils/apiResponse.js"
import mongoose from "mongoose"


const createTweet = asyncHandler(async (req, res) => {
    // get the content and verify for emptyness
    // make an tweet object with content and owner
    // return res

    const { content } = req.body

    if(content.length === 0)
        throw new apiError(400, "not a valid tweet")

    const tweet = await Tweet.create(
        {
            content,
            owner: req.user._id
        }
    )

    if(!tweet)
        throw new apiError(400, "error while saving tweet to databse")

    return res.status(200).json(
        new apiResponse(
            200, 
            {
                tweet
            },
            "tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler( async (req, res) => {
    // get user id
    // validate id
    // check whether user exist
    // aggregation pipeline - match requested user id and tweet owner
    // check if exist 
    // return response

    const requestedUserId = req.user._id

    if(!requestedUserId || !mongoose.Types.ObjectId.isValid(requestedUserId))
        throw new apiError(400, "user ID not valid")

    const user = await User.findById(requestedUserId)

    if(!user)
        throw new apiError(400, "user doesn't exist")

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(requestedUserId)
            }
        },
        {
            $project: {
                content: 1,
                _id: 0
            }
        }
    ])

    // console.log("tweets : ", tweets)

    const tweetsArray = tweets.map(tweet => tweet.content);

    if(!tweets)
        throw new apiError(400, "there are no tweets from this user")

    return res.status(200).json(
        new apiResponse(
            200,
            {tweets: tweetsArray},
            "tweets fetched successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    // get the tweet id and check for valid
    // get the tweet and check whether exist or not
    // get the requesting user
    // check if he is the owner of that tweet
    // get the new tweet from user
    // check for valid
    // update the tweet
    // return res



    const id = req.params.tweetId

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "tweet ID not valid")

    const tweet = await Tweet.findById(id)

    if(!tweet)
        throw new apiError(400, "tweet doesn't exists")

    // console.log("tweet owner : ", tweet.owner);
    // console.log("tweet owner type: ", typeof tweet.owner);
    // console.log("requesting user : ", req.user._id);
    // console.log("requesting user type: ", typeof req.user._id);

    const tweetOwnerId = tweet.owner.toString();
    const requestingUserId = req.user._id.toString();   

    if (tweetOwnerId !== requestingUserId) {
        throw new apiError(400, "you do not have permission to update this tweet");
    }

    // if(!tweet.owner.equals(req.user_id))
    //     throw new apiError(400, "you do not have permission to update this tweet")

    const { content } = req.body

    // console.log("content : ", content)

    if(content.length === 0)
        throw new apiError(400, "not a valid tweet")

    console.log("tweet before updation : ", tweet)

    tweet.content = content
    tweet.save()

    console.log("tweet after updation : ", tweet)

    return res.status(200).json(
        new apiResponse(
            200,
            {tweet},
            "tweet updated successfully"
        )
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    // get the tweet id and check for valid
    // get the tweet and check whether exist or not
    // get the requesting user
    // check if he is the owner of that tweet
    // delete the tweet
    // return res
    
    const id = req.params.tweetId

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "tweet ID not valid")

    const tweet = await Tweet.findById(id)

    if(!tweet)
        throw new apiError(400, "tweet doesn't exists")

    const tweetOwnerId = tweet.owner.toString();
    const requestingUserId = req.user._id.toString();   

    if (tweetOwnerId !== requestingUserId) {
        throw new apiError(400, "you do not have permission to update this tweet");
    }

    await Tweet.findByIdAndDelete(id)

    return res.status(200).json(
        new apiResponse( 200,"tweet deleted successfully" )
    )
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}







