import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getLikedVideos, 
    toggleCommentLike, 
    toggleTweetLike, 
    toggleVideoLike 
} from "../controllers/like.controller.js";


const router = Router()

router.use(verifyJWT)
router.route("/toggle/v/:videoId", toggleVideoLike)
router.route("/toggle/c/:commentId", toggleCommentLike)
router.route("/toggle/t/:tweetId", toggleTweetLike)
router.route("/videos", getLikedVideos)

export default router