export type RubiFirstProductInputs={
 suppliersCount:number;
 activeSuppliers:number;
 suppliersWithoutHost:number;
 totalProducts:number;
 readyCount:number;
 reviewedCount:number;
 isPartial:boolean;
};
export type RubiFirstProductStep={
 key:"supplier"|"catalog"|"checkout"|"qa";
 title:string;description:string;
 state:"done"|"pending"|"verify";
};
export function getRubiFirstProductSteps(a:RubiFirstProductInputs):RubiFirstProductStep[]{
 const supplierOk=a.activeSuppliers>0&&a.suppliersWithoutHost<a.activeSuppliers;
 const hasProduct=a.totalProducts>0;
 const checkoutOk=hasProduct&&a.readyCount>0;
 const qaOk=checkoutOk&&a.reviewedCount>0;
 return [
  {key:"supplier",title:"Confirmar fornecedor e domínio do checkout",description:"Cadastre um fornecedor autorizado, ative-o e confira o domínio exato do checkout oficial.",state:supplierOk?"done":"pending"},
  {key:"catalog",title:"Cadastrar primeiro produto real como rascunho",description:"Insira título, imagem autorizada, descrição, custo e preço. Não marque publicação nem verificação de checkout sem conferir a oferta.",state:hasProduct?"done":"pending"},
  {key:"checkout",title:"Verificar checkout oficial e ativar a oferta",description:"Compare URL e domínio do fornecedor; revise o valor e ative individualmente somente após confirmação.",state:a.isPartial?"verify":checkoutOk?"done":"pending"},
  {key:"qa",title:"Revisar HTTPS, desktop, celular, fornecedor e condições",description:"Registre evidências manuais atualizadas. Isso não substitui teste pago autorizado e conciliação da Kairos.",state:a.isPartial?"verify":qaOk?"done":"pending"},
 ];
}
