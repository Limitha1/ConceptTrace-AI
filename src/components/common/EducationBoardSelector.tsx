import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Check, 
  X, 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { 
  EDUCATION_BOARDS, 
  BOARD_CATEGORIES, 
  searchEducationBoards, 
  normalizeBoardToOption, 
  type BoardOption 
} from '../../lib/boardsData';

interface EducationBoardSelectorProps {
  value: string;
  onChange: (boardNameOrAcronym: string, boardOption: BoardOption, customName?: string) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
}

export const EducationBoardSelector: React.FC<EducationBoardSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label = '1. Education Board',
  required = true,
  error = null,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customBoardName, setCustomBoardName] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Match current value to known board option
  const selectedBoardOption = useMemo(() => {
    return normalizeBoardToOption(value);
  }, [value]);

  // If value is custom, store it in customBoardName
  useEffect(() => {
    if (selectedBoardOption.id === 'other_custom' && value && value !== 'Other' && value !== 'Other / Not Listed') {
      setCustomBoardName(value);
    }
  }, [selectedBoardOption, value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Grouped search results
  const groupedResults = useMemo(() => {
    return searchEducationBoards(searchQuery);
  }, [searchQuery]);

  // Flat list for keyboard navigation and count
  const flattenedOptions = useMemo(() => {
    const list: BoardOption[] = [];
    for (const cat of BOARD_CATEGORIES) {
      list.push(...(groupedResults[cat] || []));
    }
    return list;
  }, [groupedResults]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [flattenedOptions]);

  const handleSelectOption = (board: BoardOption) => {
    if (board.id === 'other_custom') {
      const finalName = customBoardName.trim() || 'Other';
      onChange(finalName, board, finalName);
    } else {
      onChange(board.acronym || board.name, board);
    }
    setIsOpen(false);
  };

  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomBoardName(text);
    const otherOption = EDUCATION_BOARDS.find(b => b.id === 'other_custom')!;
    onChange(text.trim() || 'Other', otherOption, text);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < flattenedOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : flattenedOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedOptions[highlightedIndex]) {
        handleSelectOption(flattenedOptions[highlightedIndex]);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {/* Label and Badge */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          All 28 States, 8 UTs & National Boards
        </span>
      </div>

      {/* Dropdown Closed Trigger Button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full py-3 px-4 rounded-2xl border text-left transition flex items-center justify-between gap-3 shadow-xs ${
            disabled 
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
              : isOpen
                ? 'bg-white border-purple-600 ring-2 ring-purple-500/20 shadow-md text-slate-900'
                : 'bg-slate-50/80 hover:bg-white hover:border-slate-300 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3 truncate min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              selectedBoardOption.isCurriculumDirectlyMapped 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-indigo-50 text-indigo-600'
            }`}>
              <GraduationCap className="w-4 h-4" />
            </div>

            <div className="truncate text-left space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {selectedBoardOption.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 shrink-0">
                  {selectedBoardOption.acronym}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {selectedBoardOption.stateOrRegion} • {selectedBoardOption.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedBoardOption.isCurriculumDirectlyMapped && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Official Board Curriculum
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu Popup */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Search Input Bar */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by state, board name, or acronym (e.g. CBSE, KSEAB, Maharashtra, UPMSP)..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-600 text-slate-900 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Listbox Container */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 overscroll-contain" role="listbox">
              {flattenedOptions.length === 0 ? (
                /* Friendly Empty State */
                <div className="p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      No board found for "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Try searching with the state name or acronym (e.g. Karnataka, BSEB, UPMSP). Or select Other below:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const other = EDUCATION_BOARDS.find(b => b.id === 'other_custom')!;
                      handleSelectOption(other);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Select "Other / Not Listed" Board
                  </button>
                </div>
              ) : (
                /* Grouped Categories */
                BOARD_CATEGORIES.map((category) => {
                  const boardsInCategory = groupedResults[category] || [];
                  if (boardsInCategory.length === 0) return null;

                  return (
                    <div key={category} className="py-2">
                      <div className="px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-50/50 flex items-center justify-between">
                        <span>{category}</span>
                        <span className="text-[9px] font-semibold text-purple-400">
                          {boardsInCategory.length} {boardsInCategory.length === 1 ? 'board' : 'boards'}
                        </span>
                      </div>

                      <div className="space-y-0.5 px-1.5 pt-1">
                        {boardsInCategory.map((board) => {
                          const isSelected = selectedBoardOption.id === board.id;
                          const flatIdx = flattenedOptions.findIndex(o => o.id === board.id);
                          const isHighlighted = highlightedIndex === flatIdx;

                          return (
                            <button
                              key={board.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleSelectOption(board)}
                              onMouseEnter={() => setHighlightedIndex(flatIdx)}
                              className={`w-full px-3 py-2.5 rounded-xl text-left transition flex items-center justify-between gap-3 text-xs ${
                                isSelected
                                  ? 'bg-purple-100/70 text-purple-950 font-bold'
                                  : isHighlighted
                                  ? 'bg-purple-50 text-slate-900 font-medium'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="space-y-0.5 truncate flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold truncate text-slate-900">
                                    {board.name}
                                  </span>
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                    isSelected 
                                      ? 'bg-purple-200 text-purple-900' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {board.acronym}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <span>{board.stateOrRegion}</span>
                                  {board.isCurriculumDirectlyMapped && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                        <ShieldCheck className="w-3 h-3" />
                                        Direct Syllabus
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Quick Help Bar */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                Select any recognized State, UT or National Board
              </span>
              <span className="font-semibold text-slate-600">
                {flattenedOptions.length} available
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Custom Board Name Input (Only appears when Other / Not Listed is selected) */}
      {selectedBoardOption.id === 'other_custom' && (
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-purple-900">
              Specify Your Board / School Authority Name:
            </label>
            <span className="text-[10px] text-purple-700 font-semibold">Custom / Specialized</span>
          </div>
          <input
            type="text"
            required
            value={customBoardName}
            onChange={handleCustomNameChange}
            placeholder="e.g. Anglo-Indian Board, Autonomous Military School Council, etc."
            className="w-full px-3.5 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-900 placeholder:text-slate-400 font-medium"
          />
          <p className="text-[11px] text-purple-800/80 leading-relaxed">
            ConceptTrace AI will automatically align standard national curriculum competencies to your custom board and allow custom PDF syllabus uploads.
          </p>
        </div>
      )}

      {/* Curriculum Note Tag */}
      {!selectedBoardOption.isCurriculumDirectlyMapped && selectedBoardOption.id !== 'other_custom' && (
        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>
            <strong>Curriculum Mapping:</strong> Aligned with {selectedBoardOption.curriculumTypeDescription}.
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
