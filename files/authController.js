import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
// FIX #17: block admin self-registration at the server level (not just UI)
export const register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // SECURITY: prevent self-promotion to admin via the public registration endpoint
        const requestedRole = role || 'passenger';
        if (requestedRole === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin accounts cannot be created via self-registration. Contact a system administrator.'
            });
        }

        // Validate role is one of the allowed public roles
        const allowedRoles = ['passenger', 'driver'];
        const assignedRole = allowedRoles.includes(requestedRole) ? requestedRole : 'passenger';

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: assignedRole
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                token
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact support.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful.',
            data: {
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('bookingHistory');

        res.json({ success: true, data: { user } });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
    }
};

// Update user profile (name, phone only — email is immutable)
export const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name: name.trim(), phone },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ success: true, message: 'Profile updated successfully.', data: { user } });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
};

// Change password — requires current password verification
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        // Fetch user with password for comparison
        const user = await User.findById(req.user._id);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
};

// Get users by role (Admin only)
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;
        if (!role) {
            return res.status(400).json({ success: false, message: 'Role parameter is required.' });
        }

        const users = await User.find({ role, isActive: true })
            .select('name email phone role')
            .sort({ name: 1 });

        res.json({ success: true, data: { users } });
    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
};
