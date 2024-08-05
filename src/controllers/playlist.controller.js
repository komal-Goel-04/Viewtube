import { Playlist } from "../models/playlist.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import mongoose from "mongoose"



const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description || name?.trim().length === 0 || description?.trim().length === 0)
        throw new apiError(400, "name and description needed")

    const playList = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if(!playList)
        throw new apiError(400, "error while creating the playlist")

    return res.status(200).json(
        new apiResponse(
            200,
            {playList},
            "playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
        throw new apiError(400, "valid playListId is needed")

    const createdplaylist = await Playlist.findById({_id: playlistId})

    if(!createdplaylist)
        throw new apiError(400, "playlist doesn't exists")

    return res.status(200).json(
        new apiResponse(
            200,
            {playList: createdplaylist},
            "playlist fetched successfully"
        )
    )
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    //get the playlistId and videoId from user
    //check whether they are valid
    //find the playlist - check whether it exists
    //find the video - check whether it exists
    //check whether user is the owner of that video
    //check whether user is the owner of that playlist
    //check whether the video already exists in the playlist
    //now update the playlist
    //return response


    const {playlistId, videoId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId) || 
    !videoId || !mongoose.Types.ObjectId.isValid(videoId))
        throw new apiError(400, "playListId and videoId is needed")

    const createdplaylist = await Playlist.findById({_id: playlistId})

    console.log("created playlist : ", createdplaylist)

    if(!createdplaylist)
        throw new apiError(400, "playlist doesn't exists")

    if(!createdplaylist.owner.equals(req.user._id))
        throw new apiError(400, "you do not have permission to add video to this playlist")

    const createdVideo = await Video.findById({_id: videoId})
        
    if(!createdVideo)
        throw new apiError(400, "video doesn't exist")

    if(!createdVideo.owner.equals(req.user._id))
        throw new apiError(400, "you do not have permission to add this video to the playlist")

    

    // console.log("playlist before updation : ", createdplaylist)

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { new: true }
    );

    console.log("playlist after updation : ", updatedPlaylist)

    return res.status(200).json(
        new apiResponse(
            200,
            {playList : updatedPlaylist},
            "video added to this playlist successfully"
        )
    )
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId) || 
    !videoId || !mongoose.Types.ObjectId.isValid(videoId))
        throw new apiError(400, "playListId and videoId is needed")

    const createdplaylist = await Playlist.findById({_id: playlistId})

    // console.log("created playlist : ", createdplaylist)

    if(!createdplaylist)
        throw new apiError(400, "playlist doesn't exists")

    if(!createdplaylist.owner.equals(req.user._id))
        throw new apiError(400, "you do not have permission to add video to this playlist")

    const createdVideo = await Video.findById({_id: videoId})
        
    if(!createdVideo)
        throw new apiError(400, "video doesn't exist")

    if(!createdVideo.owner.equals(req.user._id))
        throw new apiError(400, "you do not have permission to add this video to the playlist")

    console.log("playlist before updation : ", createdplaylist)

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );

    console.log("playlist after updation : ", updatedPlaylist)

    return res.status(200).json(
        new apiResponse(
            200,
            {playlist : updatedPlaylist},
            "video removed successfully"
        )
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
        throw new apiError(400, "valid playListId is needed")

    const createdplaylist = await Playlist.findById({_id: playlistId})

    if(!createdplaylist)
        throw new apiError(400, "playlist doesn't exists")

    await Playlist.deleteOne({_id: playlistId})

    return res.status(200).json(
        new apiResponse(
            200,
            "playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
        throw new apiError(400, "valid playListId is needed")

    const createdplaylist = await Playlist.findById({_id: playlistId})

    // console.log("before updation : ", createdplaylist);

    if(!createdplaylist)
        throw new apiError(400, "playlist doesn't exists")

    if(!name && !description)
        throw new apiError(400, "enter valid name and description")

    if(name?.trim().length === 0 && description?.trim().length === 0)
        throw new apiError(400, "enter valid name and description")


    const updateFields = {};
    if (name && name.trim().length > 0) {
        updateFields.name = name;
    }
    if (description && description.trim().length > 0) {
        updateFields.description = description;
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: updateFields },
        { new: true } // Return the updated document
    );


    return res.status(200).json(
        new apiResponse(
            200,
            {updatedPlaylist},
            "playlist updated successfully"
        )
    )
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}