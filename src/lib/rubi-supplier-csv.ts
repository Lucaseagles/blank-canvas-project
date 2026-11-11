export const RUBI_IMPORT_COLUMNS=["title","description","category","sku","retail_price","supplier_cost","image_url"] as const;
export type RubiSupplierDraft={title:string;description:string;category:string;sku:string;retail_price:number;supplier_cost:number;image_url:string};
export type RubiImportRow={line:number;draft:RubiSupplierDraft|null;errors:string[]};
export type RubiCsvPreview={rows:RubiImportRow[];headerErrors:string[]};
const MAX_ROWS=50;
const MAX_BYTES=100_000;
const maxLength:Record<"title"|"description"|"category"|"sku"|"image_url",number>={title:180,description:2000,category:80,sku:80,image_url:2000};
export function parseRubiCsvMatrix(source:string):string[][]{
 const text=source.replace(/^\uFEFF/,"");
 const result:string[][]=[];let row:string[]=[];let cell="";let quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='"'){
   if(quoted&&text[i+1]==='"'){cell+='"';i++;}
   else if(quoted){quoted=false;}
   else if(cell===""){quoted=true;}
   else throw new Error("Aspas inválidas no CSV.");
  }else if(char===","&&!quoted){row.push(cell);cell="";}
  else if((char==="\n"||char==="\r")&&!quoted){
   if(char==="\r"&&text[i+1]==="\n")i++;
   row.push(cell);if(row.some(x=>x.trim()))result.push(row);
   row=[];cell="";
  }else cell+=char;
 }
 if(quoted)throw new Error("CSV incompleto: aspas não foram fechadas.");
 row.push(cell);if(row.some(x=>x.trim()))result.push(row);
 return result;
}
function currency(raw:string):number|null{
 const value=raw.trim();
 // CSV template uses decimal DOT, no thousands separators, to prevent ambiguous values.
 if(!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(value))return null;
 const num=Number(value);
 return Number.isFinite(num)&&num<=99999999.99?num:null;
}
export function parseRubiSupplierCsv(source:string):RubiCsvPreview{
 if(new TextEncoder().encode(source).length>MAX_BYTES)throw new Error("Arquivo maior que 100 KB.");
 const matrix=parseRubiCsvMatrix(source);
 if(!matrix.length)return {rows:[],headerErrors:["Arquivo CSV vazio."]};
 const headers=matrix[0]!.map(v=>v.trim().toLowerCase());
 const headerErrors:string[]=[];
 if(headers.some((h,i)=>headers.indexOf(h)!==i))headerErrors.push("Cabeçalhos duplicados.");
 const unknown=headers.filter(h=>!RUBI_IMPORT_COLUMNS.includes(h as typeof RUBI_IMPORT_COLUMNS[number]));
 if(unknown.length)headerErrors.push("Colunas não permitidas: "+unknown.join(", "));
 const required=["title","retail_price","supplier_cost"];
 for(const h of required)if(!headers.includes(h))headerErrors.push("Falta coluna obrigatória: "+h);
 if(headerErrors.length)return {rows:[],headerErrors};
 if(matrix.length-1>MAX_ROWS)throw new Error("Limite de 50 produtos por lote.");
 const seen=new Set<string>();
 const rows=matrix.slice(1).map((values,i):RubiImportRow=>{
  const line=i+2,errors:string[]=[];
  if(values.length!==headers.length)errors.push("Número de colunas diferente do cabeçalho.");
  const raw=(key:string)=>values[headers.indexOf(key)]?.trim()??"";
  const title=raw("title"),description=raw("description"),category=raw("category"),sku=raw("sku"),image_url=raw("image_url");
  for(const [k,v] of Object.entries({title,description,category,sku,image_url}) as Array<[keyof typeof maxLength,string]>){
   if(v.length>maxLength[k])errors.push(k+" excede "+maxLength[k]+" caracteres.");
  }
  if(title.length<3)errors.push("Nome deve ter ao menos 3 caracteres.");
  if(sku){
   const normalized=sku.toLowerCase();
   if(seen.has(normalized))errors.push("SKU repetido neste lote.");
   seen.add(normalized);
  }
  const price=currency(raw("retail_price")),cost=currency(raw("supplier_cost"));
  if(price===null||price<=0)errors.push("Preço de venda inválido; use 49.90, sem R$.");
  if(cost===null)errors.push("Custo inválido; use 19.90, sem R$.");
  if(image_url){
   try{const url=new URL(image_url);if(url.protocol!=="https:"||url.username||url.password)errors.push("Imagem precisa ser URL HTTPS.");}
   catch{errors.push("URL da imagem inválida.");}
  }
  return {line,errors,draft:errors.length?null:{title,description,category,sku,retail_price:price!,supplier_cost:cost!,image_url}};
 });
 return {rows,headerErrors:[]};
}
export const RUBI_CSV_TEMPLATE="title,description,category,sku,retail_price,supplier_cost,image_url\n";
