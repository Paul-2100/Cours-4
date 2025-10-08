import React from 'react';

interface ToolbarProps {
    onGenerate: () => void | Promise<void>;
    loading?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ onGenerate, loading = false }) => {
    return (
        <div className="toolbar">
            <button
                onClick={onGenerate}
                className="generate-button"
                disabled={loading}
            >
                {loading ? 'Generating…' : 'Generate Image'}
            </button>
            {/* Additional controls can be added here */}
        </div>
    );
};

export default Toolbar;
