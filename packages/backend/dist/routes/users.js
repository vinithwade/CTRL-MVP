import { Router } from 'express';
import { z } from 'zod';
const router = Router();
const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2)
});
router.get('/', async (req, res) => {
    try {
        const users = [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
        ];
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = {
            id: parseInt(id),
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const userData = userSchema.parse(req.body);
        const newUser = {
            id: Date.now(),
            ...userData,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        res.status(201).json({
            success: true,
            data: newUser
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid user data'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedUser = {
            id: parseInt(id),
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        res.json({
            success: true,
            data: updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        res.json({
            success: true,
            message: `User ${id} deleted successfully`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});
export default router;
//# sourceMappingURL=users.js.map