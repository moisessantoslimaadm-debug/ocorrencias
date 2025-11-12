
import React from 'react';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <h2 className="w-full bg-emerald-600 text-white p-2.5 text-lg font-semibold rounded-t-md mt-6">
      {title}
    </h2>
  );
};

export default SectionHeader;
