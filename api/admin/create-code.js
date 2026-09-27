const {getFile,putFile}=require("../../lib/github");
const {caseCode}=require("../../lib/auth");
module.exports=async(req,res)=>{
 try{
  if(req.method!=="POST"||req.headers["x-admin-secret"]!==process.env.ADMIN_SECRET)return res.status(403).json({error:"Forbidden"});
  const idxFile=await getFile("data/index.json");
  const idx=idxFile?JSON.parse(idxFile.content):{players:{},codes:{}};
  let code=caseCode(); while(idx.codes[code])code=caseCode();
  idx.codes[code]={code,status:"assigned",createdAt:new Date().toISOString(),playerId:null};
  await putFile("data/index.json",JSON.stringify(idx,null,2),"Create case code "+code,idxFile&&idxFile.sha);
  return res.json({code});
 }catch(e){return res.status(500).json({error:"Could not create case code."})}
};