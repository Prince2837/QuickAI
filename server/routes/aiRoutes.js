import express from "express";
import auth from "../middlewares/auth.js";
import { generateArticle, generateBlogTitle, generateImage, removeImageBackground, removeImageObject, resumeReview } from "../controllers/aiController.js";
import { upload } from "../configs/multer.js";

const router = express.Router();

router.post("/generate-article", auth, generateArticle);
router.post("/generate-blog-title", auth, generateBlogTitle);
router.post("/generate-image", auth, generateImage);
router.post("/remove-image-background", upload.single('image'), auth, removeImageBackground);
router.post("/remove-image-object",upload.single('image'), auth, removeImageObject);
router.post("/resume-review",upload.single('resume'), auth,resumeReview );

export default router;