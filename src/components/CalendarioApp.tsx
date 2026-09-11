import React, { useState, useEffect } from 'react';
import { addMonths, subMonths, format, getDaysInMonth, startOfMonth, isWeekend, getYear, getMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, UserPlus, Pencil, Trash2, Printer, FolderDot, Plus, Check, Download, Lock } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';
import { useLeaveStore } from '@/hooks/useLeaveStore';
import { useProjectStore } from '@/hooks/useProjectStore';
import { LeaveType, LEAVE_COLORS, LEAVE_DOTS, LEAVE_LABELS, LEAVE_INITIALS } from '@/types';
import { cn } from '@/lib/utils';
import { MonthTable } from '@/components/MonthTable';

export function CalendarioApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('isAuthenticated') === 'true'
  );
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [currentDate, setCurrentDate] = useState(() => new Date()); // Apre il calendario sul mese corrente

  const [activeLeaveType, setActiveLeaveType] = useState<LeaveType | null>('ferie');
  const [newPersonName, setNewPersonName] = useState('');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [showPrintMessage, setShowPrintMessage] = useState(false);
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPrintDates, setSelectedPrintDates] = useState<string[]>([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  // Custom modals for project management
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState<string | null>(null);
  
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isEditingMainTitle, setIsEditingMainTitle] = useState(false);
  
  const { projects, currentProjectId, switchProject, addProject, updateProjectName, removeProject, loading: projectsLoading } = useProjectStore();
  const { people, leaves, loading: leavesLoading, addPerson, removePerson, updatePersonName, toggleLeave, copyPeopleFromMonth } = useLeaveStore(currentProjectId);

  const loading = projectsLoading || leavesLoading;
  
  const currentProject = projects.find(p => p.id === currentProjectId);
  const displayTitle = currentProject?.name || 'Pianificazione Ferie';

  const currentMonthStr = format(currentDate, 'yyyy-MM');
  const visiblePeople = people.filter(p => p.monthStr === currentMonthStr || !p.monthStr);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === 'admin' && loginPassword === 'giuseppe') {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuthenticated', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#E2E8F4_0%,#D3E8F5_50%,#C1F0E4_100%)] font-sans p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 text-[#5B60F6] rounded-xl flex items-center justify-center">
              <Lock size={24} className="stroke-[2.5]" />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-center text-slate-900 mb-2">Accedi</h2>
          <p className="text-center text-slate-500 text-sm mb-8">Inserisci le credenziali per visualizzare il calendario.</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome utente</label>
              <input 
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B60F6] focus:ring-1 focus:ring-[#5B60F6] transition-all"
                placeholder="Inserisci il nome utente"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input 
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B60F6] focus:ring-1 focus:ring-[#5B60F6] transition-all"
                placeholder="Inserisci la password"
              />
            </div>
            
            {loginError && (
              <p className="text-rose-500 text-sm text-center font-medium">Credenziali non valide. Riprova.</p>
            )}

            <button 
              type="submit"
              className="w-full bg-[#5B60F6] hover:bg-[#4A4FD1] text-white py-3 rounded-xl font-semibold mt-2 transition-colors shadow-sm"
            >
              Entra
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));

  const monthStart = startOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(getYear(currentDate), getMonth(currentDate), i + 1));

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    addPerson(newPersonName, currentMonthStr);
    setNewPersonName('');
  };

  const handleDayClick = (personId: string, dateStr: string) => {
    if (activeLeaveType) {
      toggleLeave(personId, dateStr, activeLeaveType);
    }
  };

  const handleOpenPrintModal = () => {
    // Default to currently viewed month
    setSelectedPrintDates([format(startOfMonth(currentDate), 'yyyy-MM-dd')]);
    setShowPrintModal(true);
  };

  const togglePrintMonth = (dateStr: string) => {
    setSelectedPrintDates(prev => 
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handlePrintConfirm = () => {
    setShowPrintModal(false);
    if (window.self !== window.top) {
      setShowPrintMessage(true);
      setTimeout(() => setShowPrintMessage(false), 5000);
    } else {
      setTimeout(() => window.print(), 100);
    }
  };

  const handleExportPdf = async () => {
    setShowPrintModal(false);
    setIsExportingPdf(true);
    
    // Attendi che il DOM si aggiorni per mostrare il container di stampa
    setTimeout(async () => {
      try {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const sortedDates = [...selectedPrintDates].sort();
        
        for (let i = 0; i < sortedDates.length; i++) {
          const dateStr = sortedDates[i];
          const element = document.getElementById(`pdf-month-${dateStr}`);
          
          if (element) {
            const dataUrl = await domtoimage.toPng(element, {
              scale: 2,
              style: {
                transform: 'scale(1)',
                transformOrigin: 'top left'
              }
            });
            
            if (i > 0) {
              pdf.addPage();
            }
            
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });
            
            // Scaliamo l'immagine per adattarsi perfettamente alla pagina (un mese per foglio)
            const scaleWidth = pdfWidth / img.width;
            const scaleHeight = pdfHeight / img.height;
            const scale = Math.min(scaleWidth, scaleHeight);
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Centra orizzontalmente se l'altezza limita la larghezza
            const xOffset = (pdfWidth - scaledWidth) / 2;
            
            pdf.addImage(dataUrl, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
          }
        }
        
        pdf.save('calendario-ferie.pdf');
      } catch (error) {
        console.error("Error generating PDF", error);
        alert("Si è verificato un errore durante la generazione del PDF.");
      } finally {
        setIsExportingPdf(false);
      }
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#E2E8F4_0%,#D3E8F5_50%,#C1F0E4_100%)] font-sans">
        <div className="bg-white/80 backdrop-blur px-8 py-4 rounded-full shadow-sm text-slate-500 font-medium animate-pulse">
          Caricamento calendario in corso...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 bg-[linear-gradient(135deg,#E2E8F4_0%,#D3E8F5_50%,#C1F0E4_100%)] print:bg-white print:bg-none font-sans relative">
      {showPrintMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <span>⚠️</span>
          Per stampare, apri l'app in una nuova scheda (usa l'icona in alto a destra)
        </div>
      )}

      {/* Header Container */}
      <header className="bg-white/90 backdrop-blur-sm print:bg-white print:backdrop-blur-none rounded-[2rem] print:rounded-none p-6 md:p-8 shadow-sm print:shadow-none print:p-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-1 py-1 pr-3">
              <div className="w-8 h-8 rounded-full bg-[#5B60F6] text-white flex items-center justify-center font-bold text-sm">
                F
              </div>
              <span className="text-[#5B60F6] font-bold tracking-wider text-xs uppercase ml-1">Ferie Flow</span>
            </div>
            
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="relative">
              <button 
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <FolderDot size={16} className="text-slate-400" />
                {projects.find(p => p.id === currentProjectId)?.name || 'Caricamento...'}
              </button>
              
              {showProjectMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-3 pt-2">I Miei Progetti</div>
                    <div className="max-h-60 overflow-y-auto">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center group">
                          <button
                            onClick={() => {
                              switchProject(project.id);
                              setShowProjectMenu(false);
                            }}
                            className={cn(
                              "flex-1 text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors",
                              currentProjectId === project.id ? "bg-slate-50 text-[#5B60F6] font-medium" : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            {currentProjectId === project.id ? <Check size={14} /> : <div className="w-[14px]"></div>}
                            
                            {editingProjectId === project.id ? (
                              <input
                                autoFocus
                                defaultValue={project.name}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                  updateProjectName(project.id, e.target.value || project.name);
                                  setEditingProjectId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateProjectName(project.id, e.currentTarget.value || project.name);
                                    setEditingProjectId(null);
                                  }
                                }}
                                className="bg-white border border-[#5B60F6] rounded px-1 py-0.5 text-sm w-full focus:outline-none"
                              />
                            ) : (
                              <span className="truncate">{project.name}</span>
                            )}
                          </button>
                          
                          {currentProjectId === project.id && editingProjectId !== project.id && (
                            <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200"
                              >
                                <Pencil size={12} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setDeleteProjectConfirm(project.id);
                                }}
                                disabled={projects.length <= 1}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="h-px bg-slate-100 my-2"></div>
                    
                    <button
                      onClick={() => {
                        setNewProjectName('');
                        setNewProjectModal(true);
                        setShowProjectMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium"
                    >
                      <Plus size={16} />
                      Crea nuovo progetto
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mb-2 group">
            {isEditingMainTitle ? (
              <input
                type="text"
                autoFocus
                defaultValue={displayTitle}
                className="text-3xl md:text-4xl font-serif text-slate-900 bg-white border border-[#5B60F6] rounded-xl px-4 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-[#5B60F6]/20"
                onBlur={(e) => {
                  if (currentProjectId) updateProjectName(currentProjectId, e.target.value || displayTitle);
                  setIsEditingMainTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (currentProjectId) updateProjectName(currentProjectId, e.currentTarget.value || displayTitle);
                    setIsEditingMainTitle(false);
                  }
                  if (e.key === 'Escape') {
                    setIsEditingMainTitle(false);
                  }
                }}
              />
            ) : (
              <h1 className="text-3xl md:text-4xl font-serif text-slate-900 flex items-center gap-4 cursor-pointer" onClick={() => setIsEditingMainTitle(true)}>
                {displayTitle}
                <button 
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all print:hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingMainTitle(true);
                  }}
                  title="Rinomina calendario"
                >
                  <Pencil size={20} />
                </button>
                <span className="hidden print:inline-block text-2xl font-normal text-slate-500">
                  - {format(currentDate, 'MMMM yyyy', { locale: it })}
                </span>
              </h1>
            )}
          </div>
          <p className="text-slate-500 text-sm md:text-base print:hidden">Calendario mensile · assegna i giorni di riposo al team</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto print:hidden">
          <div className="flex items-center bg-white border border-slate-200 rounded-full px-2 py-1.5 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-semibold text-slate-800 min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <form onSubmit={handleAddPerson} className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Aggiungi nome" 
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="bg-white border border-slate-200 rounded-full px-4 py-2.5 text-sm w-full sm:w-40 focus:outline-none focus:border-[#5B60F6] focus:ring-1 focus:ring-[#5B60F6] shadow-sm"
            />
            <button 
              type="submit"
              className="bg-[#5B60F6] hover:bg-[#4A4FD1] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
            >
              <UserPlus size={16} />
              Aggiungi
            </button>
          </form>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => {
                const prevMonth = subMonths(currentDate, 1);
                const prevMonthStr = format(prevMonth, 'yyyy-MM');
                copyPeopleFromMonth(prevMonthStr, currentMonthStr);
              }}
              title="Copia i nomi dal mese precedente"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <FolderDot size={16} />
              Copia mese prec.
            </button>
            <button onClick={handleOpenPrintModal} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto justify-center">
              <Printer size={16} />
              Stampa
            </button>
          </div>
        </div>
      </header>

      {/* Grid Container - Interactive (Hidden on print) */}
      <div className={cn("flex-1 flex flex-col", isExportingPdf ? "hidden" : "print:hidden")}>
        <MonthTable 
          currentDate={currentDate}
          people={visiblePeople}
          leaves={leaves}
          activeLeaveType={activeLeaveType}
          editingPersonId={editingPersonId}
          onDayClick={handleDayClick}
          onUpdatePersonName={updatePersonName}
          onSetEditingPersonId={setEditingPersonId}
          onRemovePerson={removePerson}
        />
      </div>

      {/* Print-only grids (Hidden on screen) */}
      <div id="pdf-export-container" className={cn("w-full bg-white", isExportingPdf ? "block" : "hidden print:block")}>
        {selectedPrintDates.sort().map(dateStr => {
          const monthDate = new Date(dateStr);
          const printMonthStr = format(monthDate, 'yyyy-MM');
          const printPeople = people.filter(p => p.monthStr === printMonthStr || !p.monthStr);
          return (
            <div 
              key={monthDate.toISOString()}
              id={`pdf-month-${dateStr}`}
              className={cn(
                "p-8 flex flex-col bg-white mx-auto",
                isExportingPdf ? "w-[1580px] min-h-[1117px]" : "w-full break-after-page"
              )}
            >
              <MonthTable 
                currentDate={monthDate}
                people={printPeople}
                leaves={leaves}
                activeLeaveType={activeLeaveType}
                editingPersonId={null}
                isPrintVersion={true}
                projectName={displayTitle}
              />
              {/* Notes box to fill remaining space */}
              <div className="mt-6 flex-1 min-h-[150px] border-2 border-slate-200 rounded-xl p-5 flex flex-col bg-slate-50/50">
                <h3 className="text-xl font-serif font-bold text-slate-800 mb-2">Note & Variazioni</h3>
                <div className="flex-1 w-full opacity-60" style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)',
                  backgroundPosition: '0 1.5rem'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>

      <p className={cn("text-center text-sm text-slate-500/80 mt-2 font-medium print:hidden", isExportingPdf ? "hidden" : "")}>
        Ferie Flow · clicca su un giorno per assegnare o cambiare un'assenza
      </p>

      {/* Print Config Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Esporta e Stampa</h2>
            <p className="text-sm text-slate-500 mb-6">Scegli i mesi dell'anno corrente che desideri includere nel documento.</p>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              {Array.from({ length: 12 }, (_, i) => new Date(getYear(currentDate), i, 1)).map(monthDate => {
                const dateStr = format(monthDate, 'yyyy-MM-dd');
                const isSelected = selectedPrintDates.includes(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => togglePrintMonth(dateStr)}
                    className={cn(
                      "p-3 rounded-xl border text-sm font-semibold transition-all",
                      isSelected 
                        ? "bg-[#5B60F6] border-[#5B60F6] text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="capitalize">{format(monthDate, 'MMM', { locale: it })}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              <button 
                onClick={() => setShowPrintModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors order-3 sm:order-1"
              >
                Annulla
              </button>
              <button 
                onClick={handlePrintConfirm}
                disabled={selectedPrintDates.length === 0}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm order-2 sm:order-2"
              >
                <Printer size={16} />
                Stampa
              </button>
              <button 
                onClick={handleExportPdf}
                disabled={selectedPrintDates.length === 0}
                className="w-full sm:w-auto bg-[#5B60F6] hover:bg-[#4A4FD1] disabled:opacity-50 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm order-1 sm:order-3"
              >
                <Download size={16} />
                Scarica PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {newProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Nuovo Progetto</h2>
            <p className="text-sm text-slate-500 mb-6">Inserisci un nome per il tuo nuovo progetto.</p>
            
            <input 
              autoFocus
              type="text" 
              placeholder="Nome progetto" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProjectName.trim()) {
                  addProject(newProjectName);
                  setNewProjectModal(false);
                }
              }}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm w-full mb-6 focus:outline-none focus:border-[#5B60F6] focus:ring-1 focus:ring-[#5B60F6] shadow-sm"
            />

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setNewProjectModal(false)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={() => {
                  if (newProjectName.trim()) {
                    addProject(newProjectName);
                    setNewProjectModal(false);
                  }
                }}
                disabled={!newProjectName.trim()}
                className="bg-[#5B60F6] hover:bg-[#4A4FD1] disabled:opacity-50 text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Check size={16} />
                Crea Progetto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirm Modal */}
      {deleteProjectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Elimina Progetto</h2>
            <p className="text-sm text-slate-500 mb-6">Sei sicuro di voler eliminare questo progetto? Tutti i dati (persone e ferie) verranno persi per sempre.</p>

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setDeleteProjectConfirm(null)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={() => {
                  removeProject(deleteProjectConfirm);
                  setDeleteProjectConfirm(null);
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Trash2 size={16} />
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
