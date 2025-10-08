import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadImage = async (file: File) => {
    const { data, error } = await supabase.storage.from('images').upload(`uploads/${file.name}`, file);
    if (error) {
        throw new Error(error.message);
    }
    return data.Key;
};

export const generateImage = async (prompt: string) => {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
        throw new Error('Failed to generate image');
    }
    const data = await response.json();
    return data.imageUrl;
};

export const saveProjectData = async (projectData: any) => {
    const { data, error } = await supabase.from('projects').insert([projectData]);
    if (error) {
        throw new Error(error.message);
    }
    return data;
};