import React from 'react';

interface ImageUploadProps {
    onImageUpload: (file: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        onImageUpload(file);
    };

    return (
        <div>
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
            />
        </div>
    );
};

export default ImageUpload;
