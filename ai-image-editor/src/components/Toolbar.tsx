import React from 'react';

const Toolbar: React.FC<{ onGenerate: () => void }> = ({ onGenerate }) => {
    return (
        <div className="toolbar">
            <button onClick={onGenerate} className="generate-button">
                Generate Image
            </button>
            {/* Additional controls can be added here */}
        </div>
    );
};

export default Toolbar;