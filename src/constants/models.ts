export const curatedModels = [
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
    { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)' },
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini (Free)' },
];

export const getOpenRouterModels = async (api_key?: string) => {
    const url = 'https://openrouter.ai/api/v1/models';
    const options: RequestInit = {
        method: 'GET',
        headers: api_key ? { Authorization: `Bearer ${api_key}` } : {}
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data && data.data) {
            return data.data.map((m: any) => ({
                id: m.id,
                name: m.name || m.id
            }));
        }
        return curatedModels;
    } catch (error) {
        console.error("Error fetching OpenRouter models:", error);
        return curatedModels;
    }
};
