import pool from "../configs/db.js";

export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth();

    const result = await pool.query(
      `SELECT * FROM creations 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, creations: result.rows });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getPublishedCreations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM creations 
       WHERE publish = true 
       ORDER BY created_at DESC`
    );

    res.json({ success: true, creations: result.rows });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const toggleLikeCreation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const result = await pool.query(
      `SELECT * FROM creations WHERE id = $1`,
      [id]
    );

    const creation = result.rows[0];

    if (!creation) {
      return res.json({
        success: false,
        message: "Creation not found",
      });
    }

    const currentLikes = creation.likes || [];
    const userIdStr = userId.toString();

    let updatedLikes;
    let message;

    if (currentLikes.includes(userIdStr)) {
      updatedLikes = currentLikes.filter((user) => user !== userIdStr);
      message = "Creation Unliked";
    } else {
      updatedLikes = [...currentLikes, userIdStr];
      message = "Creation Liked";
    }

    await pool.query(
      `UPDATE creations 
       SET likes = $1 
       WHERE id = $2`,
      [updatedLikes, id]
    );

    res.json({ success: true, message });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};