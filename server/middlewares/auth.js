import pool from "../configs/db.js";

const auth = async (req, res, next) => {
  try {
    const { userId, has } = req.auth();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check premium plan from Clerk
    const hasPremiumPlan = await has({ plan: "premium" });

    // Get user from Supabase DB
    let result = await pool.query(
      "SELECT * FROM users WHERE clerk_id = $1",
      [userId]
    );

    let user = result.rows[0];

    // If user not exists → create
    if (!user) {
      const newUser = await pool.query(
        "INSERT INTO users (clerk_id) VALUES ($1) RETURNING *",
        [userId]
      );
      user = newUser.rows[0];
    }

    req.userId = userId;
    req.plan = hasPremiumPlan ? "premium" : user.plan;
    req.free_usage = user.free_usage;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default auth;