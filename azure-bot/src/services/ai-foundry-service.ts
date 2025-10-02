import axios, { AxiosResponse } from 'axios';

export interface AIFoundryRequest {
    question: string;
    chat_history: any[];
}

export interface AIFoundryResponse {
    text?: string;
    answer?: string;
    cards?: any[];
    followUp?: string[];
    context?: any;
    analysis?: any;
}

export class AIFoundryService {
    private readonly endpoint: string;
    private readonly apiKey: string;
    private readonly flowName: string;
    private readonly deployment: string;

    constructor() {
        this.endpoint = process.env.AI_FOUNDRY_ENDPOINT || '';
        this.apiKey = process.env.AI_FOUNDRY_KEY || '';
        this.flowName = process.env.AI_FOUNDRY_FLOW_NAME || 'bcsummit2025-flow';
        this.deployment = process.env.AI_FOUNDRY_DEPLOYMENT || 'bcsummit2025-flow-1';

        if (!this.endpoint || !this.apiKey) {
            throw new Error('AI_FOUNDRY_ENDPOINT and AI_FOUNDRY_KEY are required');
        }
    }

    public async processQuery(query: string, context?: any): Promise<AIFoundryResponse | null> {
        try {
            const request: AIFoundryRequest = {
                question: query,
                chat_history: context?.chat_history || []
            };

            const response: AxiosResponse<AIFoundryResponse> = await axios.post(
                this.endpoint,
                request,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'azureml-model-deployment': this.deployment,
                        'User-Agent': 'BCSummit2025-Bot/1.0'
                    },
                    timeout: 180000
                }
            );
            
            const adaptedResponse: AIFoundryResponse = {
                text: response.data?.answer || response.data?.text || '',
                cards: response.data?.cards || [],
                followUp: response.data?.followUp || [],
                context: response.data?.context,
                analysis: response.data?.analysis
            };
            
            return adaptedResponse;

        } catch (error: any) {
            console.error('Error calling AI Foundry:', error.message);
            return this.getMinimalFallback(query);
        }
    }

    private getMinimalFallback(query: string): AIFoundryResponse {
        return {
            text: `Lo siento, no pude procesar tu consulta: "${query}". Por favor, inténtalo más tarde.`,
            followUp: [
                'Intentar de nuevo',
                'Contactar soporte'
            ]
        };
    }

    public async healthCheck(): Promise<boolean> {
        try {
            const testResponse = await axios.post(
                this.endpoint,
                {
                    question: "health check",
                    chat_history: []
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'azureml-model-deployment': this.deployment
                    },
                    timeout: 10000
                }
            );

            return testResponse.status === 200;

        } catch (error: any) {
            console.warn('AI Foundry health check failed:', error.message);
            return false;
        }
    }
}
