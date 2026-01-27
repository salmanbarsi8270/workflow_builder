import { createElement } from 'react';
import * as LucideIcons from 'lucide-react';

const ICON_ALIASES: Record<string, string> = {
    'Tokens': 'Coins',
    'ArrowRightOnRectangle': 'LogOut',
    'ArrowLeftOnRectangle': 'LogIn',
    'RectangleStack': 'Layers',
    'DocumentText': 'FileText',
    'ChatBubbleLeftRight': 'MessageSquare',
    'UserGroup': 'Users',
    'ExclamationTriangle': 'AlertTriangle',
    'InformationCircle': 'Info',
    'CheckCircle': 'CheckCircle2',
    'QuestionMarkCircle': 'HelpCircle',
};

export const renderIcon = (iconName: string | undefined, props: any = {}) => {
    if (!iconName) return null;

    // Check aliases first
    const realName = ICON_ALIASES[iconName] || iconName;

    const IconComponent = (LucideIcons as any)[realName];
    if (!IconComponent) {
        console.warn(`Icon "${iconName}" (alias for "${realName}") not found in lucide-react`);
        return null;
    }
    return createElement(IconComponent, props);
};
