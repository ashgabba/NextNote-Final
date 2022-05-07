var username = document.getElementById('username').innerText;
var note_id = document.getElementById('note_id');
var saveBtn = document.getElementById('saveBtn');
var createBtn = document.getElementById('createBtn');
var deleteBtn = document.getElementById('deleteBtn');
var shareBtn = document.getElementById('shareBtn');
var noteDropDown = document.getElementById('noteDropDown');
var note_name = document.getElementById('note_name');
var notepad = document.getElementById('notepad');
var error_message = document.getElementById('error_message');
var note_word_count = document.getElementById('note_word_count');
var delete_account_btn = document.querySelector('#delete_account_btn');

var mode_btn = document.querySelector('#mode_btn');
var body = document.querySelector('body');
var sharedWithMe;

var shareMenu = document.querySelector('.shareMenu');
var shareName = document.querySelector('#shareName');
var namesList = document.querySelector('.namesList');

var http = new XMLHttpRequest();

OnLoad();
//onload - populate dropdown, first note name & first note text


//load current note every 3 seconds
setInterval(function(){ 
    //this code runs every second 
    if(noteDropDown.value){
        PopulateNotepad();
    }

}, 3000); 

//load current note every 3 seconds
setInterval(function(){ 

    UpdateDropDown()
    if(noteDropDown.value == ""){
        notepad.textContent
    }

}, 10000); 

shareBtn.addEventListener("click", OpenShareMenu)
shareSubmitBtn.addEventListener("click", FetchShare)
delete_account_btn.addEventListener("click", DeleteAccount)

function OpenShareMenu(){
    if(shareMenu.style.display == "flex"){
        shareMenu.style.display = "none"

    }else{
        shareMenu.style.display = "flex"
        console.log(senderName)
        
        namesList.innerHTML = ("<h6>Shared with:</h6>");
        shareNames.forEach(element => {
            namesList.innerHTML += ("<h6 id='option_"+element+"'>"+element+"</h6>");
        })
    }
}

async function FetchShare(){
    username_share = shareName.value;
    const response = await fetch('/share', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            
        },
        body: JSON.stringify({
            noteName: note_name.value,
            userName: username,
            shareUserName: username_share
        })
    })
    res = await response.text()
    console.log(res)
    await (console.log("this note is shared with:\n" + res));
    exists = false;
    namesList.childNodes.forEach(element => {
        if(element.innerText == username_share){
            element.remove()
            exists = true;
        }
    })
    if(exists == false){
        namesList.innerHTML += ("<h6 style='color:orange;' id='option_"+username_share+"'>"+username_share+"</h6>");
    }
}

async function DeleteAccount(){
    result = prompt("Submit your password to delete account.")
    console.log(result)
    if(result != ""){
        const response = await fetch('/notes/'+username+'/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify({
                password: result
            })
        })
        res = await response.text()
        console.log(res)
            if(res == "success"){
                document.open();
                document.write("<html><body>Account Deleted</body></html>");
                document.close();
            }else{
                alert("Incorrect Password...")
            }
    }
}



//saveBtn - send note text, note name, & username to server to save
//          -UpdateDropDown()
saveBtn.addEventListener("click", function(){

    let curr_note = noteDropDown.value;
    let note_duplicate = false;

    noteDropDown.childNodes.forEach(element => {

        if(note_name.value == element.innerText && element.innerText != curr_note){
            note_duplicate = true;
        }
        
    });

    if(note_duplicate == true){
        error_message.innerText = "Please enter a valid name before saving."
        note_name.style.borderColor = "red"
    }else if(note_name.value == null || note_name.value.length == 0){
        // make an empty name save, or an empty name create. insert a note into db with name "untitled<id>"
        fetch( '/notes/'+username, {
            method: 'POST',
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                newName: "untitled",
                noteText: notepad.value,
            })
        }).then(response => response.json())
        .then(data => {
            console.log(data)
            noteDropDown.innerHTML += "<option id='option_"+data["name"]+"'>"+data["name"]+"</option>"
            noteDropDown.value = data["name"]
            note_name.value = data["name"]
            notepad.value = data["text"]
            
        }).catch(error => console.log('ERROR'))

    }else{
        error_message.innerText = ""
        note_name.style.border = "1px solid black"

        fetch('/notes/'+username+"/"+noteDropDown.value, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newName: note_name.value,
                oldName: noteDropDown.value,
                noteText: notepad.value
            })
        }).then(res => {
            let option = document.querySelector("#option_"+noteDropDown.value);
            option.innerText = note_name.value
            option.id = "option_"+note_name.value
            noteDropDown.value = note_name.value
        }).catch(error => console.log("ERROR"))
    }
    
    
})

