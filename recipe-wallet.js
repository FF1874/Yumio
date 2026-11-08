// Old collections were free. Only new receipts contribute to the demo balance.
const legacyRecipeKey='ankuan.exchange.v14';
const recipeReceiptPrefix='ankuan.recipe-receipt.v15.';
let spentRecipePoints=0;
function updateRecipeWallet(){
  const receipts=[];
  let spent=0;
  try{
    let legacy=[];
    try{legacy=JSON.parse(localStorage.getItem(legacyRecipeKey)||'[]')}catch{}

    for(const recipe of goods){
      const price=localStorage.getItem(recipeReceiptPrefix+recipe.id);
      if(Array.isArray(legacy)&&legacy.includes(recipe.id)){
        receipts.push(recipe.id);
      }else if(price!==null && /^(0|[1-9]\d*)$/.test(price)){
        receipts.push(recipe.id);spent+=Number(price);
      }
    }
  }catch{return}
  owned=receipts;spentRecipePoints=spent;
}
updateRecipeWallet();
const points=()=>50-spentRecipePoints;
