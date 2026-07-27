import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, PackageCheck, PackagePlus, RefreshCcw, ShieldCheck, XCircle } from 'lucide-react';
import './inventory-request-tool.css';
import './inventory-request-backend.css';
import './inventory-double-stock.css';

const REQUESTS_KEY='ema-inventory-requests-v1';

function loadRequests(){
  try{return JSON.parse(localStorage.getItem(REQUESTS_KEY)||'[]')}catch{return []}
}

export default function InventoryRequestTool({scope,lang}){
  const isEn=lang==='en';
  const categories=scope.inventory.categories[lang];
  const clinical=scope.inventory.type==='clinical';
  const emptyForm={item:'',category:categories[0],onHand:'',floorStock:'',reserveStock:'',lot:'',expiration:'',quantity:'',priority:'normal',reason:''};
  const [form,setForm]=useState(emptyForm);
  const [requests,setRequests]=useState(loadRequests);
  const [storageMode,setStorageMode]=useState('loading');
  useEffect(()=>setForm(current=>categories.includes(current.category)?current:{...current,category:categories[0]}),[lang,scope.id]);
  useEffect(()=>{let active=true;fetch(`/api/inventory/requests?scopeId=${encodeURIComponent(scope.id)}`).then(response=>{if(!response.ok)throw new Error();return response.json()}).then(payload=>{if(active){setRequests(payload.requests||[]);setStorageMode('backend')}}).catch(()=>{if(active)setStorageMode('local')});return()=>{active=false}},[scope.id]);
  const scopedRequests=requests.filter(request=>request.scopeId===scope.id);
  const update=(field,value)=>setForm(current=>({...current,[field]:value}));
  const submit=async event=>{
    event.preventDefault();
    if(!form.item.trim()||!form.quantity||Number(form.quantity)<=0||!form.reason.trim())return;
    const floorStock=clinical?Number(form.floorStock||0):undefined;const reserveStock=clinical?Number(form.reserveStock||0):undefined;
    const draft={scopeId:scope.id,role:scope.title,inventoryType:scope.inventory.type,item:form.item.trim(),category:form.category,onHand:clinical?floorStock+reserveStock:Number(form.onHand||0),floorStock,reserveStock,lot:clinical?form.lot.trim()||undefined:undefined,expiration:clinical?form.expiration||undefined:undefined,quantity:Number(form.quantity),priority:form.priority,reason:form.reason.trim()};
    let request;
    try{const response=await fetch('/api/inventory/requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(draft)});if(!response.ok)throw new Error();request=(await response.json()).request;setStorageMode('backend')}catch{request={...draft,id:`${scope.id}-${Date.now()}`,status:'pending',createdAt:new Date().toISOString()};setStorageMode('local')}
    const next=[request,...requests.filter(item=>item.id!==request.id)];setRequests(next);localStorage.setItem(REQUESTS_KEY,JSON.stringify(next));
    setForm({...emptyForm,category:categories[0]});
  };
  const decide=async(id,status)=>{let decided;try{const response=await fetch(`/api/inventory/requests/${encodeURIComponent(id)}/decision`,{method:'PATCH',headers:{'content-type':'application/json','x-actor-role':'manager'},body:JSON.stringify({status})});if(!response.ok)throw new Error();decided=(await response.json()).request;setStorageMode('backend')}catch{decided={...requests.find(request=>request.id===id),status,decidedAt:new Date().toISOString()};setStorageMode('local')}const next=requests.map(request=>request.id===id?decided:request);setRequests(next);localStorage.setItem(REQUESTS_KEY,JSON.stringify(next))};
  const statusLabel=status=>status==='approved'?(isEn?'Approved':'Aprobado'):status==='rejected'?(isEn?'Rejected':'Rechazado'):(isEn?'Pending manager approval':'Pendiente de aprobación');
  const priorityLabel=value=>value==='urgent'?(isEn?'Urgent':'Urgente'):value==='low'?(isEn?'Low':'Baja'):(isEn?'Normal':'Normal');

  return <section className="inventory-request-tool">
    <header><div><span><PackagePlus size={17}/>{isEn?'INVENTORY REQUEST WORKFLOW':'FLUJO DE PEDIDO DE INVENTARIO'}</span><h3>{scope.inventory.title[lang]}</h3><p>{scope.inventory.owner[lang]}</p></div><aside><ShieldCheck size={20}/><div><strong>{isEn?'Manager approval required':'Requiere aprobación del manager'}</strong><small>{storageMode==='backend'?(isEn?'Shared backend connected':'Backend compartido conectado'):storageMode==='local'?(isEn?'Local fallback mode':'Modo local provisional'):(isEn?'Connecting…':'Conectando…')}</small></div></aside></header>
    <div className="inventory-examples"><strong>{isEn?'Inventory includes':'El inventario incluye'}</strong><div>{scope.inventory.examples[lang].map(item=><span key={item}>{item}</span>)}</div></div>
    {scope.inventory.doubleStock&&<section className="double-stock-policy"><header><RefreshCcw size={22}/><div><span>{isEn?'AUTOMATIC REPLENISHMENT TRIGGER':'DISPARADOR AUTOMÁTICO DE REPOSICIÓN'}</span><h4>{scope.inventory.doubleStock.title[lang]}</h4></div></header><p>{scope.inventory.doubleStock.summary[lang]}</p><div>{scope.inventory.doubleStock.states[lang].map((state,index)=><span key={state} className={index===1?'trigger':''}><i>{index+1}</i>{state}</span>)}</div></section>}
    <section className="inventory-control-rules"><strong>{isEn?'Required inventory controls':'Controles obligatorios del inventario'}</strong><ul>{scope.inventory.controls[lang].map(item=><li key={item}><CheckCircle2 size={15}/>{item}</li>)}</ul></section>
    <div className="inventory-tool-layout">
      <form onSubmit={submit}>
        <div className="inventory-form-heading"><ClipboardList size={20}/><div><span>{isEn?'EMPLOYEE REQUEST':'SOLICITUD DEL COLABORADOR'}</span><h4>{isEn?'Create the replenishment request':'Crear el pedido de reposición'}</h4></div></div>
        <label>{isEn?'Item or product':'Artículo o producto'}<input required value={form.item} onChange={event=>update('item',event.target.value)} placeholder={isEn?'Exact item, presentation or size':'Artículo exacto, presentación o tamaño'}/></label>
        <label>{isEn?'Category':'Categoría'}<select value={form.category} onChange={event=>update('category',event.target.value)}>{categories.map(category=><option key={category}>{category}</option>)}</select></label>
        {clinical?<><div className="inventory-number-row"><label>{isEn?'Floor stock':'Stock en el piso'}<input min="0" type="number" value={form.floorStock} onChange={event=>update('floorStock',event.target.value)} placeholder="1"/></label><label>{isEn?'Sealed reserve stock':'Stock de reserva sellado'}<input min="0" type="number" value={form.reserveStock} onChange={event=>update('reserveStock',event.target.value)} placeholder="1"/></label></div><div className={`reserve-trigger ${form.reserveStock!==''&&Number(form.reserveStock)===0?'required':'covered'}`}>{form.reserveStock!==''&&Number(form.reserveStock)===0?<AlertTriangle size={17}/>:<ShieldCheck size={17}/>}<span>{form.reserveStock!==''&&Number(form.reserveStock)===0?(isEn?'Reserve moved to floor: replenishment is required now.':'La reserva pasó al piso: la reposición se requiere ahora.'):(isEn?'Enter floor and reserve separately. One reserve unit maintains double stock.':'Registra piso y reserva por separado. Una unidad en reserva mantiene el doble stock.')}</span></div><div className="inventory-number-row"><label>{isEn?'Lot number':'Número de lote'}<input value={form.lot} onChange={event=>update('lot',event.target.value)} placeholder={isEn?'If applicable':'Si corresponde'}/></label><label>{isEn?'Expiration':'Vencimiento'}<input type="date" value={form.expiration} onChange={event=>update('expiration',event.target.value)}/></label></div></>:<label>{isEn?'Usable on hand':'Existencia utilizable'}<input min="0" type="number" value={form.onHand} onChange={event=>update('onHand',event.target.value)} placeholder="0"/></label>}
        <label>{isEn?'Quantity requested':'Cantidad solicitada'}<input required min="1" type="number" value={form.quantity} onChange={event=>update('quantity',event.target.value)} placeholder="1"/></label>
        <label>{isEn?'Priority':'Prioridad'}<select value={form.priority} onChange={event=>update('priority',event.target.value)}><option value="low">{isEn?'Low':'Baja'}</option><option value="normal">{isEn?'Normal':'Normal'}</option><option value="urgent">{isEn?'Urgent — explain operational risk':'Urgente — explicar riesgo operacional'}</option></select></label>
        <label>{isEn?'Operational reason':'Razón operacional'}<textarea required value={form.reason} onChange={event=>update('reason',event.target.value)} placeholder={isEn?'Explain the shortage, minimum level and expected impact…':'Explica el faltante, nivel mínimo e impacto esperado…'}/></label>
        <button type="submit"><PackagePlus size={17}/>{isEn?'Submit for manager approval':'Enviar para aprobación del manager'}</button>
      </form>

      <section className="manager-approval-queue">
        <div className="inventory-form-heading"><PackageCheck size={20}/><div><span>{isEn?'MANAGER QUEUE':'COLA DEL MANAGER'}</span><h4>{isEn?'Review and decide':'Revisar y decidir'}</h4></div></div>
        <p className="manager-queue-note">{isEn?'The request does not authorize a purchase. An authorized manager must verify need, quantity, budget and required clinical or pharmacy controls.':'La solicitud no autoriza la compra. Un manager autorizado debe verificar necesidad, cantidad, presupuesto y controles clínicos o farmacéuticos requeridos.'}</p>
        {scopedRequests.length===0?<div className="empty-inventory-queue"><ClipboardList size={24}/><strong>{isEn?'No requests yet':'Todavía no hay pedidos'}</strong><span>{isEn?'Complete the form to create the first pending request.':'Completa el formulario para crear el primer pedido pendiente.'}</span></div>:<div className="inventory-request-list">{scopedRequests.map(request=><article key={request.id} className={request.status}><header><div><strong>{request.item}</strong><span>{request.category}</span></div><em>{statusLabel(request.status)}</em></header><div className="inventory-request-facts">{request.floorStock!==null&&request.floorStock!==undefined&&<span>{isEn?'Floor':'Piso'}: <b>{request.floorStock}</b></span>}{request.reserveStock!==null&&request.reserveStock!==undefined&&<span>{isEn?'Reserve':'Reserva'}: <b>{request.reserveStock}</b></span>}<span>{isEn?'Usable total':'Total utilizable'}: <b>{request.onHand}</b></span><span>{isEn?'Requested':'Solicitado'}: <b>{request.quantity}</b></span><span>{isEn?'Priority':'Prioridad'}: <b>{priorityLabel(request.priority)}</b></span>{request.lot&&<span>{isEn?'Lot':'Lote'}: <b>{request.lot}</b></span>}{request.expiration&&<span>{isEn?'Expiration':'Vencimiento'}: <b>{request.expiration}</b></span>}</div><p>{request.reason}</p>{request.status==='pending'?<footer><button className="approve" onClick={()=>decide(request.id,'approved')}><CheckCircle2 size={15}/>{isEn?'Approve':'Aprobar'}</button><button className="reject" onClick={()=>decide(request.id,'rejected')}><XCircle size={15}/>{isEn?'Reject':'Rechazar'}</button></footer>:<footer className="decision-record"><ShieldCheck size={15}/>{isEn?'Manager decision recorded':'Decisión del manager registrada'}</footer>}</article>)}</div>}
      </section>
    </div>
  </section>;
}
