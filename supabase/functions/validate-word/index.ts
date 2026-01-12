import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { words } = await req.json();
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Words array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating words:', words);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Record<string, boolean> = {};
    const wordsToCheck: string[] = [];

    // First, check which words are already in the dictionary
    for (const word of words) {
      const normalizedWord = word.toLowerCase().trim();
      
      const { data: existingWord, error } = await supabase
        .from('dictionary')
        .select('word')
        .eq('word', normalizedWord)
        .maybeSingle();

      if (error) {
        console.error('Error checking dictionary:', error);
        wordsToCheck.push(normalizedWord);
      } else if (existingWord) {
        console.log(`Word "${normalizedWord}" found in dictionary`);
        results[normalizedWord] = true;
      } else {
        wordsToCheck.push(normalizedWord);
      }
    }

    // For words not in dictionary, check the external API
    for (const word of wordsToCheck) {
      console.log(`Checking API for word: ${word}`);
      
      try {
        const apiUrl = `https://api.poocoo.de/api/v1/words-from-letters?letters=${encodeURIComponent(word)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error(`API error for word "${word}":`, response.status);
          results[word] = false;
          continue;
        }

        const apiResults = await response.json();
        console.log(`API response for "${word}":`, apiResults);

        // The API returns: { success: true, data: { wordGroups: [{ words: [...] }] } }
        let isValid = false;
        const wordsToInsert: string[] = [];

        if (apiResults.success && apiResults.data?.wordGroups) {
          // Extract all words from all word groups
          for (const group of apiResults.data.wordGroups) {
            if (Array.isArray(group.words)) {
              for (const resultWord of group.words) {
                const normalizedResult = resultWord.toLowerCase().trim();
                if (normalizedResult) {
                  wordsToInsert.push(normalizedResult);
                  if (normalizedResult === word) {
                    isValid = true;
                  }
                }
              }
            }
          }
        }

        console.log(`Word "${word}" is valid: ${isValid}, found ${wordsToInsert.length} words to insert`);

        // Insert all found words into dictionary (ignore duplicates)
        if (wordsToInsert.length > 0) {
          console.log(`Inserting words into dictionary:`, wordsToInsert);
          
          for (const wordToInsert of wordsToInsert) {
            const { error: insertError } = await supabase
              .from('dictionary')
              .upsert({ word: wordToInsert }, { onConflict: 'word', ignoreDuplicates: true });
            
            if (insertError) {
              console.error(`Error inserting word "${wordToInsert}":`, insertError);
            }
          }
        }

        results[word] = isValid;
      } catch (apiError) {
        console.error(`API fetch error for word "${word}":`, apiError);
        results[word] = false;
      }
    }

    console.log('Validation results:', results);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-word function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
