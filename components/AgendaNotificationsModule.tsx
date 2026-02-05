import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { syncService } from '../api/sync';

interface Event {
  id: string;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  tipo: string;
  prioridade: string;
  local?: string;
  cor?: string;
  diaInteiro?: boolean;
}

const AgendaNotificationsModule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get month/year info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0).toISOString();
        const data = await api.agenda.list({ startDate, endDate });
        setEvents(data);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();

    // Real-time updates
    const unsubCreate = syncService.on('agenda:created', (event) => {
      setEvents(prev => [event, ...prev]);
    });
    const unsubUpdate = syncService.on('agenda:updated', (event) => {
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    });
    const unsubDelete = syncService.on('agenda:deleted', ({ id }) => {
      setEvents(prev => prev.filter(e => e.id !== id));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, [year, month]);

  const handleSync = (provider: string) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert(`Sincronização com ${provider} concluída.`);
    }, 1500);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(1);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.getDate());
  };

  // Filter events for selected day
  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.dataInicio);
    return eventDate.getDate() === selectedDate && 
           eventDate.getMonth() === month && 
           eventDate.getFullYear() === year;
  });

  // Check if a day has events
  const dayHasEvents = (day: number) => {
    return events.some(e => {
      const eventDate = new Date(e.dataInicio);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === month && 
             eventDate.getFullYear() === year;
    });
  };

  // Check if day is today
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Format time from ISO string
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  // Priority colors
  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICA': return 'bg-red-100 text-red-600';
      case 'ALTA': return 'bg-amber-100 text-amber-600';
      case 'MEDIA': return 'bg-blue-100 text-blue-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Type icons
  const getTypeIcon = (tipo: string) => {
    switch (tipo?.toUpperCase()) {
      case 'REUNIAO': return 'fa-users';
      case 'VISITA': return 'fa-building';
      case 'AUDITORIA': return 'fa-clipboard-check';
      case 'MANUTENCAO': return 'fa-wrench';
      case 'PRAZO': return 'fa-flag';
      default: return 'fa-calendar';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Agenda Integrada</h2>
          <p className="text-slate-500 text-sm italic">Sincronizada com CRM, Projetos e SST em tempo real.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleSync('Gmail')}
            disabled={isSyncing}
            className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center shadow-sm disabled:opacity-50"
          >
            <i className="fab fa-google text-red-500 mr-2"></i> {isSyncing ? 'A sincronizar...' : 'Sincronizar Gmail'}
          </button>
          <button 
            onClick={() => handleSync('MS Project')}
            disabled={isSyncing}
            className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center shadow-sm disabled:opacity-50"
          >
            <i className="fas fa-diagram-project text-emerald-600 mr-2"></i> MSP Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-chevron-left text-slate-600"></i>
              </button>
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest min-w-[180px] text-center">
                {monthNames[month]} {year}
              </h3>
              <button 
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-chevron-right text-slate-600"></i>
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={goToToday}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
              >
                Hoje
              </button>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-white shadow-sm text-slate-800">Mês</button>
                <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Semana</button>
              </div>
            </div>
          </div>
          
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasEvents = dayHasEvents(day);
              const todayCheck = isToday(day);
              
              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-bold border transition-all ${
                    selectedDate === day 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105 z-10' 
                      : todayCheck 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-300' 
                        : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 text-slate-600'
                  }`}
                >
                  {day}
                  {hasEvents && (
                    <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${selectedDate === day ? 'bg-emerald-400' : todayCheck ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Events for Selected Day */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
              <i className="fas fa-clock-rotate-left mr-2"></i> 
              {selectedDate} de {monthNames[month]}
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">A carregar...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.length > 0 ? filteredEvents.map(ev => (
                  <div key={ev.id} className="group cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getPriorityStyle(ev.prioridade)}`}>
                        {ev.prioridade}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {ev.diaInteiro ? 'Dia inteiro' : formatTime(ev.dataInicio)}
                      </span>
                    </div>
                    <h5 className="text-xs font-black text-slate-800 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                      <i className={`fas ${getTypeIcon(ev.tipo)} text-slate-300`}></i>
                      {ev.titulo}
                    </h5>
                    {ev.local && (
                      <p className="text-[9px] text-slate-400 font-bold mt-1">
                        <i className="fas fa-location-dot mr-1"></i> {ev.local}
                      </p>
                    )}
                    <div className="mt-3 border-b border-slate-50"></div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <i className="fas fa-calendar-xmark text-slate-200 text-2xl mb-2"></i>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sem compromissos</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Weekly Summary */}
          <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Resumo do Mês</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span>Total Eventos</span>
                <span className="font-black">{events.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Próximos 7 dias</span>
                <span className="font-black">
                  {events.filter(e => {
                    const eventDate = new Date(e.dataInicio);
                    const sevenDaysFromNow = new Date();
                    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                    return eventDate <= sevenDaysFromNow && eventDate >= new Date();
                  }).length}
                </span>
              </div>
              <div className="h-px bg-white/20 my-2"></div>
              <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Exportar Agenda PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaNotificationsModule;
