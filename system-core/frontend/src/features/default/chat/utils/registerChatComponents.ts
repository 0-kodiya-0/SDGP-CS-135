// src/features/default/chat/utils/registerChatComponents.ts
import { registerComponent } from '../../../required/tab_view/utils/componentRegistry';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';

/**
 * Register all chat-related components for dynamic loading
 * This function should be called during application initialization
 */
export function registerChatComponents() {
    
    registerComponent(
        ComponentTypes.CHAT_CONVERSATION,
        () => import('../components/ChatConversation')
    );

    console.log('Chat components registered for dynamic loading');
}