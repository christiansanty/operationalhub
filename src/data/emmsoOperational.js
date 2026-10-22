export const EMMMSO_BASE_URL='https://airtable.com/appCtkLVbC33nRuh1/shrEiLgWd1FJvHWdJ';

const providerUrl=(tableId,viewId,recordId)=>`${EMMMSO_BASE_URL}/${tableId}/${viewId}/${recordId}?blocks=bipLH6GwhbnK9ZIh3`;
const contractsTableUrl=`${EMMMSO_BASE_URL}/tblj4UDvibvJEytwn/viwBggUymls6WM3l5?blocks=bipLH6GwhbnK9ZIh3`;

const provider=(recordId,name,degree,role,lifecycle='active',entity='Provider Network',extra={})=>({
  recordId,
  name,
  initials:name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(),
  degree,
  role,
  entity,
  lifecycle,
  workMode:'onsite',
  compliance:lifecycle==='active'?'review':'archived',
  license:`${degree||'Credential'} · Airtable`,
  source:'EM-MSO · ROSTER - PROVIDERS',
  sourceRecordUrl:providerUrl('tbl3UZkcI9386wBul','viwVa2W83orz7yHpc',recordId),
  sourceAttachments:[],
  ...extra,
});

// Sanitized fallback from the connected public EM-MSO roster. DOB, SSN and
// PERSONAL DOC are intentionally excluded from the application payload.
export const emmsoProviderSnapshot=[
  provider('recaJrEXorhgciybx','Raymond Molano','MD','Internal Medicine','active','Provider Network',{
    npi:'1417070376',licenseNumber:'ME108810',medicare:'L2707',medicaid:'008495800',dea:'FM2667268',caqh:'12186647',hospital:'HCA Florida Saint Lucie Hospital',
    sourceAttachments:[
      {category:'contract',filename:'EXPEDIENTE LABORAL RAYMOND MOLANO.pdf'},
      {category:'contract',filename:'Medical Director Agreement Raymond Molano.jpg'},
      {category:'contract',filename:'Raymond Molano, MD Eastern Medical CV RESEARCH.docx'},
      {category:'contract',filename:'MX-M4051_20250528_055547.pdf'},
      {category:'license',filename:'DEA Raymond Molano.jpg'},
      {category:'license',filename:'LICENSE.pdf'},
      {category:'license',filename:'DR Molano License.pdf'},
      {category:'license',filename:'Dr.Molano CV 2020.pdf'},
    ],
  }),
  provider('recS2c9gAYtigdcMt','Aleida Maxima Hernandez','MD','Internal Medicine','inactive'),
  provider('recxCReIphEXRsNWC','Aaron Chen','DO','Dermatology'),
  provider('recKT2QktCuoNDGHl','David Walton Crasto','DO','Dermatology'),
  provider('reckGHrj0zBuAKR3y','Daniel Soler','DPT','Physical Therapy'),
  provider('recOcIN7m2RWK63e7','Carlos Mirabal','PT','Physical Therapy'),
  provider('recqL5fmJjR1ihL7p','Humberto Fernandez Miro','MD','Physical Therapy'),
  provider('reccKMjztv4FHhzLT','Neena Chandrasekaran','Medical Director','MD · Eastern Medical Center','active','Eastern Medical Center'),
  provider('recQtiJ7ni6SqUKud','Yannier Ferrer Martinez','Research','Research','inactive','Eastern Medical Research',{entityKey:'research'}),
  provider('recwsnY4YzP9fSfZz','Kimberly Chin-Lin Chen','Research','Research','active','Eastern Medical Research',{entityKey:'research'}),
  provider('recRvpbyM0FAS9674','Giralt Yanez Ramos','MD','Research','active','Eastern Medical Research',{entityKey:'research'}),
  provider('recml3gMTPQyTv4SS','Alan Gerard Lakhan','MD, PhD, FAAN','PCP · Neurology · Pain Management','inactive'),
  provider('rec7ZNs0wY37TWGT3','Shaheen Rodil','Credential','Psychiatry','inactive'),
  provider('rechZOtioT9i3gtT7','Maria Vinardell','MD','Research · Cardiology','inactive','Eastern Medical Research',{entityKey:'research'}),
  provider('rec4rucFOZc26bHcB','Juan Manuel Montero Barcelo','APRN','General Practice Registered Nurse'),
  provider('recRkYw7tn7cbDrOG','Ramon Johnson','MD','Research','active','Eastern Medical Research',{entityKey:'research'}),
  provider('recCYJ90bwfBxIk4H','Barbara Minerva Moreda','MD','Rheumatology'),
];

const contract=(insurance,status='unknown',products='',notes='',extra={})=>({
  id:extra.recordId||insurance.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
  insurance,
  partner:insurance,
  status,
  products,
  notes,
  source:'EM-MSO · Insurance Contracts',
  sourceRecordUrl:extra.recordId?`${contractsTableUrl.replace('?blocks=','/'+extra.recordId+'?blocks=')}`:contractsTableUrl,
  attachments:extra.attachments||[],
  attachmentCount:extra.attachmentCount||extra.attachments?.length||0,
});

