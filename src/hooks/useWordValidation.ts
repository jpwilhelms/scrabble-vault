import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  word: string;
  isValid: boolean;
}

export function useWordValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateWords = useCallback(async (words: string[]): Promise<ValidationResult[]> => {
    if (words.length === 0) return [];

    setIsValidating(true);
    
    try {
      console.log('Validating words:', words);
      
      const { data, error } = await supabase.functions.invoke('validate-word', {
        body: { words }
      });

      if (error) {
        console.error('Error validating words:', error);
        // On error, assume all words are invalid
        return words.map(word => ({ word: word.toLowerCase(), isValid: false }));
      }

      console.log('Validation response:', data);

      const results: ValidationResult[] = words.map(word => {
        const normalizedWord = word.toLowerCase().trim();
        return {
          word: normalizedWord,
          isValid: data.results?.[normalizedWord] ?? false
        };
      });

      return results;
    } catch (error) {
      console.error('Error in word validation:', error);
      return words.map(word => ({ word: word.toLowerCase(), isValid: false }));
    } finally {
      setIsValidating(false);
    }
  }, []);

  return { validateWords, isValidating };
}
