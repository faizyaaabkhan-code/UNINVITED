function cors(res,req){
 const configured=String(process.env.FRONTEND_ORIGIN||"https://faizyaaabkhan-code.github.io").split(",").map(function(x){return x.trim()}).filter(Boolean);
 const origin=req.headers.origin;
 if(origin&&configured.indexOf(origin)>=0)res.setHeader("Access-Control-Allow-Origin",origin);
 else res.setHeader("Access-Control-Allow-Origin",configured[0]);
 res.setHeader("Vary","Origin");
 res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
 res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
}
const {getFile,putFile}=require("../lib/github");
const {hashPassword,verifyPassword,sign,id,caseCode}=require("../lib/auth");
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
 if(p.facts&&p.facts.reconstructionConfirmed&&!(p.docs||[]).some(function(d){return d&&d.id==="reconstruction"}))return false;
 return true;
}
module.exports=async(req,res)=>{ cors(res,req); if(req.method==="OPTIONS")return res.status(204).end();
 try{
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const body=req.body&&typeof req.body==="string"?JSON.parse(req.body):(req.body||{}); const {action}=body;
  const indexPath="data/index.json";
  const idxFile=await getFile(indexPath);
  const idx=idxFile?JSON.parse(idxFile.content):{players:{},codes:{}};
  if(action==="create"){
    const {name,email,password}=body;
    const initialProgress=body.progress||null;
    if(!name||!email||!password||password.length<8)return res.status(400).json({error:"Name, email, and password (8+ characters) are required."});
    if(initialProgress&&!validProgress(initialProgress))return res.status(400).json({error:"Invalid case progress."});
    let code=caseCode();
    while(idx.codes[code]) code=caseCode();
    const emailKey=email.trim().toLowerCase();
    if(Object.values(idx.players).some(p=>p.email===emailKey))return res.status(409).json({error:"An account with this email already exists."});
    const playerId=id();
    const ph=hashPassword(password);
    const player={id:playerId,name:name.trim(),email:emailKey,password:ph,caseCode:code,createdAt:new Date().toISOString()};
    idx.players[playerId]={id:playerId,name:player.name,email:player.email,caseCode:code};
    idx.codes[code]={code,status:"active",playerId,createdAt:new Date().toISOString()};
    await putFile("data/index.json",JSON.stringify(idx,null,2),"Register player "+playerId,idxFile&&idxFile.sha);
    await putFile(`data/players/${playerId}.json`,JSON.stringify({player,progress:initialProgress},null,2),"Create player "+playerId);
    const token=sign({sub:playerId,caseCode:code,exp:Date.now()+1000*60*60*24*30});
    return res.json({token,player:{id:playerId,name:player.name,email:player.email,caseCode:code},progress:initialProgress});
  }
  if(action==="login"){
    const {email,password}=body;
    const idxFile=await getFile("data/index.json");
    const idx=idxFile?JSON.parse(idxFile.content):{players:{},codes:{}};
    const emailKey=String(email||"").trim().toLowerCase();
    const p=Object.values(idx.players).find(x=>x.email===emailKey);
    if(!p)return res.status(401).json({error:"No account was found for that email address."});
    const pf=await getFile(`data/players/${p.id}.json`);
    if(!pf)return res.status(500).json({error:"Player record is missing."});
    const full=JSON.parse(pf.content);
    if(!verifyPassword(password,full.player.password.salt,full.player.password.hash))return res.status(401).json({error:"The email or password is incorrect."});
    const token=sign({sub:p.id,caseCode:p.caseCode,exp:Date.now()+1000*60*60*24*30});
    return res.json({token,player:{id:p.id,name:p.name,email:p.email,caseCode:p.caseCode},progress:full.progress||null});
  }
  if(action==="codeLogin"){
    const code=String(body.caseCode||"").trim().toUpperCase();
    const rec=idx.codes[code];
    if(!rec||!rec.playerId)return res.status(401).json({error:"That case code was not found."});
    const p=idx.players[rec.playerId];
    if(!p)return res.status(401).json({error:"That case code is not linked to a player account."});
    const pf=await getFile(`data/players/${p.id}.json`);
    if(!pf)return res.status(500).json({error:"Player record is missing."});
    const full=JSON.parse(pf.content);
    const token=sign({sub:p.id,caseCode:p.caseCode,exp:Date.now()+1000*60*60*24*30});
    return res.json({token,player:{id:p.id,name:p.name,email:p.email,caseCode:p.caseCode},progress:full.progress||null});
  }
  return res.status(400).json({error:"Unknown auth action."});
 }catch(e){ console.error("UNINVITED AUTH ERROR:", e && e.stack ? e.stack : e); return res.status(500).json({error:"Authentication service error."})}
};