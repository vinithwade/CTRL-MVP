import { Router } from 'express';
import { z } from 'zod';
import { AIService } from '../services/aiService.js';
const router = Router();
const aiService = new AIService();
const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    context: z.string().optional(),
    userId: z.string().optional()
});
const batchProcessSchema = z.object({
    data: z.array(z.any()),
    operation: z.string(),
    options: z.record(z.any()).optional()
});
router.post('/chat', async (req, res, next) => {
    try {
        const { message, context, userId } = chatMessageSchema.parse(req.body);
        if (!message || message.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Message is required and cannot be empty'
            });
            return;
        }
        const response = await aiService.processChatMessage({
            message,
            context: context || '',
            userId: userId || '',
            timestamp: new Date()
        });
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }
        next(error);
    }
});
router.post('/batch', async (req, res, next) => {
    try {
        const { data, operation, options } = batchProcessSchema.parse(req.body);
        const results = await aiService.batchProcess({
            data,
            operation,
            options: options || {}
        });
        res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/status', async (req, res, next) => {
    try {
        const status = await aiService.getStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/capabilities', async (req, res, next) => {
    try {
        const capabilities = await aiService.getCapabilities();
        res.json({
            success: true,
            data: capabilities
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/analyze', async (req, res, next) => {
    try {
        const { text, analysisType } = req.body;
        if (!text || !analysisType) {
            return res.status(400).json({
                success: false,
                error: 'Text and analysis type are required'
            });
        }
        const analysis = await aiService.analyzeText(text, analysisType);
        return res.json({
            success: true,
            data: analysis
        });
    }
    catch (error) {
        return next(error);
    }
});
router.post('/image', async (req, res, next) => {
    try {
        const { imageUrl, operation } = req.body;
        if (!imageUrl || !operation) {
            return res.status(400).json({
                success: false,
                error: 'Image URL and operation are required'
            });
        }
        const result = await aiService.processImage(imageUrl, operation);
        return res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        return next(error);
    }
});
export default router;
//# sourceMappingURL=ai.js.map