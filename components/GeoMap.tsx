
import React, { useState, useMemo, useEffect } from 'react';
import { schoolsData } from '../data/autocompleteData';
import type { SchoolData } from '../types';

interface GeoMapProps {
  currentStudentAddress?: string;
  currentStudentName?: string;
}

const GeoMap: React.FC<GeoMapProps> = ({ currentStudentAddress, currentStudentName }) => {
  const [mapQuery, setMapQuery] = useState('Itaberaba, BA');
  const [searchAddress, setSearchAddress] = useState('');
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [isLocatingStudent, setIsLocatingStudent] = useState(false);

  useEffect(() => {
    // If a student address is provided when the component mounts, prompt or auto-load could happen.
    // Here we just set the initial view if desired, or let the user click "Localizar Aluno".
    if (currentStudentAddress) {
        setSearchAddress(currentStudentAddress);
    }
  }, [currentStudentAddress]);

  const mapSrc = useMemo(() => {
    // Encode the query for the map
    const query = encodeURIComponent(mapQuery);
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }, [mapQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      setMapQuery(`${searchAddress}, Itaberaba - BA`);
      setActiveSchoolId(null);
      setIsLocatingStudent(false);
    }
  };

  const handleLocateStudent = () => {
      if (currentStudentAddress) {
          setMapQuery(`${currentStudentAddress}, Itaberaba - BA`);
          setSearchAddress(currentStudentAddress);
          setIsLocatingStudent(true);
          setActiveSchoolId(null);
      }
  };

  const handleSchoolClick = (school: SchoolData) => {
    setMapQuery(`${school.name}, Itaberaba - BA`);
    setActiveSchoolId(school.id);
    setIsLocatingStudent(false);
  };

  const filteredSchools = useMemo(() => {
    if (!filterText) return schoolsData;
    const lower = filterText.toLowerCase();
    return schoolsData.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.zone.toLowerCase().includes(lower)
    );
  }, [filterText]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4 animate-fade-in-up">
      {/* Sidebar / Tools */}
      <div className="w-full lg:w-96 flex flex-col gap-4 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Ferramentas de Localização
            </h2>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
            
            {/* Student Locator Section */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h3 className="text-sm font-semibold text-indigo-900 mb-2">Localizar Residência</h3>
                <form onSubmit={handleSearch} className="space-y-2">
                    <div>
                        <input 
                            type="text" 
                            placeholder="Nome da Rua, Número" 
                            className="w-full px-3 py-2 border border-indigo-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                        />
                        <p className="text-[10px] text-indigo-600 mt-1">
                            Digite "Rua X" ou "Rua X, 123"
                        </p>
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Buscar no Mapa
                    </button>
                </form>

                {currentStudentAddress && (
                    <div className="mt-4 pt-3 border-t border-indigo-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-indigo-800">Aluno Atual:</span>
                            <span className="text-xs text-indigo-600 truncate max-w-[120px]" title={currentStudentName}>{currentStudentName || 'Sem nome'}</span>
                        </div>
                        <button 
                            onClick={handleLocateStudent}
                            className={`mt-2 w-full py-1.5 px-3 rounded text-xs font-medium transition-colors border flex items-center justify-center gap-1
                                ${isLocatingStudent 
                                    ? 'bg-indigo-200 text-indigo-800 border-indigo-300' 
                                    : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                            Ver Endereço Cadastrado
                        </button>
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* School Locator Section */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    Localizar Escolas
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">{filteredSchools.length}</span>
                </h3>
                <input 
                    type="text" 
                    placeholder="Filtrar escolas..." 
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
                <div className="space-y-2 max-h-[300px] lg:max-h-[calc(100vh-500px)] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredSchools.map(school => (
                        <div 
                            key={school.id}
                            onClick={() => handleSchoolClick(school)}
                            className={`p-3 rounded-md border cursor-pointer transition-all hover:shadow-md
                                ${activeSchoolId === school.id 
                                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' 
                                    : 'bg-white border-gray-200 hover:border-emerald-300'
                                }`}
                        >
                            <h4 className={`text-sm font-bold ${activeSchoolId === school.id ? 'text-emerald-800' : 'text-gray-800'}`}>
                                {school.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{school.address}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{school.zone}</span>
                                <span className="text-[10px] text-gray-400">Ver no mapa &rarr;</span>
                            </div>
                        </div>
                    ))}
                    {filteredSchools.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhuma escola encontrada.</p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Map Display */}
      <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            title="Mapa de Geolocalização"
            src={mapSrc}
            className="w-full h-full"
        ></iframe>
        
        {/* Map Overlay Info */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 max-w-sm pointer-events-none">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Visualizando:</p>
            <p className="text-sm font-medium text-gray-800 line-clamp-2">
                {isLocatingStudent ? `Residência: ${searchAddress}` : mapQuery.replace(', Itaberaba - BA', '')}
            </p>
        </div>
      </div>
    </div>
  );
};

export default GeoMap;
