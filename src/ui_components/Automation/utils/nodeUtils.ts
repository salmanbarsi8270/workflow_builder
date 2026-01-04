// nodeUtils.ts
export const getNodeStatusColor = (status: string) => {
  const statusColors = {
    pending: { border: 'border-gray-300', bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-500' },
    running: { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
    success: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
    error: { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500' },
    warning: { border: 'border-amber-500', bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-500' }
  };

  return statusColors[status as keyof typeof statusColors] || statusColors.pending;
};


export const calculateNodeProgress = (data: any): number => {
  // Calculate progress based on node data
  if (typeof data.progress === 'number') return data.progress;
  if (data.status === 'success') return 100;
  if (data.status === 'running') return 50;
  if (data.status === 'error') return 0;
  return 0;
};

export const shouldShowProgress = (data: any): boolean => {
  const status = data.status;
  return status === 'running' || status === 'success' || data.showProgress === true;
};


export const getNodeIcon = (iconType: string) => {
  const IconMap = {
    'trigger': 'Zap',
    'action': 'Monitor',
    'email': 'Mail',
    'doc': 'FileText',
    'schedule': 'Clock',
    'delay': 'Clock',
    'gmail': 'Mail',
    'sheets': 'FileText',
    'docs': 'FileText',
    'drive': 'HardDrive',
    'default': 'Zap'
  };
  
  return IconMap[iconType as keyof typeof IconMap] || IconMap.default;
};

export const shouldShowEdgeButton = (sourceNode: any, targetNode: any): boolean => {
  if (!sourceNode || !targetNode) return false;

  // ❌ Never show + on condition branches
  if (sourceNode.type === 'condition') {
    return false;
  }

  // ✅ Show + on merge placeholder (Green circle)
  if (targetNode.data?.isMergePlaceholder) {
    return true;
  }

  // ✅ Show + on End node (to allow adding before end)
  if (targetNode.type === 'end') {
    return true;
  }

  // ❌ Hide for other placeholders (like True/False branch starts)
  if (targetNode.data?.isPlaceholder) {
    return false;
  }

  // ✅ Show for normal nodes (Standard flow)
  return true;
};