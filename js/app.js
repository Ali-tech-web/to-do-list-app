
// Select the Elements
const clear = document.querySelector(".clear");
const dateElement = document.getElementById("date");
const list = document.getElementById("list");
const input = document.getElementById("input");
const downArrow = document.getElementById("downArrow");
const itemCount = document.getElementById("itemsCount");
const removeAllCompletedBtn = document.getElementById ("removeAllCompleted");
const showOnlyCompletedBtn = document.getElementById("showCompletedLink")
const showAllTaskBtn = document.getElementById("showAllLink");
const showOnlyActiveBtn = document.getElementById("showActive");
const pTags = document.getElementsByTagName ("p");


// Classes names
const CHECK = "fa-check-circle";
const UNCHECK = "fa-circle-thin";
const LINE_THROUGH = "lineThrough";
const DB_NAME = "todo-db10";
const STORE_NAME = "task";

// Variables
var LIST=[];
let id=0;
let allTasksComplete = false;
let dontUpdateItemCount = false;
let itemsLeft=0;
var db;
var objectStore;
var index;
var tx;

// CREATE DATABASE
var request = window.indexedDB.open(DB_NAME, 1);

request.onerror = function (event) {
    console.log('The database is opened failed');
  };

request.onsuccess = function (event) {
  db = request.result;
  console.log('The database is opened successfully');
  readAll();
};

  request.onupgradeneeded = function (event) {
    let db = event.target.result;
    if (!db.objectStoreNames.contains('task')) {
      objectStore = db.createObjectStore('task', { keyPath: 'id' });
      index = objectStore.createIndex('name', 'name', { unique: false });
      console.log("index Created Successfully");
    }
   
  }

//add or update into the database
function update(task) {
let request = db.transaction(['task'], 'readwrite')
    .objectStore('task')
    .put(task);
    console.log (task);

request.onsuccess = function (event) {
    console.log('The data has been updated successfully');
};

request.onerror = function (event) {
    console.log('The data has been updated failed');
}
}

// read all items in database using cursor
function readAll() {
var objectStore = db.transaction('task').objectStore('task');
LIST = [];
    objectStore.openCursor().onsuccess = function (event) {
    var cursor = event.target.result;

    if (cursor) {  
        loadList (cursor.value.name, cursor.key, cursor.value.done,cursor.value.trash);
        id++;      
        addToDo (cursor.value.name, cursor.key, cursor.value.done,cursor.value.trash);
        cursor.continue();
    } else {
    console.log('No more data');
    }
};
}


//load LIST array from entries in the database
function  loadList (name,id,done,trash){
    let task = {
    name : name,
    id : id,
    done : done,
    trash : trash
    }; 
    LIST.push (task);
}

  

list.addEventListener("dblclick", function(event){
    const element = event.target; // return the clicked element inside list
    const elementJob = element.attributes.job.value; // complete or delete        
    if (elementJob == "taskName"){
        element.contentEditable = true;
    }
});


list.addEventListener("keyup", function (event){

    if (event.keyCode == 13){
        let element = event.target
        if (element.attributes.job.value == "taskName"){
            element.contentEditable = false;
            let text =  element.innerText;
            element.innerHTML = text;

            let parent = element.parentNode;
            let firstChild = parent.firstElementChild;
            let id = parseInt(firstChild.id);
            LIST[id].name = text;
            update (LIST[id]);

        }
    }

});


list.addEventListener('focusout', function (event){
    let element = event.target
    if (element.attributes.job.value == "taskName"){
        element.contentEditable = false;
        let text =  element.innerText;
        element.innerHTML = text;

        let parent = element.parentNode;
        let firstChild = parent.firstElementChild;
        let id = parseInt(firstChild.id);
        LIST[id].name = text;
        update (LIST[id]);
    }
});


// add to do function
function addToDo(toDo, id, done, trash){
    
    if(trash){ return; }
    
    const DONE = done ? CHECK : UNCHECK;
    const LINE = done ? LINE_THROUGH : "";   
    const item = `<li class="item">
                    <i class="fa ${DONE} co" job="complete" id="${id}"></i>
                    <p class="text ${LINE}" job="taskName">${toDo}</p>
                    <i class="fa fa-trash-o de" job="delete" id="${id}"></i>
                  </li>
                `;
    
    const position = "beforeend";

    if (done == false && trash == false) {
        incrementItemCount();
    }
    
    list.insertAdjacentHTML(position, item);
}

function incrementItemCount(){
    itemsLeft++;
    localStorage.setItem("itemsleft", JSON.stringify(itemsLeft));
    itemCount.innerHTML=itemsLeft;

}

function decrementItemCount(){
    itemsLeft--;
    localStorage.setItem("itemsleft", JSON.stringify(itemsLeft));
    itemCount.innerHTML=itemsLeft;
}


