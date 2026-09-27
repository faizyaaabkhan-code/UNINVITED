const API="https://api.github.com";
const OWNER=process.env.GITHUB_OWNER || "faizyaaabkhan-code";
const REPO=process.env.GITHUB_REPO || "UNINVITED";
const BRANCH=process.env.GITHUB_BRANCH || "main";

function headers(){
  return {
    "Authorization":"Bearer "+process.env.GITHUB_TOKEN,
    "Accept":"application/vnd.github+json",
    "X-GitHub-Api-Version":"2022-11-28",
    "User-Agent":"UNINVITED-Companion"
  };
}
async function getFile(path){
  const r=await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,{headers:headers()});
  if(r.status===404)return null;
  if(!r.ok)throw new Error("GitHub read failed: "+r.status);
  const j=await r.json();
  return {sha:j.sha,content:Buffer.from(j.content.replace(/\n/g,""),"base64").toString("utf8")};
}
async function putFile(path,content,message,sha){
  const body={message,content:Buffer.from(content,"utf8").toString("base64"),branch:BRANCH};
  if(sha)body.sha=sha;
  const r=await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`,{method:"PUT",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error("GitHub write failed: "+r.status+" "+await r.text());
  return r.json();
}
module.exports={getFile,putFile};