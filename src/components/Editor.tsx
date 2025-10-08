import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import Toolbar from './Toolbar';

const Editor: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleImageUpload = (file: File) => {
        setSelectedImage(file);
    };

    const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(event.target.value);
    };

    const handleGenerateImage = async () => {
        if (!selectedImage || !prompt) return;

        setLoading(true);
        try {
            // Call the API to generate the image
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ image: selectedImage, prompt }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setGeneratedImage(data.imageUrl);
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="editor">
            <ImageUpload onImageUpload={handleImageUpload} />
            <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Enter your prompt here..."
            />
            <Toolbar onGenerate={handleGenerateImage} loading={loading} />
            {loading && <p>Generating image...</p>}
            {generatedImage && <img src={generatedImage} alt="Generated" />}
        </div>
    );
};

export default Editor;