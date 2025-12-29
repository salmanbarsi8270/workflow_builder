import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api/apiurl';
import { type PropertyMetadata } from './ActionDefinitions';

export interface ActionMetadata {
  label?: string;
  description?: string;
  parameters?: any[]; // We can refine this later
  outputSchema?: PropertyMetadata[];
}

export interface PieceMetadata {
  name: string;
  actions: string[];
  triggers: string[];
  metadata?: {
    actions?: Record<string, ActionMetadata>;
    triggers?: Record<string, ActionMetadata>;
  };
}

export const usePiecesMetadata = () => {
  const [pieces, setPieces] = useState<Record<string, PieceMetadata>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/pieces`);
        if (response.data.success) {
          setPieces(response.data.pieces);
        } else {
          setError(response.data.error || 'Failed to fetch pieces metadata');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching piece metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  return { pieces, loading, error };
};
