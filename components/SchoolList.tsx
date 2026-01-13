
import React, { useMemo, useState } from 'react';
import { schoolsData } from '../data/autocompleteData';
import { SchoolData } from '../types';

interface SchoolListProps {
  onSelectSchool: (school: SchoolData) => void;
}

const SchoolList: React.FC<SchoolListProps> = ({ onSelectSchool }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return schoolsData;
    const lowerSearch = searchTerm.toLowerCase();
    return schoolsData.filter(
      school => 
        school.name.toLowerCase().includes(lowerSearch) || 
        school.zone.toLowerCase().includes(lowerSearch) ||
        school.inep.includes(lowerSearch)
    );
  }, [searchTerm]);

  const groupedSchools = useMemo(() => {
    const groups: { [key: string]: SchoolData[] } = {};
    filteredSchools.forEach(school => {
      if (!groups[school.zone]) {
        groups[school.zone] = [];
      }
      groups[school.zone].push(school);
    });
    // Sort zones for consistent display (optional)
    return Object.keys(groups).sort().reduce((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {} as { [key: string]: SchoolData[] });
  }, [filteredSchools]);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800">Unidades Escolares</h2>
        <p className="text-gray-600 mt-2">Selecione uma escola para visualizar ocorrências e dados específicos.</p>
        
        <div className="max-w-xl mx-auto mt-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                placeholder="Buscar por nome da escola, zona ou INEP..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSchools).map(([zone, schools]) => (
          <div key={zone} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                <h3 className="text-lg font-bold text-gray-800">{zone}</h3>
                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
                    {schools.length} Escolas
                </span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {schools.map(school => (
                <button
                  key={school.id}
                  onClick={() => onSelectSchool(school)}
                  className="flex flex-col h-full bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-emerald-400 transition-all duration-300 group text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <svg className="w-6 h-6 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">INEP: {school.inep}</span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 group-hover:text-emerald-700 line-clamp-2 min-h-[2.5rem]">
                    {school.name}
                  </h4>
                  
                  <div className="mt-auto space-y-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Dir. {school.director}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {school.phone}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedSchools).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                <p className="text-gray-500">Nenhuma escola encontrada com esse termo de busca.</p>
                <button onClick={() => setSearchTerm('')} className="mt-2 text-emerald-600 font-medium hover:underline">Limpar busca</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default SchoolList;
