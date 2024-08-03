import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import mongoose from "mongoose";
import { apiResponse } from "../utils/apiResponse.js";


const getVideoComments = asyncHandler ( async (req, res) => {
    // get video id from user
    // check for valid
    // use id and check whether video exists
    // from comment model go to all docs where video is id and display comment
    // check if there are comments
    // return res
    
    const id = req.params.videoId;

    // console.log("id : ",id)

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "video id not valid")

    const video = await Video.findById(id)

    if(!video)
        throw new apiError(400, "video doesn't exist")

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $project: {
                content: 1,
                _id: 0
            }
        }
    ])

    if(!comments)
        throw new apiError(400, "there are no comments for this video")

    const commentsArray = comments.map(comment => comment.content);

    // console.log("comments : ", comments);

    return res.status(200).json(
        new apiResponse(
            200, 
            {comments: commentsArray},
            "all comments displayed successfully"
        )
    )

} )

const addComment = asyncHandler ( async (req, res) => {
    // get video id from user
    // check for valid id
    // use id and check whether video exists
    // take content from user
    // check for empty
    // find user id from req.user
    // make comment object with content, owner, videoid
    // check comment object
    // return res

    const id = req.params.videoId;

    // console.log("id : ",id)

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "video id not valid")

    const video = await Video.findById(id)

    // console.log("video : ",video)

    if(!video)
        throw new apiError(400, "video doesn't exist")

    // console.log(req.body)
    const { content } = req.body

    // console.log("comment : ", comment)

    if(!content || content.trim().length === 0)
        throw new apiError(400, "enter a valid comment")

    const comment = await Comment.create(
        {
            content,
            owner: req.user._id,
            video: id
        }
    )

    if(!comment)
        throw new apiError(400, "error while saving to databse")


    return res.status(200).json(
        new apiResponse( 
            200,
            { comment },
            "comment added successfully"
        )
    )
} )

const updateComment = asyncHandler ( async (req, res) => {
    // get the id
    // check for valid id
    // get the comment
    // check whether it exists
    // get the new comment
    // check for valid
    // update comment
    // return res

    const id = req.params.commentId;

    console.log("id : ",id)

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "comment id not valid")

    const comment = await Comment.findById(id);

    if(!comment)
        throw new apiError(400, "comment doesn't exist")

    const { content } = req.body
    // console.log("content : ", content)
    
    if(content.length === 0)
        throw new apiError(400, "enter a valid comment")

    // console.log("comment before updation : ", comment)
    comment.content = content
    comment.save()

    // console.log("comment after updation : ", comment)

    // console.log("new comment : ",comment.content)

    return res.status(200).json(
        new apiResponse(
            200,
            {comment},
            "comment updated successfully"
        )
    )
} )

const deleteComment = asyncHandler ( async (req, res) => {
    // get the id
    // check for valid id
    // check for existence of comment
    // findbyIdAndDelete
    // return res

    const id = req.params.commentId;

    console.log("id : ",id)

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        throw new apiError(400, "comment id not valid")

    const comment = await Comment.findById(id);

    if(!comment)
        throw new apiError(400, "comment doesn't exist")    

    await Comment.findByIdAndDelete(id)

    // const commentnew = await Comment.findById(id)
    // console.log("comment new : ", commentnew)

    return res.status(200).json(
        new apiResponse(
            200, "comment deleted successfully"
        )
    )
} )


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}