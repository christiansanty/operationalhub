import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const privateRoot=path.resolve('private');
const databasePath=path.join(privateRoot,'operational-hub.sqlite');

function openDatabase(){
  mkdirSync(privateRoot,{recursive:true,mode:0o700});
  const database=new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS inventory_requests (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL,
      role_json TEXT NOT NULL,
      inventory_type TEXT NOT NULL,
      item TEXT NOT NULL,
      category TEXT NOT NULL,
      on_hand INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL,
      priority TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      decided_at TEXT,
      floor_stock INTEGER,
      reserve_stock INTEGER,
      lot TEXT,
      expiration TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_inventory_scope_status ON inventory_requests(scope_id,status,created_at);
  `);
  const columns=new Set(database.prepare('PRAGMA table_info(inventory_requests)').all().map(column=>column.name));
  if(!columns.has('floor_stock'))database.exec('ALTER TABLE inventory_requests ADD COLUMN floor_stock INTEGER');
  if(!columns.has('reserve_stock'))database.exec('ALTER TABLE inventory_requests ADD COLUMN reserve_stock INTEGER');
  if(!columns.has('lot'))database.exec('ALTER TABLE inventory_requests ADD COLUMN lot TEXT');
  if(!columns.has('expiration'))database.exec('ALTER TABLE inventory_requests ADD COLUMN expiration TEXT');
  return database;
}

const mapRequest=row=>({...row,role:JSON.parse(row.role_json),scopeId:row.scope_id,inventoryType:row.inventory_type,onHand:row.on_hand,floorStock:row.floor_stock,reserveStock:row.reserve_stock,createdAt:row.created_at,decidedAt:row.decided_at||undefined,role_json:undefined,scope_id:undefined,inventory_type:undefined,on_hand:undefined,floor_stock:undefined,reserve_stock:undefined,created_at:undefined,decided_at:undefined});

export function listInventoryRequests(scopeId){
  const database=openDatabase();
  try{
    const rows=scopeId?database.prepare('SELECT * FROM inventory_requests WHERE scope_id = ? ORDER BY created_at DESC').all(scopeId):database.prepare('SELECT * FROM inventory_requests ORDER BY created_at DESC').all();
    return rows.map(mapRequest);
  }finally{database.close()}
}

export function createInventoryRequest(payload){
  const required=['scopeId','role','inventoryType','item','category','quantity','priority','reason'];
  if(required.some(field=>payload[field]===undefined||payload[field]===null||payload[field]===''))throw new Error('Missing required inventory request fields');
  const quantity=Number(payload.quantity);const onHand=Number(payload.onHand||0);
  if(!Number.isInteger(quantity)||quantity<1||!Number.isInteger(onHand)||onHand<0)throw new Error('Invalid inventory quantities');
  if(!['low','normal','urgent'].includes(payload.priority))throw new Error('Invalid priority');
  const request={id:`inv-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,scopeId:String(payload.scopeId).slice(0,80),role:payload.role,inventoryType:String(payload.inventoryType).slice(0,40),item:String(payload.item).trim().slice(0,240),category:String(payload.category).trim().slice(0,160),onHand,quantity,priority:payload.priority,reason:String(payload.reason).trim().slice(0,1000),status:'pending',createdAt:new Date().toISOString(),floorStock:payload.floorStock===undefined?null:Number(payload.floorStock),reserveStock:payload.reserveStock===undefined?null:Number(payload.reserveStock),lot:payload.lot?String(payload.lot).trim().slice(0,120):null,expiration:payload.expiration?String(payload.expiration).slice(0,20):null};
  if(request.floorStock!==null&&(!Number.isInteger(request.floorStock)||request.floorStock<0))throw new Error('Invalid floor stock');
  if(request.reserveStock!==null&&(!Number.isInteger(request.reserveStock)||request.reserveStock<0))throw new Error('Invalid reserve stock');
  const database=openDatabase();
  try{database.prepare('INSERT INTO inventory_requests (id,scope_id,role_json,inventory_type,item,category,on_hand,quantity,priority,reason,status,created_at,decided_at,floor_stock,reserve_stock,lot,expiration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(request.id,request.scopeId,JSON.stringify(request.role),request.inventoryType,request.item,request.category,request.onHand,request.quantity,request.priority,request.reason,request.status,request.createdAt,null,request.floorStock,request.reserveStock,request.lot,request.expiration)}finally{database.close()}
  return request;
}

export function decideInventoryRequest(id,status){
  if(!['approved','rejected'].includes(status))throw new Error('Invalid manager decision');
  const decidedAt=new Date().toISOString();
  const database=openDatabase();
  try{
    const result=database.prepare("UPDATE inventory_requests SET status = ?, decided_at = ? WHERE id = ? AND status = 'pending'").run(status,decidedAt,id);
    if(result.changes!==1)throw new Error('Pending inventory request not found');
    return mapRequest(database.prepare('SELECT * FROM inventory_requests WHERE id = ?').get(id));
  }finally{database.close()}
}
