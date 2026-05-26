import React from 'react';
import { History, LogOut, Truck, PackagePlus, CheckCircle2 } from 'lucide-react';
import { Order, OrderStatus, MaintenanceStatus } from '../types';
import { MAINTENANCE_COLUMNS, REVISION_CHECKLIST_DEVOLUCION, REVISION_CHECKLIST_REMISION } from '../constants/orders';

const getRevisionChecklist = (order: Order) => {
  return order.tipoTransporte === 'devolucion' ? REVISION_CHECKLIST_DEVOLUCION : REVISION_CHECKLIST_REMISION;
};

export const StepIndicator = ({ status, compact = false }: { status: OrderStatus, compact?: boolean }) => {
  const steps = [
    { id: 'PEDIDO', label: 'Solicitud' },
    { id: 'EN_LOGISTICA', label: 'Logística' },
    { id: 'EN_TRANSPORTE', label: 'Transporte' },
    { id: 'FINALIZADO', label: 'Revision Docs' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);

  return (
    <div className={`w-full ${compact ? 'py-2 px-0 max-w-xl' : 'py-8 px-4 max-w-2xl mx-auto'}`}>
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 rounded-full z-0"></div>
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-indigo-500 rounded-full transition-all duration-700 ease-in-out z-0"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Circle */}
              <div className={`rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                compact ? 'w-8 h-8' : 'w-10 h-10'
              } ${
                isCompleted ? 'bg-indigo-600 border-indigo-100 text-white shadow-sm' :
                isActive ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg scale-110' :
                'bg-white border-slate-200 text-slate-300'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className={compact ? "w-4 h-4" : "w-5 h-5"} />
                ) : (
                  <span className={compact ? "text-xs font-bold" : "text-sm font-bold"}>{index + 1}</span>
                )}
              </div>
              
              {/* Label */}
              <div className={`absolute ${compact ? 'top-10' : 'top-12'} whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
                isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MaintenanceStepIndicator = ({ status, compact = false }: { status: MaintenanceStatus, compact?: boolean }) => {
  const steps = MAINTENANCE_COLUMNS.map(col => ({
    id: col.status,
    label: col.title
  }));

  const currentStepIndex = steps.findIndex(s => s.id === status);

  return (
    <div className={`w-full ${compact ? 'py-2 px-0 max-w-xl' : 'py-8 px-4 max-w-2xl mx-auto'}`}>
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-100 rounded-full z-0"></div>
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-orange-500 rounded-full transition-all duration-700 ease-in-out z-0"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Circle */}
              <div className={`rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                compact ? 'w-8 h-8' : 'w-10 h-10'
              } ${
                isCompleted ? 'bg-orange-600 border-orange-100 text-white shadow-sm' :
                isActive ? 'bg-white border-orange-600 text-orange-600 shadow-lg scale-110' :
                'bg-white border-slate-200 text-slate-300'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className={compact ? "w-4 h-4" : "w-5 h-5"} />
                ) : (
                  <span className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`}>{index + 1}</span>
                )}
              </div>
              
              {/* Label */}
              <span className={`absolute top-full mt-2 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
                isActive ? 'text-orange-600' :
                isCompleted ? 'text-slate-600' :
                'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MiniStepIndicator = ({ order }: { order: Order }) => {
  const steps = [
    { id: 'PEDIDO', label: 'Solicitud', icon: History },
    { id: 'EN_LOGISTICA', label: 'Logística', icon: LogOut },
    { id: 'EN_TRANSPORTE', label: 'Transporte', icon: Truck },
    { id: 'FINALIZADO', label: 'Revision Docs', icon: PackagePlus }
  ];

  const getStageStatus = (stageId: string) => {
    const stageOrder = ['PEDIDO', 'EN_LOGISTICA', 'EN_TRANSPORTE', 'FINALIZADO'];
    const currentStageIndex = stageOrder.indexOf(order.status);
    const stageIndex = stageOrder.indexOf(stageId);

    if (stageIndex > currentStageIndex) {
      return 'gray';
    }

    switch (stageId) {
      case 'PEDIDO': {
        const verifiedCount = order.items.filter(i => i.proveedor).length;
        const totalCount = order.items.length;
        if (verifiedCount === totalCount && totalCount > 0) return 'green';
        if (verifiedCount > 0) return 'orange';
        return 'red';
      }
      case 'EN_LOGISTICA': {
        const mandatory = order.logisticsInfo?.transportista && 
                          order.logisticsInfo?.tipoVehiculo;
        const optional = order.logisticsInfo?.cobroTransporte &&
                         (order.logisticsInfo?.razonTransporte && order.logisticsInfo.razonTransporte.length > 0);
        
        if (!mandatory) return 'red';
        if (!optional) return 'orange';
        return 'green';
      }
      case 'EN_TRANSPORTE': {
        const mandatory = true;
        const hasProviders = order.items && order.items.length > 0;
        const optional = hasProviders && order.items.every(item => {
          const provider = item.proveedor || "Sin Proveedor";
          const data = order.transportInfo?.providerData?.[provider];
          const hasRmDv = order.transportInfo?.providerRmDvAttachments?.[provider]?.length;
          return data?.fechaCobroSub && data?.fechaTransporteSub && data?.numAlterno && hasRmDv;
        });
        
        if (!mandatory) return 'red';
        if (!optional) return 'orange';
        return 'green';
      }
      case 'FINALIZADO': {
        const checklist = getRevisionChecklist(order);
        const checklistComplete = Object.values(order.checklist || {}).filter(Boolean).length === checklist.length;
        if (checklistComplete) return 'green';
        return 'orange';
      }
      default: return 'gray';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step) => {
        const status = getStageStatus(step.id);
        const Icon = step.icon;
        const colorClass = 
          status === 'green' ? 'text-emerald-600' :
          status === 'orange' ? 'text-orange-500' :
          status === 'red' ? 'text-red-600' : 'text-slate-300';
        
        return (
          <div key={step.id} className="flex items-center gap-2 min-w-0">
            <Icon className={`w-4 h-4 shrink-0 ${colorClass}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${colorClass}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const HeaderStepIndicator = ({ order }: { order: Order }) => {
  const steps = [
    { id: 'PEDIDO', label: 'Solicitud', icon: History },
    { id: 'EN_LOGISTICA', label: 'Logística', icon: LogOut },
    { id: 'EN_TRANSPORTE', label: 'Transporte', icon: Truck },
    { id: 'FINALIZADO', label: 'Revision Docs', icon: PackagePlus }
  ];

  const getStageStatus = (stageId: string) => {
    const stageOrder = ['PEDIDO', 'EN_LOGISTICA', 'EN_TRANSPORTE', 'FINALIZADO'];
    const currentStageIndex = stageOrder.indexOf(order.status);
    const stageIndex = stageOrder.indexOf(stageId);

    if (stageIndex > currentStageIndex) {
      return 'gray';
    }

    switch (stageId) {
      case 'PEDIDO': {
        const verifiedCount = order.items.filter(i => i.proveedor).length;
        const totalCount = order.items.length;
        if (verifiedCount === totalCount && totalCount > 0) return 'green';
        if (verifiedCount > 0) return 'orange';
        return 'red';
      }
      case 'EN_LOGISTICA': {
        const mandatory = order.logisticsInfo?.transportista && 
                          order.logisticsInfo?.tipoVehiculo;
        const optional = order.logisticsInfo?.cobroTransporte &&
                         (order.logisticsInfo?.razonTransporte && order.logisticsInfo.razonTransporte.length > 0);
        
        if (!mandatory) return 'red';
        if (!optional) return 'orange';
        return 'green';
      }
      case 'EN_TRANSPORTE': {
        const mandatory = true;
        const hasProviders = order.items && order.items.length > 0;
        const optional = hasProviders && order.items.every(item => {
          const provider = item.proveedor || "Sin Proveedor";
          const data = order.transportInfo?.providerData?.[provider];
          const hasRmDv = order.transportInfo?.providerRmDvAttachments?.[provider]?.length;
          return data?.fechaCobroSub && data?.fechaTransporteSub && data?.numAlterno && hasRmDv;
        });
        
        if (!mandatory) return 'red';
        if (!optional) return 'orange';
        return 'green';
      }
      case 'FINALIZADO': {
        const checklist = getRevisionChecklist(order);
        const checklistComplete = Object.values(order.checklist || {}).filter(Boolean).length === checklist.length;
        if (checklistComplete) return 'green';
        return 'orange';
      }
      default: return 'gray';
    }
  };

  return (
    <div className="hidden lg:flex items-center gap-3 max-w-xs">
      {steps.map((step, index) => {
        const status = getStageStatus(step.id);
        const Icon = step.icon;
        const colorClass = 
          status === 'green' ? 'text-emerald-600 border-emerald-600 bg-emerald-50' :
          status === 'orange' ? 'text-orange-500 border-orange-500 bg-orange-50' :
          status === 'red' ? 'text-red-500 border-red-500 bg-red-50' : 'text-slate-300 border-slate-200 bg-white';

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-0.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[8px] uppercase font-bold tracking-tighter whitespace-nowrap ${
                status === 'green' ? 'text-emerald-600' :
                status === 'orange' ? 'text-orange-500' :
                status === 'red' ? 'text-red-500' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-[1px] flex-1 min-w-[10px] rounded-full ${
                status === 'green' ? 'bg-emerald-500' : 'bg-slate-100'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Types are now imported from ./types