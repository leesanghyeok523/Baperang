import React from 'react';

export interface InputCardProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 필드 위에 표시할 레이블 텍스트 */
  label?: string;
  /** 추가 클래스명 */
  className?: string;
}

const InputCard: React.FC<InputCardProps> = ({ label, className = '', ...props }) => (
  <div className={`flex flex-col space-y-1 ${className}`}>
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input
      {...props}
      className="
        w-full
        px-4 py-5
        bg-white/50
        rounded-2xl
        text-gray-800
        placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-green-500
      "
    />
  </div>
);

export default InputCard;
