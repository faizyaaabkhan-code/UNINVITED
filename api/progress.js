function cors(res,req){
 const configured=String(process.env.FRONTEND_ORIGIN||"https://faizyaaabkhan-code.github.io").split(",").map(function(x){return x.trim()}).filter(Boolean);
 const origin=req.headers.origin;
 if(origin&&configured.indexOf(origin)>=0)res.setHeader("Access-Control-Allow-Origin",origin);
 else res.setHeader("Access-Control-Allow-Origin",configured[0]);
 res.setHeader("Vary","Origin");
 res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
 res.setHeader("Access-Control-Allow-Methods","GET,PUT,OPTIONS");
}
function validProgress(p){
 if(!p||typeof p!=="object")return false;
 var lead=Number(p.lead),profile=Number(p.profileStage);
 if(!Number.isInteger(lead)||lead<0||lead>7)return false;
 if(!Number.isInteger(profile)||profile<0||profile>4)return false;
 var docs=Array.isArray(p.docs)?p.docs:[];
 var ids=docs.map(function(d){return d&&d.id}).filter(Boolean);
 if(ids.some(function(id){return ["ella","owen","interrogation","reconstruction"].indexOf(id)<0}))return false;
 var hasElla=ids.indexOf("ella")>=0,hasOwen=ids.indexOf("owen")>=0,hasInterrogation=ids.indexOf("interrogation")>=0;
 if(profile>=2&&!hasElla)return false;
 if(profile>=4&&!hasOwen)return false;
 if(lead>=4&&profile<1)return false;
 if(lead>=5&&profile<3)return false;
 if(lead>=7&&!p.iris)return false;
 if(p.iris&&lead<7)return false;
 if(p.facts&&p.facts.reconstructionConfirmed&&(!p.iris||!hasInterrogation||Number(p.lead)!==7))return false;
 if(p.final&&(!p.iris||!hasInterrogation||!(p.facts&&p.facts.interrogationSent)||!(p.facts&&p.facts.reconstructionConfirmed)))return false;
 if(p.final&&p.task!=="CASE CLOSED")return false;
 if(p.facts&&p.facts.interrogationSent&&!hasInterrogation)return false;
 if(p.facts&&p.facts.reconstructionConfirmed&&ids.indexOf("reconstruction")<0)return false;
 return true;
}
function isReset(p){
 return Number(p&&p.lead)===0&&Number(p&&p.profileStage)===0&&!p.iris&&!p.final&&Array.isArray(p.messages)&&p.messages.length===0;
}
function transitionAllowed(oldP,newP){
 if(!validProgress(newP))return false;
 if(!oldP)return Number(newP.lead)<=1;
 if(isReset(newP))return true;
 var oldLead=Number(oldP.lead)||0,newLead=Number(newP.lead)||0;
 var oldProfile=Number(oldP.profileStage)||0,newProfile=Number(newP.profileStage)||0;
 if(newLead<oldLead||newLead>oldLead+1)return false;
 if(newProfile<oldProfile||newProfile>oldProfile+1)return false;
 var oldInterrogation=!!(oldP.facts&&oldP.facts.interrogationSent);
 var newInterrogation=!!(newP.facts&&newP.facts.interrogationSent);
 var oldReconstruction=!!(oldP.facts&&oldP.facts.reconstructionConfirmed);
 var newReconstruction=!!(newP.facts&&newP.facts.reconstructionConfirmed);
 if(newInterrogation&&!oldInterrogation){
  if(!(oldLead===7&&oldP.iris&&newLead===7))return false;
 }
 if(newReconstruction&&!oldReconstruction){
  if(!(oldLead===7&&oldP.iris&&oldInterrogation&&newLead===7))return false;
 }
 if(newP.final&&!oldP.final){
  if(!(oldLead===7&&oldP.iris&&oldInterrogation&&oldReconstruction&&newLead===7))return false;
 }
 if(newLead===oldLead&&newProfile===oldProfile){
  var oldDocs=Array.isArray(oldP.docs)?oldP.docs.map(function(d){return d&&d.id}).filter(Boolean):[];
  var newDocs=Array.isArray(newP.docs)?newP.docs.map(function(d){return d&&d.id}).filter(Boolean):[];
  for(var i=0;i<oldDocs.length;i++)if(newDocs.indexOf(oldDocs[i])<0)return false;
  return true;
 }
 return true;
}
const {getFile,putFile}=require("../lib/github");
const {verify}=require("../lib/auth");
module.exports=async(req,res)=>{ cors(res,req); if(req.method==="OPTIONS")return res.status(204).end();
 try{
  const p=verify((req.headers.authorization||"").replace(/^Bearer\s+/i,""));
  if(!p)return res.status(401).json({error:"Session expired. Please sign in again."});
  const path=`data/players/${p.sub}.json`;
  const file=await getFile(path);
  if(!file)return res.status(404).json({error:"Player record not found."});
  const data=JSON.parse(file.content);
  if(req.method==="GET")return res.json({progress:data.progress||null});
  if(req.method==="PUT"){
   const progress=req.body&&req.body.progress;
   if(!transitionAllowed(data.progress||null,progress))return res.status(409).json({error:"Invalid case progression."});
   data.progress=progress;
   data.updatedAt=new Date().toISOString();
   await putFile(path,JSON.stringify(data,null,2),"Save case progress "+p.sub,file.sha);
   return res.json({ok:true});
  }
  return res.status(405).json({error:"Method not allowed"});
 }catch(e){return res.status(500).json({error:"Progress service error."})}
};