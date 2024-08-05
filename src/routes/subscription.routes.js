import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getSubscribedChannels, 
    toggleSubscription,
    getUserChannelSubscribers
} from "../controllers/subscription.controller.js";


const router = Router();

router.use(verifyJWT)
router.route("/c/:channelId").post(toggleSubscription)
router.route("/subscribed-channels").get(getSubscribedChannels)
// router.route("/u/:subscriberId").get(getUserChannelSubscribers);
router.route("/subscribers").get(getUserChannelSubscribers)


export default router