// UI Designer Types - Frontend
// Matches backend UIDesign interface from workflow_builder_backend/src/types.ts

export interface UIDesign {
    id: string;
    user_id: string;
    name: string;
    description?: string;

    // Configuration
    template_id: 'modern' | 'professional' | 'creative' | 'custom';
    theme_color: string;
    logo_url?: string;
    title: string;
    subtitle?: string;
    welcome_message?: string;
    input_placeholder?: string;
    font_family?: string;
    custom_css?: string;
    component_styles?: ComponentStyles;

    // Metadata
    is_public: boolean;
    allow_file_uploads: boolean;
    show_header: boolean;
    show_agent_avatar: boolean;
    preview_image_url?: string;
    created_at: Date;
    updated_at: Date;
}

export interface ComponentStyles {
    // Styles
    avatar_style?: 'circle' | 'square' | 'rounded';
    input_style?: 'rounded' | 'pill' | 'line';
    bubble_style?: 'rounded' | 'square' | 'leaf';

    // Visibility (Structure)
    header_visible?: boolean;
    chat_visible?: boolean;
    input_visible?: boolean;
    logo_visible?: boolean;
    send_button?: boolean; // Renamed from send_button_visible for brevity if preferred, sticking to plan though? Let's use send_button
}

export interface UITemplate {
    id: 'modern' | 'professional' | 'creative' | 'custom';
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
            font_family: 'Inter, sans-serif',
            component_styles: {
                avatar_style: 'circle',
                input_style: 'pill',
                bubble_style: 'rounded',
                header_visible: true,
                chat_visible: true,
                input_visible: true,
                logo_visible: true,
                send_button: true
            },
            allow_file_uploads: false,
            show_header: true,
            show_agent_avatar: true
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
            font_family: 'Roboto, sans-serif',
            component_styles: {
                avatar_style: 'rounded',
                input_style: 'rounded',
                bubble_style: 'square',
                header_visible: true,
                chat_visible: true,
                input_visible: true,
                logo_visible: true,
                send_button: true
            },
            allow_file_uploads: false,
            show_header: true,
            show_agent_avatar: true
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
            font_family: 'Outfit, sans-serif',
            component_styles: {
                avatar_style: 'circle',
                input_style: 'pill',
                bubble_style: 'leaf',
                header_visible: true,
                chat_visible: true,
                input_visible: true,
                logo_visible: true,
                send_button: true
            },
            allow_file_uploads: false,
            show_header: true,
            show_agent_avatar: true
        }
    },
    {
        id: 'custom',
        name: 'Custom Builder',
        description: 'Build your own component style from scratch',
        preview: '🛠️',
        defaultConfig: {
            template_id: 'custom',
            theme_color: '#6366f1',
            title: 'My Custom Chat',
            subtitle: 'Helper',
            welcome_message: 'How can I help?',
            input_placeholder: 'Ask me anything...',
            font_family: 'Inter, sans-serif',
            component_styles: {
                avatar_style: 'square',
                input_style: 'line',
                bubble_style: 'rounded',
                // Blank Canvas Defaults
                header_visible: false,
                chat_visible: false,
                input_visible: false,
                logo_visible: false,
                send_button: false
            },
            allow_file_uploads: false,
            show_header: true,
            show_agent_avatar: true
        }
    }
];
