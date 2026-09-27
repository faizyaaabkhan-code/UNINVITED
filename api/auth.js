const {getFile,putFile}=require("../lib/github");
const {hashPassword,verifyPassword,sign,id}=require("../lib/auth");
module.exports=async(req,res)=>{
 try{
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const {action}=req.body||{};
  if(action==="create"){
    const {name,email,password,caseCode}=req.body;
    if(!name||!email||!password||!caseCode||password.length<8)return res.status(400).json({error:"Name, email, password (8+ characters), and assigned case code are required."});
    const indexPath="data/index.json";
    const idxFile=await getFile(indexPath);
    const idx=idxFile?JSON.parse(idxFile.content):{players:{},codes:{}};
    const code=String(caseCode).trim().toUpperCase();
    const codeRec=idx.codes[code];
    if(!codeRec||codeRec.status!=="assigned"||codeRec.playerId)return res.status(403).json({error:"This case code is invalid, unavailable, or already assigned."});
    const emailKey=email.trim().toLowerCase();
    if(Object.values(idx.players).some(p=>p.email===emailKey))return res.status(409).json({error:"An account with this email already exists."});
    const playerId=id();
    const ph=hashPassword(password);
    const player={id:playerId,name:name.trim(),email:emailKey,password:ph,caseCode:code,createdAt:new Date().toISOString()};
    idx.players[playerId]={id:playerId,name:player.name,email:player.email,caseCode:code};
    idx.codes[code]={...codeRec,status:"active",playerId};
    await putFile("data/index.json",JSON.stringify(idx,null,2),"Register player "+playerId,idxFile&&idxFile.sha);
    await putFile(`data/players/${playerId}.json`,JSON.stringify({player,progress:null},null,2),"Create player "+playerId);
    const token=sign({sub:playerId,caseCode:code,exp:Date.now()+1000*60*60*24*30});
    return res.json({token,player:{id:playerId,name:player.name,email:player.email,caseCode:code}});
  }
  if(action==="login"){
    const {email,password,caseCode}=req.body;
    const idxFile=await getFile("data/index.json");
    const idx=idxFile?JSON.parse(idxFile.content):{players:{},codes:{}};
    const emailKey=String(email||"").trim().toLowerCase();
    const p=Object.values(idx.players).find(x=>x.email===emailKey);
    if(!p||p.caseCode!==String(caseCode||"").trim().toUpperCase())return res.status(401).json({error:"Email, password, or case code is incorrect."});
    const pf=await getFile(`data/players/${p.id}.json`);
    if(!pf)return res.status(500).json({error:"Player record is missing."});
    const full=JSON.parse(pf.content);
    if(!verifyPassword(password,full.player.password.salt,full.player.password.hash))return res.status(401).json({error:"Email, password, or case code is incorrect."});
    const token=sign({sub:p.id,caseCode:p.caseCode,exp:Date.now()+1000*60*60*24*30});
    return res.json({token,player:{id:p.id,name:p.name,email:p.email,caseCode:p.caseCode},progress:full.progress||null});
  }
  return res.status(400).json({error:"Unknown auth action."});
 }catch(e){return res.status(500).json({error:"Authentication service error."})}
};