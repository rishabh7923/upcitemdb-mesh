import { config } from 'dotenv';
import { lookup } from './core/upcitemdb';
import express, { Request, Response } from 'express';
import { AppDataSource } from './database/source';
import { UpcItem } from './database/entity/UPCItem';


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
        // Check cache first
        const cachedItem = await UpcItem.findOne({ where: { upc } });

        if (cachedItem) return res.status(200).json({
            ...cachedItem,
            source: 'cache'
        });


        const apiResponse = await lookup(upc);

        if (!apiResponse || !apiResponse.items?.length) return res.status(404).json({
            error: `Item not found: No item with UPC ${upc} found in our database or external sources`
        });


        const itemData = apiResponse.items[0];

        try {
            await UpcItem.insert({ ...itemData, upc });
        } catch (insertError) {
            console.warn(`⚠️ Failed to cache item for UPC ${upc}:`, (insertError as Error).message);
        }

        return res.status(200).json({
            ...itemData,
            source: 'external'
        });

    } catch (error) {
        console.error(`💥 Error looking up UPC ${upc}:`, error);

        // Handle specific error types
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return res.status(503).json({
                error: 'External service unavailable: Unable to connect to UPC lookup service. Please try again later.'
            });
        }

        return res.status(500).json({
            error: 'Internal server error: An unexpected error occurred while processing your request'
        });
    }
});


AppDataSource.initialize().then(() => {
    console.log(`💻 Connected to the Cache Database`);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Server accessible from anywhere on port ${PORT}`);
});


export default app;