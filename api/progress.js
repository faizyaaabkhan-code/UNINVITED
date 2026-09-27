const {getFile,putFile}=require("../lib/github");
const {verify}=require("../lib/auth");
module.exports=async(req,res)=>{
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
    if(!progress)return res.status(400).json({error:"Progress is required."});
    data.progress=progress;
    data.updatedAt=new Date().toISOString();
    await putFile(path,JSON.stringify(data,null,2),"Save case progress "+p.sub,file.sha);
    return res.json({ok:true});
  }
  return res.status(405).json({error:"Method not allowed"});
 }catch(e){return res.status(500).json({error:"Progress service error."})}
};