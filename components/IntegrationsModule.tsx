
import React from 'react';

const IntegrationsModule: React.FC = () => {
  const providers = [
    { name: 'WhatsApp Business API', icon: 'fa-whatsapp text-emerald-500', status: 'Pronto p/ API', sync: 'Webhooks / HSM' },
    { name: 'Apache POI (Excel Engine)', icon: 'fa-file-excel text-green-600', status: 'Ativo', sync: 'Import/Export' },
    { name: 'MPXJ (MS Project Sync)', icon: 'fa-diagram-project text-emerald-600', status: 'Configurado', sync: '.mpp / .xml' },
    { name: 'iText/PDF Generator', icon: 'fa-file-pdf text-red-500', status: 'Ativo', sync: 'Reports/SST' },
    { name: 'RabbitMQ Service', icon: 'fa-envelope-open-text text-orange-500', status: 'Online', sync: 'Filas de Notificação' },
  ];

  const technicalSpecs = [
    { label: 'Autenticação', value: 'Spring Security + JWT (Stateless)' },
    { label: 'Mensageria', value: 'RabbitMQ (Event-driven OS flow)' },
    { label: 'Cache & Session', value: 'Redis (KPI Acceleration)' },
    { label: 'Relatórios', value: 'JasperReports / iText (ISO Compliant)' }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Middleware & Integrações</h2>
          <p className="text-slate-500 text-sm italic">Configurações de backend para processamento de dados externos.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Serviços de Terceiros & Parsing</h3>
          <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full">ESTADO: PRODUÇÃO</span>
        </div>
        <div className="divide-y divide-slate-100">
          {providers.map((p, i) => (
            <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-xl">
                  <i className={`fab ${p.icon.includes('fa-') ? p.icon : 'fas ' + p.icon}`}></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Protocolo: {p.sync}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase border ${p.status === 'Online' || p.status === 'Ativo' || p.status === 'Pronto p/ API' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                  {p.status}
                </span>
                <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl transition-all">Logs</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-server text-7xl rotate-12"></i>
          </div>
          <h4 className="font-black uppercase text-[10px] tracking-widest mb-6 text-emerald-400">Especificações Técnicas (Spring Boot)</h4>
          <div className="space-y-4">
            {technicalSpecs.map((spec, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{spec.label}</span>
                <span className="text-xs font-black">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-black uppercase text-[10px] tracking-widest mb-1 opacity-80">WhatsApp Business API</h4>
            <p className="text-lg font-bold leading-tight">Canal de Alertas SST</p>
            <p className="text-xs opacity-75 mt-2 italic font-medium leading-relaxed">
              O backend processa eventos de "Nova Não Conformidade" ou "OS Urgente" e dispara mensagens via Webhooks para as equipas no terreno.
            </p>
          </div>
          <button className="w-full mt-6 bg-white text-emerald-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-800/20">
            Configurar Webhooks
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsModule;
