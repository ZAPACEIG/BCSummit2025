import * as dotenv from 'dotenv';
import * as path from 'path';
import express from 'express';
import { 
    BotFrameworkAdapter,
    TurnContext
} from 'botbuilder';
import { IBBBot } from './bot';

// Load environment variables
const ENV_FILE = path.join(__dirname, '..', '.env');
dotenv.config({ path: ENV_FILE });

// Create Express server
const app = express();
app.use(express.json());

// Create Bot Framework Adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId || '',
    appPassword: process.env.MicrosoftAppPassword || '',
    channelAuthTenant: process.env.MicrosoftAppTenantId
});

// Error handling
adapter.onTurnError = async (context: TurnContext, error: Error) => {
    console.error('Error:', error.message);
    await context.sendActivity('Sorry, there was an error processing your request.');
};

// Create bot instance
const bot = new IBBBot();

// Main bot endpoint
app.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context: TurnContext) => bot.run(context));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
const PORT = process.env.PORT || 3978;
app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
});