// save note on every change
notepad.addEventListener("input" , function(){
    note_word_count.innerText = ("words: "+(notepad.value.split("\n").length + notepad.value.split(" ").length - 1));
    fetch('/notes/'+username+"/"+noteDropDown.value, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            newName: noteDropDown.value,
            oldName: noteDropDown.value,
            noteText: notepad.value
        })
    }).catch(error => console.log("ERROR"))

})




//createBtn - Create new note, with note_name = "new note" + id
//          - UpdateDropDown()
//          - update note name & note text for new note
createBtn.addEventListener("click", function(){
   
    if(note_name.value == null || note_name.value.length == 0){
        // make an empty name save, or an empty name create. insert a note into db with name "untitled<id>"
        fetch( '/notes/'+username, {
            method: 'POST',
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                newName: "untitled",
                noteText: notepad.value,
            })
        }).then(response => response.json())
        .then(data => {
            console.log(data)
            noteDropDown.innerHTML += "<option id='option_"+data["name"]+"'>"+data["name"]+"</option>"
            noteDropDown.value = data["name"]
            note_name.value = data["name"]
            notepad.value = data["text"]
            
        }).catch(error => console.log('ERROR'))

    }else if(note_name.value == noteDropDown.value){
        error_message.innerText = note_name.value + " is already taken"
        note_name.style.borderColor = "red"
    }else{
        error_message.innerText = ""
        note_name.style.border = "1px solid black"
        fetch( '/notes/'+username, {
            method: 'POST',
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                newName: note_name.value,
                noteText: "",
            })
        }).then(res => {
            noteDropDown.innerHTML += "<option id='option_"+note_name.value+"'>"+note_name.value+"</option>"
            noteDropDown.value = note_name.value
            notepad.value = " "
        }).catch(error => console.log('ERROR'))
        
    }
})


//deleteBtn - Delete current selected note
//          - UpdateDropDown()
//          - populate another note name & note text
deleteBtn.addEventListener("click", function(){

    if(noteDropDown.childElementCount == 1) {
        notepad.value = " "
    }

    if(sharedWithMe == true){
        fetch( '/unshare' , {
            method: 'POST',
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                noteId: note_id.innerText,
                userName: username,
            })
        }).then(res => {
            document.querySelector("#option_"+noteDropDown.value).remove()
            notepad.value = " Successfully Unshared. Please Select another Notepad"
            note_name.value = ""
            noteDropDown.value = ""
    
            if(noteDropDown.childElementCount == 0){
                notepad.value = "You have no active Notes!\n\nPlease enter note name & click Create..."
            }
    
    
        }).then(data => {
            console.log(data);
        }).catch(error => console.log(error))
    }else{
        fetch( '/notes/'+username+'/'+noteDropDown.value , {
            method: 'DELETE',
            headers: {
                "Content-Type":"application/json"
            }
        }).then(res => {
            document.querySelector("#option_"+noteDropDown.value).remove()
            notepad.value = " Successfully deleted. Please Select another Notepad"
            note_name.value = ""
            noteDropDown.value = ""
    
            if(noteDropDown.childElementCount == 0){
                notepad.value = "You have no active Notes!\n\nPlease enter note name & click Create..."
            }
    
    
        }).catch(error => console.log(error))
    }

    


})



//noteDropDown(onchange) - populate note name & note text with selection
noteDropDown.addEventListener("change" || "click", function(){
    note_name.value = noteDropDown.value;
    shareMenu.style.display = "none"
    PopulateNotepad()

})


