import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    deleteVideo, 
    getAllVideos, 
    getVideoById, 
    publishVideo, 
    togglePublishStatus, 
    updateThumbNail,  
} from "../controllers/video.controller.js";


const router = Router();

// applying verifyJWT to all vdo routes
router.use(verifyJWT)


router.route("/").get(getAllVideos).post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbNail",
            maxCount: 1
        }
    ]),
    publishVideo
)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbNail"), updateThumbNail)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router