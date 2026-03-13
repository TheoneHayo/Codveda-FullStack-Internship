const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        const skip = (page - 1) * limit;

        const query = { name: { $regex: search, $options: "i" } };

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password') // never return passwords
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({ total, page, totalPages: Math.ceil(total / limit), users });

    } catch (error) {
        next(error);
    }
};

// Get single user
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// Create user (admin adds a user — password required)
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({
            message: "User created successfully",
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        next(error);
    }
};

// Update user
exports.updateUser = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (email) {
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Invalid email format" });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User updated successfully", user });

    } catch (error) {
        next(error);
    }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        next(error);
    }
};