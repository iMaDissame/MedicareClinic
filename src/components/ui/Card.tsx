import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-pink-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;