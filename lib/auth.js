const crypto=require("crypto");
function hashPassword(password,salt=crypto.randomBytes(16).toString("hex")){
  return {salt,hash:crypto.scryptSync(password,salt,64).toString("hex")};
}
function verifyPassword(password,salt,hash){
  const h=crypto.scryptSync(password,salt,64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(h,"hex"),Buffer.from(hash,"hex"));
}
function sign(payload){
  const body=Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig=crypto.createHmac("sha256",process.env.AUTH_SECRET).update(body).digest("base64url");
  return body+"."+sig;
}
function verify(token){
  try{
    const [body,sig]=String(token||"").split(".");
    if(!body||!sig)return null;
    const expected=crypto.createHmac("sha256",process.env.AUTH_SECRET).update(body).digest("base64url");
    if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
    const p=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
    if(!p.exp||p.exp<Date.now())return null;
    return p;
  }catch(e){return null}
}
function id(){return crypto.randomUUID();}
function caseCode(){
  return "UNV-"+crypto.randomBytes(3).toString("hex").toUpperCase()+"-"+crypto.randomBytes(2).toString("hex").toUpperCase();
}
module.exports={hashPassword,verifyPassword,sign,verify,id,caseCode};