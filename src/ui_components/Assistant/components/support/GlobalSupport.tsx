import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportChatInterface } from './SupportChatInterface';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/theme-provider';

export function GlobalSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { accentColor } = useTheme();

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[450px] max-w-[calc(100vw-2rem)] h-[700px] max-h-[calc(100vh-8rem)] bg-background border border-border/50 shadow-2xl rounded-[32px] overflow-hidden pointer-events-auto"
          >
            <SupportChatInterface userId={user.id} userName={user.name || 'User'} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full shadow-2xl border-none text-white relative group overflow-hidden"
          style={{ backgroundColor: accentColor }}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isOpen ? (
            <X className="h-6 w-6 relative z-10" />
          ) : (
            <MessageCircle className="h-6 w-6 relative z-10" />
          )}
        </Button>
      </motion.div>
    </div>
  );
}