// Real carrier rows observed in the connected EM-MSO Insurance Contracts view.
// The API sync replaces this fallback with the complete Airtable payload.
export const emmsoContractSnapshot=[
  contract('Solis','active','Medicare and Medicaid','Provider: Dr Aleida Hernandez · Dr Aaron Chen',{recordId:'recw6lrmyEQnUaHfz',attachments:['SOLIS CONTRACTING 1.pdf','SOLIS CONTRACTING 2.pdf','SOLIS CONTRACTING 3.pdf','SOLIS CONTRACTING 4.pdf']}),
  contract('Aetna 305','active','Commercial HMO, PPO, EPO, POS and Medicare','Physical-therapy contracting and network follow-up.',{recordId:'recIEi58eRbblbvuf'}),
  contract('Aetna E.M.C','inactive','Commercial HMO, PPO, EPO, POS and Medicare','',{recordId:'recVPYquDJduuE3We'}),
  contract('Aetna Commercial E.M.G','active','Commercial HMO and PPO','',{recordId:'recCDdELX4Crm05ft'}),
  contract('AVMED','unknown','Commercial Group · Entrust only','Carrier contact and contracting record on file.',{recordId:'recm4E6ezhXI2q9GJ',attachmentCount:1}),
  contract('BCBS HMO','progress','Health Options','PCP expansion requested for all locations, with Fort Myers prioritized.',{recordId:'recRCZRpr8gE8VJzW'}),
  contract('BCBS PPO','unknown','Preferred Patient Care','PCP expansion requested for all locations.',{recordId:'recYKl2HAkMC8syEC',attachmentCount:1}),
  contract('Bright','inactive','','',{recordId:'recd38YScgF2ETIkx'}),
  contract('Care Source','unknown','HMO Medicare Advantage · effective 2025','',{recordId:'recNE2Z0gw5mnE5E8',attachmentCount:1}),
  contract('CIGNA','active','Commercial and ACA','Credentialing and contract-upload follow-up documented in Airtable.',{recordId:'reclsCElNMQH6yoqf'}),
  contract('Florida Blue','active','BlueCare, BlueOptions and BlueMedicare product families','Roster expansion and new-doctor IDs are tracked in Airtable.',{recordId:'recsrlfaFr0rWD4un',attachmentCount:3}),
  contract('Free Medicare','active','Medicare EMG','',{recordId:'recTNXv4uwVpXUKGg'}),
  contract('Humana Behavior','unknown','Commercial, Medicare and EAP products','',{recordId:'recUB8LfUyYJYBMuK'}),
  contract('Humana Medicine','progress','Commercial HMO/PPO/POS/EPO, Medicare and physical therapy','Capitation-contract follow-up is documented in Airtable.',{attachmentCount:1}),
  contract('Longevity','unknown','',''),
  contract('Medicaid','active','Simply and Molina',''),
  contract('Molina - EMG','unknown','Medicaid, Florida KidCare, Medicare and Marketplace','EFT and product participation details are recorded in Airtable.',{attachmentCount:4}),
  contract('Multi Plan','unknown','PPO',''),
  contract('Oscar','inactive','Commercial products',''),
  contract('Simply','active','Medicare','Medicaid and CAQH roster work is documented in Airtable.',{attachmentCount:5}),
  contract('Simply Healthcare','active','',''),
  contract('Sunhealth - Medplan','active','Discount plans · patient-paid visit',''),
  contract('Sunshine Health','unknown','','Associated Medical Care MSO contact pending.',{attachmentCount:3}),
  contract('United Health Care - EMG','active','United Commercial',''),
  contract('Practice Choice MSO','progress','Oscar, Cigna, ACA, CarePlus and United','Entity and provider configuration is tracked in Airtable.'),
  contract('Amerihealth Caritas','active','Amerihealth Caritas and VIP Care','Active effective 04/23/2025; contracts and roster were submitted.',{attachmentCount:11}),
  contract('Well Care - 305, FM','unknown','',''),
  contract('WELLPOINT','progress','','Invitation and faxed-letter follow-up is recorded in Airtable.'),
  contract('AMBETTER EMG','active','Physical Therapy',''),
  contract('AMBETTER EMC','active','PCP','Roster update is documented in Airtable.',{attachmentCount:7}),
  contract('MEDICARE','progress','305 Medical Care',''),
  contract('DOCTOR MSO 305 MEDICAL','progress','Ambetter / Oscar capitation','February 17, 2026 milestone recorded in Airtable.',{attachmentCount:1}),
  contract('305 AMERIHEALTH','active','',''),
  contract('Oscar 305','active','Doctors MSO','',{attachmentCount:16}),
];

export const emmsoLicenseSnapshot=[];

export const emmsoSourceStatus={
  source:'Airtable · EM-MSO',
  baseId:'appCtkLVbC33nRuh1',
  state:'snapshot',
  mode:'public-share-snapshot',
  apiConnected:false,
  discovered:{providers:18,contracts:38},
  imported:{providers:emmsoProviderSnapshot.length,contracts:emmsoContractSnapshot.length,licenses:0},
  message:'The connected token must be granted access to EM-MSO before the protected backend can synchronize every field and attachment automatically.',
  baseUrl:EMMMSO_BASE_URL,
};