// UpdateDropDown(){
//     #GET /notes/username
//      #populate select optioins
function UpdateDropDown(){
    temp = noteDropDown.value
    http.open("GET", '/notes/'+username)
    http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    http.send();
    http.onload = () => {
        if (http.status != 200){
            console.log('UpdateDropDown() ERROR: ' + http.status);
            return;
        }
        sql = "SELECT user_mode FROM Users WHERE user_id = '"+str(user_id)+"'"
        temp = SqlCommand(sql, "fetch_one")
        noteDropDown.innerHTML = "";
        data.forEach(element => {
            noteDropDown.innerHTML += "<option id='option_"+element+"'>"+element+"</option>"
            
        });
        noteDropDown.value = temp
        note_name.value = noteDropDown.value
        
    }
}

function OnLoad(){
    noteDropDown.innerHTML = "";
    http.open("GET", '/notes/'+username)
    http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    http.send();
    http.onload = () => {
        if (http.status != 200){
            console.log('UpdateDropDown() ERROR: ' + http.status);
            return;
        }
        response = JSON.parse(http.responseText)

        mode = response['mode']

        if(mode == "Dark Mode"){
            notepad.style.background = "black";
            notepad.style.color = "white";
            body.style.background = "MidnightBlue";
            mode_btn.innerText = "Light Mode";
            document.body.style.color = "white";
        }else{
            notepad.style.background = "white";
            notepad.style.color = "black";
            body.style.background = "LightGray";
            mode_btn.innerText = "Dark Mode";
            document.body.style.color = "black";   
        }

        data = response['note_names']
        data.forEach(element => {
            noteDropDown.innerHTML += "<option id='option_"+element+"'>"+element+"</option>"
            
        });
        note_name.value = noteDropDown.value;
        if(noteDropDown.childElementCount == 0){
            notepad.value = "You have no active Notes!\n\nPlease enter note name & click Create..."
        }else{
            
            PopulateNotepad()
        }
        


    }
}

function PopulateNotepad(){
    note_word_count.innerText = ("words: "+(notepad.value.split("\n").length + notepad.value.split(" ").length - 1));
    if(noteDropDown.childElementCount == 0){
        notepad.value = "You have no active Notes!\n\nPlease enter note name & click Create..."
    }else{
    http.open("GET", '/notes/'+username+'/'+noteDropDown.value)
    http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    http.send();
    http.onload = () => {
        if (http.status != 200){
            console.log('PopulateNotepad() ERROR: ' + http.status);
            return;
        }
        data = JSON.parse(http.responseText)
        console.log(data)
        notepad.value = data['text']
        note_id.innerText = data['id']
        sharedWithMe = data['sharedWithMe']
        shareNames = data['shareNames']
        senderName = data['senderName']
        if(sharedWithMe == false){
            saveBtn.hidden = false
            shareBtn.hidden = false
        }else{
            saveBtn.hidden = true
            shareBtn.hidden = true


        }
    }
}
}

//disable spaces in note_name field
$("#note_name").on({
    keydown: function(e) {
      if (e.which === 32)
        return false;
    }
});


mode_btn.addEventListener("click", function(){

    var temp = mode_btn.innerText
    if(mode_btn.innerText == "Dark Mode"){
        notepad.style.background = "black";
        notepad.style.color = "white";
        body.style.background = "MidnightBlue";
        mode_btn.innerText = "Light Mode";
        document.body.style.color = "white";
    }else{
        notepad.style.background = "white";
        notepad.style.color = "black";
        body.style.background = "LightGray";
        mode_btn.innerText = "Dark Mode";
        document.body.style.color = "black";
        
    }

    fetch( '/mode', {
        method: 'POST',
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            mode: temp,
            user_name: username,
        })
    }).then(response => response.json())
    .then(data => {
        console.log(data)
        noteDropDown.innerHTML += "<option id='option_"+data["name"]+"'>"+data["name"]+"</option>"
        noteDropDown.value = data["name"]
        note_name.value = data["name"]
        notepad.value = data["text"]
        
    }).catch(error => console.log('ERROR'))

})
