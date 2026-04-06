import {

    createSupply,
    getSupplies,
    updateSupply,
    deleteSupply

}
    from "../BarberShopWebsite/Collections/inventory.js";


let allSupplies=[];

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init(){

    await loadSupplies();
    setupCreate();
    setupSearch();
    setupUpdate();
    setupCancelEdit();
    setupAlertEdit();

}


async function loadSupplies(){
    allSupplies=
        await getSupplies();
    renderTable(allSupplies);

}


//render table
function renderTable(list){

    const body=
        document.getElementById("supply-body");
    body.innerHTML="";

    list.forEach(s=>{

        let status="In Stock";
        let statusClass="instock";

        if(s.quantity==0){
            status="Out of Stock";
            statusClass="out";
        }
        else if(

            s.alertEnabled &&
            s.quantity<=s.minQuantity

        ){
            status="Low Stock";
            statusClass="low";

        }


        const row=
            document.createElement("tr");

        row.innerHTML=`

<td>${s.supplyID}</td>
<td>${s.itemName}</td>
<td>${s.quantity}</td>
<td>
<div class="status ${statusClass}">
${status}
</div>
</td>
<td>${s.expiryDate||""}</td>
<td>${s.supplierName||""}</td>
<td>${s.supplierPhone||""}</td>
<td>${s.supplierEmail||""}</td>
<td>${s.supplierAddress||""}</td>
<td>
<button
class="edit" data-id="${s.id}">Edit</button>
<button
class="delete" data-id="${s.id}">Delete</button>
</td>

`;

        body.appendChild(row);

    });

    setupDelete();
    setupEdit();

}


//generate Item ID
async function generateSupplyID(){

    let max=0;
    allSupplies.forEach(s=>{
        if(!s.supplyID) return;
        const num=
            parseInt(
                s.supplyID.slice(1)
            );
        if(num>max)
            max=num;
    });
    return "I"+
        String(max+1)
            .padStart(6,'0');

}


//create new item
function setupCreate(){

    document
        .getElementById("set-alert")
        .onchange=function(){

        document
            .getElementById("alert-box")
            .style.display=

            this.checked?
                "block":
                "none";

    };

    const btn=
        document.getElementById("createSupplyBtn");

    const modal=
        document.getElementById("createModal");

    btn.onclick=
        ()=>modal.style.display="block";

    document
        .getElementById("cancelCreate")
        .onclick=

        ()=>modal.style.display="none";

    document
        .getElementById("saveCreate")
        .onclick=
        async ()=>{

            const qty=
                parseInt(
                    document
                        .getElementById("i-qty")
                        .value
                );

            const id=
                await generateSupplyID();

            await createSupply({

                supplyID:id,

                itemName:
                document.getElementById("i-name").value,

                quantity:qty,

                alertEnabled:
                document.getElementById("set-alert").checked,

                minQuantity:
                    parseInt(
                        document.getElementById("min-qty").value
                    )||0,

                expiryDate:
                document.getElementById("i-expiry").value,

                supplierName:
                document.getElementById("sup-name").value,

                supplierPhone:
                document.getElementById("sup-phone").value,

                supplierEmail:
                document.getElementById("sup-email").value,

                supplierAddress:
                document.getElementById("sup-address").value

            });


            modal.style.display="none";

            loadSupplies();

        };

}


//edit item
function setupEdit(){

    document.querySelectorAll(".edit")

        .forEach(btn=>{

            btn.onclick=()=>{

                const item=
                    allSupplies.find(

                        s=>s.id===btn.dataset.id

                    );

                document.getElementById("edit-id").value=
                    item.id;

                document.getElementById("edit-name").value=
                    item.itemName;

                document.getElementById("edit-qty").value=
                    item.quantity;

                document.getElementById("edit-expiry").value=
                    item.expiryDate;

                document.getElementById("edit-sup-name").value=
                    item.supplierName;

                document.getElementById("edit-sup-phone").value=
                    item.supplierPhone;

                document.getElementById("edit-sup-email").value=
                    item.supplierEmail;

                document.getElementById("edit-sup-address").value=
                    item.supplierAddress;

                document.getElementById("edit-set-alert").checked=
                    item.alertEnabled||false;

                document.getElementById("edit-min-qty").value=
                    item.minQuantity||"";

                document
                    .getElementById("edit-alert-box")
                    .style.display=

                    item.alertEnabled?
                        "block":
                        "none";

                document
                    .getElementById("editModal")
                    .style.display="block";

            };

        });

}


//low stock alert function
function setupAlertEdit(){

    document
        .getElementById("edit-set-alert")
        .onchange=function(){

        document
            .getElementById("edit-alert-box")
            .style.display=

            this.checked?
                "block":
                "none";

    };

}

//update item
function setupUpdate(){

    const btn=
        document.getElementById("updateSupply");

    if(!btn) return;

    btn.onclick=

        async ()=>{

            const id=
                document.getElementById("edit-id")
                    .value;

            await updateSupply(id,{

                itemName:
                document.getElementById("edit-name").value,
                quantity:
                    parseInt(
                        document.getElementById("edit-qty").value
                    ),

                alertEnabled:
                document.getElementById("edit-set-alert").checked,

                minQuantity:
                    parseInt(
                        document.getElementById("edit-min-qty").value
                    )||0,

                expiryDate:
                document.getElementById("edit-expiry").value,

                supplierName:
                document.getElementById("edit-sup-name").value,

                supplierPhone:
                document.getElementById("edit-sup-phone").value,

                supplierEmail:
                document.getElementById("edit-sup-email").value,

                supplierAddress:
                document.getElementById("edit-sup-address").value

            });

            document
                .getElementById("editModal")
                .style.display="none";


            loadSupplies();

        };

}


//cancel edit
function setupCancelEdit(){

    document
        .getElementById("cancelEdit")
        .onclick=

        ()=>{

            document
                .getElementById("editModal")
                .style.display="none";

        };

}


//delte item
function setupDelete(){
    document
        .querySelectorAll(".delete")

        .forEach(btn=>{

            btn.onclick=

                async ()=>{

                    if(!confirm("Delete item?"))
                        return;

                    await deleteSupply(
                        btn.dataset.id
                    );

                    loadSupplies();

                };

        });

}


//searching function
function setupSearch(){

    const input=
        document.getElementById("searchSupply");

    input.addEventListener(

        "input",

        e=>{

            const term=
                e.target.value.toLowerCase();

            const filtered=

                allSupplies.filter(s=>

                    (s.itemName||"")

                        .toLowerCase()

                        .includes(term)

                );

            renderTable(filtered);

        });

}