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

const toPascalCase = (str: string) => {
    return str
        .split(/[-_ ]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
};

export const renderIcon = (iconName: string | undefined, props: any = {}) => {
    if (!iconName) return null;

    // Check aliases first
    const aliasName = ICON_ALIASES[iconName] || iconName;
    
    // Try exact, then alias, then PascalCase of both
    const namesToTry = [
        aliasName,
        iconName,
        toPascalCase(aliasName),
        toPascalCase(iconName)
    ];

    let IconComponent = null;

    for (const name of namesToTry) {
        if ((LucideIcons as any)[name]) {
            IconComponent = (LucideIcons as any)[name];
            break;
        }
    }

    if (!IconComponent) {
        console.warn(`Icon "${iconName}" not found in lucide-react (tried: ${namesToTry.join(', ')})`);
        return null;
    }
    return createElement(IconComponent, props);
};
