/** Parses a bounded CSV upload; no network access and no database writes. */
export function parseRubiAffiliateCsv(text:string):{headers:string[];rows:string[][]}{
 const grid:string[][]=[];
 let row:string[]=[],value="",quoted=false;
 const input=text.replace(/^\uFEFF/,"");
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'){
   if(quoted&&input[i+1]==='"'){value+='"';i++;}
   else quoted=!quoted;
  }else if(c===','&&!quoted){row.push(value);value="";}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&input[i+1]==='\n')i++;
   row.push(value);
   if(row.some(v=>v.trim()))grid.push(row);
   row=[];value="";
  }else value+=c;
 }
 if(quoted)throw new Error("CSV com aspas não fechadas.");
 if(value.length||row.length){row.push(value);if(row.some(v=>v.trim()))grid.push(row);}
 const header=grid.shift();
 if(!header)return {headers:[],rows:[]};
 const headers=header.map(v=>v.trim().toLowerCase());
 if(new Set(headers).size!==headers.length)throw new Error("CSV com colunas repetidas.");
 return {headers,rows:grid};
}
export function safeRubiAffiliateUrl(value:string):boolean{
 try{
  const url=new URL(value);
  const host=url.hostname.toLowerCase();
  return url.protocol==="https:"&&Boolean(host)&&!url.username&&!url.password
   &&!host.endsWith(".local")&&!host.endsWith(".internal")
   &&host!=="localhost"&&host.includes(".")
   &&!/^\d+(?:\.\d+){3}$/.test(host)&&!host.includes(":");
 }catch{return false;}
}