// add an item to the list user the enter key
document.addEventListener("keyup",function(event){
    if(event.keyCode == 13){
        const toDo = input.value;      
        // if the input isn't empty
        if(toDo){
            addToDo(toDo, id, false, false);  
            let task = {
                name : toDo,
                id : id,
                done : false,
                trash : false
            };    

            LIST.push(task);     
            update (task);     
            id++;
        }
        input.value = "";
    }
});


// complete to do (This single function caters check and uncheck)
function completeToDo(element){
    if (element.classList.contains(UNCHECK)){
        decrementItemCount();
    }else {
        incrementItemCount();
    }
    element.classList.toggle(CHECK);
    element.classList.toggle(UNCHECK);
    element.parentNode.querySelector(".text").classList.toggle(LINE_THROUGH);
    LIST[element.id].done = LIST[element.id].done ? false : true;
    update (LIST[element.id]);
}

// remove to do
function removeToDo(element){
    if (element.parentNode.firstElementChild.classList.contains(UNCHECK)){
        decrementItemCount();
    }
    element.parentNode.parentNode.removeChild(element.parentNode);
    LIST[element.id].trash = true;
    update (LIST[element.id]);
   // localStorage.setItem("TODO", JSON.stringify(LIST));
}

// target the items created dynamically
list.addEventListener("click", function(event){
    const element = event.target; // return the clicked element inside list
    const elementJob = element.attributes.job.value; // complete or delete    
    if(elementJob == "complete"){
        completeToDo(element);
    }else if(elementJob == "delete"){
        removeToDo(element);
    }
    else if (elementJob == "taskName"){
        element.contentEditable = true;
    }
});


// select all of the Tasks and mark them completed
downArrow.addEventListener('click', markAllCompleteOrIncomplete);


function markAllCompleteOrIncomplete(event){
    let children = list.children;
    for (let i = 0; i < children.length; i++){
        if (allTasksComplete){
            markAsIncomplete(children[i].firstElementChild); 
        }else{
            markAsComplete(children[i].firstElementChild);     
        }
    }
    allTasksComplete = allTasksComplete ? false : true;
}


// This function marks a list item as complete
function markAsComplete(element){
    if (element.classList.contains(UNCHECK)){
        element.classList.toggle(UNCHECK);
        element.classList.toggle(CHECK);
        element.parentNode.querySelector(".text").classList.toggle(LINE_THROUGH);
        LIST[element.id].done = LIST[element.id].done ? false : true;
        
        update (LIST[element.id]);
        decrementItemCount();
    }
}

//This function marks a list Item as incomplete
function markAsIncomplete(element){
    if (element.classList.contains(CHECK)){
        element.classList.toggle(CHECK);
        element.classList.toggle(UNCHECK);
        element.parentNode.querySelector(".text").classList.toggle(LINE_THROUGH);
        LIST[element.id].done = LIST[element.id].done ? false : true;
        update (LIST[element.id]);
        incrementItemCount();

    }
}


//Event Listener on Remove Completed Link
removeAllCompletedBtn.addEventListener('click',removeAllCompleted)

function removeAllCompleted(){
      LIST.forEach (function (item){
        if (item.done == true && item.trash == false){
            item.trash = true;  
            //update database     
            update (LIST[item.id]);    

            let ElementToBeRemove = document.getElementById(item.id).parentElement; 
            console.log(ElementToBeRemove);
            list.removeChild(ElementToBeRemove);                                  
        }
    });
}


// listener to show only completed Tasks
showOnlyCompletedBtn.addEventListener('click',showOnlyCompletedTasks)

function showOnlyCompletedTasks () {
    list.innerHTML="";
    LIST.forEach(function (item) {
        if (item.done == true && item.trash == false){
           // dontUpdateItemCount = true;               
            addToDoV2(item.name, item.id, item.done, item.trash);
        }
    });

}


function addToDoV2(toDo, id, done, trash){
    if(trash){ return; }
    let DONE = done ? CHECK : UNCHECK;
    let LINE = done ? LINE_THROUGH : ""; 
    let item = `<li class="item">
                    <i class="fa ${DONE} co" job="complete" id="${id}"></i>
                    <p class="text ${LINE}">${toDo}</p>
                    <i class="fa fa-trash-o de" job="delete" id="${id}"></i>
                  </li>
                `;
    
    let position = "beforeend";
    list.insertAdjacentHTML(position, item);
}


///show All Tasks
showAllTaskBtn.addEventListener ('click', showAllTasks)

function showAllTasks () {
    list.innerHTML="";
    LIST.forEach(function (item) {
        if (item.trash == false){
           // dontUpdateItemCount = true;              
            addToDoV2(item.name, item.id, item.done, item.trash);
        }
    });

}


/// show Only Active
showOnlyActiveBtn.addEventListener("click",showOnlyActive)
function showOnlyActive () {
    list.innerHTML="";
    LIST.forEach(function (item) {
        if (item.trash == false && item.done == false){
           // dontUpdateItemCount = true;                  
            addToDoV2(item.name, item.id, item.done, item.trash);
        }
    });
}

