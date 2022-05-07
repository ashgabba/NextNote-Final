
from http.client import OK
from flask import Flask, request, render_template
import sqlite3
from flask_cors import CORS, cross_origin
from datetime import datetime
import json

app = Flask(__name__)
CORS(app, support_credentials=True)


### ROUTE ### Home Page route
@app.route("/")
def home():
    return render_template('index.html')

### ROUTE ### (/register) ###
# POST: - registers user
#       - inserts them into database with oneway hashed password
#       - returns notes.html page

# GET:  - returns register.html page
@app.route("/register", methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        username = username.lower()
        password = request.form.get('password')
        hash_pass = ""
        for char in password:
            hash_pass += str(ord(char)*len(password) % 15)
        password = hash_pass

        sql = 'INSERT INTO Users (user_name, user_password) VALUES ("' + username + '","' + password + '")'
        SqlCommand(sql, 'commit')
        return render_template('notes.html', username = username)

    else:   #GET    
        return render_template('register.html')



### ROUTE ### (/login) ###
# POST: - if user credentials valid, log user in after hashing password and comparing it to db password
#       - else return login.html page with Invalid credentials message

# GET:  - returns login.html page
@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        username = username.lower()
        password = request.form.get('password')
        hash_pass = ""
        for char in password:
            hash_pass += str(ord(char)*len(password) % 15) #hash algorithm
        password = hash_pass
        sql = "SELECT user_id FROM Users WHERE user_name='"+username+"' AND user_password='"+password+"'"
        result = SqlCommand(sql, 'fetch_one')
        if result: #check to ensure credntials are the same
            return render_template('notes.html', username = username)
        else:
            return render_template('login.html', msg = "Invalid Credentials")


    else:    
        return render_template('login.html')

### ROUTE ### (/notes/<username>/delete) ###
# DELETE: - delete user, notes, & shares related to user_name/user_id
@app.route("/notes/<username>/delete", methods=["POST"])
def DeleteAccount(username):
    if(request.method == "POST"):
        try:
            userId = GetUserId(username)
            password = request.json['password']
            hash_pass = ""
            for char in password:
                hash_pass += str(ord(char)*len(password) % 15)
            password = hash_pass

            sql = "SELECT user_id FROM Users WHERE user_name='"+username+"' AND user_password='"+password+"'"
            result = SqlCommand(sql, 'fetch_one')


            if result:
                sql = "DELETE FROM Users WHERE user_id = '"+str(userId)+"'"
                SqlCommand(sql, "commit")
                sql = "DELETE FROM Notes WHERE user_id = '"+str(userId)+"'"
                SqlCommand(sql, "commit")
                sql = "DELETE FROM Shares WHERE sender_id = '"+str(userId)+"' OR receiver_id = '"+str(userId)+"'"
                SqlCommand(sql, "commit")
                return "success"
            else:
                return "Invalid Credentials"
                
        except Exception as e:
            return(e)


### ROUTE ### (/unshare) ###
# POST: -deletes record in Shares table
#       -receiving user unshares note
@app.route("/unshare", methods=['POST'])
def UnshareNote():
    if(request.method == "POST"):
        try:
            note_id = request.json['noteId'] 
            user_name = request.json['userName']
            userId = GetUserId(user_name)
            sql = "DELETE FROM Shares WHERE note_id = '"+str(note_id)+"' AND receiver_id = '"+str(userId)+"'"
            SqlCommand(sql, "commit")
            return "success"
        except Exception as e:
            return str(e)

### ROUTE ### (/share) ###
# POST: - inserts share record into table based on sender_id & receiver_id & note_id
#       - if share record already exists delete it
@app.route("/share", methods=['POST'])
def ShareNote():
    if request.method == 'POST':
        noteName = request.json['noteName']     
        userName = request.json['userName']
        shareUserName = request.json['shareUserName']

        try:
            shareUserId = GetUserId(shareUserName)
            userId = GetUserId(userName)

            noteId = GetNoteId(userId, noteName)
            sql = "SELECT share_id FROM Shares WHERE sender_id = '"+str(userId)+"' AND receiver_id = '"+str(shareUserId)+"'"
            temp = SqlCommand(sql, "fetch_one")
            if temp:
                sql = "DELETE FROM Shares WHERE share_id = '"+str(temp[0])+"'"
                SqlCommand(sql, 'commit')
            else:    
                sql = "INSERT INTO Shares (sender_id, receiver_id, note_id, note_name) VALUES ('"+str(GetUserId(userName))+"', '"+str(GetUserId(shareUserName))+"', '"+str(noteId)+"', '"+noteName+"')"
                SqlCommand(sql, 'commit')


            noteId = GetNoteId(userId, noteName)
            sql = "SELECT receiver_id FROM Shares WHERE sender_id = '"+str(userId)+"'"
            temp = SqlCommand(sql, "fetch_all")
            share_name_list = []
            if temp:
                for x in temp:
                    sql = "SELECT user_name FROM Users WHERE user_id = '"+str(x[0])+"'"
                    temp2 = SqlCommand(sql, "fetch_one")
                    share_name_list.append(temp2)

        except Exception as e:
            return str(e)

        return str(share_name_list)

### ROUTE ### (/share) ###
# POST: - inserts share record into table based on sender_id & receiver_id & note_id
#       - if share record already exists delete it
@app.route("/mode", methods=['POST'])
def ChangeMode():
    if request.method == 'POST':
        mode = request.json['mode']     
        user_name = request.json['user_name']

        try:
            user_id = GetUserId(user_name)
            sql = "UPDATE Users SET user_mode = '"+mode+"' WHERE user_id = '"+str(user_id)+"'"
            SqlCommand(sql, 'commit')

        except Exception as e:
            return str(e)

        return "success"



### ROUTE ### (/notes/<username>) ###
# GET: - Get all user notes
#      - if notes are shared with user, get those notes too

# POST: - Insert New Note into DB
#uses the same route to accomplish two different tasks
#post inserts new note into the db
@app.route("/notes/<username>", methods=['GET','POST'])
def CreateAndListNotes(username):
    if(request.method == "GET"):
        user_id = GetUserId(username)

        sql = "SELECT user_mode FROM Users WHERE user_id = '"+str(user_id)+"'"
        temp = SqlCommand(sql, "fetch_one")

        note_ids = GetAllUserNoteIds(user_id)
        
        note_names = GetAllUserNoteNames(note_ids)


        data = {
            "mode": temp,
            "note_names": note_names,
        }

        return json.dumps(data)
        

    elif(request.method == "POST"): #POST
        newName = request.json['newName']
        noteText = request.json['noteText']

        user_id = GetUserId(username)

        if newName == "untitled":
            sql = "SELECT MAX(note_id) FROM Notes"
            temp = SqlCommand(sql, "fetch_one")
            newName = newName + str(temp[0]+1)
            sql = "INSERT INTO Notes (user_id, note_name, note_text) VALUES ('"+str(user_id)+"', '"+newName+"', '"+noteText+"')"
            SqlCommand(sql, 'commit')
        
        else:
            sql = "INSERT INTO Notes (user_id, note_name) VALUES ('"+str(user_id)+"', '"+newName+"')"
            SqlCommand(sql, 'commit')

        data = {
            "name": newName,
            "text": noteText,
        }

        return json.dumps(data)


### ROUTE ### (/notes/<username>/<note_name>) ###
# GET:  - Get currently selected note
#       - if note is shared dont let receiver edit
#       - Hide some buttons

# PUT: - Save note name & note text upon hitting save btn

# DELETE: - delete note from notes & from all instances in shares table

@app.route("/notes/<username>/<note_name>", methods=['GET','PUT','DELETE'])
def GetNoteText(username, note_name):
    try:
        if(request.method == "GET"):
            user_id = GetUserId(username)
            note_id = GetNoteId(user_id, note_name)
            sql = "SELECT note_text FROM Notes WHERE note_id = '"+str(note_id)+"'"
            note_text = SqlCommand(sql, 'fetch_one')
            sql = "SELECT user_id FROM Notes WHERE note_id = '"+str(note_id)+"'"
            share_user_id = SqlCommand(sql, 'fetch_one')[0]
            share_user_name = GetUserName(share_user_id)
            
            sql = "SELECT receiver_id FROM Shares WHERE note_id = '"+str(note_id)+"'"
            receiver_ids = SqlCommand(sql, 'fetch_all')

            sql = "SELECT user_mode FROM Users WHERE user_id = '"+str(user_id)+"'"
            mode = SqlCommand(sql, 'fetch_one')

            receiver_names = []
            if(receiver_ids):         
                for id in receiver_ids:
                    receiver_names.append(GetUserName(id[0]))

            if(share_user_id == user_id):
                shared = False
            else:
                shared = True
            temp = {
                "id": note_id,
                "sharedWithMe": shared,
                "senderName": share_user_name,
                "shareNames": receiver_names,
                "text": note_text[0],
                "mode": mode
            }
            return json.dumps(temp)

            
        elif(request.method == "PUT"):
            newName = request.json['newName'] 
            oldName = request.json['oldName']
            noteText = request.json['noteText']

            user_id = GetUserId(username)
            note_id = GetNoteId(user_id, note_name)

            sql = "UPDATE Notes SET note_name = '"+newName+"', note_text = '"+noteText+"' WHERE note_id = '"+str(note_id)+"'"
            SqlCommand(sql, 'commit')

            sql = "UPDATE Shares SET note_name = '"+newName+"' WHERE note_id = '"+str(note_id)+"'"
            SqlCommand(sql, 'commit')

            return "success"

        elif(request.method == "DELETE"):
            user_id = GetUserId(username)
            note_id = GetNoteId(user_id, note_name)
            sql = "DELETE FROM Notes Where note_id = '"+str(note_id)+"'"
            SqlCommand(sql, 'commit')
            sql = "DELETE FROM Shares Where note_id = '"+str(note_id)+"'"
            SqlCommand(sql, 'commit')
            return "success"
    except Exception as e:
        return str(e)


# DATABASE HELPER FUNCTIONS

def GetUserName(user_id):
    sql = "SELECT user_name FROM Users WHERE user_id = '"+str(user_id)+"'"
    return SqlCommand(sql, 'fetch_one')[0]

def GetUserId(username):
    sql = "SELECT user_id FROM Users WHERE user_name = '"+username+"'"
    return SqlCommand(sql, 'fetch_one')[0]

def GetNoteId(user_id, note_name):
    sql = "SELECT note_id FROM Notes WHERE note_name = '"+note_name+"' AND user_id = '"+str(user_id)+"'"
    
    result = SqlCommand(sql, 'fetch_one')
    if result == None:
        sql = "SELECT note_id FROM Shares WHERE note_name = '"+note_name+"'AND receiver_id = '"+str(user_id)+"'"
        result = SqlCommand(sql, 'fetch_one')
    try:
        return result[0]
    except Exception as e:
        return str(e)

def GetAllUserNoteIds(user_id):
    sql = "SELECT note_id FROM Notes WHERE user_id = '"+str(user_id)+"' UNION ALL SELECT note_id FROM Shares WHERE receiver_id = '"+str(user_id)+"'"
    user_note_ids = SqlCommand(sql, 'fetch_all')
    note_id_list = []
    if user_note_ids:
        for x in user_note_ids:
            note_id_list.append(x[0])
        return note_id_list
    return ""

def GetAllUserNoteNames(note_id_list:list):
    note_name_list = []
    for x in note_id_list:
        sql = "SELECT note_name FROM Notes WHERE note_id = '" + str(x) + "'"
        note_name_list.append(SqlCommand(sql, "fetch_one"))

    temp = []
    if note_name_list:
        for x in note_name_list:
            temp.append(x)
        note_name_list = temp
        return note_name_list
    return ""


# DATABASE fetch & commit functions
def SqlCommand(sql, method):
    if method == "fetch_one":
        try:
            conn = sqlite3.connect('database.db')
            result = conn.execute(sql).fetchone()
            conn.close()
            return result
        except Exception as e:
           return str(e)

    elif method == "fetch_all":
        try:
            conn = sqlite3.connect('database.db')
            result = conn.execute(sql).fetchall()
            conn.close()
            return result
        except Exception as e:
            return str(e)

    elif method == "commit":
        try:
            conn = sqlite3.connect('database.db')
            cursor = conn.cursor()
            cursor.execute(sql)
            conn.commit()
            conn.close()
        except Exception as e:
            return str(e) 




if __name__ == '__main__':
        app.run(host='0.0.0.0', port=5000, debug=True)