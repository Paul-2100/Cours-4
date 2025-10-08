import React from 'react';

interface ImageUploadProps {
    onFileSelect: (file: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        onFileSelect(file);
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