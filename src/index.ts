import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import { lookup } from './core/upcitemdb';

// Load environment variables
config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to UPC Item Database Server',
        version: '1.0.0',
        status: 'running'
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/lookup', async (req: Request, res: Response) => {
    const upc = req.query.upc as string;
    const authorization = req.header('Authorization');

    if (!authorization || authorization !== process.env.API_KEY) {
        res.status(401).json({ error: 'Missing or Invalid Authorization' });
        return;
    }

    try {
        const response = await lookup(upc);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Server accessible from anywhere on port ${PORT}`);
});

export default app;