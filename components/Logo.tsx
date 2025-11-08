import React from 'react';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width="52" height="52" rx="8" fill="#0284c7" />
            <text 
                x="50%" 
                y="54%" 
                dominantBaseline="middle" 
                textAnchor="middle" 
                fontFamily="sans-serif" 
                fontSize="24" 
                fontWeight="600" 
                fill="white"
                letterSpacing="-1"
            >
                TS
            </text>
        </svg>
    );
};

export default Logo;