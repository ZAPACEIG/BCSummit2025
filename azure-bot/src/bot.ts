import { ActivityHandler, MessageFactory, TurnContext, ActivityTypes, CardFactory } from 'botbuilder';
import { AIFoundryService } from './services/ai-foundry-service';

export class IBBBot extends ActivityHandler {
    private aiFoundryService: AIFoundryService;

    constructor() {
        super();

        this.aiFoundryService = new AIFoundryService();

        this.onMessage(async (context: TurnContext, next: () => Promise<void>) => {
            await this.handleMessage(context);
            await next();
        });

        this.onMembersAdded(async (context: TurnContext, next: () => Promise<void>) => {
            await this.handleMembersAdded(context);
            await next();
        });
    }

    private async handleMessage(context: TurnContext): Promise<void> {
        const userMessage = context.activity.text?.trim() || '';

        try {
            // Check for special commands
            if (await this.handleSpecialCommands(context, userMessage)) {
                return;
            }

            // Show typing indicator
            await context.sendActivity({ type: ActivityTypes.Typing });

            // Process with AI Foundry
            const response = await this.aiFoundryService.processQuery(userMessage);

            if (response && response.text) {
                const replyActivity = MessageFactory.text(response.text);
                
                if (response.cards && response.cards.length > 0) {
                    replyActivity.attachments = response.cards.map((card: any) => 
                        CardFactory.adaptiveCard(card)
                    );
                }

                await context.sendActivity(replyActivity);
            } else {
                await this.sendFallbackResponse(context);
            }

        } catch (error) {
            console.error('Error processing message:', error);
            await this.sendErrorResponse(context);
        }
    }

    private async handleSpecialCommands(context: TurnContext, message: string): Promise<boolean> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('help') || lowerMessage.includes('ayuda') || lowerMessage === '?') {
            await this.sendHelpMessage(context);
            return true;
        }

        if (lowerMessage.includes('hello') || lowerMessage.includes('hola') || lowerMessage.includes('hi')) {
            await this.sendWelcomeMessage(context);
            return true;
        }

        return false;
    }

    private async handleMembersAdded(context: TurnContext): Promise<void> {
        const membersAdded = context.activity.membersAdded;
        if (membersAdded) {
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await this.sendWelcomeMessage(context);
                }
            }
        }
    }

    private async sendWelcomeMessage(context: TurnContext): Promise<void> {
        const welcomeText = `¡Hola! Soy el asistente de Business Central para BC Summit 2025.

Te puedo ayudar con:
• Consultar información de clientes
• Análisis de productos e inventario
• Gestión de pedidos de venta
• Seguimiento de líneas de pedido
• Envío y facturación de pedidos

¿En qué puedo ayudarte hoy?`;
        
        await context.sendActivity(MessageFactory.text(welcomeText));
    }

    private async sendHelpMessage(context: TurnContext): Promise<void> {
        const helpText = `**BC Summit 2025 Bot - Guía de Ayuda**

**Ejemplos de consultas que puedes hacer:**

**Clientes:**
• "¿Cuántos clientes tenemos activos?"
• "Muéstrame la información del cliente Contoso"
• "Listado de clientes con crédito pendiente"

**Productos:**
• "¿Qué productos tenemos en stock?"
• "Muéstrame los productos con stock bajo"
• "Información del producto BIKE-001"

**Pedidos de Venta:**
• "Listado de pedidos pendientes"
• "¿Cuál es el estado del pedido SO-2024-001?"
• "Pedidos del cliente Fabrikam"

**Acciones:**
• "Enviar y facturar el pedido SO-2024-002"
• "Procesar envío del pedido número 12345"

¡Simplemente hazme tu pregunta de forma natural!`;
        
        await context.sendActivity(MessageFactory.text(helpText));
    }

    private async sendFallbackResponse(context: TurnContext): Promise<void> {
        const responses = [
            "No pude procesar tu consulta. ¿Podrías reformularla?",
            "¿Podrías ser más específico? Te puedo ayudar con clientes, productos o pedidos de venta.",
            "Intenta preguntar sobre inventario, facturas o análisis de Business Central.",
            "Escribe 'ayuda' para ver ejemplos de lo que puedo hacer."
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        await context.sendActivity(MessageFactory.text(randomResponse));
    }

    private async sendErrorResponse(context: TurnContext): Promise<void> {
        const errorText = "Lo siento, ha ocurrido un error técnico procesando tu solicitud. Por favor, inténtalo de nuevo.";
        await context.sendActivity(MessageFactory.text(errorText));
    }
}