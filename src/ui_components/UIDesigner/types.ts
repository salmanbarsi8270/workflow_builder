// UI Designer Types - Frontend
// Matches backend UIDesign interface from workflow_builder_backend/src/types.ts

export interface UIDesign {
    id: string;
    user_id: string;
    name: string;
    description?: string;

    // Configuration
    template_id: 'modern' | 'professional' | 'creative';
    theme_color: string;
    logo_url?: string;
    title: string;
    subtitle?: string;
    welcome_message?: string;
    input_placeholder?: string;
    font_family?: string;
    custom_css?: string;

    // Metadata
    is_public: boolean;
    preview_image_url?: string;
    created_at: Date;
    updated_at: Date;
}

export interface UITemplate {
    id: 'modern' | 'professional' | 'creative';
    name: string;
    description: string;
    preview: string; // Preview image or icon
    defaultConfig: Partial<UIDesign>;
}

export const TEMPLATES: UITemplate[] = [
    {
        id: 'modern',
        name: 'Modern Dark',
        description: 'Sleek dark theme with glassmorphism effects',
        preview: '🌙',
        defaultConfig: {
            template_id: 'modern',
            theme_color: '#4dabf7',
            title: 'AI Assistant',
            subtitle: 'Online Now',
            welcome_message: 'Hello! How can I assist you today?',
            input_placeholder: 'Type your message...',
            font_family: 'Inter, sans-serif'
        }
    },
    {
        id: 'professional',
        name: 'Professional Light',
        description: 'Clean business-focused design',
        preview: '💼',
        defaultConfig: {
            template_id: 'professional',
            theme_color: '#2563eb',
            title: 'Support Bot',
            subtitle: 'Ready to Help',
            welcome_message: 'Welcome! What can I help you with?',
            input_placeholder: 'Ask a question...',
            font_family: 'Roboto, sans-serif'
        }
    },
    {
        id: 'creative',
        name: 'Creative Gradient',
        description: 'Vibrant colorful interface with animations',
        preview: '🎨',
        defaultConfig: {
            template_id: 'creative',
            theme_color: '#ec4899',
            title: 'Creative Agent',
            subtitle: 'Let\'s Create!',
            welcome_message: 'Hi there! Ready to explore something amazing?',
            input_placeholder: 'Share your ideas...',
            font_family: 'Outfit, sans-serif'
        }
    }
];
