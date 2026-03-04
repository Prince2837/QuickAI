import { createRequire } from "module";
import fs from "fs";
import pool from "../configs/db.js";
import { GoogleGenAI } from "@google/genai";
import { clerkClient } from "@clerk/express";
import cloudinary from "../configs/cloudinary.js";
import axios from 'axios'

const require = createRequire(import.meta.url);

// Fix for pdf-parse in ESM
const pdfModule = require("pdf-parse");
const pdf = pdfModule.default || pdfModule;


export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;

    const plan = req.plan;
    const free_usage = req.free_usage;

    // check premium plan or not 
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    //Initialize Gemini and give credentials
    const ai = new GoogleGenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    //  Generate content 
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: length,
      },
    });

    const content = response.text;

    // Save to superbase database
    const result = await pool.query(
      `INSERT INTO creations (user_id, prompt, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, prompt, content, "article"]
    );

    // Increase free_usage => ONLY if free user
    if (plan !== "premium") {

      // Update Supabase
      await pool.query(
        "UPDATE users SET free_usage = free_usage + 1 WHERE clerk_id = $1",
        [userId]
      );

      //  Get latest Clerk user
      const user = await clerkClient.users.getUser(userId);

      const currentUsage = user.privateMetadata?.free_usage || 0;

      // 3️⃣ Update Clerk metadata safely
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: currentUsage + 1,
        },
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Generate Article Error:", error);
    return res.status(500).json({
      success: false,
      message: "AI generation failed",
    });
  }
};



export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;

    const plan = req.plan;
    const free_usage = req.free_usage;

    // Free limit check
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    //Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate content
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const content = response.text;

    //Save to database
    const result = await pool.query(
      `INSERT INTO creations (user_id, prompt, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, prompt, content, "blog-title"]
    );

    // Increase usage (ONLY if free user)
    if (plan !== "premium") {

      //  Update Supabase
      await pool.query(
        "UPDATE users SET free_usage = free_usage + 1 WHERE clerk_id = $1",
        [userId]
      );

      // Get latest Clerk user
      const user = await clerkClient.users.getUser(userId);

      const currentUsage = user.privateMetadata?.free_usage || 0;

      // Update Clerk metadata safely
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: currentUsage + 1,
        },
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Generate Article Error:", error);
    return res.status(500).json({
      success: false,
      message: "AI generation failed",
    });
  }
};


export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      { prompt },
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data).toString(
      "base64"
    )}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "quickai",
    });

    const secure_url = uploadResult.secure_url;

    await pool.query(
      `INSERT INTO creations (user_id, prompt, content, type, publish)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, prompt, secure_url, "image", publish ?? false]
    );

    res.json({
      success: true,
      content: secure_url,
    });

  } catch (error) {
    console.error("Generate Image Error:", error);
    res.status(500).json({
      success: false,
      message: "AI image generation failed",
    });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (!image) {
      return res.json({
        success: false,
        message: "No image uploaded",
      });
    }

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // Upload with background removal
    const uploadResult = await cloudinary.uploader.upload(image.path, {
      effect: "background_removal",
      folder: "quickai",
    });

    const secure_url = uploadResult.secure_url;

    // Save in DB (fixed placeholders)
    const result = await pool.query(
      `INSERT INTO creations (user_id, prompt, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, "Remove background from image", secure_url, "image"]
    );

    res.json({
      success: true,
      content: secure_url,
    });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (!image) {
      return res.json({
        success: false,
        message: "No image uploaded",
      });
    }

    if (!object) {
      return res.json({
        success: false,
        message: "No object specified",
      });
    }

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    //  Upload original image
    const uploadResult = await cloudinary.uploader.upload(image.path, {
      folder: "quickai",
    });

    const public_id = uploadResult.public_id;

    //  Generate transformed URL
    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`,
        },
      ],
      resource_type: "image",
    });

    // Save in DB
    const result = await pool.query(
      `INSERT INTO creations (user_id, prompt, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, `Removed ${object} from image`, imageUrl, "image"]
    );

    res.json({
      success: true,
      content: imageUrl,
    });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    //  Check file exists
    if (!resume) {
      return res.json({
        success: false,
        message: "No resume uploaded",
      });
    }

    //  Premium check
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    //  File size check (5MB)
    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds 5MB limit.",
      });
    }

    //  Read PDF
    const dataBuffer = fs.readFileSync(resume.path);

    // Extract text
    const pdfData = await pdf(dataBuffer);

    // Remove uploaded file after reading
    fs.unlinkSync(resume.path);

    //  Prepare prompt
    const prompt = `
Review the following resume and provide constructive feedback 
on its strengths, weaknesses, and areas for improvement.

Resume content:
${pdfData.text}
`;

    //  Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const content = response.text;

    //  Save in DB
    await pool.query(
      `INSERT INTO creations (user_id, prompt, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, "Resume Review", content, "resume-review"]
    );

    res.json({
      success: true,
      content,
    });

  } catch (error) {
    console.log("Resume Review Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};