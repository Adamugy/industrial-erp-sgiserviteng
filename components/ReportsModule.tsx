
import React from 'react';

const ReportsModule: React.FC = () => {
  const handleExportPDF = () => {
    alert("O relatório de Produtividade foi gerado e o download do PDF começará em instantes.");
  };

  const handleExportExcel = () => {
    alert("O arquivo Excel do Fluxo de Caixa Projetado está sendo preparado.");
  };

  const dataMapping = [
    { module: 'CRM', entities: 'Clientes, Propostas, Purchase Orders (PO)', keyFields: 'Valor, Status, Validade' },
    { module: 'Projetos', entities: 'Obras, Ordens de Serviço (OS), Fases', keyFields: 'Progresso, Cronograma, Custo' },
    { module: 'SST/Qualidade', entities: 'APR, Permissões de Trabalho (PT), NCs', keyFields: 'Severidade, Checklist, Auditoria' },
    { module: 'Equipas/HR', entities: 'Colaboradores, Timesheets, Escalas', keyFields: 'Horas, Especialidade, Liderança' },
    { module: 'Inventário', entities: 'Materiais, Ativos (Frota), Requisições', keyFields: 'Stock, Prox. Manutenção, Custo Médio' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">BI & Dicionário de Dados</h2>
          <p className="text-slate-500 text-sm font-medium italic">Visão geral para sincronização com o Backend (PostgreSQL/Spring Boot).</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card: Exportação */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
             <i className="fas fa-chart-line text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">Exportação de Indicadores</h3>
          <div className="mt-6 flex flex-col w-full space-y-3">
            <button onClick={handleExportPDF} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              <i className="fas fa-file-pdf mr-2"></i> PDF: Produtividade ISO
            </button>
            <button onClick={handleExportExcel} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              <i className="fas fa-file-excel mr-2"></i> Excel: Fluxo de Caixa
            </button>
          </div>
        </div>

        {/* Card: Dicionário de Entidades */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Arquitetura de Dados (Mapeamento Backend)</h4>
          <div className="space-y-3">
            {dataMapping.map((map, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-800 uppercase">{map.module}</span>
                  <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">SQL TABLE</span>
                </div>
                <p className="text-[10px] text-slate-600 font-medium mt-1">Entidades: <span className="font-bold text-slate-800">{map.entities}</span></p>
                <p className="text-[9px] text-slate-400 italic">Campos-Chave: {map.keyFields}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integrações */}
      <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fas fa-database text-6xl"></i>
         </div>
         <div className="relative z-10">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">Monitorização de Streams & RabbitMQ</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Msgs/Seg', val: '142' },
                 { label: 'Job Queue', val: '02' },
                 { label: 'Uptime API', val: '99.9%' },
                 { label: 'DB Latency', val: '12ms' }
               ].map((st, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{st.label}</p>
                    <p className="text-xl font-black text-white">{st.val}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default ReportsModule;
