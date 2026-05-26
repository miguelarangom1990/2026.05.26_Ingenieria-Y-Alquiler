
import React from 'react';
import { 
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  Construction, 
  HardHat, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  Database
} from 'lucide-react';
import { EquipmentStatus, Company, ConstructionSite, Equipment, Order } from '../types';
import { getGeminiAdvice } from '../services/geminiService';
import { seedDatabase } from '../services/firebaseService';

interface DashboardProps {
  companies: Company[];
  sites: ConstructionSite[];
  equipment: Equipment[];
  orders: Order[];
}

const Dashboard: React.FC<DashboardProps> = ({ companies, sites, equipment, orders }) => {
  const [advice, setAdvice] = React.useState<string>("Analizando datos de la flota...");
  const [loadingAdvice, setLoadingAdvice] = React.useState(true);
  const [isSeeding, setIsSeeding] = React.useState(false);

  const clientsList = React.useMemo(() => companies.filter(c => c.roles.includes('Cliente')), [companies]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      setIsSeeding(false);
      window.location.reload();
    } catch(e: any) {
      setIsSeeding(false);
      alert('Error al alimentar base de datos: ' + (e?.message || 'Revisa la consola'));
    }
  };

  React.useEffect(() => {
    const fetchAdvice = async () => {
      const rented = equipment.filter(e => e.status === EquipmentStatus.RENTED).length;
      const maintenance = equipment.filter(e => e.status === EquipmentStatus.MAINTENANCE).length;
      const validSites = sites.filter(s => !s.isVirtualObra);
      const context = `Tenemos ${equipment.length} equipos en total. ${rented} alquilados, ${maintenance} en mantenimiento. Hay ${validSites.length} obras registradas y ${clientsList.length} clientes activos.`;
      const aiAdvice = await getGeminiAdvice(context);
      setAdvice(aiAdvice);
      setLoadingAdvice(false);
    };
    fetchAdvice();
  }, [clientsList.length, sites, equipment.length]);

  const stats = [
    { label: 'Maquinaria Total', value: equipment.length, icon: Construction, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Obras Activas', value: sites.filter(s => s.status === 'Activa' && !s.isVirtualObra).length, icon: HardHat, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Clientes', value: clientsList.length, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Alquilados', value: equipment.filter(e => e.status === EquipmentStatus.RENTED).length, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const statusData = [
    { name: 'Disponibles', value: equipment.filter(e => e.status === EquipmentStatus.AVAILABLE).length },
    { name: 'Alquilados', value: equipment.filter(e => e.status === EquipmentStatus.RENTED).length },
    { name: 'Mantenimiento', value: equipment.filter(e => e.status === EquipmentStatus.MAINTENANCE).length },
  ];

  const rentalData = [
    { month: 'Ene', income: 4500 },
    { month: 'Feb', income: 5200 },
    { month: 'Mar', income: 4800 },
    { month: 'Abr', income: 6100 },
    { month: 'May', income: 7500 },
    { month: 'Jun', income: 6900 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resumen General</h1>
          <p className="text-slate-500">Estado actual de la flota y operaciones en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          {orders.length === 0 && (
            <button 
              onClick={handleSeedData} 
              disabled={isSeeding}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
            >
              <Database size={16} />
              {isSeeding ? 'Cargando...' : 'Cargar Datos de Prueba'}
            </button>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600">
            <Clock size={16} />
            Sincronizado
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform">
          <Sparkles size={120} />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Gemini AI Insights
              <span className="px-2 py-0.5 bg-green-400 text-green-900 text-[10px] uppercase font-bold rounded-full">En Vivo</span>
            </h3>
            <div className="text-indigo-50 leading-relaxed max-w-3xl">
              {loadingAdvice ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                </div>
              ) : (
                <p className="italic text-sm md:text-base leading-relaxed whitespace-pre-line">{advice}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
              <TrendingUp className="text-green-500" size={16} />
            </div>
            <div className="space-y-1">
              <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              Ingresos Mensuales
              <span className="text-xs font-normal text-slate-400">USD</span>
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rentalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} 
                  activeDot={{r: 6}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-900 mb-8">Estado de la Flota</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
