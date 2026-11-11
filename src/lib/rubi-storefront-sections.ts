export type RubiStorefrontSection={
 id?:string|undefined;
 kind:"hero"|"collection";title:string;subtitle:string;product_ids:string[];
 status:"draft"|"published";starts_at:string|null;ends_at:string|null;
 position:number;revision?:number|undefined;
};
export const emptyRubiStorefrontSection=():RubiStorefrontSection=>({
 kind:"collection",title:"",subtitle:"",product_ids:[],status:"draft",
 starts_at:null,ends_at:null,position:0
});
export function activeRubiStorefrontSection(section:RubiStorefrontSection,at:Date):boolean{
 if(section.status!=="published")return false;
 if(section.starts_at&&new Date(section.starts_at).getTime()>at.getTime())return false;
 if(section.ends_at&&new Date(section.ends_at).getTime()<=at.getTime())return false;
 return true;
}
export function validRubiStorefrontWindow(section:RubiStorefrontSection):boolean{
 if(section.starts_at&&!Number.isFinite(Date.parse(section.starts_at)))return false;
 if(section.ends_at&&!Number.isFinite(Date.parse(section.ends_at)))return false;
 return !section.starts_at||!section.ends_at||Date.parse(section.starts_at)<Date.parse(section.ends_at);
}
