import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { HexColorPicker } from "react-colorful";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, PaintBucket, Palette, Sparkles, X } from "lucide-react";
import "@/styles/color-picker.css";

const presets = [
  { color: '#4dabf7', name: 'Sky Blue' },
  { color: '#339af0', name: 'Azure' },
  { color: '#f06595', name: 'Pink Rose' },
  { color: '#be4bdb', name: 'Purple' },
  { color: '#20c997', name: 'Emerald' },
  { color: '#fab005', name: 'Golden' },
  { color: '#ff6b6b', name: 'Coral' },
  { color: '#748ffc', name: 'Lavender' },
  { color: '#ff922b', name: 'Sunset' },
  { color: '#51cf66', name: 'Lime' },
  { color: '#ff8787', name: 'Peach' },
  { color: '#9775fa', name: 'Violet' },
];

interface ColorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ColorPickerModal({ open, onOpenChange }: ColorPickerModalProps) {
  const { accentColor, setAccentColor } = useTheme();
  const [customColor, setCustomColor] = useState(accentColor);
  const [isCopyFeedback, setIsCopyFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Update local state when accentColor changes
  useEffect(() => {
    setCustomColor(accentColor);
  }, [accentColor]);

  const handleColorSelect = (color: string) => {
    setCustomColor(color);
  };

  const handleApply = () => {
    setAccentColor(customColor);
    onOpenChange(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customColor);
    setIsCopyFeedback(true);
    setTimeout(() => setIsCopyFeedback(false), 2000);
  };

  const calculateLuminance = (color: string) => {
    // Simple luminance calculation for contrast text
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const textColor = calculateLuminance(customColor) > 0.5 ? '#000000' : '#FFFFFF';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false} 
        className="w-[500px] rounded-3xl p-0 overflow-hidden bg-linear-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-2xl backdrop-blur-xl"
      >
        {/* Animated background linear */}
        <div className="absolute inset-0 bg-linear-to-br from-gray-900/50 via-transparent to-gray-900/30 pointer-events-none" />
        
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-linear-to-br from-gray-800 to-gray-900">
              <Palette className="w-5 h-5 text-gray-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Theme Customizer
            </DialogTitle>
          </div>
          <div className="cursor-pointer hover:bg-gray-800 p-2 rounded-xl">
            <X className="w-4 h-4 text-gray-400" onClick={() => onOpenChange(false)} />
          </div>
          </div>
          <p className="text-sm text-gray-400">
            Choose your primary accent color
          </p>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 p-1 rounded-2xl bg-gray-900/50 w-fit">
            <button
              onClick={() => setActiveTab('presets')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === 'presets'
                  ? "bg-linear-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === 'custom'
                  ? "bg-linear-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'presets' ? (
              <motion.div
                key="presets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-6 gap-3">
                  {presets.map((item) => (
                    <motion.button
                      key={item.color}
                      onClick={() => handleColorSelect(item.color)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl transition-all duration-300 shadow-lg",
                            customColor.toLowerCase() === item.color.toLowerCase() && 
                            "ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110"
                          )}
                          style={{ 
                            backgroundColor: item.color,
                            backgroundImage: `linear-linear(135deg, ${item.color}99, ${item.color})`
                          }}
                        />
                        {customColor.toLowerCase() === item.color.toLowerCase() && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1"
                          >
                            <div className="p-0.5 bg-gray-900 rounded-full">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 truncate w-full text-center">
                        {item.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="custom"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="custom-picker-container">
                  <HexColorPicker 
                    color={customColor} 
                    onChange={setCustomColor} 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Preview & Code
                    </h3>
                    <Sparkles className="w-4 h-4 text-gray-500" />
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-linear-to-r from-gray-900/50 to-gray-900/30 backdrop-blur-sm border border-gray-800/50">
                    <div className="relative">
                      <div 
                        className="w-12 h-12 rounded-xl shadow-lg transition-all duration-300"
                        style={{ 
                          backgroundColor: customColor,
                          backgroundImage: `linear-linear(135deg, ${customColor}99, ${customColor})`
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-linear-to-br from-gray-800 to-gray-900 border border-gray-700" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 flex-1 rounded-full"
                          style={{ backgroundColor: customColor }}
                        />
                        <div 
                          className="h-2 w-8 rounded-full"
                          style={{ backgroundColor: customColor }}
                        />
                      </div>
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: customColor,
                          width: '70%',
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={customColor.toUpperCase()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^#[0-9A-F]{0,6}$/i.test(val)) {
                            handleColorSelect(val);
                          }
                        }}
                        className="w-full h-12 bg-gray-900/50 backdrop-blur-sm rounded-xl px-4 text-sm font-mono font-bold text-white border border-gray-700 focus:border-gray-600 focus:ring-2 focus:ring-gray-700/50 transition-all outline-none"
                        placeholder="#HEXCODE"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <button
                          onClick={copyToClipboard}
                          className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                        >
                          <AnimatePresence mode="wait">
                            {isCopyFeedback ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check className="w-4 h-4 text-green-400" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="paint"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <PaintBucket className="w-4 h-4 text-gray-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                      style={{ 
                        backgroundColor: customColor,
                        color: textColor
                      }}
                      onClick={copyToClipboard}
                    >
                      {isCopyFeedback ? 'Copied!' : 'copy'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800/50 bg-linear-to-t from-gray-900/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Current: <span className="font-mono text-gray-300">{customColor.toUpperCase()}</span>
            </div>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-linear-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}